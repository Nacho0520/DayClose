import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const VITE_TEST_EMAIL = import.meta.env.VITE_TEST_EMAIL || null

// Clave de localStorage para el override local del plan.
// Funciona para cualquier usuario — la cuenta test la tenía en exclusiva,
// ahora la comparten todos.
const LS_KEY = 'dayclose_plan_override' // 'pro' | 'free' | null (sin override)

// ── [NUEVO] Duración del Silent Pro Trial (días) ──────────────────────────────
const TRIAL_DAYS = 14

/**
 * Gestiona el plan Pro del usuario.
 *
 * Jerarquía de resolución:
 *   1. isAdmin              → siempre PRO, sin override posible
 *   2. localOverride        → 'pro' | 'free'  (cualquier usuario puede toglear)
 *   3. isInTrial            → PRO silencioso durante los primeros 14 días
 *   4. BD (profiles.plan)  → valor real persistido
 *
 * El toggle guarda en localStorage para que sobreviva recargas, pero NO
 * modifica la BD — es un override de vista, exactamente como la cuenta test.
 *
 * NOTA: localOverride === 'free' anula el trial (permite simular expiración).
 */
export function useProPlan({ session, isAdmin }) {
  // ── Plan real de BD ───────────────────────────────────────────────────────
  const [dbIsPro, setDbIsPro] = useState(false)

  // ── [NUEVO] Estado del trial ───────────────────────────────────────────────
  const [isInTrial, setIsInTrial] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState(0)

  // ── Override local (cualquier usuario) ───────────────────────────────────
  // null  → sin override, usar el valor de BD
  // 'pro' → simular PRO
  // 'free'→ simular FREE (también anula el trial)
  const [localOverride, setLocalOverride] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) || null
    } catch { return null }
  })

  // ── Compatibilidad hacia atrás: cuenta test usaba 'dayclose_simulate_free' ─
  const isTestAccount = VITE_TEST_EMAIL
    ? session?.user?.email === VITE_TEST_EMAIL
    : false

  // ── [NUEVO] Plan efectivo ─────────────────────────────────────────────────
  // Admin → siempre PRO
  // localOverride 'free' → fuerza FREE (anula trial y BD)
  // localOverride 'pro'  → fuerza PRO
  // isInTrial            → PRO silencioso
  // dbIsPro              → PRO real de BD
  const effectiveIsPro = isAdmin
    ? true
    : localOverride === 'free'
      ? false
      : localOverride === 'pro'
        ? true
        : isInTrial || dbIsPro

  // ── Resolución del plan desde BD ──────────────────────────────────────────
  const resolveDbIsPro = (profileData) => {
    if (profileData?.plan !== 'pro') return false
    const expiresAt = profileData?.pro_expires_at
    if (!expiresAt) return true
    return new Date(expiresAt) > new Date()
  }

  // ── [NUEVO] Cálculo del trial a partir de created_at ─────────────────────
  const resolveTrialData = (profileData) => {
    const createdAt = profileData?.created_at
    if (!createdAt) return { inTrial: false, daysLeft: 0 }

    const msPerDay = 1000 * 60 * 60 * 24
    const diffMs = Date.now() - new Date(createdAt).getTime()
    const daysPassed = Math.floor(diffMs / msPerDay)
    const daysLeft = Math.max(0, TRIAL_DAYS - daysPassed)
    const inTrial = daysLeft > 0

    return { inTrial, daysLeft }
  }

  useEffect(() => {
    if (!session) return
    const loadPlan = async () => {
      const { data: profileData, error } = await supabase
        .from('profiles')
        // ── [NUEVO] Añadimos created_at al SELECT ────────────────────────────
        .select('plan, pro_expires_at, created_at')
        .eq('id', session.user.id)
        .single()
      if (error) console.error('[useProPlan] Error:', error.message)

      setDbIsPro(resolveDbIsPro(profileData))

      // ── [NUEVO] Calcular y guardar datos del trial ────────────────────────
      const { inTrial, daysLeft } = resolveTrialData(profileData)
      setIsInTrial(inTrial)
      setTrialDaysLeft(daysLeft)
    }
    loadPlan()
  }, [session, isAdmin])

  // ── Toggle — igual para todos, igual que la cuenta test ──────────────────
  // Alterna entre 'pro' y 'free'.
  // Si el usuario está en el estado real, el primer toggle lo lleva al opuesto.
  const handleToggleTestPro = () => {
    setLocalOverride(prev => {
      // Estado actual efectivo (lo que ve el usuario antes de pulsar)
      const currentEffective = isAdmin
        ? true
        : (prev !== null ? prev === 'pro' : (isInTrial || dbIsPro))
      const next = currentEffective ? 'free' : 'pro'
      try {
        localStorage.setItem(LS_KEY, next)
        // Limpiar la clave antigua de la cuenta test para evitar conflictos
        localStorage.removeItem('dayclose_simulate_free')
      } catch {}
      return next
    })
  }

  // ── Resetear override (opcional — para restaurar el valor real de BD) ────
  const resetPlanOverride = () => {
    setLocalOverride(null)
    try {
      localStorage.removeItem(LS_KEY)
      localStorage.removeItem('dayclose_simulate_free')
    } catch {}
  }

  return {
    isPro: effectiveIsPro,                    // ← efectivo (con override + trial)
    isTestAccount,                            // ← para compatibilidad
    effectiveIsPro,                           // ← idéntico a isPro, alias explícito
    handleToggleTestPro,                      // ← toggle para cualquier usuario
    resetPlanOverride,                        // ← extra: restaurar estado real
    hasLocalOverride: localOverride !== null, // ← saber si hay override activo
    // ── [NUEVO] Exports del trial ────────────────────────────────────────────
    isInTrial,                                // ← true si está en período de gracia
    trialDaysLeft,                            // ← días enteros restantes del trial
  }
}