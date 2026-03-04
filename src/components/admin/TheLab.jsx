import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Send, Save, FlaskConical, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

function NotificationPreview({ title, body }) {
  if (!title && !body) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4"
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-2">Vista previa</p>
      <div className="bg-neutral-800/60 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-neutral-700 flex items-center justify-center shrink-0">
          <img src="/pwa-192x192.png" alt="DayClose" className="w-7 h-7 rounded-lg" onError={e => { e.target.style.display = 'none' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">{title || 'Título de la notificación'}</p>
          <p className="text-xs text-neutral-400 mt-0.5 leading-snug">{body || 'Cuerpo del mensaje...'}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function TheLab({ notifyNow, setNotifyNow, notifySchedule, setNotifySchedule, onSendNotification, onScheduleNotification, onLogAction }) {
  const [sendStatus, setSendStatus] = useState(null) // 'sending' | 'sent' | 'error'
  const [schedOpen, setSchedOpen] = useState(false)

  const handleSend = async () => {
    if (!notifyNow.title.trim() || !notifyNow.body.trim()) return
    const isBroadcast = !notifyNow.target_email?.trim()
    if (isBroadcast && sendStatus !== 'confirm') {
      setSendStatus('confirm')
      return
    }
    setSendStatus('sending')
    try {
      await onSendNotification()
      if (onLogAction) {
        await onLogAction('send_push', notifyNow.target_email || 'broadcast', {
          title: notifyNow.title,
          target: notifyNow.target_email || 'all',
        })
      }
      setSendStatus('sent')
      setTimeout(() => setSendStatus(null), 4000)
    } catch {
      setSendStatus('error')
      setTimeout(() => setSendStatus(null), 3000)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black uppercase tracking-tight">The Lab</h2>
        <p className="text-[10px] text-neutral-500 font-bold uppercase mt-0.5">Prueba quirúrgica de notificaciones</p>
      </div>

      {/* Formulario de envío inmediato */}
      <div className="bg-neutral-800/20 rounded-[2rem] border border-white/5 p-5 space-y-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-3 bg-fuchsia-500/10 rounded-[1.2rem] border border-white/5">
            <Bell size={18} className="text-fuchsia-400" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-tight">Envío inmediato</p>
            <p className="text-[10px] text-neutral-500">Notificación instantánea o por usuario</p>
          </div>
        </div>

        <input
          value={notifyNow.target_email}
          onChange={e => { setNotifyNow({ ...notifyNow, target_email: e.target.value }); setSendStatus(null) }}
          className="w-full bg-neutral-900 border border-neutral-800/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-fuchsia-500/40"
          placeholder="Email del usuario (vacío = todos)"
        />

        {!notifyNow.target_email?.trim() && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <AlertTriangle size={12} className="text-amber-400 shrink-0" />
            <p className="text-[11px] text-amber-400/80 font-semibold">Sin email → broadcast a todos los suscriptores</p>
          </div>
        )}

        <input
          value={notifyNow.title}
          onChange={e => setNotifyNow({ ...notifyNow, title: e.target.value })}
          className="w-full bg-neutral-900 border border-neutral-800/60 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-fuchsia-500/40"
          placeholder="Título"
        />
        <textarea
          value={notifyNow.body}
          onChange={e => setNotifyNow({ ...notifyNow, body: e.target.value })}
          className="w-full bg-neutral-900 border border-neutral-800/60 rounded-xl px-3 py-2.5 text-sm text-white h-20 resize-none outline-none focus:border-fuchsia-500/40"
          placeholder="Cuerpo del mensaje"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={notifyNow.min_version}
            onChange={e => setNotifyNow({ ...notifyNow, min_version: e.target.value })}
            className="bg-neutral-900 border border-neutral-800/60 rounded-xl px-3 py-2 text-sm text-white outline-none"
            placeholder="Versión mín."
          />
          <input
            value={notifyNow.max_version}
            onChange={e => setNotifyNow({ ...notifyNow, max_version: e.target.value })}
            className="bg-neutral-900 border border-neutral-800/60 rounded-xl px-3 py-2 text-sm text-white outline-none"
            placeholder="Versión máx."
          />
        </div>
        <input
          value={notifyNow.url}
          onChange={e => setNotifyNow({ ...notifyNow, url: e.target.value })}
          className="w-full bg-neutral-900 border border-neutral-800/60 rounded-xl px-3 py-2 text-sm text-white outline-none"
          placeholder="URL (opcional)"
        />

        {/* Vista previa */}
        <NotificationPreview title={notifyNow.title} body={notifyNow.body} />

        {/* Botón de envío con estados */}
        <AnimatePresence mode="wait">
          {sendStatus === 'confirm' ? (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <button
                onClick={handleSend}
                className="flex-1 bg-amber-500 text-black font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <AlertTriangle size={15} /> Confirmar broadcast a todos
              </button>
              <button onClick={() => setSendStatus(null)} className="px-4 py-3 rounded-xl bg-neutral-800 text-xs font-bold text-neutral-400">
                Cancelar
              </button>
            </motion.div>
          ) : sendStatus === 'sending' ? (
            <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 py-3 text-sm text-neutral-400 font-semibold">
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              Enviando...
            </motion.div>
          ) : sendStatus === 'sent' ? (
            <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 py-3 text-sm text-emerald-400 font-black">
              ✓ Enviado correctamente
            </motion.div>
          ) : sendStatus === 'error' ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2 py-3 text-sm text-red-400 font-black">
              ✗ Error al enviar
            </motion.div>
          ) : (
            <motion.button
              key="send"
              onClick={handleSend}
              disabled={!notifyNow.title.trim() || !notifyNow.body.trim()}
              className="w-full bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95 border border-fuchsia-500/20"
            >
              <Send size={15} /> Disparar prueba
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Notificaciones programadas */}
      <div className="bg-neutral-800/20 rounded-[2rem] border border-white/5">
        <button
          onClick={() => setSchedOpen(o => !o)}
          className="w-full flex items-center justify-between p-5"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-neutral-700/50 rounded-[1.2rem] border border-white/5">
              <Save size={18} className="text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight">Programadas</p>
              <p className="text-[10px] text-neutral-500">Se ejecutan vía cronjob</p>
            </div>
          </div>
          {schedOpen ? <ChevronUp size={14} className="text-neutral-500" /> : <ChevronDown size={14} className="text-neutral-500" />}
        </button>
        <AnimatePresence>
          {schedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-3">
                <input
                  value={notifySchedule.title}
                  onChange={e => setNotifySchedule({ ...notifySchedule, title: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800/60 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  placeholder="Título"
                />
                <textarea
                  value={notifySchedule.body}
                  onChange={e => setNotifySchedule({ ...notifySchedule, body: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800/60 rounded-xl px-3 py-2 text-sm text-white h-20 resize-none outline-none"
                  placeholder="Mensaje"
                />
                <input
                  type="datetime-local"
                  value={notifySchedule.send_at}
                  onChange={e => setNotifySchedule({ ...notifySchedule, send_at: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800/60 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
                <input
                  value={notifySchedule.url}
                  onChange={e => setNotifySchedule({ ...notifySchedule, url: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-800/60 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  placeholder="URL (opcional)"
                />
                <button
                  onClick={onScheduleNotification}
                  className="w-full bg-white text-black font-black py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  <Save size={15} /> Programar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
