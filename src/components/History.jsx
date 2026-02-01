import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Calendar, ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

function formatDateLocal(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function History({ user, onClose }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [habits, setHabits] = useState([])
  const [range, setRange] = useState('month')
  const [selectedMonth, setSelectedMonth] = useState(formatDateLocal(new Date()).slice(0, 7))
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    const now = new Date()
    const day = now.getDay()
    const distanceToMonday = day === 0 ? 6 : day - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - distanceToMonday)
    return formatDateLocal(monday)
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      setLoading(true)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      const { data: logsData } = await supabase
        .from('daily_logs')
        .select('id, created_at, status, note, habit_id')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
      const { data: habitsData } = await supabase
        .from('habits')
        .select('id, title, icon, color')
        .eq('user_id', user.id)
      setLogs(logsData || [])
      setHabits(habitsData || [])
      setLoading(false)
    }
    fetchData()
  }, [user])

  const habitMap = useMemo(() => {
    const map = new Map()
    habits.forEach(h => map.set(h.id, h))
    return map
  }, [habits])

  const filteredLogs = useMemo(() => {
    if (range === 'month') {
      return logs.filter(log => formatDateLocal(log.created_at).startsWith(selectedMonth))
    }
    const start = new Date(selectedWeekStart)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return logs.filter(log => {
      const d = new Date(log.created_at)
      return d >= start && d <= end
    })
  }, [logs, range, selectedMonth, selectedWeekStart])

  const grouped = useMemo(() => {
    const map = new Map()
    filteredLogs.forEach(log => {
      const dateKey = formatDateLocal(log.created_at)
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey).push(log)
    })
    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      items,
      completed: items.filter(i => i.status === 'completed').length,
      total: items.length
    }))
  }, [filteredLogs])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto px-6 pb-32 pt-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-neutral-800/60 border border-white/5 flex items-center justify-center text-neutral-300 hover:text-white"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-black text-white">{t('history_title')}</h2>
          <p className="text-[11px] text-neutral-500">{t('history_subtitle')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 bg-neutral-900/60 border border-white/5 rounded-full p-1">
          <button
            onClick={() => setRange('week')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold ${range === 'week' ? 'bg-white text-black' : 'text-neutral-400'}`}
          >
            {t('history_week')}
          </button>
          <button
            onClick={() => setRange('month')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold ${range === 'month' ? 'bg-white text-black' : 'text-neutral-400'}`}
          >
            {t('history_month')}
          </button>
        </div>
        {range === 'month' ? (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-neutral-900/60 border border-white/5 rounded-full px-3 py-1 text-[11px] text-neutral-300"
          />
        ) : (
          <input
            type="week"
            value={selectedWeekStart}
            onChange={(e) => {
              const [year, week] = e.target.value.split('-W')
              const firstDay = new Date(year, 0, 1)
              const days = (Number(week) - 1) * 7
              const monday = new Date(firstDay.getTime() + days * 24 * 60 * 60 * 1000)
              const day = monday.getDay()
              const diff = day === 0 ? -6 : 1 - day
              monday.setDate(monday.getDate() + diff)
              setSelectedWeekStart(formatDateLocal(monday))
            }}
            className="bg-neutral-900/60 border border-white/5 rounded-full px-3 py-1 text-[11px] text-neutral-300"
          />
        )}
      </div>

      {grouped.length === 0 ? (
        <div className="radius-card border border-white/5 bg-neutral-800/30 p-6 text-center text-neutral-400 shadow-apple-soft">
          <p className="text-body font-medium">{t('history_empty')}</p>
        </div>
      ) : (
        <div className="premium-divider">
          {grouped.map(day => {
            const pct = day.total ? Math.round((day.completed / day.total) * 100) : 0
            return (
              <div key={day.date} className="bg-neutral-800/30 rounded-[2rem] p-5 border border-white/5 shadow-apple-soft">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-neutral-500" />
                    <span className="text-sm font-semibold text-white">{day.date}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    {pct}%
                  </span>
                </div>
                <div className="premium-divider">
                  {day.items.map((item) => {
                    const habit = habitMap.get(item.habit_id)
                    const isDone = item.status === 'completed'
                    return (
                      <div key={item.id} className="flex items-start gap-3 bg-neutral-900/60 border border-white/5 rounded-2xl p-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${habit?.color || 'bg-neutral-800'}`}>
                          <span className="text-base">{habit?.icon || '•'}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{habit?.title || t('history_unknown')}</p>
                          {item.note && (
                            <p className="text-[11px] text-neutral-500 mt-1">{item.note}</p>
                          )}
                        </div>
                        <div className="mt-1">
                          {isDone ? (
                            <CheckCircle2 size={18} className="text-emerald-400" />
                          ) : (
                            <XCircle size={18} className="text-red-400" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
