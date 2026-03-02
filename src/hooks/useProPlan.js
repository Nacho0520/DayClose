import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const VITE_TEST_EMAIL = import.meta.env.VITE_TEST_EMAIL || null

/**
 * Gestiona el plan Pro del usuario.
 * - isPro: determinado por la BD + isAdmin (del RPC, nunca email hardcodeado)
 * - isTestAccount: derivado de VITE_TEST_EMAIL (variable de entorno)
 * - effectiveIsPro: considera overrides de la cuenta de test
 */
export function useProPlan({ session, isAdmin }) {
  const [isPro, setIsPro] = useState(false)
  const [testProOverride, setTestProOverride] = useState(() => {
    try {
      return localStorage.getItem('dayclose_simulate_free') !== 'true'
    } catch { return true }
  })

  const isTestAccount = VITE_TEST_EMAIL
    ? session?.user?.email === VITE_TEST_EMAIL
    : false

  const effectiveIsPro = isTestAccount ? testProOverride : isPro

  // isAdmin viene del hook useSession (determinado por RPC),
  // si es admin, siempre tiene acceso Pro
  const resolveIsPro = (profileData) => {
    if (isAdmin) return true
    if (profileData?.plan !== 'pro') return false
    const expiresAt = profileData?.pro_expires_at
    if (!expiresAt) return true
    return new Date(expiresAt) > new Date()
  }

  useEffect(() => {
    if (!session) return
    const loadPlan = async () => {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('plan, pro_expires_at')
        .eq('id', session.user.id)
        .single()
      if (error) console.error('[useProPlan] Error consultando profiles (plan):', error.message)
      setIsPro(resolveIsPro(profileData))
    }
    loadPlan()
  }, [session, isAdmin])

  const handleToggleTestPro = () => {
    setTestProOverride(prev => {
      const next = !prev
      try {
        localStorage.setItem('dayclose_simulate_free', next ? 'false' : 'true')
      } catch {}
      return next
    })
  }

  return { isPro, isTestAccount, effectiveIsPro, handleToggleTestPro }
}