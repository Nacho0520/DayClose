import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Flame, Trophy, TrendingUp, Calendar, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Stats({ user }) {
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [totalCompleted, setTotalCompleted] = useState(0)
  const [weeklyData, setWeeklyData] = useState([])
  
  // Función auxiliar para formatear fechas locales (YYYY-MM-DD)
  const formatDate = (date) => {
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  }

  useEffect(() => {
    async function calculateStats() {
      if (!user) return

      // 1. Obtenemos TODOS los logs completados del usuario (solo fechas y estado)
      const { data: logs, error } = await supabase
        .from('daily_logs')
        .select('created_at, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error || !logs) {
        setLoading(false)
        return
      }

      // --- CÁLCULO DE RACHA (STREAK) ---
      // Creamos un Set con las fechas únicas donde hubo al menos un hábito completado
      const activeDays = new Set(logs.map(log => formatDate(log.created_at)))
      
      let currentStreak = 0
      const today = new Date()
      // Empezamos a contar desde hoy (o ayer si hoy no ha hecho nada aún pero no ha roto racha)
      let checkDate = new Date(today)
      
      // Ajuste: si hoy no ha marcado nada, miramos si ayer sí marcó para mantener la racha viva
      const todayStr = formatDate(today)
      if (!activeDays.has(todayStr)) {
         // Si hoy está vacío, la racha depende de ayer
         checkDate.setDate(checkDate.getDate() - 1)
         // Si ayer tampoco hizo nada, la racha es 0 (o lo que haya durado antes)
         if (!activeDays.has(formatDate(checkDate))) {
            currentStreak = 0
         } else {
            // Si ayer sí hizo, empezamos a contar
            currentStreak = 1
            checkDate.setDate(checkDate.getDate() - 1) // Retrocedemos para el bucle
         }
      } else {
         // Si hoy ya hizo algo, empezamos en 1
         currentStreak = 1
         checkDate.setDate(checkDate.getDate() - 1)
      }

      // Bucle hacia atrás
      while (currentStreak > 0) { // Solo entramos si la racha está viva
        if (activeDays.has(formatDate(checkDate))) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break // Se rompió la racha
        }
      }
      
      setStreak(currentStreak)

      // --- CÁLCULO TOTAL ---
      setTotalCompleted(logs.length)

      // --- CÁLCULO SEMANAL (Últimos 7 días) ---
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      const last7Days = []
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = formatDate(d)
        
        // Contamos cuántos hábitos se completaron ese día específico
        const count = logs.filter(l => formatDate(l.created_at) === dateStr).length
        
        last7Days.push({
          day: days[d.getDay()],
          date: dateStr,
          count: count,
          isToday: dateStr === todayStr
        })
      }
      setWeeklyData(last7Days)
      setLoading(false)
    }

    calculateStats()
  }, [user])

  if (loading) return (
    <div className="flex h-full items-center justify-center min-h-[50vh]">
      <Loader2 className="animate-spin text-emerald-500" size={32} />
    </div>
  )

  return (
    <div className="w-full max-w-md mx-auto px-6 pb-32 pt-6 animate-in fade-in duration-500">
      
      {/* 1. TARJETA HERO: RACHA */}
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-[2.5rem] p-8 text-center border border-white/5 shadow-2xl mb-6">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Flame size={120} />
        </div>
        
        <div className="relative z-10">
          <motion.div 
            initial={{ scale: 0.5 }} animate={{ scale: 1 }} 
            className="inline-flex items-center justify-center p-4 bg-orange-500/20 rounded-full mb-4 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.2)]"
          >
            <Flame size={32} className="text-orange-500 fill-orange-500" />
          </motion.div>
          <h2 className="text-5xl font-black text-white tracking-tighter mb-1">{streak}</h2>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-[0.3em]">Días en Racha</p>
        </div>
      </div>

      {/* 2. GRID DE DATOS SECUNDARIOS */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-neutral-800/50 p-6 rounded-[2rem] border border-white/5">
          <Trophy className="text-yellow-500 mb-3" size={24} />
          <p className="text-2xl font-black text-white">{totalCompleted}</p>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Victorias Totales</p>
        </div>
        <div className="bg-neutral-800/50 p-6 rounded-[2rem] border border-white/5">
          <TrendingUp className="text-emerald-500 mb-3" size={24} />
          <p className="text-2xl font-black text-white">
            {weeklyData.reduce((acc, curr) => acc + curr.count, 0)}
          </p>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Esta Semana</p>
        </div>
      </div>

      {/* 3. GRÁFICO SEMANAL MINIMALISTA */}
      <div className="bg-neutral-800/30 p-8 rounded-[2.5rem] border border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <Calendar size={18} className="text-neutral-400" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Rendimiento Semanal</h3>
        </div>
        
        <div className="flex items-end justify-between h-32 gap-2">
          {weeklyData.map((d, i) => {
            // Calculamos la altura relativa (max 100%)
            const max = Math.max(...weeklyData.map(w => w.count)) || 1
            const height = d.count === 0 ? 5 : (d.count / max) * 100 // min 5% height

            return (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <div className="w-full relative flex items-end justify-center h-full">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.1, type: "spring" }}
                    className={`w-full rounded-xl min-h-[6px] transition-colors ${
                      d.isToday 
                        ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                        : d.count > 0 ? 'bg-neutral-700 group-hover:bg-neutral-600' : 'bg-neutral-800'
                    }`}
                  />
                  {d.count > 0 && (
                    <div className="absolute -top-6 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </div>
                  )}
                </div>
                <p className={`mt-3 text-[10px] font-bold uppercase ${d.isToday ? 'text-emerald-500' : 'text-neutral-600'}`}>
                  {d.day[0]}
                </p>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}