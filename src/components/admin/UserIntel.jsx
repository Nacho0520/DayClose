import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Mail, ChevronDown, ChevronUp, UserX, UserCheck, Trash2, Crown, Star } from 'lucide-react'

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useMemo(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function RelativeTime({ ts }) {
  if (!ts) return <span className="text-neutral-600">—</span>
  const diff = Date.now() - new Date(ts).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return <span className="text-emerald-400/80">hoy</span>
  if (d === 1) return <span className="text-neutral-400">ayer</span>
  if (d < 7)  return <span className="text-neutral-500">hace {d}d</span>
  return <span className="text-neutral-600">hace {Math.floor(d / 7)}sem</span>
}

function UserCard({ u, onToggleBlock, onDeleteData, onDeleteUser, onForcePro, onLogAction }) {
  const [expanded, setExpanded]   = useState(false)
  const [confirming, setConfirming] = useState(null) // 'block' | 'clean' | 'delete' | 'pro'
  const isPro = u.plan === 'pro'

  const confirm = (action, fn) => {
    if (confirming === action) {
      fn()
      setConfirming(null)
    } else {
      setConfirming(action)
    }
  }

  const cancel = () => setConfirming(null)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900/60 rounded-2xl border border-white/5 overflow-hidden"
    >
      {/* Fila principal */}
      <button
        onClick={() => { setExpanded(e => !e); setConfirming(null) }}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className="h-9 w-9 rounded-xl bg-neutral-800 border border-white/5 flex items-center justify-center shrink-0">
          <Mail size={14} className="text-neutral-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold truncate max-w-[180px]">{u.email}</p>
            {u.is_blocked && (
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                bloqueado
              </span>
            )}
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
              isPro
                ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                : 'bg-neutral-800/60 text-neutral-500 border-white/5'
            }`}>
              {isPro ? 'PRO' : 'FREE'}
            </span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-0.5 flex items-center gap-2">
            <span>Alta: {u.created_at?.slice(0, 10)}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              Última actividad: <RelativeTime ts={u.last_seen} />
            </span>
          </p>
        </div>
        {expanded ? <ChevronUp size={14} className="text-neutral-500 shrink-0" /> : <ChevronDown size={14} className="text-neutral-500 shrink-0" />}
      </button>

      {/* Ficha expandida */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
              {/* Acciones */}
              <div className="flex flex-wrap gap-2">

                {/* Force Pro toggle */}
                {confirming === 'pro' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { onForcePro(u.user_id, !isPro); cancel() }}
                      className="px-3 py-1.5 rounded-xl text-xs font-black bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    >
                      {isPro ? 'Confirmar → FREE' : 'Confirmar → PRO'}
                    </button>
                    <button onClick={cancel} className="text-xs text-neutral-500 hover:text-neutral-300">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirming('pro')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      isPro
                        ? 'bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20'
                        : 'bg-neutral-800 text-neutral-300 border-white/5 hover:border-violet-500/30'
                    }`}
                  >
                    {isPro ? <Star size={12} fill="currentColor" /> : <Crown size={12} />}
                    {isPro ? 'Revocar Pro' : 'Activar Pro'}
                  </button>
                )}

                {/* Bloquear / Activar */}
                {confirming === 'block' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { onToggleBlock(u.user_id, !u.is_blocked); cancel() }}
                      className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    >
                      Confirmar
                    </button>
                    <button onClick={cancel} className="text-xs text-neutral-500 hover:text-neutral-300">Cancelar</button>
                  </div>
                ) : (
                  <button
                    onClick={() => confirm('block', () => {})}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-800 border border-white/5"
                  >
                    {u.is_blocked
                      ? <><UserCheck size={12} className="text-emerald-400" /> Activar</>
                      : <><UserX size={12} className="text-amber-400" /> Bloquear</>
                    }
                  </button>
                )}

                {/* Limpiar datos */}
                {confirming === 'clean' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { onDeleteData(u.user_id); cancel() }}
                      className="px-3 py-1.5 rounded-xl text-xs font-black bg-neutral-700 text-white border border-white/10"
                    >
                      Confirmar
                    </button>
                    <button onClick={cancel} className="text-xs text-neutral-500 hover:text-neutral-300">Cancelar</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirming('clean')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-800 border border-white/5 text-neutral-400 hover:text-white"
                  >
                    Limpiar datos
                  </button>
                )}

                {/* Eliminar cuenta */}
                {confirming === 'delete' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { onDeleteUser(u.user_id); cancel() }}
                      className="px-3 py-1.5 rounded-xl text-xs font-black bg-red-500/20 text-red-300 border border-red-500/30"
                    >
                      Eliminar definitivamente
                    </button>
                    <button onClick={cancel} className="text-xs text-neutral-500 hover:text-neutral-300">Cancelar</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirming('delete')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                  >
                    <Trash2 size={12} /> Eliminar cuenta
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function UserIntel({ users, onToggleBlockUser, onDeleteUserData, onDeleteUser, onForcePro, onLogAction, onBack }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return users
    const q = debouncedQuery.toLowerCase()
    return users.filter(u => u.email?.toLowerCase().includes(q))
  }, [users, debouncedQuery])

  return (
    <div className="space-y-5">
      {/* Header del módulo */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight">User Intel</h2>
          <p className="text-[10px] text-neutral-500 font-bold uppercase mt-0.5">
            {users.length} usuarios registrados
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por email..."
          className="w-full bg-neutral-800/50 border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-neutral-600 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Lista */}
      <motion.div layout className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <p className="text-sm text-neutral-600 text-center py-8">
              {query ? 'Sin resultados para esa búsqueda.' : 'No hay usuarios todavía.'}
            </p>
          ) : (
            filtered.map(u => (
              <UserCard
                key={u.user_id}
                u={u}
                onToggleBlock={onToggleBlockUser}
                onDeleteData={onDeleteUserData}
                onDeleteUser={onDeleteUser}
                onForcePro={onForcePro}
                onLogAction={onLogAction}
              />
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
