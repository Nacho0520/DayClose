import { motion, AnimatePresence } from 'framer-motion'
import { X, LogOut, Settings, ShieldCheck } from 'lucide-react'

export default function Sidebar({ isOpen, onClose, user, onLogout, onOpenSettings, version, onOpenAdmin }) {
  const displayName = user?.user_metadata?.full_name || 'Usuario'
  const email = user?.email || ''
  const isAdmin = email === 'hemmings.nacho@gmail.com' // Filtro de seguridad para el administrador

  const getInitial = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name[0].toUpperCase()
    if (user?.email) return user.email[0].toUpperCase()
    return 'U'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" />
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 left-0 bottom-0 w-64 bg-neutral-900 border-r border-neutral-800 z-50 p-6 shadow-2xl" >
            <div className="flex flex-col h-full"> 
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-white">Menú</h2>
                <button onClick={onClose} className="text-neutral-400 hover:text-white"> <X size={24} /> </button>
              </div>

              <div className="flex items-center gap-3 mb-8 p-3 bg-neutral-800 rounded-xl text-white">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold flex-shrink-0"> {getInitial()} </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate">{displayName}</p>
                  <p className="text-xs text-neutral-400 truncate">{email}</p>
                </div>
              </div>

              <nav className="space-y-2 flex-1">
                <button onClick={() => { onOpenSettings(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-xl transition-colors" >
                  <Settings size={20} /> <span>Ajustes / Perfil</span>
                </button>

                {isAdmin && (
                  <button onClick={() => { onOpenAdmin(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 text-blue-400 hover:bg-blue-400/10 rounded-xl transition-colors font-bold text-left" >
                    <ShieldCheck size={20} /> <span>Torre de Control</span>
                  </button>
                )}
              </nav>

              <div className="mt-auto pt-4 border-t border-neutral-800">
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-xl transition-colors text-left mb-4" >
                  <LogOut size={20} /> <span>Cerrar Sesión</span>
                </button>
                <div className="px-4 text-center pb-2">
                  <p className="text-[10px] font-medium text-neutral-600 uppercase tracking-widest"> Versión {version || '1.0.0'} </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}