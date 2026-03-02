import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { Check, Clock, X, Flame } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

// ── Constantes ────────────────────────────────────────────────────────────────
const HOURS_COOLDOWN = 4
const COOLDOWN_MS = HOURS_COOLDOWN * 60 * 60 * 1000

// ── Props recibidas desde App.jsx:
//   session      — sesión de Supabase
//   isPro        — booleano de plan Pro (effectiveIsPro)
//   habits       — hábitos de HOY ya filtrados por frecuencia (del estado de App)
//   todayLogs    — logs de hoy ya cargados (del estado de App)
//   mode         — modo actual de la app ('dashboard', 'reviewing', 'admin', etc.)
// ─────────────────────────────────────────────────────────────────────────────

export default function ReminderPopup({ session, isPro, habits = [], todayLogs = [], mode }) {
  const [visible, setVisible] = useState(false)
  const [currentHabit, setCurrentHabit] = useState(null)
  const [snoozedHabits, setSnoozedHabits] = useState([])
  const [streakDangerVisible, setStreakDangerVisible] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(0)
  const { t } = useLanguage()

  // ── Hábitos pendientes: calculados con los datos que ya tenemos, sin queries ──
  const pendingHabits = useMemo(() => {
    // IDs que ya tienen log (completado O saltado)
    const loggedIds = new Set(todayLogs.map(l => l.habit_id))
    return habits.filter(h => !loggedIds.has(h.id) && !snoozedHabits.includes(h.id))
  }, [habits, todayLogs, snoozedHabits])

  // ── Mensaje dinámico según cuántos hábitos faltan ─────────────────────────
  const reminderSubtext = useMemo(() => {
    if (pendingHabits.length === 1) {
      return t('reminder_one_left') || '¡Solo te queda uno para un día perfecto!'
    }
    return (t('reminder_many_left') || 'Tienes {n} tareas pendientes para cerrar el día.').replace('{n}', pendingHabits.length)
  }, [pendingHabits.length, t])

  // ── Lógica del popup de hábito pendiente (sin queries) ────────────────────
  const checkPendingHabits = () => {
    if (!session || !isPro) return
    // No mostrar si el usuario está revisando o en modo admin
    if (mode === 'reviewing' || mode === 'admin') return
    // No mostrar si ya completó/saltó todo
    if (pendingHabits.length === 0) {
      setVisible(false)
      return
    }

    const lastShownStr = localStorage.getItem('lastPopupTime')
    if (lastShownStr && Date.now() - parseInt(lastShownStr) < COOLDOWN_MS) return

    // Mostrar el primer hábito pendiente
    const next = pendingHabits[0]
    if (next) {
      setCurrentHabit(next)
      setVisible(true)
      localStorage.setItem('lastPopupTime', Date.now().toString())
    }
  }

  // ── Lógica de racha en peligro — query mínima (solo 2 días) ───────────────
  const checkStreakDanger = async () => {
    if (!session || !isPro) return
    if (mode === 'reviewing' || mode === 'admin') return

    const now = new Date()
    if (now.getHours() < 21) return // Solo avisar a partir de las 21:00

    const dismissedKey = `dayclose_streak_danger_${now.toISOString().split('T')[0]}`
    if (localStorage.getItem(dismissedKey)) return

    // Si todayLogs ya tiene completados, la racha está a salvo — no molestar
    const completedToday = todayLogs.filter(l => l.status === 'completed').length
    if (completedToday > 0) return

    // Query ligera: solo logs de ayer para verificar si había racha activa
    // Es mucho más eficiente que traer todo el historial
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const yesterdayStart = `${yesterday.toISOString().split('T')[0]}T00:00:00.000Z`
    const yesterdayEnd   = `${yesterday.toISOString().split('T')[0]}T23:59:59.999Z`

    const { data: yesterdayLogs, error } = await supabase
      .from('daily_logs')
      .select('created_at')
      .eq('user_id', session.user.id)
      .eq('status', 'completed')
      .gte('created_at', yesterdayStart)
      .lte('created_at', yesterdayEnd)
      .limit(1) // Solo necesitamos saber si existe al menos uno

    if (error) {
      console.error('[ReminderPopup] Error verificando racha de ayer:', error.message)
      return
    }

    // Si no hubo actividad ayer, no hay racha que proteger
    if (!yesterdayLogs || yesterdayLogs.length === 0) return

    // Hay racha activa y hoy no se ha completado nada → racha en peligro
    // Calculamos la racha con el protector de localStorage para mostrar un número real
    const protectorUses = (() => {
      try {
        const raw = localStorage.getItem('dayclose_streak_protector_uses')
        return raw ? JSON.parse(raw) : []
      } catch { return [] }
    })()

    // Query adicional solo si necesitamos el número de días (ligera, limitada a 365)
    const streakStart = new Date(now)
    streakStart.setDate(now.getDate() - 365)

    const { data: allLogs } = await supabase
      .from('daily_logs')
      .select('created_at')
      .eq('user_id', session.user.id)
      .eq('status', 'completed')
      .gte('created_at', streakStart.toISOString())
      .order('created_at', { ascending: false })

    if (!allLogs) return

    const formatDate = (d) => {
      const dd = new Date(d)
      return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`
    }

    const activeDays = new Set([
      ...allLogs.map(l => formatDate(l.created_at)),
      ...protectorUses
    ])

    // Contar racha hacia atrás desde ayer
    let streak = 0
    let check = new Date(yesterday)
    while (activeDays.has(formatDate(check))) {
      streak++
      check.setDate(check.getDate() - 1)
    }

    if (streak >= 2) {
      setCurrentStreak(streak)
      setStreakDangerVisible(true)
    }
  }

  // ── Efecto principal: pendientes se recalculan con los datos de App ────────
  useEffect(() => {
    if (!isPro || !session) return
    // Si el usuario está en modo que no debe mostrar el popup, ocultar inmediatamente
    if (mode === 'reviewing' || mode === 'admin') {
      setVisible(false)
      return
    }
    const timer = setTimeout(checkPendingHabits, 5000)
    const interval = setInterval(checkPendingHabits, 300_000) // cada 5 min
    return () => { clearTimeout(timer); clearInterval(interval) }
  // pendingHabits ya incluye la dependencia de habits/todayLogs/snoozedHabits
  }, [session, isPro, mode, pendingHabits])

  // ── Efecto de racha en peligro ────────────────────────────────────────────
  useEffect(() => {
    if (!isPro || !session) return
    if (mode === 'reviewing' || mode === 'admin') return
    checkStreakDanger()
    const interval = setInterval(checkStreakDanger, 60 * 60 * 1000) // cada hora
    return () => clearInterval(interval)
  }, [session, isPro, mode, todayLogs])

  // ── Acción del usuario sobre el popup ─────────────────────────────────────
  const handleAction = async (action) => {
    if (!currentHabit || !session) return

    if (action === 'done') {
      const { error } = await supabase.from('daily_logs').insert({
        user_id: session.user.id,
        habit_id: currentHabit.id,
        status: 'completed',
        note: 'Marcado desde recordatorio',
        created_at: new Date().toISOString()
      })
      if (error) {
        console.error('[ReminderPopup] Error marcando hábito como completado:', error.message)
        return
      }
      setVisible(false)
      window.location.reload()

    } else if (action === 'later') {
      setSnoozedHabits(prev => [...prev, currentHabit.id])
      setVisible(false)

    } else if (action === 'skip') {
      const { error } = await supabase.from('daily_logs').insert({
        user_id: session.user.id,
        habit_id: currentHabit.id,
        status: 'skipped',
        note: 'Omitido desde pop-up',
        created_at: new Date().toISOString()
      })
      if (error) {
        console.error('[ReminderPopup] Error saltando hábito:', error.message)
        return
      }
      setVisible(false)
      window.location.reload()
    }
  }

  // ── Gate Pro: si no es Pro, no renderizar nada ────────────────────────────
  if (!isPro) return null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {/* ── Popup de Hábito Pendiente ─────────────────────────────────────── */}
      {visible && currentHabit && (
        <motion.div
          key="habit-popup"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <div className="bg-neutral-800 border border-white/5 rounded-[2rem] p-5 shadow-2xl flex flex-col gap-4">
            {/* Cabecera: icono + título del hábito */}
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner ${currentHabit.color || 'bg-blue-500'}`}>
                <span className="text-2xl">{currentHabit.icon || '📝'}</span>
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">
                  {t('reminder_title')}
                </p>
                <p className="text-white font-bold text-lg leading-tight">{currentHabit.title}</p>
                {/* Mensaje dinámico de progreso */}
                <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">{reminderSubtext}</p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAction('done')}
                className="flex flex-col items-center justify-center bg-emerald-500/10 text-emerald-400 py-3 rounded-2xl border border-emerald-500/10 active:scale-95 transition-all"
              >
                <Check size={20} className="mb-1" />
                <span className="text-[10px] font-black uppercase tracking-wider">{t('btn_done')}</span>
              </button>
              <button
                onClick={() => handleAction('later')}
                className="flex flex-col items-center justify-center bg-neutral-900/40 text-neutral-400 py-3 rounded-2xl border border-white/5 active:scale-95 transition-all"
              >
                <Clock size={20} className="mb-1" />
                <span className="text-[10px] font-black uppercase tracking-wider">{t('btn_later')}</span>
              </button>
              <button
                onClick={() => handleAction('skip')}
                className="flex flex-col items-center justify-center bg-red-500/10 text-red-400 py-3 rounded-2xl border border-red-500/10 active:scale-95 transition-all"
              >
                <X size={20} className="mb-1" />
                <span className="text-[10px] font-black uppercase tracking-wider">{t('btn_skip')}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Popup de Racha en Peligro ─────────────────────────────────────── */}
      {streakDangerVisible && !visible && (
        <motion.div
          key="streak-danger"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <div className="bg-neutral-900 border border-orange-500/20 rounded-[2rem] p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 border border-orange-500/20 flex-shrink-0">
                <Flame size={24} className="text-orange-400 fill-orange-400/30" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-orange-400 uppercase font-black tracking-widest">
                  {t('streak_danger_title') || 'Racha en peligro'}
                </p>
                <p className="text-white font-bold text-sm leading-snug">
                  {currentStreak} {t('streak_label')} — {t('streak_danger_desc') || 'Salva tu progreso hoy'}
                </p>
              </div>
              <button
                onClick={() => {
                  const key = `dayclose_streak_danger_${new Date().toISOString().split('T')[0]}`
                  localStorage.setItem(key, 'true')
                  setStreakDangerVisible(false)
                }}
                className="text-neutral-600 hover:text-neutral-400 p-2"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}