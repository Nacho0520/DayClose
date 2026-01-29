import { useState } from "react";
import { Check, X, Circle, Menu, Plus, Trash2, Settings, RotateCcw } from "lucide-react";
import Sidebar from "./Sidebar";
import SettingsModal from "./SettingsModal";
import HabitCreator from "./HabitCreator";
import { supabase } from "../lib/supabaseClient";

function CircularProgress({ percentage }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="none" className="text-neutral-800" />
        <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-emerald-500 transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-4xl font-bold text-white tracking-tighter">{Math.round(percentage)}%</p>
        <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest mt-1">Hoy</p>
      </div>
    </div>
  );
}

function Dashboard({ user, habits, todayLogs, onStartReview, onResetToday, version, onOpenAdmin }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isCreatorOpen, setCreatorOpen] = useState(false);
  const [editHabit, setEditHabit] = useState(null);

  const logsMap = new Map();
  (todayLogs || []).forEach(l => logsMap.set(l.habit_id, { status: l.status, logId: l.id }));

  const completed = (habits || []).filter(h => logsMap.get(h.id)?.status === "completed").length;
  const percentage = habits?.length > 0 ? (completed / habits.length) * 100 : 0;

  return (
    // pb-40 para que el contenido nunca quede tapado por el Dock
    <div className="min-h-screen bg-neutral-900 px-4 pt-8 pb-40 relative">
      <button onClick={() => setSidebarOpen(true)} className="absolute top-6 left-4 text-white p-2 hover:bg-neutral-800 rounded-full transition-colors z-[100]">
        <Menu size={28} />
      </button>

      <Sidebar 
        isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} user={user} 
        onLogout={() => supabase.auth.signOut().then(() => window.location.reload())} 
        onOpenSettings={() => setSettingsOpen(true)} version={version}
        onOpenAdmin={onOpenAdmin} 
      />
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} user={user} />
      <HabitCreator isOpen={isCreatorOpen || !!editHabit} onClose={() => { setCreatorOpen(false); setEditHabit(null); }} userId={user?.id} habitToEdit={editHabit} onHabitCreated={() => window.location.reload()} />

      <div className="mx-auto w-full max-w-md mt-6">
        <header className="mb-10 text-center">
          <h2 className="text-lg font-light text-neutral-500 italic">Hola,</h2>
          <h1 className="text-3xl font-black text-white tracking-tight capitalize leading-none">{user?.user_metadata?.full_name || 'Usuario'}</h1>
        </header>

        <div className="mb-10 flex justify-center"><CircularProgress percentage={percentage} /></div>

        <div className="space-y-3">
          {(habits || []).map((habit) => {
            const log = logsMap.get(habit.id);
            return (
              <div key={habit.id} className="group flex items-center gap-3 rounded-[2rem] border border-neutral-800 bg-neutral-800/30 p-4 backdrop-blur-md transition-all">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${habit.color} shadow-inner flex-shrink-0`}>
                  <span className="text-2xl">{habit.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate text-base tracking-tight">{habit.title}</p>
                </div>
                <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity pr-2">
                  <button onClick={() => setEditHabit(habit)} className="p-2 text-neutral-400 hover:text-blue-400 rounded-lg"><Settings size={18} /></button>
                  <button onClick={async () => { if(confirm('¿Eliminar?')){ await supabase.from('daily_logs').delete().eq('habit_id', habit.id); await supabase.from('habits').delete().eq('id', habit.id); window.location.reload(); }}} className="p-2 text-neutral-400 hover:text-red-500 rounded-lg"><Trash2 size={18} /></button>
                </div>
                <div className="flex-shrink-0 ml-1">
                  {log ? (
                    <button onClick={async () => { await supabase.from('daily_logs').delete().eq('id', log.logId); window.location.reload(); }} className="flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-75 bg-white/5 shadow-lg">
                      {log.status === "completed" ? <Check className="h-6 w-6 text-emerald-500" /> : <X className="h-6 w-6 text-red-500" />}
                    </button>
                  ) : <Circle className="h-6 w-6 text-neutral-700" />}
                </div>
              </div>
            );
          })}
        </div>

        {(habits || []).some(h => !logsMap.has(h.id)) && (
          <button onClick={onStartReview} className="mt-8 w-full rounded-[2rem] bg-white px-6 py-5 text-lg font-black text-black shadow-2xl active:scale-95 transition-all">Comenzar Revisión</button>
        )}
      </div>

      {/* Ajuste de posición del botón + para que no se pise con el Dock (bottom-32) */}
      <button onClick={() => setCreatorOpen(true)} className="fixed bottom-32 right-6 h-16 w-16 bg-blue-600 text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center active:scale-90 transition-all z-40">
        <Plus size={36} strokeWidth={3} />
      </button>
    </div>
  );
}

export default Dashboard;