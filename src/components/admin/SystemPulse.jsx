import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, ShieldAlert, UserCheck, Wrench, Globe, Trash2, Megaphone,
  Sparkles, ShieldCheck, Flame, Star, Bell, ListChecks, Clock, Heart, Wand2,
  Bug, ChevronDown, ChevronUp
} from 'lucide-react'

function PingBlock({ onPingSupabase }) {
  const [latency, setLatency] = useState(null)
  const [pinging, setPinging] = useState(false)

  const run = async () => {
    setPinging(true)
    setLatency(null)
    const ms = await onPingSupabase()
    setLatency(ms)
    setPinging(false)
  }

  const color = latency === null ? 'text-neutral-500'
    : latency < 200 ? 'text-emerald-400'
    : latency < 500 ? 'text-amber-400'
    : 'text-red-400'

  const dot = latency === null ? 'bg-neutral-600'
    : latency < 200 ? 'bg-emerald-400'
    : latency < 500 ? 'bg-amber-400'
    : 'bg-red-400'

  const label = latency === null ? '—'
    : latency < 200 ? `${latency}ms · Óptimo`
    : latency < 500 ? `${latency}ms · Lento`
    : `${latency}ms · Crítico`

  return (
    <div className="bg-neutral-900/60 rounded-2xl border border-white/5 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`h-2.5 w-2.5 rounded-full ${dot} ${latency === null && !pinging ? '' : 'shadow-[0_0_6px_currentColor]'}`} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Supabase DB</p>
          <p className={`text-sm font-black ${color}`}>{pinging ? 'Midiendo...' : label}</p>
        </div>
      </div>
      <button
        onClick={run}
        disabled={pinging}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 border border-white/5 text-xs font-bold text-neutral-300 hover:text-white transition-colors active:scale-95 disabled:opacity-50"
      >
        <Zap size={13} />
        Ping
      </button>
    </div>
  )
}

function ErrorsBlock({ feedbackReports }) {
  const open = feedbackReports.filter(r => r.status === 'open').length
  const color = open === 0 ? 'text-emerald-400' : open < 5 ? 'text-amber-400' : 'text-red-400'
  const dot = open === 0 ? 'bg-emerald-400' : open < 5 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className="bg-neutral-900/60 rounded-2xl border border-white/5 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Reportes abiertos</p>
          <p className={`text-sm font-black ${color}`}>{open === 0 ? 'Sin incidencias' : `${open} reporte${open > 1 ? 's' : ''} abierto${open > 1 ? 's' : ''}`}</p>
        </div>
      </div>
      <span className={`text-2xl font-black ${color}`}>{open}</span>
    </div>
  )
}

function Accordion({ title, icon: Icon, iconBg, iconColor, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-neutral-800/20 rounded-[2rem] border border-white/5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 ${iconBg} rounded-[1.2rem] border border-white/5`}>
            <Icon className={iconColor} size={22} />
          </div>
          <span className="font-black text-sm uppercase tracking-tight">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-neutral-500" /> : <ChevronDown size={14} className="text-neutral-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SystemPulse({
  appMetrics, feedbackReports, maintenance, maintenanceMessage, whitelist, whitelistInput,
  setMaintenance, setMaintenanceMessage, setWhitelistInput, onSaveMaintenanceMessage,
  onAddWhitelist, onRemoveWhitelist, onPingSupabase,
  bannerTextES, setBannerTextES, bannerTextEN, setBannerTextEN,
  updateId, setUpdateId, updateTitleES, setUpdateTitleES, updateSubtitleES, setUpdateSubtitleES,
  updateItemsES, setUpdateItemsES, updateTitleEN, setUpdateTitleEN, updateSubtitleEN, setUpdateSubtitleEN,
  updateItemsEN, setUpdateItemsEN, onClearAnnouncement, UPDATE_ICON_OPTIONS, addUpdateItem, updateItemField, removeUpdateItem,
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black uppercase tracking-tight">System Pulse</h2>
        <p className="text-[10px] text-neutral-500 font-bold uppercase mt-0.5">Salud · Mantenimiento · Métricas</p>
      </div>

      {/* Health checks */}
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Estado del sistema</p>
        <PingBlock onPingSupabase={onPingSupabase} />
        <ErrorsBlock feedbackReports={feedbackReports} />

        {/* Modo mantenimiento — toggle prominente */}
        <div className={`bg-neutral-900/60 rounded-2xl border p-4 flex items-center justify-between transition-colors ${
          maintenance ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'
        }`}>
          <div className="flex items-center gap-3">
            <ShieldAlert size={18} className={maintenance ? 'text-amber-400' : 'text-neutral-500'} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Modo mantenimiento</p>
              <p className={`text-sm font-black ${maintenance ? 'text-amber-400' : 'text-neutral-400'}`}>
                {maintenance ? 'Activo — App bloqueada' : 'Inactivo'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMaintenance(!maintenance)}
            className={`h-9 w-16 rounded-full transition-all relative ${maintenance ? 'bg-amber-400' : 'bg-neutral-700'}`}
          >
            <div className={`absolute top-1.5 h-6 w-6 rounded-full shadow-md transition-all ${maintenance ? 'left-8 bg-neutral-900' : 'left-2 bg-white'}`} />
          </button>
        </div>
      </div>

      {/* Métricas DAU/WAU/MAU */}
      {appMetrics && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-3">Engagement</p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: 'DAU', value: appMetrics.dau },
              { label: 'WAU', value: appMetrics.wau },
              { label: 'MAU', value: appMetrics.mau },
            ].map(({ label, value }) => (
              <div key={label} className="bg-neutral-900/50 p-4 rounded-2xl border border-white/5 text-center">
                <p className="text-[10px] text-neutral-500 uppercase font-bold">{label}</p>
                <p className="text-xl font-black">{value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-900/50 p-4 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] text-neutral-500 uppercase font-bold">Cumplimiento</p>
              <p className="text-xl font-black">{Math.round((appMetrics.avg_completion || 0) * 100)}%</p>
            </div>
            <div className="bg-neutral-900/50 p-4 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] text-neutral-500 uppercase font-bold">Hábitos / user</p>
              <p className="text-xl font-black">{Number(appMetrics.avg_habits_per_user || 0).toFixed(1)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Acordeón Mantenimiento — detalles */}
      <Accordion title="Configurar Mantenimiento" icon={Wrench} iconBg="bg-amber-500/10" iconColor="text-amber-400">
        <div>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Mensaje para usuarios</p>
          <textarea
            value={maintenanceMessage}
            onChange={e => setMaintenanceMessage(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800/60 rounded-[1.5rem] p-4 text-sm font-medium outline-none h-24 resize-none focus:border-neutral-400/50 transition-colors"
            placeholder="Estamos aplicando mejoras importantes..."
          />
          <button onClick={onSaveMaintenanceMessage} className="mt-3 bg-white text-black font-bold px-4 py-2 rounded-xl text-sm">
            Guardar mensaje
          </button>
        </div>
        <div>
          <div className="flex items-center gap-3 mb-3">
            <UserCheck size={14} className="text-neutral-400" />
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Lista blanca</p>
          </div>
          <div className="flex gap-2">
            <input
              value={whitelistInput}
              onChange={e => setWhitelistInput(e.target.value)}
              className="flex-1 bg-neutral-900 border border-neutral-800/60 rounded-xl px-3 py-2 text-sm text-white"
              placeholder="email@dominio.com"
            />
            <button onClick={onAddWhitelist} className="bg-white text-black font-bold px-3 rounded-xl text-sm">Añadir</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {whitelist.map(email => (
              <button
                key={email}
                onClick={() => onRemoveWhitelist(email)}
                className="px-3 py-1 rounded-full border border-white/5 bg-neutral-900/60 text-xs text-neutral-300 hover:border-red-500/30 hover:text-red-400 transition-colors"
              >
                {email}
              </button>
            ))}
          </div>
        </div>
      </Accordion>

      {/* Acordeón Anuncio Forzoso */}
      <Accordion title="Anuncio Forzoso" icon={Megaphone} iconBg="bg-indigo-500/10" iconColor="text-indigo-400">
        <div className="flex items-center justify-end">
          {bannerTextES && (
            <button onClick={onClearAnnouncement} className="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20">
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Globe size={10} /> Español
          </p>
          <textarea value={bannerTextES} onChange={e => setBannerTextES(e.target.value)} placeholder="Mensaje en español..." className="w-full bg-neutral-900 border border-neutral-800/60 rounded-[1.5rem] p-4 text-sm font-medium outline-none h-20 resize-none focus:border-neutral-400/50" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Globe size={10} /> Inglés
          </p>
          <textarea value={bannerTextEN} onChange={e => setBannerTextEN(e.target.value)} placeholder="Message in English..." className="w-full bg-neutral-900 border border-neutral-800/60 rounded-[1.5rem] p-4 text-sm font-medium outline-none h-20 resize-none focus:border-neutral-400/50" />
        </div>
        <div className="border-t border-white/5 pt-3">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Sparkles size={10} /> Tutorial de Novedades
          </p>
          <input value={updateId} onChange={e => setUpdateId(e.target.value)} placeholder="ID único (ej. 2026-01-30)" className="w-full bg-neutral-900 border border-neutral-800/60 rounded-[1.5rem] px-4 py-3 text-sm outline-none focus:border-neutral-400/50 mb-3" />
          {/* Contenido ES */}
          <p className="text-[10px] font-bold text-neutral-500 uppercase mb-2">Contenido ES</p>
          <input value={updateTitleES} onChange={e => setUpdateTitleES(e.target.value)} placeholder="Título (ES)" className="w-full bg-neutral-900 border border-neutral-800/60 rounded-[1.5rem] px-4 py-2.5 text-sm outline-none mb-2" />
          <input value={updateSubtitleES} onChange={e => setUpdateSubtitleES(e.target.value)} placeholder="Subtítulo (ES)" className="w-full bg-neutral-900 border border-neutral-800/60 rounded-[1.5rem] px-4 py-2.5 text-sm outline-none mb-2" />
          <div className="space-y-2">
            {updateItemsES.map((item, index) => (
              <div key={`es-${index}`} className="bg-neutral-900/60 border border-white/5 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  {UPDATE_ICON_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    return (
                      <button key={opt.id} type="button" onClick={() => updateItemField(setUpdateItemsES, index, 'icon', opt.id)}
                        className={`h-7 w-7 rounded-xl flex items-center justify-center border ${item.icon === opt.id ? 'bg-white/10 border-white/20 text-white' : 'bg-neutral-900/60 border-white/5 text-neutral-500'}`}>
                        <Icon size={12} />
                      </button>
                    )
                  })}
                </div>
                <input value={item.title} onChange={e => updateItemField(setUpdateItemsES, index, 'title', e.target.value)} placeholder="Título" className="w-full bg-neutral-900 border border-neutral-800/60 rounded-xl px-3 py-2 text-sm text-white mb-1.5" />
                <textarea value={item.desc} onChange={e => updateItemField(setUpdateItemsES, index, 'desc', e.target.value)} placeholder="Descripción" className="w-full bg-neutral-900 border border-neutral-800/60 rounded-xl p-3 text-sm text-white h-16 resize-none" />
                <button type="button" onClick={() => removeUpdateItem(setUpdateItemsES, index)} className="text-xs text-red-400 mt-2">Eliminar</button>
              </div>
            ))}
            <button type="button" onClick={() => addUpdateItem(setUpdateItemsES)} className="w-full bg-white/10 border border-white/10 text-white text-xs font-bold py-2 rounded-xl">
              + Añadir novedad
            </button>
          </div>
          {/* Contenido EN */}
          <p className="text-[10px] font-bold text-neutral-500 uppercase mb-2 mt-4">Contenido EN</p>
          <input value={updateTitleEN} onChange={e => setUpdateTitleEN(e.target.value)} placeholder="Title (EN)" className="w-full bg-neutral-900 border border-neutral-800/60 rounded-[1.5rem] px-4 py-2.5 text-sm outline-none mb-2" />
          <input value={updateSubtitleEN} onChange={e => setUpdateSubtitleEN(e.target.value)} placeholder="Subtitle (EN)" className="w-full bg-neutral-900 border border-neutral-800/60 rounded-[1.5rem] px-4 py-2.5 text-sm outline-none mb-2" />
          <div className="space-y-2">
            {updateItemsEN.map((item, index) => (
              <div key={`en-${index}`} className="bg-neutral-900/60 border border-white/5 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  {UPDATE_ICON_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    return (
                      <button key={opt.id} type="button" onClick={() => updateItemField(setUpdateItemsEN, index, 'icon', opt.id)}
                        className={`h-7 w-7 rounded-xl flex items-center justify-center border ${item.icon === opt.id ? 'bg-white/10 border-white/20 text-white' : 'bg-neutral-900/60 border-white/5 text-neutral-500'}`}>
                        <Icon size={12} />
                      </button>
                    )
                  })}
                </div>
                <input value={item.title} onChange={e => updateItemField(setUpdateItemsEN, index, 'title', e.target.value)} placeholder="Title" className="w-full bg-neutral-900 border border-neutral-800/60 rounded-xl px-3 py-2 text-sm text-white mb-1.5" />
                <textarea value={item.desc} onChange={e => updateItemField(setUpdateItemsEN, index, 'desc', e.target.value)} placeholder="Description" className="w-full bg-neutral-900 border border-neutral-800/60 rounded-xl p-3 text-sm text-white h-16 resize-none" />
                <button type="button" onClick={() => removeUpdateItem(setUpdateItemsEN, index)} className="text-xs text-red-400 mt-2">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => addUpdateItem(setUpdateItemsEN)} className="w-full bg-white/10 border border-white/10 text-white text-xs font-bold py-2 rounded-xl">
              + Add update
            </button>
          </div>
        </div>
      </Accordion>
    </div>
  )
}
