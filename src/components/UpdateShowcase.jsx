import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, CheckCircle2, ShieldCheck, Flame, Star, Bell, ListChecks, Clock, Heart, Wand2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
const MotionDiv = motion.div

const ICONS = {
  sparkles: Sparkles,
  shield: ShieldCheck,
  flame: Flame,
  star: Star,
  bell: Bell,
  list: ListChecks,
  clock: Clock,
  heart: Heart,
  wand: Wand2
}

export default function UpdateShowcase({ isOpen, onClose, payload }) {
  const { t } = useLanguage()
  if (!isOpen || !payload) return null

  const { title, subtitle, items = [] } = payload

  return (
    <AnimatePresence>
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <MotionDiv
          initial={{ y: 30, scale: 0.96 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 30, scale: 0.96 }}
          className="w-full max-w-md bg-neutral-800/80 radius-card border border-white/5 p-6 shadow-apple relative"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-neutral-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
              <Sparkles size={18} className="text-neutral-200" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
              <p className="text-xs text-neutral-500">{subtitle}</p>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const Icon = item.icon ? (ICONS[item.icon] || CheckCircle2) : CheckCircle2
              return (
              <div
                key={`${item.title}-${index}`}
                className="flex items-start gap-3 bg-neutral-900/60 border border-white/5 rounded-2xl p-4"
              >
                <div className="mt-1 h-6 w-6 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                  <Icon size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-[11px] text-neutral-500 mt-1">{item.desc}</p>
                </div>
              </div>
            )})}
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full bg-white text-black font-black py-3 rounded-2xl active:scale-95 transition-all"
          >
            {t('updates_ack')}
          </button>
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  )
}
