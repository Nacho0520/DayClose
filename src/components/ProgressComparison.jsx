import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { useLanguage } from '../context/LanguageContext'
import { BarChart3, Zap } from 'lucide-react'

function formatDate(date) { return new Date(date).toISOString().split('T')[0] }
function diffPercent(current, previous) {
  if (previous === 0 && current === 0) return 0
  if (previous === 0) return 100
  return Math.round(((current - previous) / previous) * 100)
}

export default function ProgressComparison({ user, isPro, onUpgrade }) {
  const [loading, setLoading] = useState(true)
  const [comparison, setComparison] = useState({ day: null, week: null, month: null })
  const { t } = useLanguage()

  useEffect(() => {
    async function calculate() {
      if (!user) return
      const startDate = new Date(); startDate.setDate(startDate.getDate() - 31)
      const { data: logs } = await supabase.from('daily_logs').select('created_at, status').eq('user_id', user.id).eq('status', 'completed').gte('created_at', startDate.toISOString())
      if (!logs) { setLoading(false); return }
      const tKey = formatDate(new Date()); const yKey = formatDate(new Date(Date.now() - 86400000))
      const tc = logs.filter(l => formatDate(l.created_at) === tKey).length
      const yc = logs.filter(l => formatDate(l.created_at) === yKey).length
      setComparison({
        day: { current: tc, delta: diffPercent(tc, yc) },
        week: { current: logs.filter(l => (new Date() - new Date(l.created_at)) < 7 * 86400000).length, delta: 0 },
        month: { current: logs.filter(l => new Date(l.created_at).getMonth() === new Date().getMonth()).length, delta: 0 }
      })
      setLoading(false)
    }
    calculate()
  }, [user])

  if (loading) return null

  return (
    <div className="bg-neutral-800/20 p-6 rounded-[2.5rem] border border-white/5 shadow-xl relative overflow-hidden mb-6 text-left">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-white" />
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">{t('compare_section_title')}</h2>
        </div>
        {/* Solo sale PRO si el usuario es FREE */}
        {!isPro && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-violet-500/10 border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest">
            <Zap size={10} fill="currentColor" /> PRO
          </div>
        )}
      </div>

      <div className="relative">
        <div className={`grid grid-cols-3 gap-3 transition-all duration-500 ${!isPro ? 'blur-md pointer-events-none' : ''}`}>
          {['day', 'week', 'month'].map((key) => (
            <div key={key} className="bg-neutral-900/60 border border-white/5 rounded-[1.5rem] p-4 text-center">
              <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mb-1">{t(`compare_${key}`)}</p>
              <p className="text-2xl font-black text-white tracking-tighter mb-2">{comparison[key]?.current || 0}</p>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${comparison[key]?.delta >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                {comparison[key]?.delta >= 0 ? '▲' : '▼'} {Math.abs(comparison[key]?.delta || 0)}%
              </span>
            </div>
          ))}
        </div>
        {!isPro && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button onClick={onUpgrade} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-violet-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-500/30 active:scale-95 transition-all">
              <Zap size={12} fill="currentColor" /> {t('upgrade_to_pro')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}