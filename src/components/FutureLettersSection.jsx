import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Mail, MailOpen, Send, Trash2, Zap, Plus, ChevronRight, CalendarDays } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'

// ── Constantes ────────────────────────────────────────────────────────────────
const DAY_MS           = 24 * 60 * 60 * 1000
const MAX_FREE_LETTERS = 1

const DELAY_OPTIONS = [
  { days: 1,  labelEs: 'Mañana',   labelEn: 'Tomorrow' },
  { days: 3,  labelEs: '3 días',   labelEn: '3 days'   },
  { days: 7,  labelEs: '1 semana', labelEn: '1 week'   },
  { days: 30, labelEs: '1 mes',    labelEn: '1 month'  },
]

// ── Animación "papel que se despliega" ────────────────────────────────────────
const paperUnfold = {
  hidden:  { opacity: 0, scaleY: 0.4, scaleX: 0.92, y: -20 },
  visible: {
    opacity: 1, scaleY: 1, scaleX: 1, y: 0,
    transition: { type: 'spring', damping: 22, stiffness: 260, mass: 0.7 },
  },
  exit: {
    opacity: 0, scaleY: 0.3, scaleX: 0.9, y: -16,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
}
const backdropAnim = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
}

// ── Helpers de Fecha ──────────────────────────────────────────────────────────
function daysUntil(isoDate) {
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / DAY_MS))
}
function isUnlocked(isoDate) {
  return new Date(isoDate).getTime() <= Date.now()
}
function formatDeliverDate(isoDate, language) {
  return new Date(isoDate).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function FutureLettersSection({ isPro, onUpgrade, user }) {
  const { t, language } = useLanguage()

  const [letters,           setLetters]           = useState([])
  const [loading,           setLoading]           = useState(true)
  const [showWriter,        setShowWriter]         = useState(false)
  const [activeLetter,      setActiveLetter]       = useState(null)
  const [showLetterProGate, setShowLetterProGate]  = useState(false)
  const [letterText,        setLetterText]         = useState('')
  const [letterDelay,       setLetterDelay]        = useState(7)
  const [saving,            setSaving]             = useState(false)

  // ── Carga desde Supabase ──────────────────────────────────────────────────
  const loadLetters = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('future_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('deliver_at', { ascending: true })
    if (error) console.error('[FutureLettersSection] Error:', error.message)
    else setLetters(data || [])
    setLoading(false)
  }, [user?.id])

  useEffect(() => { loadLetters() }, [loadLetters])

  const readyLetters = useMemo(() => letters.filter(l => isUnlocked(l.deliver_at)), [letters])

  const handleSaveLetter = async () => {
    if (!letterText.trim() || !user?.id) return
    setSaving(true)
    const { error } = await supabase.from('future_letters').insert({
      user_id:    user.id,
      message:    letterText.trim(),
      deliver_at: new Date(Date.now() + letterDelay * DAY_MS).toISOString(),
    })
    if (!error) { setLetterText(''); setLetterDelay(7); setShowWriter(false); await loadLetters() }
    setSaving(false)
  }

  const handleDeleteLetter = async (id) => {
    const { error } = await supabase.from('future_letters').delete().eq('id', id)
    if (!error) { setActiveLetter(null); await loadLetters() }
  }

  const handleOpenWriter = () => {
    if (!isPro && letters.length >= MAX_FREE_LETTERS) { onUpgrade?.(); return }
    setShowWriter(true)
  }

  const portal = (node) =>
    typeof document !== 'undefined' ? createPortal(node, document.body) : null

  if (!user) return null

  return (
    <div className="bg-neutral-800/20 rounded-[2.5rem] border border-white/5 p-6 shadow-xl relative overflow-hidden mb-6 text-left">

      {/* ── Cabecera Estilo Stats ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-white" />
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
            {t('more_letters_title')}
          </h2>
        </div>
        {/* Sin badge aquí por diseño; se muestra en la fila si es necesario */}
      </div>

      <div className="space-y-3">
        {/* ── Fila de Acción: Escribir Carta (Diseño Más Funciones) ── */}
        <button 
          onClick={handleOpenWriter}
          className="w-full flex items-center gap-4 p-4 rounded-[1.5rem] bg-neutral-900/60 border border-white/5 active:scale-[0.98] transition-all group"
        >
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Plus size={20} className="text-violet-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-white">{t('more_letters_action')}</p>
            <p className="text-[11px] text-neutral-500">
              {!isPro && letters.length >= MAX_FREE_LETTERS ? 'Límite Free alcanzado' : t('more_letters_modal_subtitle')}
            </p>
          </div>
          {!isPro && letters.length >= MAX_FREE_LETTERS ? (
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-violet-500/10 border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest">
                <Zap size={10} fill="currentColor" /> PRO
             </div>
          ) : (
            <ChevronRight size={16} className="text-neutral-700 group-hover:text-neutral-500" />
          )}
        </button>

        {/* ── Lista de Cartas con Fechas Restauradas ── */}
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
          </div>
        ) : (
          letters.map((letter) => {
            const unlocked = isUnlocked(letter.deliver_at)
            const daysLeft = daysUntil(letter.deliver_at)
            return (
              <div 
                key={letter.id} 
                onClick={() => {
                  if (!unlocked) return
                  if (!isPro) { setShowLetterProGate(true); return }
                  setActiveLetter(letter)
                }}
                className={`flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all ${
                  unlocked 
                    ? 'bg-emerald-500/5 border-emerald-500/20 cursor-pointer shadow-lg' 
                    : 'bg-neutral-900/20 border-white/5 opacity-60'
                }`}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                  unlocked ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-neutral-800 border-white/5'
                }`}>
                  {unlocked ? <MailOpen size={20} className="text-emerald-400" /> : <Lock size={18} className="text-neutral-600" />}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-bold ${unlocked ? 'text-emerald-400' : 'text-neutral-400'}`}>
                    {unlocked ? t('more_letters_ready') : `${t('more_letters_opens_in')} ${daysLeft}d`}
                  </p>
                  <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                    {formatDeliverDate(letter.deliver_at, language)}
                  </p>
                </div>
                {unlocked && <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />}
              </div>
            )
          })
        )}

        {!loading && letters.length === 0 && (
          <p className="text-center py-2 text-[10px] font-bold text-neutral-700 uppercase tracking-[0.2em]">
            {t('more_letters_empty')}
          </p>
        )}
      </div>

      {/* ── Modales con Portal y Lógica de Selector de Días ── */}
      {portal(
        <AnimatePresence>
          {showWriter && (
            <motion.div variants={backdropAnim} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-6" onClick={() => setShowWriter(false)}>
              <motion.div variants={paperUnfold} className="w-full max-w-sm bg-neutral-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500" />
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Mail size={20} className="text-violet-400" />
                    <div>
                      <h3 className="text-white font-black text-base">{t('more_letters_modal_title')}</h3>
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{t('more_letters_modal_subtitle')}</p>
                    </div>
                  </div>
                  <textarea autoFocus value={letterText} onChange={e => setLetterText(e.target.value)} maxLength={600} className="w-full h-32 bg-neutral-950/60 border border-white/10 rounded-2xl p-5 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-violet-500/40 resize-none mb-6" placeholder={t('more_letters_placeholder')} />
                  
                  {/* Selector de días restaurado */}
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">{t('more_letters_schedule')}</p>
                  <div className="grid grid-cols-4 gap-2 mb-8">
                    {DELAY_OPTIONS.map(opt => (
                      <button 
                        key={opt.days} 
                        onClick={() => setLetterDelay(opt.days)} 
                        className={`py-3 rounded-xl text-[10px] font-black border transition-all ${
                          letterDelay === opt.days ? 'bg-white text-black border-white shadow-lg' : 'bg-neutral-800/60 text-neutral-500 border-white/5'
                        }`}
                      >
                        {language === 'es' ? opt.labelEs : opt.labelEn}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setShowWriter(false)} className="flex-1 py-4 text-xs font-black text-neutral-500">{t('more_letters_cancel')}</button>
                    <button onClick={handleSaveLetter} disabled={!letterText.trim() || saving} className="flex-[2] py-4 bg-white text-black text-xs font-black rounded-2xl active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2">
                      {saving ? <div className="w-4 h-4 border-2 border-black/20 border-t-black animate-spin rounded-full" /> : <><Send size={14} /> {t('more_letters_save')}</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeLetter && (
            <motion.div variants={backdropAnim} initial="hidden" animate="visible" exit="exit" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-6" onClick={() => setActiveLetter(null)}>
              <motion.div variants={paperUnfold} className="w-full max-w-sm bg-neutral-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
                <div className="p-8 text-left">
                  <div className="flex items-center gap-3 mb-6">
                    <MailOpen size={20} className="text-emerald-400" />
                    <h3 className="text-white font-black text-base">{t('more_letters_open_title')}</h3>
                  </div>
                  <div className="bg-neutral-950/50 rounded-2xl border border-white/5 p-6 mb-6 italic text-neutral-200 whitespace-pre-wrap relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="border-b border-white h-7" />
                      ))}
                    </div>
                    "{activeLetter.message}"
                  </div>
                  <p className="text-[10px] text-neutral-600 text-center font-mono mb-6 uppercase tracking-widest">
                    📅 {formatDeliverDate(activeLetter.deliver_at, language)}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setActiveLetter(null)} className="flex-1 py-4 bg-neutral-800 text-white text-xs font-black rounded-2xl">{t('more_letters_close')}</button>
                    <button onClick={() => handleDeleteLetter(activeLetter.id)} className="px-5 py-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/10 active:scale-95"><Trash2 size={18} /></button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
          {showLetterProGate && (
            <motion.div
              variants={backdropAnim}
              initial="hidden" animate="visible" exit="exit"
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-6"
              onClick={() => setShowLetterProGate(false)}
            >
              <motion.div
                variants={paperUnfold}
                className="w-full max-w-sm bg-neutral-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-500" />
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
                    <Lock size={28} className="text-violet-400" />
                  </div>
                  <h3 className="text-white font-black text-base mb-2">
                    {t('future_letter_locked') || 'Tu carta del pasado te espera — Activa Pro para leerla.'}
                  </h3>
                  <p className="text-neutral-500 text-xs mb-6">
                    {t('more_letters_modal_subtitle')}
                  </p>
                  <button
                    onClick={() => { setShowLetterProGate(false); onUpgrade?.() }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-4 rounded-2xl text-sm active:scale-95 shadow-lg shadow-indigo-500/30 mb-3"
                  >
                    <Zap size={15} fill="white" />
                    {t('future_letter_locked_cta') || 'Activar Pro'}
                  </button>
                  <button
                    onClick={() => setShowLetterProGate(false)}
                    className="w-full text-neutral-500 text-xs py-2"
                  >
                    {t('back') || 'Volver'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}