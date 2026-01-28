import { useState } from "react";
// 1. Añadimos Trash2 y Settings para recuperar las acciones
import { Check, X, Circle, Menu, Plus, Trash2, Settings } from "lucide-react";
import Sidebar from "./Sidebar";
import SettingsModal from "./SettingsModal";
import HabitCreator from "./HabitCreator";
import { supabase } from "../lib/supabaseClient";

function CircularProgress({ percentage }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const safePercentage = percentage || 0;
  const offset = circumference - (safePercentage / 100) * circumference;

  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="none" className="text-neutral-700" />
        <circle
          cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="text-emerald-500 transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl font-bold text-white">{Math.round(safePercentage)}%</p>
          <p className="mt-1 text-xs text-neutral-400">Completado</p>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, habits, todayLogs, onStartReview, onResetToday }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isCreatorOpen, setCreatorOpen] = useState(false);
  const [editHabit, setEditHabit] = useState(null); // Para editar

  const safeHabits = habits || [];
  const safeLogs = todayLogs || [];
  const logsMap = new Map();
  safeLogs.forEach((log) => { if (log?.habit_id) logsMap.set(log.habit_id, log.status); });

  const completedCount = safeHabits.filter((h) => logsMap.get(h.id) === "completed").length;
  const totalCount = safeHabits.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const hasPending = safeHabits.some((h) => !logsMap.has(h.id));

  // --- ACCIÓN: ELIMINAR HÁBITO ---
  const handleDeleteHabit = async (habitId) => {
    if (confirm("¿Estás seguro de que quieres eliminar este hábito? Se borrará todo su historial.")) {
      const { error } = await supabase.from('habits').delete().eq('id', habitId);
      if (error) alert("Error al eliminar");
      else window.location.reload();
    }
  };

  const getStatusIcon = (habitId) => {
    const status = logsMap.get(habitId);
    if (status === "completed") return <Check className="h-5 w-5 text-emerald-500" />;
    if (status === "skipped") return <X className="h-5 w-5 text-red-500" />;
    return <Circle className="h-5 w-5 text-neutral-500" />;
  };

  return (
    <div className="min-h-screen bg-neutral-900 px-4 py-8 relative">
      
      {/* BOTÓN SALIR: Ahora sale DURANTE el proceso (cuando hay pendientes) */}
      {hasPending && totalCount > 0 && (
        <button
          onClick={() => window.location.reload()}
          className="absolute top-6 right-6 text-neutral-500 hover:text-white p-2 z-50 flex items-center gap-2 text-xs"
        >
          <span>Salir</span>
          <X size={20} />
        </button>
      )}

      {/* Menú Hamburguesa */}
      <button onClick={() => setSidebarOpen(true)} className="absolute top-6 left-4 text-white p-2 hover:bg-neutral-800 rounded-full transition-colors">
        <Menu size={28} />
      </button>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} user={user} onLogout={() => supabase.auth.signOut().then(() => window.location.reload())} onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} user={user} />

      {/* Creador / Editor de Hábitos */}
      <HabitCreator 
        isOpen={isCreatorOpen || !!editHabit} 
        onClose={() => { setCreatorOpen(false); setEditHabit(null); }} 
        userId={user?.id} 
        habitToEdit={editHabit} // Le pasamos el hábito si estamos editando
        onHabitCreated={() => window.location.reload()} 
      />

      <div className="mx-auto w-full max-w-md mt-6 pb-20">
        <header className="mb-8 text-center">
          <h2 className="text-xl font-light text-neutral-400">Hola,</h2>
          <h1 className="text-3xl font-bold text-white capitalize">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}</h1>
        </header>

        <div className="mb-8 flex justify-center">
          <CircularProgress percentage={percentage} />
        </div>

        {/* LISTA DE HÁBITOS CON ACCIONES RECUPERADAS */}
        <div className="mb-6 space-y-3">
          {safeHabits.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-neutral-700 rounded-2xl">
              <p className="text-neutral-400">Aún no tienes rutina.</p>
            </div>
          ) : (
            safeHabits.map((habit) => {
              const status = logsMap.get(habit.id);
              const isCompleted = status === "completed";
              const isSkipped = status === "skipped";

              return (
                <div key={habit.id} className={`group flex items-center gap-3 rounded-xl border p-4 transition-all ${
                  isCompleted ? "border-emerald-700 bg-emerald-900/20" : 
                  isSkipped ? "border-red-700 bg-red-900/20" : "border-neutral-700 bg-neutral-800"
                }`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${habit.color} flex-shrink-0`}>
                    <span className="text-xl">{habit.icon}</span>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-white truncate">{habit.title}</p>
                  </div>

                  {/* ACCIONES (Solo visibles si no se ha marcado hoy o al pasar el ratón) */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditHabit(habit)} className="p-1 text-neutral-500 hover:text-blue-400">
                      <Settings size={18} />
                    </button>
                    <button onClick={() => handleDeleteHabit(habit.id)} className="p-1 text-neutral-500 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex-shrink-0">
                    {getStatusIcon(habit.id)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {hasPending && (
          <button onClick={onStartReview} className="w-full rounded-full bg-white px-6 py-4 text-lg font-semibold text-neutral-900 shadow-lg active:scale-95 transition-all">
            Comenzar Revisión Nocturna
          </button>
        )}

        {!hasPending && totalCount > 0 && (
          <div className="rounded-xl border border-emerald-700 bg-emerald-900/20 p-4 text-center">
            <p className="text-sm font-medium text-emerald-300">¡Día completado! 🌙</p>
          </div>
        )}
      </div>

      <button onClick={() => setCreatorOpen(true)} className="fixed bottom-6 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all z-40">
        <Plus size={32} />
      </button>
    </div>
  );
}

export default Dashboard;