import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { X, ShieldAlert, RefreshCw, Megaphone, Users, Activity, Save, ChevronLeft } from 'lucide-react'

export default function AdminPanel({ onClose, version }) {
  const [maintenance, setMaintenance] = useState(false)
  const [appVersion, setAppVersion] = useState(version || '1.0.0')
  const [bannerText, setBannerText] = useState('')
  const [stats, setStats] = useState({ users: 0, logs: 0 })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    // 1. Obtener Ajustes (Mantenimiento y Versión)
    const { data: settings } = await supabase.from('app_settings').select('*')
    if (settings) {
      const m = settings.find(s => s.key === 'maintenance_mode')
      const v = settings.find(s => s.key === 'app_version')
      if (m) setMaintenance(m.value === 'true' || m.value === true)
      if (v) setAppVersion(v.value)
    }

    // 2. Obtener último anuncio
    const { data: announcement } = await supabase
      .from('announcements')
      .select('message')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (announcement) setBannerText(announcement.message)

    // 3. Obtener Estadísticas básicas
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const { count: logCount } = await supabase.from('daily_logs').select('*', { count: 'exact', head: true })
    setStats({ users: userCount || 0, logs: logCount || 0 })
  }

  const handleUpdateSettings = async () => {
    setLoading(true)
    try {
      // Actualizar Mantenimiento
      await supabase.from('app_settings').update({ value: maintenance.toString() }).eq('key', 'maintenance_mode')
      // Actualizar Versión
      await supabase.from('app_settings').update({ value: appVersion }).eq('key', 'app_version')
      
      // Crear nuevo anuncio si ha cambiado
      if (bannerText) {
        await supabase.from('announcements').insert([{ message: bannerText, is_active: true }])
      }

      setMessage({ type: 'success', text: '¡Configuración maestra actualizada!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al actualizar' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6 pb-20 overflow-y-auto">
      <header className="flex justify-between items-center mb-10">
        <button onClick={onClose} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
          <span className="font-medium text-sm">Volver</span>
        </button>
        <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Panel Administrador</span>
        </div>
      </header>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      {/* MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-neutral-800/40 p-5 rounded-[2rem] border border-neutral-800 backdrop-blur-sm">
          <Users className="text-blue-400 mb-2" size={20} />
          <p className="text-2xl font-bold">{stats.users}</p>
          <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-tighter">Usuarios Totales</p>
        </div>
        <div className="bg-neutral-800/40 p-5 rounded-[2rem] border border-neutral-800 backdrop-blur-sm">
          <Activity className="text-emerald-400 mb-2" size={20} />
          <p className="text-2xl font-bold">{stats.logs}</p>
          <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-tighter">Hábitos Marcados</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* SECCIÓN MANTENIMIENTO */}
        <section className="bg-neutral-800/40 rounded-[2.5rem] p-8 border border-neutral-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-2xl">
                <ShieldAlert className="text-amber-500" size={24} />
              </div>
              <div>
                <h3 className="font-bold">Modo Mantenimiento</h3>
                <p className="text-xs text-neutral-500">Bloquea la App para usuarios</p>
              </div>
            </div>
            <button 
              onClick={() => setMaintenance(!maintenance)}
              className={`h-8 w-14 rounded-full transition-colors relative ${maintenance ? 'bg-amber-500' : 'bg-neutral-700'}`}
            >
              <div className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${maintenance ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="h-px bg-neutral-800 mb-6" />

          {/* SECCIÓN VERSIÓN */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl">
              <RefreshCw className="text-purple-500" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Software Version</h3>
              <p className="text-xs text-neutral-500">Fuerza actualización remota</p>
            </div>
            <input 
              type="text" 
              value={appVersion}
              onChange={(e) => setAppVersion(e.target.value)}
              className="w-20 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-center text-sm font-bold"
            />
          </div>
        </section>

        {/* SECCIÓN BANNER */}
        <section className="bg-neutral-800/40 rounded-[2.5rem] p-8 border border-neutral-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-500/10 rounded-2xl">
              <Megaphone className="text-indigo-500" size={24} />
            </div>
            <div>
              <h3 className="font-bold">Anuncio Global</h3>
              <p className="text-xs text-neutral-500">Mensaje en el TopBanner</p>
            </div>
          </div>
          <textarea 
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
            placeholder="Escribe el anuncio para tus usuarios..."
            className="w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
          />
        </section>

        <button 
          onClick={handleUpdateSettings}
          disabled={loading}
          className="w-full bg-white text-black font-black py-5 rounded-[2rem] text-lg active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
        >
          {loading ? 'Sincronizando...' : <><Save size={20} /> Aplicar Cambios Globales</>}
        </button>
      </div>
    </div>
  )
}