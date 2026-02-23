import { motion, AnimatePresence } from 'framer-motion'
import { Infinity, BarChart2, Bell, Zap } from 'lucide-react'

const features = [
  { icon: Infinity, text: 'Hábitos ilimitados' },
  { icon: BarChart2, text: 'Historial completo' },
  { icon: Bell, text: 'Recordatorios inteligentes' },
  { icon: Zap, text: 'Funciones anticipadas' }
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export default function ProWelcomeModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
          >
            <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              <div className="pt-8 pb-6 px-6">
                <div className="flex justify-center mb-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-violet-600 text-white text-xs font-semibold uppercase tracking-widest">
                    PRO
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white text-center mb-1">
                  Todo desbloqueado.
                </h2>
                <p className="text-neutral-400 text-sm text-center mb-6">
                  Bienvenido al plan Pro.
                </p>
                <div className="border-t border-white/5 pt-5">
                  <motion.ul
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                  >
                    {features.map(({ icon: Icon, text }) => (
                      <motion.li key={text} variants={item} className="flex items-center gap-3">
                        <Icon size={18} className="text-violet-400 flex-shrink-0" />
                        <span className="text-white text-sm font-medium">{text}</span>
                      </motion.li>
                    ))}
                  </motion.ul>
                </div>
                <button
                  onClick={onClose}
                  className="w-full mt-6 py-4 rounded-2xl bg-white text-black font-bold active:scale-95 transition-all"
                >
                  Comenzar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
