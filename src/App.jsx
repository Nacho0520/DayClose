import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion, useMotionValue, animate } from 'framer-motion'

// Componentes
import Dashboard from './components/Dashboard'
import Auth from './components/Auth'
import LandingPage from './components/LandingPage'
import ReminderPopup from './components/ReminderPopup'
import TopBanner from './components/TopBanner'
import MaintenanceScreen from './components/MaintenanceScreen'
import AdminPanel from './components/AdminPanel'
import Tutorial from './components/Tutorial'
import Dock from './components/Dock'
import Stats from './components/Stats'
import ProgressComparison from './components/ProgressComparison'
import BlockedScreen from './components/BlockedScreen'
import UpdateShowcase from './components/UpdateShowcase'
import MoreFeatures from './components/MoreFeatures'
import FutureLettersSection from './components/FutureLettersSection'
import FeedbackSection from './components/FeedbackSection'
import CommunityHub from './components/CommunityHub'
import History from './components/History'
import ProModal from './components/ProModal'
import ReviewScreen from './components/ReviewScreen'

// Hooks y Contexto
import { supabase } from './lib/supabaseClient'
import { useLanguage } from './context/LanguageContext'
import { useSession } from './hooks/useSession'
import { useAppSettings } from './hooks/useAppSettings'
import { useHabits } from './hooks/useHabits'
import { useProPlan } from './hooks/useProPlan'

// ── Constantes Globales ───────────────────────────────────────────────────────
const CURRENT_SOFTWARE_VERSION = '2.0.2'
const AUTO_UPDATE_DELAY_MS = 8000
const TABS = ['home', 'stats', 'community', 'apps']
const MotionDiv = motion.div

// ── Componente de Ruta Protegida ─────────────────────────────────────────────
const ProtectedRoute = ({ isAdmin, children }) => {
  return isAdmin ? children : <Navigate to="/" replace />
}

// ── Layout Principal (Dashboard con Slider Swipeable) ────────────────────────
function DashboardLayout({
  session, habits, todayLogs, effectiveIsPro, isAdmin, isTestAccount,
  updateUnread, updateAvailable, updateOpen, setUpdateOpen,
  handleResetTutorial, handleResetUpdates, handleToggleTestPro,
  setProModalOpen, t, fetchTodayLogs
}) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('home')
  const tabIndex = TABS.indexOf(activeTab)
  const tabRef = useRef(null)
  const [tabWidth, setTabWidth] = useState(0)
  const x = useMotionValue(0)
  const effectiveWidth = Math.max(tabWidth || 0, typeof window !== 'undefined' ? window.innerWidth : 0)

  // ✅ RECUPERADO: Scroll to top al cambiar de pestaña
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [activeTab])

  // Medir ancho para el slider
  useEffect(() => {
    const measure = () => setTabWidth(tabRef.current?.getBoundingClientRect?.().width || window.innerWidth)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Animar el slider al cambiar pestaña
  useEffect(() => {
    if (!effectiveWidth || tabIndex < 0) return
    const ctrl = animate(x, -tabIndex * effectiveWidth, { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 })
    return ctrl.stop
  }, [effectiveWidth, tabIndex, x])

  return (
    <div className="relative min-h-screen bg-neutral-900 overflow-x-hidden flex flex-col">
      <div className="flex-1 flex flex-col overflow-hidden w-full" ref={tabRef}>
        <MotionDiv
          className="flex h-full"
          style={{ x }}
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: -effectiveWidth * (TABS.length - 1), right: 0 }}
          dragElastic={0.06}
          onDragEnd={(_, info) => {
            if (!effectiveWidth) return
            const threshold = effectiveWidth * 0.2
            if (info.offset.x < -threshold && tabIndex < TABS.length - 1) {
              setActiveTab(TABS[tabIndex + 1])
            } else if (info.offset.x > threshold && tabIndex > 0) {
              setActiveTab(TABS[tabIndex - 1])
            } else {
              animate(x, -tabIndex * effectiveWidth, { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 })
            }
          }}
        >
          {/* 1. Dashboard / Home */}
          <div style={{ width: effectiveWidth }} className="shrink-0">
            <Dashboard
              user={session.user} habits={habits} todayLogs={todayLogs}
              onStartReview={() => navigate('/review')}
              version={CURRENT_SOFTWARE_VERSION}
              onOpenAdmin={() => navigate('/admin')}
              onOpenUpdates={() => setUpdateOpen(true)}
              hasUpdates={updateUnread}
              isTestAccount={isTestAccount}
              onResetTutorial={handleResetTutorial}
              onResetUpdates={handleResetUpdates}
              onOpenHistory={() => navigate('/history')}
              isPro={effectiveIsPro}
              isAdmin={isAdmin}
              onToggleTestPro={handleToggleTestPro}
              onUpgrade={() => setProModalOpen(true)}
              onResetToday={fetchTodayLogs}
            />
          </div>

          {/* 2. Stats */}
          <div style={{ width: effectiveWidth }} className="shrink-0">
            <Stats user={session.user} isPro={effectiveIsPro} onUpgrade={() => setProModalOpen(true)} />
          </div>

          {/* 3. Community */}
          <div style={{ width: effectiveWidth }} className="shrink-0">
            <CommunityHub user={session.user} />
          </div>

          {/* 4. More Features */}
          <div style={{ width: effectiveWidth }} className="shrink-0">
            <div className="flex flex-col items-center justify-center flex-1 text-white p-6 text-center">
              <div className="w-full max-w-md space-y-6">
                <ProgressComparison user={session.user} isPro={effectiveIsPro} onUpgrade={() => setProModalOpen(true)} />
                <FutureLettersSection isPro={effectiveIsPro} onUpgrade={() => setProModalOpen(true)} />
                <FeedbackSection user={session.user} />
                <MoreFeatures />
              </div>
            </div>
          </div>
        </MotionDiv>
      </div>

      <Dock activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

// ── Componente Principal App ──────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, language } = useLanguage()

  // 1. Gestión de Sesión y Permisos REALES (Base de Datos)
  const { session, loadingSession, isAdmin, isBlocked, isWhitelisted, checkWhitelist } = useSession()

  // 2. Lógica Unificada de Admin (Cuenta Real + Cuenta Test)
  const isTestAccount = useMemo(() => {
    return session?.user?.email === import.meta.env.VITE_TEST_EMAIL
  }, [session])

  const effectiveIsAdmin = isAdmin || isTestAccount

  // 3. Configuración de Sistema
  const {
    isMaintenance, maintenanceMessage, updateAvailable, updatePayload,
    updateUnread, setUpdateUnread, markUpdateSeen, resetUpdateSeen
  } = useAppSettings({ session, loadingSession, language })

  // 4. Datos de Hábitos y Plan Pro
  const mode = location.pathname === '/review' ? 'reviewing' : 'dashboard'
  const { habits, todayLogs, fetchTodayLogs } = useHabits({ session, mode })
  const { effectiveIsPro, handleToggleTestPro } = useProPlan({ session, isAdmin: effectiveIsAdmin })

  const [proModalOpen, setProModalOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)

  // ── Efectos Globales ────────────────────────────────────────────────────────

  // Redirigir al tutorial si es necesario
  useEffect(() => {
    if (session && !session.user.user_metadata?.has_finished_tutorial) {
      if (location.pathname !== '/tutorial') navigate('/tutorial', { replace: true })
    }
  }, [session, navigate, location.pathname])

  // Comprobar mantenimiento
  useEffect(() => {
    checkWhitelist(isMaintenance)
  }, [session, isMaintenance, checkWhitelist])

  // Auto-reload si hay versión nueva
  useEffect(() => {
    if (!updateAvailable) return
    const timer = setTimeout(() => window.location.reload(), AUTO_UPDATE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [updateAvailable])

  // Abrir modal de novedades automáticamente al llegar al home
  useEffect(() => {
    if (location.pathname === '/' && updateUnread && updatePayload && !updateOpen) {
      queueMicrotask(() => setUpdateOpen(true))
    }
  }, [location.pathname, updateUnread, updatePayload, updateOpen])

  // ── Guardas de Renderizado ──────────────────────────────────────────────────

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white font-black italic tracking-tighter uppercase text-3xl">
        DAYCLOSE
      </div>
    )
  }

  if (isMaintenance && !isWhitelisted && !effectiveIsAdmin) {
    return <MaintenanceScreen message={maintenanceMessage} />
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth onBack={() => navigate('/')} />} />
        <Route path="*" element={<LandingPage onGetStarted={() => navigate('/auth')} />} />
      </Routes>
    )
  }

  if (isBlocked && !effectiveIsAdmin) {
    return <BlockedScreen title={t('blocked_title')} message={t('blocked_desc')} />
  }

  // ── Render App Autenticada ──────────────────────────────────────────────────
  return (
    <>
      <ProModal
        isOpen={proModalOpen}
        onClose={() => setProModalOpen(false)}
        user={session.user}
        onProActivated={() => window.location.reload()}
      />

      <TopBanner onOpenUpdates={() => setUpdateOpen(true)} />

      <UpdateShowcase
        isOpen={updateOpen}
        onClose={() => { markUpdateSeen(updatePayload?.id); setUpdateOpen(false) }}
        payload={updatePayload}
      />

      <ReminderPopup
        session={session}
        isPro={effectiveIsPro}
        habits={habits}
        todayLogs={todayLogs}
        mode={mode}
      />

      <Routes>
        {/* Tutorial */}
        <Route
          path="/tutorial"
          element={
            <Tutorial
              user={session.user}
              onComplete={async () => {
                await supabase.auth.updateUser({ data: { has_finished_tutorial: true } })
                navigate('/', { replace: true })
              }}
            />
          }
        />

        {/* Panel de Admin Protegido */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAdmin={effectiveIsAdmin}>
              <AdminPanel onClose={() => navigate('/')} version={CURRENT_SOFTWARE_VERSION} />
            </ProtectedRoute>
          }
        />

        {/* Historial */}
        <Route
          path="/history"
          element={<History user={session.user} onClose={() => navigate('/')} isPro={effectiveIsPro} />}
        />

        {/* Review de Hábitos */}
        <Route
          path="/review"
          element={
            <ReviewScreen
              habits={habits}
              todayLogs={todayLogs}
              session={session}
              onReviewComplete={fetchTodayLogs}
            />
          }
        />

        {/* Dashboard Principal */}
        <Route
          path="/"
          element={
            <DashboardLayout
              session={session}
              habits={habits}
              todayLogs={todayLogs}
              effectiveIsPro={effectiveIsPro}
              isAdmin={effectiveIsAdmin}
              isTestAccount={isTestAccount}
              updateUnread={updateUnread}
              updateAvailable={updateAvailable}
              updateOpen={updateOpen}
              setUpdateOpen={setUpdateOpen}
              fetchTodayLogs={fetchTodayLogs}
              handleResetTutorial={async () => {
                await supabase.auth.updateUser({ data: { has_finished_tutorial: false } })
                navigate('/tutorial', { replace: true })
              }}
              handleResetUpdates={() => { resetUpdateSeen(updatePayload?.id); setUpdateOpen(true) }}
              handleToggleTestPro={handleToggleTestPro}
              setProModalOpen={setProModalOpen}
              t={t}
            />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}