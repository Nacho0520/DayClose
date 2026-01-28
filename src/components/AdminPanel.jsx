import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { X, ShieldAlert, RefreshCw, Megaphone, CheckCircle, Activity, Save, ChevronLeft, AlertCircle, Users } from 'lucide-react'

export default function AdminPanel({ onClose, version }) {
  const [maintenance, setMaintenance] = useState(false)
  const [appVersion, setAppVersion] = useState(version || '1.0.0')
  const [bannerText, setBannerText] = useState('')
  const [stats, setStats] = useState({ habits: 0, logs: 0, users: 0 })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => { fetchAdminData() }, [])

  const fetchAdminData = async () => {
    try {
      // 1. Cargar Ajustes
      const { data: settings } = await supabase.from('app_settings').select('*')
      if (settings) {
        const m = settings.find(s => s.key === 'maintenance_mode')
        const v = settings.find(s => s.key === 'app_version')
        if (m) setMaintenance(m.value === 'true' || m.value === true)
        if (v) setAppVersion(v.value)
      }

      // 2. Cargar Anuncio
      const { data: announcement } = await supabase.from('announcements').select('message').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single()
      if (announcement) setBannerText(announcement.message)

      // 3. Cargar Estadísticas GLOBALES usando la función RPC
      const { data: rpcStats, error: rpcError } = await supabase.rpc('get_admin_stats')
      
      if (rpcError) {
        console.error("Error cargando estadísticas RPC:", rpcError)
      } else if (rpcStats && rpcStats[0]) {
        setStats({
          users: rpcStats[0].total_users || 0,
          habits: rpcStats[0].total_habits || 0,
          logs: rpcStats[0].total_logs || 0
        })
      }

    } catch (error) {
      console.error("Error crítico en el panel admin:", error)
    }
  }

  const handleUpdateSettings = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const updates = [
        supabase.from('app_settings').update({ value: maintenance.toString() }).eq('key', 'maintenance_mode'),
        supabase.from('app_settings').update({ value: appVersion }).eq('key', 'app_version')
      ]
      if (bannerText) updates.push(supabase.from('announcements').insert([{ message: bannerText, is_active: true }]))
      
      await Promise.all(updates)
      setMessage({ type: 'success', text: 'Sincronización global completada.' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Error en la sincronización' })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6 pb-20 overflow-y-auto font-sans">
      <header className="flex justify-between items-center mb-10">
        <button onClick={onClose} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-all active:scale-95">
          <ChevronLeft size={24} /> <span className="font-medium text-sm">Escritorio</span>
        </button>
        <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Torre de Control</span>
        </div>
      </header>

      {message && <div className={`mb-8 p-4 rounded-2xl text-sm font-bold border flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{message.text}</div>}

      <div className="grid grid-cols-3 gap-3 mb-10">
        <div className="bg-neutral-800/40 p-4 rounded-3xl border border-neutral-800 text-center">
          <Users className="text-blue-400 mx-auto mb-2" size={20} />
          <p className="text-xl font-black">{stats.users}</p>
          <p className="text-[8px] text-neutral-500 uppercase font-black">Usuarios</p>
        </div>
        <div className="bg-neutral-800/40 p-4 rounded-3xl border border-neutral-800 text-center">
          <CheckCircle className="text-purple-400 mx-auto mb-2" size={20} />
          <p className="text-xl font-black">{stats.habits}</p>
          <p className="text-[8px] text-neutral-500 uppercase font-black">Hábitos</p>
        </div>
        <div className="bg-neutral-800/40 p-4 rounded-3xl border border-neutral-800 text-center">
          <Activity className="text-emerald-400 mx-auto mb-2" size={20} />
          <p className="text-xl font-black">{stats.logs}</p>
          <p className="text-[8px] text-neutral-500 uppercase font-black">Registros</p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="bg-neutral-800/20 rounded-[3rem] p-8 border border-neutral-800/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-amber-500/10 rounded-[1.5rem] border border-amber-500/10"><ShieldAlert className="text-amber-500" size={28} /></div>
              <div><h3 className="font-black text-sm uppercase tracking-tight">Mantenimiento</h3><p className="text-[10px] text-neutral-500 font-bold uppercase">Cierre de emergencia</p></div>
            </div>
            <button onClick={() => setMaintenance(!maintenance)} className={`h-9 w-16 rounded-full transition-all relative ${maintenance ? 'bg-amber-500' : 'bg-neutral-700'}`}>
              <div className={`absolute top-1.5 h-6 w-6 rounded-full bg-white shadow-md transition-all ${maintenance ? 'left-8' : 'left-2'}`} />
            </button>
          </div>
          <div className="h-px bg-neutral-800/50 mb-8" />
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-500/10 rounded-[1.5rem] border border-purple-500/10"><RefreshCw className="text-purple-500" size={28} /></div>
            <div className="flex-1"><h3 className="font-black text-sm uppercase tracking-tight">Software v{version}</h3><p className="text-[10px] text-neutral-500 font-bold uppercase">Versión de sincronización:</p></div>
            <input type="text" value={appVersion} onChange={(e) => setAppVersion(e.target.value)} className="w-24 bg-neutral-900 border border-neutral-700 rounded-2xl px-4 py-3 text-center text-sm font-black text-purple-400 focus:border-purple-500 outline-none" />
          </div>
        </section>

        <section className="bg-neutral-800/20 rounded-[3rem] p-8 border border-neutral-800/50">
          <div className="flex items-center gap-4 mb-6"><div className="p-4 bg-indigo-500/10 rounded-[1.5rem] border border-indigo-500/10"><Megaphone className="text-indigo-500" size={28} /></div><div><h3 className="font-black text-sm uppercase tracking-tight">Anuncio Global</h3><p className="text-[10px] text-neutral-500 font-bold uppercase">Push al TopBanner</p></div></div>
          <textarea value={bannerText} onChange={(e) => setBannerText(e.target.value)} placeholder="¿Qué quieres decirles?" className="w-full bg-neutral-900 border border-neutral-700 rounded-[2rem] p-6 text-sm font-medium outline-none h-32 resize-none" />
        </section>

        <button onClick={handleUpdateSettings} disabled={loading} className="w-full bg-white text-black font-black py-6 rounded-[2.5rem] text-lg active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(255,255,255,0.1)]">
          {loading ? 'Sincronizando...' : <><Save size={22} /> Aplicar Cambios Maestros</>}
        </button>
      </div>
    </div>
  )
}