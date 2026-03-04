import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, RotateCcw, ShieldCheck, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

function formatRelative(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora mismo'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

export default function Guardian({ onLogAction }) {
  const [moments, setMoments] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState({}) // { id: timeoutId }
  const [undoVisible, setUndoVisible] = useState({}) // { id: countdown }

  useEffect(() => {
    fetchMoments()
  }, [])

  const fetchMoments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('shared_moments')
      .select('id, content, emoji, user_id, created_at, user_profiles(email)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(30)

    if (!error && data) setMoments(data)
    setLoading(false)
  }

  const softDelete = (id) => {
    // Optimista: ocultar inmediatamente
    setMoments(prev => prev.filter(m => m.id !== id))

    // Mostrar undo durante 5s
    setUndoVisible(prev => ({ ...prev, [id]: true }))

    const timer = setTimeout(async () => {
      // Confirmar en BD
      await supabase.from('shared_moments').update({ is_deleted: true }).eq('id', id)
      if (onLogAction) onLogAction('delete_moment', id, {})
      setUndoVisible(prev => { const n = { ...prev }; delete n[id]; return n })
      setPendingDelete(prev => { const n = { ...prev }; delete n[id]; return n })
    }, 5000)

    setPendingDelete(prev => ({ ...prev, [id]: timer }))
  }

  const undoDelete = (id) => {
    // Cancelar el timeout
    if (pendingDelete[id]) {
      clearTimeout(pendingDelete[id])
      setPendingDelete(prev => { const n = { ...prev }; delete n[id]; return n })
    }
    setUndoVisible(prev => { const n = { ...prev }; delete n[id]; return n })

    // Restaurar optimistamente
    fetchMoments()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">Guardian</h2>
          <p className="text-[10px] text-neutral-500 font-bold uppercase mt-0.5">
            Moderación de contenido · últimos 30
          </p>
        </div>
        <button
          onClick={fetchMoments}
          disabled={loading}
          className="p-2.5 rounded-xl bg-neutral-800 border border-white/5 text-neutral-400 hover:text-white transition-colors active:scale-95"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Toast de undo */}
      <AnimatePresence>
        {Object.keys(undoVisible).map(id => (
          <motion.div
            key={`undo-${id}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between bg-neutral-800/80 border border-white/10 rounded-2xl px-4 py-3"
          >
            <p className="text-sm text-neutral-300 font-semibold">Momento eliminado</p>
            <button
              onClick={() => undoDelete(id)}
              className="flex items-center gap-1.5 text-sm text-emerald-400 font-bold"
            >
              <RotateCcw size={13} /> Deshacer
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      ) : moments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <ShieldCheck size={32} className="text-emerald-500/50" />
          <p className="text-sm text-neutral-500 font-semibold">No hay momentos visibles</p>
          <p className="text-xs text-neutral-600">El feed está limpio</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {moments.map(m => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-neutral-900/60 rounded-2xl border border-white/5 p-4 flex items-start gap-3"
              >
                {/* Emoji */}
                <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center text-lg shrink-0">
                  {m.emoji || '🌙'}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium leading-snug line-clamp-2">
                    {m.content || '(sin texto)'}
                  </p>
                  <p className="text-[10px] text-neutral-600 mt-1.5 flex items-center gap-1.5">
                    <span className="text-neutral-500 truncate max-w-[150px]">
                      {m.user_profiles?.email || m.user_id?.slice(0, 8) + '…'}
                    </span>
                    <span>·</span>
                    <span>{formatRelative(m.created_at)}</span>
                  </p>
                </div>

                {/* Botón eliminar */}
                <button
                  onClick={() => softDelete(m.id)}
                  className="shrink-0 p-2 rounded-xl text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors active:scale-90"
                  title="Eliminar momento"
                >
                  <Trash2 size={15} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
