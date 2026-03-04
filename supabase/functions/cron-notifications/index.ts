import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

serve(async (req) => {
  // Proteger el endpoint: solo acepta el CRON_SECRET configurado en Supabase Secrets
  const authHeader = req.headers.get("Authorization")
  const cronSecret = Deno.env.get("CRON_SECRET") ?? ""
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  const publicKey   = Deno.env.get("VAPID_PUBLIC_KEY") ?? ""
  const privateKey  = Deno.env.get("VAPID_PRIVATE_KEY") ?? ""

  if (!publicKey || !privateKey) {
    return new Response(JSON.stringify({ error: "Faltan claves VAPID" }), { status: 500 })
  }

  webpush.setVapidDetails("mailto:admin@dayclose.app", publicKey, privateKey)
  const supabase = createClient(supabaseUrl, supabaseKey)

  // 1. Leer notificaciones pendientes cuyo send_at ya pasó
  const { data: pending, error: fetchError } = await supabase
    .from("scheduled_notifications")
    .select("*")
    .eq("status", "pending")
    .lte("send_at", new Date().toISOString())

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
  }

  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: "Sin notificaciones pendientes" }), { status: 200 })
  }

  let totalSent = 0
  let totalFailed = 0

  for (const notification of pending) {
    // 2. Obtener suscripciones (filtrando por idioma si la notificación lo especifica)
    let query = supabase.from("push_subscriptions").select("*")
    if (notification.language) query = query.eq("language", notification.language)

    const { data: subscriptions } = await query
    if (!subscriptions || subscriptions.length === 0) {
      await supabase
        .from("scheduled_notifications")
        .update({ status: "sent" })
        .eq("id", notification.id)
      continue
    }

    // 3. Enviar a cada suscriptor
    for (const sub of subscriptions) {
      const isEn = sub.language === "en"
      const payload = JSON.stringify({
        title: notification.title || (isEn ? "🌙 Close your day" : "🌙 Cierra tu día"),
        body:  notification.body  || (isEn
          ? "Your nightly ritual is waiting. Less than 10 seconds."
          : "Tu ritual nocturno te espera. Menos de 10 segundos."),
        icon:  "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        url:   notification.url || "https://dayclose.vercel.app",
      })

      try {
        const pushSub = typeof sub.subscription === "string"
          ? JSON.parse(sub.subscription)
          : sub.subscription
        await webpush.sendNotification(pushSub, payload)
        totalSent++
      } catch (err: any) {
        console.error(`Error enviando a ${sub.id}:`, err.message)
        // Suscripción expirada — limpiar
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id)
        }
        totalFailed++
      }
    }

    // 4. Marcar como enviada
    await supabase
      .from("scheduled_notifications")
      .update({ status: "sent" })
      .eq("id", notification.id)
  }

  return new Response(
    JSON.stringify({ sent: totalSent, failed: totalFailed, processed: pending.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  )
})
