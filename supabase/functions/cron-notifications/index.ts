import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

// Mensajes del recordatorio nocturno por idioma
const DAILY_MESSAGES: Record<string, { title: string; body: string }> = {
  es: {
    title: "🌙 Cierra tu día",
    body: "¿Cómo ha ido el día? Dedica 10 segundos a cerrar tus hábitos.",
  },
  en: {
    title: "🌙 Close your day",
    body: "How was your day? Take 10 seconds to close your habits.",
  },
}

const DEFAULT_LANG = "es"
const APP_URL = "https://dayclose.vercel.app"

async function sendPush(
  supabase: ReturnType<typeof createClient>,
  sub: Record<string, unknown>,
  payload: string
): Promise<"ok" | "stale" | "error"> {
  try {
    const pushSub =
      typeof sub.subscription === "string"
        ? JSON.parse(sub.subscription as string)
        : sub.subscription
    await webpush.sendNotification(pushSub, payload)
    return "ok"
  } catch (err: any) {
    const code = err.statusCode
    console.error(`[push] sub ${sub.id} → HTTP ${code}: ${err.message}`)
    // Suscripción expirada o clave VAPID diferente → limpiar
    if (code === 410 || code === 404 || code === 401) {
      await supabase.from("push_subscriptions").delete().eq("id", sub.id)
      return "stale"
    }
    return "error"
  }
}

serve(async (req) => {
  // Proteger el endpoint con CRON_SECRET
  const authHeader = req.headers.get("Authorization")
  const cronSecret = Deno.env.get("CRON_SECRET") ?? ""
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const publicKey  = Deno.env.get("VAPID_PUBLIC_KEY")  ?? ""
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? ""

  if (!publicKey || !privateKey) {
    console.error("[cron] Faltan claves VAPID en Secrets de Supabase")
    return new Response(JSON.stringify({ error: "Faltan claves VAPID" }), { status: 500 })
  }

  webpush.setVapidDetails("mailto:admin@dayclose.app", publicKey, privateKey)

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )

  const stats = { daily: { sent: 0, stale: 0, error: 0 }, custom: { sent: 0, stale: 0, error: 0 } }

  // ── PARTE 1: Recordatorio nocturno automático ─────────────────────────────
  // Se envía a TODOS los suscriptores en su idioma, sin necesitar entradas en
  // la tabla scheduled_notifications.
  console.log("[cron] Enviando recordatorio nocturno automático...")

  const { data: allSubs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("*")

  if (subsError) {
    console.error("[cron] Error cargando suscripciones:", subsError.message)
  } else if (allSubs && allSubs.length > 0) {
    for (const sub of allSubs) {
      const lang = (sub.language as string) ?? DEFAULT_LANG
      const msg = DAILY_MESSAGES[lang] ?? DAILY_MESSAGES[DEFAULT_LANG]
      const payload = JSON.stringify({
        title: msg.title,
        body:  msg.body,
        icon:  "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        url:   APP_URL,
      })
      const result = await sendPush(supabase, sub, payload)
      stats.daily[result === "ok" ? "sent" : result === "stale" ? "stale" : "error"]++
    }
    console.log(`[cron] Recordatorio enviado: ${JSON.stringify(stats.daily)}`)
  } else {
    console.log("[cron] Sin suscripciones activas.")
  }

  // ── PARTE 2: Notificaciones personalizadas programadas por el admin ───────
  // Procesa entradas pendientes en scheduled_notifications cuyo send_at ya pasó.
  const { data: pending } = await supabase
    .from("scheduled_notifications")
    .select("*")
    .eq("status", "pending")
    .lte("send_at", new Date().toISOString())

  if (pending && pending.length > 0) {
    console.log(`[cron] Procesando ${pending.length} notificación(es) programada(s)...`)

    for (const notification of pending) {
      let query = supabase.from("push_subscriptions").select("*")
      if (notification.language) query = query.eq("language", notification.language)

      const { data: subs } = await query
      if (!subs || subs.length === 0) {
        await supabase
          .from("scheduled_notifications")
          .update({ status: "sent" })
          .eq("id", notification.id)
        continue
      }

      for (const sub of subs) {
        const isEn = (sub.language as string) === "en"
        const payload = JSON.stringify({
          title: notification.title || (isEn ? "🌙 Close your day" : "🌙 Cierra tu día"),
          body:  notification.body  || (isEn
            ? "Your nightly ritual is waiting."
            : "Tu ritual nocturno te espera."),
          icon:  "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          url:   notification.url || APP_URL,
        })
        const result = await sendPush(supabase, sub, payload)
        stats.custom[result === "ok" ? "sent" : result === "stale" ? "stale" : "error"]++
      }

      await supabase
        .from("scheduled_notifications")
        .update({ status: "sent" })
        .eq("id", notification.id)
    }
    console.log(`[cron] Programadas enviadas: ${JSON.stringify(stats.custom)}`)
  }

  return new Response(
    JSON.stringify({ ok: true, stats }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  )
})
