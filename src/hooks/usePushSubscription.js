import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

// Convierte la clave VAPID pública (base64url) al formato que pide el navegador
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

/**
 * Registra automáticamente la suscripción push del dispositivo en Supabase
 * cuando el usuario ya tiene sesión activa y el Service Worker está listo.
 * Solo se ejecuta si el navegador soporta push y el permiso ya fue concedido.
 */
export function usePushSubscription(session, language = 'es') {
  const registeredRef = useRef(false)

  useEffect(() => {
    if (!session?.user?.id) return
    if (registeredRef.current) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.includes('PEGA_AQUI')) {
      console.warn('[Push] VITE_VAPID_PUBLIC_KEY no configurada en .env.local')
      return
    }

    const register = async () => {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const registration = await navigator.serviceWorker.ready

        // Obtener o crear la suscripción push
        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          })
        }

        const appVersion = import.meta.env.VITE_APP_VERSION || null
        const subJson = subscription.toJSON()

        // Guardar en Supabase — upsert por endpoint para evitar duplicados
        const { error } = await supabase.from('push_subscriptions').upsert(
          {
            user_id: session.user.id,
            subscription: subJson,
            language,
            app_version: appVersion,
          },
          { onConflict: 'user_id' }
        )

        if (error) {
          console.error('[Push] Error guardando suscripción:', error.message)
        } else {
          registeredRef.current = true
          console.log('[Push] Suscripción registrada correctamente')
        }
      } catch (err) {
        console.error('[Push] Error en registro:', err.message)
      }
    }

    register()
  }, [session?.user?.id, language])
}
