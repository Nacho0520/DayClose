import { useState } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Check, X, Hand, ChevronRight, ChevronLeft } from 'lucide-react' // <--- AÑADIDOS ICONOS

export default function SwipeCard({ habit, onSwipeComplete, onDrag }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])
  
  // Colores de fondo dinámicos según hacia donde muevas
  const background = useTransform(
    x,
    [-150, 0, 150],
    ['rgb(127, 29, 29)', 'rgb(38, 38, 38)', 'rgb(6, 78, 59)'] // Red-900 -> Neutral-800 -> Emerald-900
  )

  // Iconos que aparecen al deslizar (Feedback visual)
  const checkOpacity = useTransform(x, [50, 150], [0, 1])
  const crossOpacity = useTransform(x, [-50, -150], [0, 1])
  const scale = useTransform(x, [-150, 0, 150], [1.1, 1, 1.1])

  // ESTADO PARA EL TUTORIAL
  const [hasInteracted, setHasInteracted] = useState(false)

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      onSwipeComplete('right')
    } else if (info.offset.x < -100) {
      onSwipeComplete('left')
    }
  }

  return (
    <div className="relative h-96 w-full flex items-center justify-center perspective-1000">
      
      {/* --- TUTORIAL (SOLO SI NO HA TOCADO) --- */}
      <AnimatePresence>
        {!hasInteracted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 flex items-center justify-between px-4 pointer-events-none"
          >
            {/* Lado Izquierdo (Saltar) */}
            <motion.div 
              animate={{ x: [-5, 5, -5] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex flex-col items-center gap-1 opacity-40"
            >
              <ChevronLeft className="text-red-400 w-8 h-8" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Saltar</span>
            </motion.div>

            {/* Mano Central Animada */}
            <div className="absolute inset-0 flex items-center justify-center mt-32 opacity-30">
                <motion.div
                    animate={{ x: [-20, 20, -20], rotate: [-10, 10, -10] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                >
                    <Hand className="w-8 h-8 text-white" />
                </motion.div>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute top-10 text-xs text-neutral-500 font-medium"
                >
                    Desliza la tarjeta
                </motion.p>
            </div>

            {/* Lado Derecho (Completar) */}
            <motion.div 
              animate={{ x: [5, -5, 5] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex flex-col items-center gap-1 opacity-40"
            >
              <ChevronRight className="text-emerald-400 w-8 h-8" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Hecho</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* --------------------------------------- */}

      <motion.div
        style={{ x, rotate, opacity, background, scale }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6} // Sensación más elástica y suave
        onDragStart={() => {
            onDrag && onDrag(0)
            setHasInteracted(true) // <--- AL TOCAR, EL TUTORIAL DESAPARECE
        }} 
        onDrag={(e, info) => onDrag && onDrag(info.offset.x)}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing', scale: 1.05 }}
        className="relative flex h-80 w-72 flex-col items-center justify-center rounded-3xl shadow-2xl border border-white/10 cursor-grab z-10"
      >
        {/* Iconos Gigantes de Feedback (Fondo) */}
        <motion.div style={{ opacity: checkOpacity }} className="absolute inset-0 flex items-center justify-center bg-emerald-600 rounded-3xl z-0">
            <Check size={80} className="text-white drop-shadow-lg" />
        </motion.div>
        <motion.div style={{ opacity: crossOpacity }} className="absolute inset-0 flex items-center justify-center bg-red-800 rounded-3xl z-0">
            <X size={80} className="text-white drop-shadow-lg" />
        </motion.div>

        {/* Contenido de la Tarjeta */}
        <div className="z-10 flex flex-col items-center gap-6 p-6">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full shadow-inner ${habit.color} border-4 border-white/10`}>
            <span className="text-5xl drop-shadow-md">{habit.icon}</span>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">{habit.title}</h2>
            <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 bg-black/20 rounded-full text-xs font-medium text-neutral-300 backdrop-blur-sm">
                    {habit.time_of_day === 'morning' ? 'Mañana' : habit.time_of_day === 'afternoon' ? 'Tarde' : 'Noche'}
                </span>
            </div>
          </div>
        </div>
        
        {/* Barra decorativa inferior */}
        <div className="absolute bottom-6 w-12 h-1.5 bg-white/20 rounded-full" />

      </motion.div>
    </div>
  )
}