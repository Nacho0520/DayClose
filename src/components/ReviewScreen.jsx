import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import SwipeCard from './SwipeCard'
import NoteModal from './NoteModal'
import { useLanguage } from '../context/LanguageContext'

// MotionDiv fuera del componente para evitar re-renders innecesarios
const MotionDiv = motion.div

export default function ReviewScreen({ habits, todayLogs, session, onReviewComplete }) {
  const navigate = useNavigate()
  const { t } = useLanguage()

  // ── Calcular hábitos pendientes de hoy ─────────────────────────────────
  // Solo los que no tienen log (ni completado ni saltado)
  const pendingHabits = useMemo(() => {
    const loggedIds = new Set((todayLogs || []).map(l => l.habit_id))
    return (habits || []).filter(h => !loggedIds.has(h.id))
  }, [habits, todayLogs])

  // ── Hábitos a revisar (respeta el "Día difícil" de localStorage) ───────
  const reviewHabits = useMemo(() => {
    try {
      const hardDayEnabled = localStorage.getItem('dayclose_hard_day_enabled') === 'true'
      if (!hardDayEnabled) return pendingHabits
      const rawIds = localStorage.getItem('dayclose_hard_day_ids')
      const hardDayIds = rawIds ? JSON.parse(rawIds) : []
      if (!Array.isArray(hardDayIds) || hardDayIds.length === 0) return pendingHabits
      const allowed = new Set(hardDayIds)
      return pendingHabits.filter(h => allowed.has(h.id))
    } catch {
      return pendingHabits
    }
  }, [pendingHabits])

  // ── Redirigir si no hay hábitos pendientes ─────────────────────────────
  useEffect(() => {
    // Esperamos a que habits/todayLogs estén cargados (arrays no vacíos o ya definidos)
    // Si habits ya llegó y no hay nada pendiente → volver al home
    if (habits !== undefined && habits !== null && reviewHabits.length === 0) {
      navigate('/', { replace: true })
    }
  }, [reviewHabits, habits, navigate])

  // ── Estado local del flujo de review ───────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState([])
  const [swipeStatus, setSwipeStatus] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingHabit, setPendingHabit] = useState(null)

  // ── Estado del resumen del día ─────────────────────────────────────────
  const [showDaySummary, setShowDaySummary] = useState(false)
  const [dayScore, setDayScore] = useState(null)
  const [dayMood, setDayMood] = useState(null)

  // ── Estado de guardado ─────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(null)
  const [hasSaved, setHasSaved] = useState(false)

  const currentHabit = reviewHabits[currentIndex]

  // ── Guardar resultados cuando se terminan todos los hábitos y el resumen ─
  const saveResults = useCallback(async () => {
    if (!session || !results.length || hasSaved || saving) return
    setSaving(true)
    const payload = results.map(i => ({
      user_id: session.user.id,
      habit_id: i.id,
      status: i.status,
      note: i.note || null,
      created_at: new Date().toISOString()
    }))
    const { error } = await supabase.from('daily_logs').insert(payload)
    if (!error) {
      setSaveSuccess(t('saved_success'))
      setHasSaved(true)
      // Notificar a App.jsx para que refresque todayLogs
      if (typeof onReviewComplete === 'function') onReviewComplete()
      setTimeout(() => navigate('/', { replace: true }), 1200)
    } else {
      console.error('[ReviewScreen] Error guardando logs del review:', error.message)
    }
    setSaving(false)
  }, [session, results, hasSaved, saving, t, onReviewComplete, navigate])

  useEffect(() => {
    const allDone = currentIndex >= reviewHabits.length && reviewHabits.length > 0
    if (allDone && showDaySummary && !hasSaved && !saving) {
      saveResults()
    }
  }, [currentIndex, reviewHabits.length, showDaySummary, hasSaved, saving, saveResults])

  // ── Si aún no hay datos cargados, mostrar loading mínimo ───────────────
  if (!habits) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white font-black italic tracking-tighter uppercase text-3xl">
        DAYCLOSE
      </div>
    )
  }

  // ── Render principal ────────────────────────────────────────────────────
  return (
    <div
      className={`app-screen flex items-center justify-center transition-colors duration-300 relative ${
        swipeStatus === 'done'
          ? 'bg-emerald-900'
          : swipeStatus === 'not-done'
          ? 'bg-red-900'
          : 'bg-neutral-900'
      }`}
    >
      {/* Botón de salida */}
      <button
        onClick={() => navigate('/', { replace: true })}
        className="fixed top-6 right-6 z-[100] flex items-center gap-1 px-4 py-2 bg-neutral-800/80 backdrop-blur-md border border-white/5 rounded-full text-neutral-400 hover:text-white transition-all shadow-lg"
      >
        <X size={18} />
        <span className="text-xs font-medium uppercase tracking-widest">{t('exit')}</span>
      </button>

      <div className="w-full max-w-md mx-auto px-4 py-6 text-white">
        <h1 className="mb-2 text-center text-2xl font-semibold">{t('review_night')}</h1>

        {/* ── Fase 1: Swipe de hábitos ───────────────��─────────────────── */}
        {currentHabit ? (
          <SwipeCard
            habit={currentHabit}
            onSwipeComplete={(direction) => {
              if (direction === 'right') {
                setResults(prev => [
                  ...prev,
                  { id: currentHabit.id, title: currentHabit.title, status: 'completed' }
                ])
                setCurrentIndex(c => c + 1)
              } else {
                setPendingHabit(currentHabit)
                setIsModalOpen(true)
              }
            }}
            onDrag={(xVal) =>
              setSwipeStatus(xVal > 100 ? 'done' : xVal < -100 ? 'not-done' : null)
            }
          />

        ) : !showDaySummary ? (
          /* ── Fase 2: Score y mood del día ─────────────────────────────── */
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="w-full max-w-sm mx-auto"
          >
            <div className="bg-neutral-800/60 rounded-[2rem] border border-white/5 p-6 text-center shadow-xl">
              <p className="text-2xl mb-1">✅</p>
              <p className="text-lg font-black text-white mb-1">{t('review_completed')}</p>
              <p className="text-[11px] text-neutral-500 mb-6">
                {t('day_summary_subtitle') || 'Antes de cerrar, ¿cómo fue tu día?'}
              </p>

              {/* Score */}
              <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-3">
                {t('day_score_label') || 'Puntúa tu día'}
              </p>
              <div className="flex justify-center gap-1.5 mb-6 flex-wrap">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setDayScore(n)}
                    className={`w-9 h-9 rounded-xl text-sm font-black transition-all active:scale-90 ${
                      dayScore === n
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-neutral-700/60 text-neutral-400 border border-white/5'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Mood */}
              <p className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 mb-3">
                {t('day_mood_label') || 'Estado de ánimo'}
              </p>
              <div className="flex justify-center gap-3 mb-6">
                {['😩','😕','😐','🙂','😄'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setDayMood(emoji)}
                    className={`text-2xl w-12 h-12 rounded-2xl transition-all active:scale-90 ${
                      dayMood === emoji
                        ? 'bg-neutral-600 ring-2 ring-white/30 scale-110'
                        : 'bg-neutral-700/40 border border-white/5'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* CTA cerrar el día */}
              <button
                onClick={() => setShowDaySummary(true)}
                disabled={!dayScore || !dayMood}
                className="w-full py-4 rounded-2xl bg-white text-black font-black text-sm active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                {t('close_day_btn') || 'Cerrar el día →'}
              </button>
              <button
                onClick={() => setShowDaySummary(true)}
                className="mt-3 w-full text-[11px] text-neutral-600 active:text-neutral-400"
              >
                {t('skip_summary') || 'Saltar'}
              </button>
            </div>
          </MotionDiv>

        ) : (
          /* ── Fase 3: Guardando / éxito ───────────────────────────────── */
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="rounded-2xl bg-neutral-800 p-6 text-center"
          >
            <p className="text-xl font-bold mb-2">{t('review_completed')}</p>
            {saving && (
              <p className="text-sm text-neutral-400">{t('saving')}</p>
            )}
            {saveSuccess && (
              <p className="text-sm text-emerald-400">{t('saved_success')}</p>
            )}
            <button
              onClick={() => navigate('/', { replace: true })}
              className="mt-6 w-full py-4 bg-white text-black font-bold rounded-2xl active:scale-95 transition-all"
            >
              {t('back_dashboard')}
            </button>
          </MotionDiv>
        )}
      </div>

      {/* Modal de nota al saltar un hábito */}
      <NoteModal
        isOpen={isModalOpen}
        habitTitle={pendingHabit?.title}
        onSave={(note) => {
          setResults(prev => [
            ...prev,
            { id: pendingHabit.id, title: pendingHabit.title, status: 'skipped', note: note || '' }
          ])
          setIsModalOpen(false)
          setCurrentIndex(c => c + 1)
        }}
        onSkip={() => {
          setResults(prev => [
            ...prev,
            { id: pendingHabit.id, title: pendingHabit.title, status: 'skipped', note: '' }
          ])
          setIsModalOpen(false)
          setCurrentIndex(c => c + 1)
        }}
      />
    </div>
  )
}