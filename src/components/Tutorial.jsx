import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ArrowRight, CheckCircle, MessageSquare, PartyPopper, Bell } from 'lucide-react'
import SwipeCard from './SwipeCard'
import { useLanguage } from '../context/LanguageContext'

export default function Tutorial({ user, onComplete }) {
  const [phase, setPhase] = useState('welcome') 
  const [step, setStep] = useState(0)
  const [tutorialNote, setTutorialNote] = useState('')
  const { t } = useLanguage()
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)

  const pushSteps = isIOS
    ? [t('push_ios_step1'), t('push_ios_step2'), t('push_ios_step3')]
    : isAndroid
      ? [t('push_android_step1'), t('push_android_step2'), t('push_android_step3')]
      : [t('push_generic_step1'), t('push_generic_step2')]

  const PRACTICE_STEPS = [
    { id: 'p1', title: t('tut_step1_title'), desc: t('tut_step1_desc'), icon: "💧", color: "bg-blue-500", instruction: t('tut_step1_instr') },
    { id: 'p2', title: t('tut_step2_title'), desc: t('tut_step2_desc'), icon: "🧘", color: "bg-purple-500", instruction: t('tut_step2_instr') }
  ]

  const handleSwipe = (direction) => {
    if (step === 0 && direction === 'right') setStep(1)
    else if (step === 1 && direction === 'left') setPhase('note')
  }

  return (
    <div className="fixed inset-0 z-[200] bg-neutral-900 flex items-center justify-center p-6 overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {phase === 'welcome' && (
          <motion.div key="welcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="w-full max-w-sm bg-neutral-800 border border-white/5 rounded-[3rem] p-8 shadow-2xl text-center">
            <div className="flex justify-center mb-6"><div className="p-4 bg-blue-500/10 rounded-3xl border border-blue-500/20 text-blue-400"><Star size={32} fill="currentColor" /></div></div>
            <h1 className="text-3xl font-black text-white tracking-tighter mb-4 leading-none">{t('tut_welcome_title')}</h1>
            <p className="text-neutral-400 text-sm mb-8 leading-relaxed font-medium">{t('hello')} <span className="text-white font-bold">{user?.user_metadata?.full_name || 'campeón'}</span>. {t('tut_welcome_desc')}</p>
            <button onClick={() => setPhase('practice')} className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl">{t('tut_teach_me')} <ArrowRight size={18} /></button>
          </motion.div>
        )}
        {phase === 'practice' && (
          <motion.div key="practice" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-md flex flex-col items-center">
            <div className="mb-10 text-center px-4"><h2 className="text-white font-black text-2xl tracking-tight mb-2">{PRACTICE_STEPS[step].title}</h2><p className="text-neutral-400 text-xs font-black uppercase tracking-[0.2em]">{PRACTICE_STEPS[step].instruction}</p></div>
            <div className="w-full relative h-[380px]"><SwipeCard key={PRACTICE_STEPS[step].id} habit={PRACTICE_STEPS[step]} onSwipeComplete={handleSwipe} onDrag={() => {}} /></div>
          </motion.div>
        )}
        {phase === 'note' && (
          <motion.div key="note" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm bg-neutral-800 border border-white/5 rounded-[3rem] p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400"><MessageSquare size={24} /></div><h2 className="text-xl font-black text-white tracking-tight">{t('tut_note_title')}</h2></div>
            <p className="text-neutral-400 text-xs mb-4 font-bold uppercase tracking-widest">{t('tut_sim')}</p>
            <textarea autoFocus value={tutorialNote} onChange={(e) => setTutorialNote(e.target.value)} placeholder={t('tut_note_placeholder')} className="w-full bg-neutral-900 border border-neutral-800/60 rounded-2xl p-4 text-white text-sm outline-none focus:border-neutral-400/50 transition-colors h-32 resize-none mb-6" />
            <button onClick={() => setPhase('push')} className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all">{t('tut_save_note')}</button>
          </motion.div>
        )}
        {phase === 'push' && (
          <motion.div key="push" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm bg-neutral-800 border border-white/5 rounded-[3rem] p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400"><Bell size={22} /></div>
              <h2 className="text-xl font-black text-white tracking-tight">{t('push_tutorial_title')}</h2>
            </div>
            <p className="text-neutral-400 text-xs mb-4 font-bold uppercase tracking-widest">{t('push_tutorial_subtitle')}</p>
            <div className="space-y-2 mb-6">
              {pushSteps.map((stepText, index) => (
                <div key={`${stepText}-${index}`} className="flex items-start gap-3 bg-neutral-900/60 border border-white/5 rounded-2xl p-3 text-sm text-neutral-300">
                  <div className="h-6 w-6 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold flex items-center justify-center text-neutral-400">
                    {index + 1}
                  </div>
                  <p className="text-[12px] leading-relaxed">{stepText}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setPhase('congrats')} className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all">
              {t('push_tutorial_cta')}
            </button>
          </motion.div>
        )}
        {phase === 'congrats' && (
          <motion.div key="congrats" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm text-center">
            <motion.div animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="flex justify-center mb-8"><div className="p-6 bg-emerald-500/20 rounded-[2.5rem] border border-emerald-500/30 text-emerald-400"><PartyPopper size={60} /></div></motion.div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-4 leading-none">{t('tut_congrats_title')}</h1>
            <p className="text-neutral-300 text-lg font-medium mb-10 leading-snug px-4">{t('tut_congrats_desc')}</p>
            <button onClick={onComplete} className="w-full bg-white text-black font-black py-5 rounded-[2rem] text-lg shadow-[0_10px_30px_rgba(255,255,255,0.05)] active:scale-95 transition-all flex items-center justify-center gap-3">{t('tut_enter_app')} <CheckCircle size={22} /></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}