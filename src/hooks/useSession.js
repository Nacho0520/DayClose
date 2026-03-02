import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Gestiona la sesión de Supabase Auth y el estado derivado de admin.
 * isAdmin se determina EXCLUSIVAMENTE via RPC is_admin() — nunca por email hardcodeado.
 */
export function useSession() {
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isWhitelisted, setIsWhitelisted] = useState(false)

  // Inicializar sesión y suscribirse a cambios de auth
  useEffect(() => {
    const initSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) console.error('[useSession] Error obteniendo sesión:', error.message)
      const current = data?.session ?? null
      setSession(current)
      setLoadingSession(false)
    }
    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Cargar estado del perfil cuando hay sesión activa
  useEffect(() => {
    if (!session) return
    const loadProfile = async () => {
      // 1. is_blocked
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_blocked')
        .eq('user_id', session.user.id)
        .single()
      if (profileError) console.error('[useSession] Error consultando user_profiles:', profileError.message)
      setIsBlocked(Boolean(profileData?.is_blocked))

      // 2. isAdmin via RPC — NUNCA por email hardcodeado
      const { data: adminResult, error: adminError } = await supabase.rpc('is_admin')
      if (adminError) {
        console.error('[useSession] Error consultando is_admin():', adminError.message)
        setIsAdmin(false)
      } else {
        setIsAdmin(Boolean(adminResult))
      }

      // 3. Actualizar last_seen
      const { error: lastSeenError } = await supabase
        .from('user_profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('user_id', session.user.id)
      if (lastSeenError) console.error('[useSession] Error actualizando last_seen:', lastSeenError.message)
    }
    loadProfile()
  }, [session])

  // Verificar whitelist de mantenimiento (solo cuando es relevante)
  const checkWhitelist = async (isMaintenance) => {
    if (!session || !isMaintenance) {
      setIsWhitelisted(false)
      return
    }
    const { data, error } = await supabase.rpc('is_maintenance_whitelisted', { p_email: session.user.email })
    if (error) console.error('[useSession] Error consultando is_maintenance_whitelisted:', error.message)
    setIsWhitelisted(Boolean(data))
  }

  return { session, loadingSession, isAdmin, isBlocked, isWhitelisted, checkWhitelist }
}