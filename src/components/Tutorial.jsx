import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight, Zap, Star, Layout, MousePointer2 } from 'lucide-react'

const PRACTICE_STEPS = [
  {
    id: 'p1',
    title: "Prueba el Swipe",
    desc: "Desliza esta carta a la derecha para marcar este hábito como completado.",
    icon: "💧",
    color: "bg-blue-500",
    instruction: "Desliza a la derecha para el ÉXITO"
  },
  {
    id: 'p2',
    title: "Añade una nota",
    desc: "Desliza a la izquierda si no pudiste cumplirlo. Podrás explicar qué pasó.",
    icon: "🧘",
    color: "bg-purple-500",
    instruction: "Desliza a la izquierda para el SKIP"
  }
]

export default function Tutorial({ user, onComplete }) {
  const [phase, setPhase] = useState('welcome') // 'welcome' o 'practice'
  const [step, setStep] = useState(0)

  const nextStep = () => {
    if (step < PRACTICE_STEPS.length - 1) setStep(step + 1)
    else onComplete()
  }

  return (
    <div className="fixed inset-0 z-[200] bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        
        {/* FASE 1: BIENVENIDA FLOTANTE */}
        {phase === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="w-full max-w-sm bg-neutral-800 border border-neutral-700 rounded-[3rem] p-8 shadow-2xl"
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-500/10 rounded-3xl border border-blue-500/20">
                <Star className="text-blue-400" size={32} fill="currentColor" />
              </div>
            </div>
            
            <h1 className="text-3xl font-black text-white text-center tracking-tighter mb-4 leading-none">
              Bienvenido a MiVida
            </h1>
            
            <p className="text-neutral-400 text-center text-sm mb-8 leading-relaxed font-medium">
              Hola <span className="text-white font-bold">{user?.user_metadata?.full_name || 'campeón'}</span>. 
              Has dado el primer paso para dominar tu rutina. MiVida te ayudará a ser constante mediante revisiones nocturnas rápidas y visuales.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-xs text-neutral-300 font-bold">
                <Layout size={18} className="text-blue-500" />
                <span>Interfaz limpia y sin distracciones</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-300 font-bold">
                <MousePointer2 size={18} className="text-emerald-500" />
                <span>Control total mediante gestos naturales</span>
              </div>
            </div>

            <button 
              onClick={() => setPhase('practice')}
              className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-white/5"
            >
              ENTIENDO, ¿CÓMO FUNCIONA? <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {/* FASE 2: TUTORIAL INTERACTIVO */}
        {phase === 'practice' && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm"
          >
            <div className={`rounded-[3rem] ${PRACTICE_STEPS[step].color} p-8 shadow-2xl relative overflow-hidden`}>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              
              <div className="relative z-10 text-center">
                <span className="text-7xl mb-6 block">{PRACTICE_STEPS[step].icon}</span>
                <h2 className="text-3xl font-black text-white leading-tight mb-4 tracking-tighter">
                  {PRACTICE_STEPS[step].title}
                </h2>
                <p className="text-white/80 text-sm font-medium leading-relaxed mb-10">
                  {PRACTICE_STEPS[step].desc}
                </p>

                <button 
                  onClick={nextStep}
                  className="w-full bg-black/20 hover:bg-black/30 backdrop-blur-md py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] transition-all border border-white/10"
                >
                  {PRACTICE_STEPS[step].instruction}
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-2">
              {PRACTICE_STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-white' : 'w-2 bg-neutral-700'}`} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}