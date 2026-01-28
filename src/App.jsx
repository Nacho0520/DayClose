import { useEffect, useState, useCallback } from 'react'
import SwipeCard from './components/SwipeCard'
import NoteModal from './components/NoteModal'
import Dashboard from './components/Dashboard'
import Auth from './components/Auth'
import { supabase } from './lib/supabaseClient'
import ReminderPopup from './components/ReminderPopup'
import TopBanner from './components/TopBanner'
import MaintenanceScreen from './components/MaintenanceScreen'
import AdminPanel from './components/AdminPanel' // Importamos el nuevo panel
import { X } from 'lucide-react'

// --- CONFIGURACIÓN DE VERSIÓN ---
const CURRENT_SOFTWARE_VERSION = '1.0.0'; 

function getDefaultIconForTitle(title = '', index) {
  const mapping = ['📖', '💧', '🧘', '💤', '🍎', '💪', '📝', '🚶']
  const lower = title.toLowerCase()
  if (lower.includes('leer') || lower.includes('lectura')) return '📖'
  if (lower.includes('agua')) return '💧'
  if (lower.includes('meditar') || lower.includes('respir')) return '🧘'
  if (lower.includes('dormir') || lower.includes('pantalla')) return '💤'
  if (lower.includes('comer') || lower.includes('dieta')) return '🍎'
  if (lower.includes('ejercicio') || lower.includes('flexion') || lower.includes('correr')) return '💪'
  return mapping[index % mapping.length]
}

function getDefaultColorForIndex(index) {
  const colors = [
    'bg-blue-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-purple-500',
    'bg-pink-500', 'bg-orange-500', 'bg-amber-500',
  ]
  return colors[index % colors.length]
}

function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeStatus, setSwipeStatus] = useState(null)
  const [results, setResults] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingHabit, setPendingHabit] = useState(null)
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [habits, setHabits] = useState([])
  const [loadingHabits, setLoadingHabits] = useState(false)
  const [dataError, setDataError] = useState(null)
  const [todayLogs, setTodayLogs] = useState([])
  const [loadingTodayLogs, setLoadingTodayLogs] = useState(false)
  const [mode, setMode] = useState('dashboard') // dashboard, reviewing, admin
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(null)
  const [hasSaved, setHasSaved] = useState(false)
  const [isMaintenance, setIsMaintenance] = useState(false)
  const ADMIN_EMAIL = 'hemmings.nacho@gmail.com' 

  const currentHabit = habits[currentIndex]

  // LÓGICA DE ACTUALIZACIÓN Y MANTENIMIENTO
  useEffect(() => {
    const handleVersionCheck = (dbVersion) => {
      if (dbVersion && dbVersion !== CURRENT_SOFTWARE_VERSION) {
        window.location.reload(true);
      }
    };

    const initSettings = async () => {
      const { data } = await supabase.from('app_settings').select('key, value');
      if (data) {
        const maint = data.find(s => s.key === 'maintenance_mode');
        const vers = data.find(s => s.key === 'app_version');
        if (maint) setIsMaintenance(maint.value === 'true' || maint.value === true);
        if (vers) handleVersionCheck(vers.value);
      }

      const subscription = supabase
        .channel('settings_realtime')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, (payload) => {
          if (payload.new.key === 'maintenance_mode') {
            setIsMaintenance(payload.new.value === 'true' || payload.new.value === true);
          }
          if (payload.new.key === 'app_version') {
            handleVersionCheck(payload.new.value);
          }
        })
        .subscribe();

      return () => subscription.unsubscribe();
    };

    initSettings();
  }, []);

  const getTodayDateString = () => new Date().toISOString().split('T')[0]
  
  const fetchTodayLogs = useCallback(async () => {
    if (!session) return
    setLoadingTodayLogs(true)
    const todayStart = `${getTodayDateString()}T00:00:00.000Z`
    const todayEnd = `${getTodayDateString()}T23:59:59.999Z`
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd)
    setTodayLogs(data || [])
    setLoadingTodayLogs(false)
  }, [session])

  const handleResetToday = async () => {
    if (!session) return
    const todayStart = `${getTodayDateString()}T00:00:00.000Z`
    const todayEnd = `${getTodayDateString()}T23:59:59.999Z`
    await supabase.from('daily_logs').delete().eq('user_id', session.user.id).gte('created_at', todayStart).lte('created_at', todayEnd)
    await fetchTodayLogs()
    setMode('dashboard')
  }

  const handleStartReview = () => {
    setMode('reviewing')
    setCurrentIndex(0)
    setResults([])
    setHasSaved(false)
  }

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data?.session ?? null)
      setLoadingSession(false)
    }
    initSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    const fetchHabits = async () => {
      setLoadingHabits(true)
      const { data } = await supabase.from('habits').select('*').eq('is_active', true)
      if (data) {
        const normalized = data.map((habit, index) => ({
          ...habit,
          icon: habit.icon || getDefaultIconForTitle(habit.title, index),
          color: habit.color || getDefaultColorForIndex(index),
        }))
        setHabits(normalized)
      }
      setLoadingHabits(false)
    }
    fetchHabits()
  }, [session])

  useEffect(() => { if (session) fetchTodayLogs() }, [session, habits, fetchTodayLogs])

  useEffect(() => {
    if (!session || !habits.length || mode !== 'reviewing' || currentIndex < habits.length || !results.length || hasSaved || saving) return
    const saveResults = async () => {
      setSaving(true)
      const payload = results.map((item) => ({
        user_id: session.user.id,
        habit_id: item.id,
        status: item.status,
        note: item.note || null,
        created_at: new Date().toISOString(),
      }))
      const { error } = await supabase.from('daily_logs').insert(payload)
      if (!error) {
        setHasSaved(true)
        setTimeout(() => { fetchTodayLogs(); setMode('dashboard'); }, 1500)
      }
      setSaving(false)
    }
    saveResults()
  }, [session, habits, currentIndex, results, hasSaved, saving, mode])

  const handleSwipeComplete = (direction) => {
    if (!currentHabit) return
    if (direction === 'right') {
      setResults((prev) => [...prev, { id: currentHabit.id, title: currentHabit.title, status: 'completed' }])
      setCurrentIndex((prev) => prev + 1)
    } else if (direction === 'left') {
      setPendingHabit(currentHabit)
      setIsModalOpen(true)
    }
  }

  if (loadingSession) return <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-neutral-300">Cargando sesión...</div>

  if (isMaintenance && session?.user?.email !== ADMIN_EMAIL) return <MaintenanceScreen />

  if (!session) return <><TopBanner /><Auth /></>

  if (mode === 'admin') return <AdminPanel onClose={() => setMode('dashboard')} version={CURRENT_SOFTWARE_VERSION} />

  if (mode === 'dashboard') {
    return (
      <>
        <TopBanner />
        <Dashboard
          user={session.user}
          habits={habits}
          todayLogs={todayLogs}
          onStartReview={handleStartReview}
          onResetToday={handleResetToday}
          version={CURRENT_SOFTWARE_VERSION}
          onOpenAdmin={() => setMode('admin')}
        />
        <ReminderPopup session={session} />
      </>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${swipeStatus === 'done' ? 'bg-emerald-900' : swipeStatus === 'not-done' ? 'bg-red-900' : 'bg-neutral-900'} transition-colors duration-300 relative`}>
      <button onClick={() => window.location.reload()} className="fixed top-6 right-6 z-[100] flex items-center gap-1 px-4 py-2 bg-neutral-800/80 backdrop-blur-md border border-neutral-700 rounded-full text-neutral-400 hover:text-white transition-all shadow-lg">
        <X size={18} /> <span className="text-xs font-medium">Salir</span>
      </button>
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <h1 className="mb-2 text-center text-2xl font-semibold text-white">Revisión nocturna</h1>
        {currentHabit ? <SwipeCard habit={currentHabit} onSwipeComplete={handleSwipeComplete} onDrag={(x) => setSwipeStatus(x > 100 ? 'done' : x < -100 ? 'not-done' : null)} /> : <div className="rounded-2xl bg-neutral-800 p-6 text-center text-white">¡Resumen completado! <button onClick={() => setMode('dashboard')} className="mt-6 w-full py-3 bg-neutral-700 rounded-xl">Volver al inicio</button></div>}
      </div>
      <NoteModal isOpen={isModalOpen} habitTitle={pendingHabit?.title} onSave={(note) => { setResults((prev) => [...prev, { id: pendingHabit.id, title: pendingHabit.title, status: 'skipped', note: note || '' }]); setIsModalOpen(false); setCurrentIndex((prev) => prev + 1); }} onSkip={() => { setResults((prev) => [...prev, { id: pendingHabit.id, title: pendingHabit.title, status: 'skipped', note: '' }]); setIsModalOpen(false); setCurrentIndex((prev) => prev + 1); }} />
    </div>
  )
}

export default App