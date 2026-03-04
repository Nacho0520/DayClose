import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import AdminLauncher from './AdminLauncher'
import UserIntel from './UserIntel'
import SystemPulse from './SystemPulse'
import TheLab from './TheLab'
import Guardian from './Guardian'

const moduleVariants = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -14, transition: { duration: 0.18 } }
}

const launcherVariants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, scale: 0.96, transition: { duration: 0.18 } }
}

export default function AdminDashboard(props) {
  const { onClose, version, message } = props
  const [activeModule, setActiveModule] = useState(null)

  const MODULE_LABELS = {
    'user-intel':   'User Intel',
    'system-pulse': 'System Pulse',
    'the-lab':      'The Lab',
    'guardian':     'Guardian',
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'user-intel':
        return <UserIntel key="user-intel" {...props} onBack={() => setActiveModule(null)} />
      case 'system-pulse':
        return <SystemPulse key="system-pulse" {...props} onBack={() => setActiveModule(null)} />
      case 'the-lab':
        return <TheLab key="the-lab" {...props} onBack={() => setActiveModule(null)} />
      case 'guardian':
        return <Guardian key="guardian" {...props} onBack={() => setActiveModule(null)} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white overflow-y-auto font-sans">
      {/* Header fijo */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <button
          onClick={activeModule ? () => setActiveModule(null) : onClose}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-all active:scale-95"
        >
          <ChevronLeft size={20} />
          <span className="font-bold text-sm">
            {activeModule ? MODULE_LABELS[activeModule] : 'Escritorio'}
          </span>
        </button>

        <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
            Torre de Control
          </span>
        </div>
      </header>

      {/* Toast de mensaje global */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mx-6 mt-4 p-4 rounded-2xl text-sm font-bold border flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido principal — Launcher o módulo activo */}
      <div className="p-6 pb-24">
        <AnimatePresence mode="wait">
          {activeModule === null ? (
            <motion.div key="launcher" variants={launcherVariants} initial="initial" animate="animate" exit="exit">
              <AdminLauncher {...props} onOpenModule={setActiveModule} />
            </motion.div>
          ) : (
            <motion.div key={activeModule} variants={moduleVariants} initial="initial" animate="animate" exit="exit">
              {renderModule()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
