import { motion } from 'framer-motion'
import { Users, Activity, CheckCircle, Save, UserSearch, HeartPulse, FlaskConical, ShieldCheck } from 'lucide-react'

const MODULES = [
  {
    id: 'user-intel',
    icon: UserSearch,
    color: 'bg-violet-500/10 border-violet-500/15',
    iconColor: 'text-violet-400',
    title: 'User Intel',
    sub: 'Gestión · Pro · Bloqueos',
  },
  {
    id: 'system-pulse',
    icon: HeartPulse,
    color: 'bg-blue-500/10 border-blue-500/15',
    iconColor: 'text-blue-400',
    title: 'System Pulse',
    sub: 'Salud · Mantenimiento · Métricas',
  },
  {
    id: 'the-lab',
    icon: FlaskConical,
    color: 'bg-fuchsia-500/10 border-fuchsia-500/15',
    iconColor: 'text-fuchsia-400',
    title: 'The Lab',
    sub: 'Push · Pruebas · Cron',
  },
  {
    id: 'guardian',
    icon: ShieldCheck,
    color: 'bg-amber-500/10 border-amber-500/15',
    iconColor: 'text-amber-400',
    title: 'Guardian',
    sub: 'Momentos · Moderación',
  },
]

const stagger = {
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } }
}

const tileVariant = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }
}

export default function AdminLauncher({ stats, onOpenModule, onSave, loading, version }) {
  return (
    <div className="space-y-6">
      {/* Stats chips */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid grid-cols-3 gap-3"
      >
        {[
          { icon: Users,       color: 'text-blue-400',    value: stats.users,  label: 'Usuarios' },
          { icon: CheckCircle, color: 'text-violet-400',  value: stats.habits, label: 'Hábitos' },
          { icon: Activity,    color: 'text-emerald-400', value: stats.logs,   label: 'Registros' },
        ].map(({ icon: Icon, color, value, label }) => (
          <motion.div
            key={label}
            variants={tileVariant}
            className="bg-neutral-800/40 p-4 rounded-3xl border border-white/5 text-center"
          >
            <Icon className={`${color} mx-auto mb-2`} size={18} />
            <p className="text-xl font-black">{value}</p>
            <p className="text-[8px] text-neutral-500 uppercase font-black tracking-wider">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Versión activa */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center justify-center gap-2"
      >
        <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
          Software v{version}
        </span>
      </motion.div>

      {/* Bento Grid 2x2 */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-4"
      >
        {MODULES.map((mod) => {
          const Icon = mod.icon
          return (
            <motion.button
              key={mod.id}
              variants={tileVariant}
              whileTap={{ scale: 0.95 }}
              onClick={() => onOpenModule(mod.id)}
              className={`relative flex flex-col items-center justify-center gap-4 p-6 rounded-[2.5rem] border ${mod.color} bg-neutral-800/40 hover:bg-neutral-800/60 transition-colors text-center min-h-[152px]`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${mod.color}`}>
                <Icon className={mod.iconColor} size={26} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-tight text-white leading-tight">
                  {mod.title}
                </p>
                <p className="text-[10px] text-neutral-500 font-bold mt-0.5 leading-snug">
                  {mod.sub}
                </p>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Botón global Ejecutar Órdenes */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={onSave}
        disabled={loading}
        className="w-full bg-white text-black font-black py-5 rounded-[2.5rem] text-base active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.05)]"
      >
        {loading ? 'Sincronizando...' : <><Save size={20} /> Ejecutar Órdenes</>}
      </motion.button>
    </div>
  )
}
