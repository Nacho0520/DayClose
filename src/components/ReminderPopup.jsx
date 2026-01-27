import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { Check, Clock, X } from 'lucide-react'

export default function ReminderPopup({ session }) {
  const [visible, setVisible] = useState(false)
  const [currentHabit, setCurrentHabit] = useState(null)
  const [snoozedHabits, setSnoozedHabits] = useState([]) // Para recordar qué hemos pospuesto

  const checkPendingHabits = async () => {
    if (!session) return

    // 1. Obtener todos los hábitos activos
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('is_active', true)

    if (!habits || habits.length === 0) return

    // 2. Obtener lo que ya hicimos HOY
    const today = new Date().toISOString().split('T')[0]
    const todayStart = `${today}T00:00:00.000Z`
    const todayEnd = `${today}T23:59:59.999Z`

    const { data: logs } = await supabase
      .from('daily_logs')
      .select('habit_id')
      .eq('user_id', session.user.id)
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd)

    const completedIds = logs?.map(l => l.habit_id) || []

    // 3. Buscar el primero que falte y NO esté pospuesto (snoozed) en esta sesión
    const pending = habits.find(h => 
      !completedIds.includes(h.id) && 
      !snoozedHabits.includes(h.id)
    )

    if (pending) {
      setCurrentHabit(pending)
      setVisible(true)
    }
  }

  // Comprobar cada 60 segundos
  useEffect(() => {
    // Primera comprobación a los 3 segundos de entrar
    const initialTimer = setTimeout(checkPendingHabits, 3000)
    
    // Comprobación periódica
    const interval = setInterval(checkPendingHabits, 60000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [session, snoozedHabits]) // Re-ejecutar si cambia la lista de pospuestos

  const handleAction = async (action) => {
    if (!currentHabit) return

    if (action === 'done') {
      // Opción 1: YA LO HICE -> Guardar en base de datos
      const { error } = await supabase.from('daily_logs').insert({
        user_id: session.user.id,
        habit_id: currentHabit.id,
        status: 'completed',
        note: 'Marcado desde recordatorio',
        created_at: new Date().toISOString()
      })
      if (!error) {
        setVisible(false)
        // Opcional: recargar la página para actualizar dashboard (o manejar estado global)
        window.location.reload() 
      }
    } 
    else if (action === 'later') {
      // Opción 2: MÁS TARDE -> Añadir a lista de ignorados temporalmente
      setSnoozedHabits(prev => [...prev, currentHabit.id])
      setVisible(false)
    } 
    else if (action === 'skip') {
      // Opción 3: NO RECORDAR -> Marcar como 'skipped' en BD hoy
      const { error } = await supabase.from('daily_logs').insert({
        user_id: session.user.id,
        habit_id: currentHabit.id,
        status: 'skipped',
        note: 'Omitido desde pop-up',
        created_at: new Date().toISOString()
      })
      if (!error) {
        setVisible(false)
        window.location.reload()
      }
    }
  }

  return (
    <AnimatePresence>
      {visible && currentHabit && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
            
            {/* Cabecera del aviso */}
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${currentHabit.color || 'bg-blue-500'}`}>
                <span className="text-xl">{currentHabit.icon || '📝'}</span>
              </div>
              <div>
                <p className="text-xs text-neutral-400 uppercase font-bold tracking-wide">Recordatorio</p>
                <p className="text-white font-medium text-lg">{currentHabit.title}</p>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAction('done')}
                className="flex flex-col items-center justify-center bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 py-2 rounded-xl border border-emerald-600/50 transition-colors"
              >
                <Check size={18} className="mb-1" />
                <span className="text-xs font-medium">Ya lo hice</span>
              </button>

              <button
                onClick={() => handleAction('later')}
                className="flex flex-col items-center justify-center bg-neutral-700 text-neutral-300 hover:bg-neutral-600 py-2 rounded-xl border border-neutral-600 transition-colors"
              >
                <Clock size={18} className="mb-1" />
                <span className="text-xs font-medium">Más tarde</span>
              </button>

              <button
                onClick={() => handleAction('skip')}
                className="flex flex-col items-center justify-center bg-red-900/20 text-red-400 hover:bg-red-900/30 py-2 rounded-xl border border-red-900/50 transition-colors"
              >
                <X size={18} className="mb-1" />
                <span className="text-xs font-medium">No recordar</span>
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}