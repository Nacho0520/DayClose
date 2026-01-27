import { motion } from 'framer-motion'

function SwipeCard({ habit, onDrag, onSwipeComplete }) {
  const handleDrag = (event, info) => {
    if (onDrag) {
      onDrag(info.offset.x)
    }
  }

  const handleDragEnd = (event, info) => {
    const offsetX = info.offset.x

    if (offsetX > 100) {
      onSwipeComplete?.('right')
    } else if (offsetX < -100) {
      onSwipeComplete?.('left')
    } else {
      // Si no supera el umbral, reseteamos el estado de fondo
      if (onDrag) {
        onDrag(0)
      }
    }
  }

  return (
    <motion.div
      className="relative w-full bg-neutral-800 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.98 }}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="mb-6 flex items-center justify-center">
        <div className={`flex h-24 w-24 items-center justify-center rounded-full ${habit.color}`}>
          <span className="text-5xl">{habit.icon}</span>
        </div>
      </div>
      <p className="mt-2 text-center text-xl font-semibold text-white">
        {habit.title}
      </p>
    </motion.div>
  )
}

export default SwipeCard

