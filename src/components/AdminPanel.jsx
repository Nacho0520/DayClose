import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ShieldAlert, RefreshCw, Megaphone, CheckCircle, Activity, Save, ChevronLeft, Users, Trash2, Globe, Bell, UserX, UserCheck, ListChecks, LineChart, Wrench, Mail, Sparkles, ShieldCheck, Flame, Star, Clock, Heart, Wand2, Bug } from 'lucide-react'
import AdminDashboard from './admin/AdminDashboard'

export default function AdminPanel({ onClose, version }) {
  const [maintenance, setMaintenance] = useState(false)
  const [appVersion, setAppVersion] = useState(version || '1.0.0')
  const [bannerTextES, setBannerTextES] = useState('')
  const [bannerTextEN, setBannerTextEN] = useState('')
  const [updateId, setUpdateId] = useState('')
  const [updateTitleES, setUpdateTitleES] = useState('')
  const [updateSubtitleES, setUpdateSubtitleES] = useState('')
  const [updateItemsES, setUpdateItemsES] = useState([])
  const [updateTitleEN, setUpdateTitleEN] = useState('')
  const [updateSubtitleEN, setUpdateSubtitleEN] = useState('')
  const [updateItemsEN, setUpdateItemsEN] = useState([])
  const [stats, setStats] = useState({ habits: 0, logs: 0, users: 0 })
  const [users, setUsers] = useState([])
  const [habitStats, setHabitStats] = useState([])
  const [appMetrics, setAppMetrics] = useState(null)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [whitelist, setWhitelist] = useState([])
  const [whitelistInput, setWhitelistInput] = useState('')
  const [feedbackReports, setFeedbackReports] = useState([])
  const [notifyNow, setNotifyNow] = useState({ title: '', body: '', language: '', min_version: '', max_version: '', url: '', target_email: '' })
  const [notifySchedule, setNotifySchedule] = useState({ title: '', body: '', language: 'es', send_at: '', url: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [openSection, setOpenSection] = useState('maintenance')

  useEffect(() => { fetchAdminData() }, [])

  const fetchAdminData = async () => {
    try {
      const { data: settings } = await supabase.from('app_settings').select('*')
      if (settings) {
        const m = settings.find(s => s.key === 'maintenance_mode')
        const v = settings.find(s => s.key === 'app_version')
        if (m) setMaintenance(m.value === 'true' || m.value === true)
        if (v) setAppVersion(v.value)
      }

      const { data: announcement } = await supabase.from('announcements').select('message').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single()
      if (announcement) {
        try {
          const parsed = JSON.parse(announcement.message)
          if (parsed.es && parsed.en) {
            const esPayload = typeof parsed.es === 'string' ? { banner: parsed.es } : parsed.es
            const enPayload = typeof parsed.en === 'string' ? { banner: parsed.en } : parsed.en
            setBannerTextES(esPayload?.banner || '')
            setBannerTextEN(enPayload?.banner || '')
            const update = esPayload?.update || enPayload?.update
            if (update) {
              setUpdateId(update.id || '')
              setUpdateTitleES(update.title || '')
              setUpdateSubtitleES(update.subtitle || '')
              setUpdateItemsES(update.items || [])
              const updateEn = enPayload?.update
              if (updateEn) {
                setUpdateTitleEN(updateEn.title || '')
                setUpdateSubtitleEN(updateEn.subtitle || '')
                setUpdateItemsEN(updateEn.items || [])
              }
            } else {
              setUpdateId('')
              setUpdateTitleES('')
              setUpdateSubtitleES('')
              setUpdateItemsES([])
              setUpdateTitleEN('')
              setUpdateSubtitleEN('')
              setUpdateItemsEN([])
            }
          } else {
            setBannerTextES(announcement.message)
            setUpdateId('')
            setUpdateTitleES('')
            setUpdateSubtitleES('')
            setUpdateItemsES([])
            setUpdateTitleEN('')
            setUpdateSubtitleEN('')
            setUpdateItemsEN([])
          }
        } catch {
          setBannerTextES(announcement.message)
          setUpdateId('')
          setUpdateTitleES('')
          setUpdateSubtitleES('')
          setUpdateItemsES([])
          setUpdateTitleEN('')
          setUpdateSubtitleEN('')
          setUpdateItemsEN([])
        }
      }

      const { data: rpcStats } = await supabase.rpc('get_admin_stats')
      if (rpcStats && rpcStats[0]) {
        setStats({ users: rpcStats[0].total_users || 0, habits: rpcStats[0].total_habits || 0, logs: rpcStats[0].total_logs || 0 })
      }

      const { data: usersData } = await supabase.rpc('get_admin_users')
      if (usersData) setUsers(usersData)

      const { data: habitData } = await supabase.rpc('get_admin_habit_stats')
      if (habitData) setHabitStats(habitData)

      const { data: metricsData } = await supabase.rpc('get_admin_app_metrics')
      if (metricsData && metricsData[0]) setAppMetrics(metricsData[0])

      const { data: feedbackData } = await supabase.rpc('get_admin_feedback')
      if (feedbackData) {
        const ordered = [...feedbackData].sort((a, b) => {
          const orderA = a.status === 'open' ? 0 : 1
          const orderB = b.status === 'open' ? 0 : 1
          if (orderA !== orderB) return orderA - orderB
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        setFeedbackReports(ordered)
      }

      const { data: whitelistData } = await supabase.from('maintenance_whitelist').select('email').order('email', { ascending: true })
      if (whitelistData) setWhitelist(whitelistData.map(w => w.email))

      const { data: textSettings } = await supabase.from('app_settings_text').select('*').eq('key', 'maintenance_message').single()
      if (textSettings?.value) setMaintenanceMessage(textSettings.value)
    } catch (error) {
      console.error('Error crítico:', error)
    }
  }

  const handleUpdateSettings = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const buildUpdate = (id, title, subtitle, items) => {
        const filtered = (items || []).filter(i => i?.title?.trim())
        const hasContent = id.trim() || title.trim() || subtitle.trim() || filtered.length > 0
        if (!hasContent) return null
        return {
          id: id.trim(),
          title: title.trim(),
          subtitle: subtitle.trim(),
          items: filtered.map(i => ({
            title: i.title.trim(),
            desc: (i.desc || '').trim(),
            icon: i.icon || ''
          }))
        }
      }

      const updates = [
        supabase.from('app_settings').update({ value: maintenance.toString() }).eq('key', 'maintenance_mode'),
        supabase.from('app_settings').update({ value: appVersion }).eq('key', 'app_version')
      ]
      await supabase.from('announcements').update({ is_active: false }).neq('id', 0)
      const updateEs = buildUpdate(updateId, updateTitleES, updateSubtitleES, updateItemsES)
      const updateEn = buildUpdate(updateId, updateTitleEN, updateSubtitleEN, updateItemsEN) || updateEs
      const hasAnnouncement = bannerTextES.trim().length > 0 || updateEs
      if (hasAnnouncement) {
        const finalMessage = JSON.stringify({
          es: { banner: bannerTextES.trim(), update: updateEs },
          en: { banner: (bannerTextEN || bannerTextES).trim(), update: updateEn }
        })
        updates.push(supabase.from('announcements').insert([{ message: finalMessage, is_active: true }]))
      }
      await Promise.all(updates)
      setMessage({ type: 'success', text: 'Sincronización global completada.' })
      setTimeout(() => setMessage(null), 3000)
    } catch {
      setMessage({ type: 'error', text: 'Error en la sincronización' })
    } finally { setLoading(false) }
  }

  const clearAnnouncement = () => {
    setBannerTextES('')
    setBannerTextEN('')
    setUpdateId('')
    setUpdateTitleES('')
    setUpdateSubtitleES('')
    setUpdateItemsES([])
    setUpdateTitleEN('')
    setUpdateSubtitleEN('')
    setUpdateItemsEN([])
  }

  const UPDATE_ICON_OPTIONS = [
    { id: 'sparkles', icon: Sparkles },
    { id: 'shield', icon: ShieldCheck },
    { id: 'flame', icon: Flame },
    { id: 'star', icon: Star },
    { id: 'bell', icon: Bell },
    { id: 'list', icon: ListChecks },
    { id: 'clock', icon: Clock },
    { id: 'heart', icon: Heart },
    { id: 'wand', icon: Wand2 }
  ]

  const addUpdateItem = (setItems) => {
    setItems(prev => [...prev, { title: '', desc: '', icon: 'sparkles' }])
  }

  const updateItemField = (setItems, index, field, value) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const removeUpdateItem = (setItems, index) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const toggleBlockUser = async (userId, blocked) => {
    await supabase.rpc('set_user_blocked', { p_user_id: userId, p_blocked: blocked })
    fetchAdminData()
  }

  const deleteUserData = async (userId) => {
    if (!confirm('¿Eliminar datos del usuario?')) return
    await supabase.rpc('delete_user_data', { p_user_id: userId })
    fetchAdminData()
  }

  const deleteUser = async (userId) => {
    if (!confirm('¿Eliminar usuario y todos sus datos?')) return
    await supabase.functions.invoke('admin-users', { body: { action: 'delete_user', user_id: userId } })
    fetchAdminData()
  }

  const saveMaintenanceMessage = async () => {
    await supabase.from('app_settings_text').upsert({ key: 'maintenance_message', value: maintenanceMessage })
    setMessage({ type: 'success', text: 'Mensaje de mantenimiento guardado.' })
    setTimeout(() => setMessage(null), 3000)
  }

  const updateFeedbackStatus = async (id, status) => {
    await supabase.from('feedback_reports').update({ status }).eq('id', id)
    fetchAdminData()
  }

  const deleteFeedbackReport = async (id) => {
    if (!confirm('¿Eliminar este reporte?')) return
    await supabase.from('feedback_reports').delete().eq('id', id)
    fetchAdminData()
  }

  const addWhitelistEmail = async () => {
    if (!whitelistInput.trim()) return
    await supabase.from('maintenance_whitelist').insert({ email: whitelistInput.trim() })
    setWhitelistInput('')
    fetchAdminData()
  }

  const removeWhitelistEmail = async (email) => {
    await supabase.from('maintenance_whitelist').delete().eq('email', email)
    fetchAdminData()
  }

  const sendNotificationNow = async () => {
    if (!notifyNow.title.trim() || !notifyNow.body.trim()) return

    // Construir payload limpio — sin language vacío ni target_email (que la Edge Function no entiende)
    const payload = {
      title: notifyNow.title.trim(),
      body:  notifyNow.body.trim(),
      ...(notifyNow.url?.trim()         && { url: notifyNow.url.trim() }),
      ...(notifyNow.min_version?.trim() && { min_version: notifyNow.min_version.trim() }),
      ...(notifyNow.max_version?.trim() && { max_version: notifyNow.max_version.trim() }),
      // Solo filtrar por idioma si se especificó explícitamente (evita excluir suscripciones sin language)
      ...(notifyNow.language?.trim()    && { language: notifyNow.language.trim() }),
    }

    // Si hay target_email, buscar el user_id correspondiente
    if (notifyNow.target_email?.trim()) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_id')
        .ilike('email', notifyNow.target_email.trim())
        .single()

      if (!profile?.user_id) {
        setMessage({ type: 'error', text: `Usuario no encontrado: ${notifyNow.target_email}` })
        setTimeout(() => setMessage(null), 4000)
        return
      }
      payload.user_ids = [profile.user_id]
    }

    const { error } = await supabase.functions.invoke('push-notification', { body: payload })
    if (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` })
      setTimeout(() => setMessage(null), 6000)
      // Relanzar para que TheLab muestre el estado de error en el botón
      throw new Error(error.message)
    }
    setMessage({ type: 'success', text: payload.user_ids ? 'Notificación enviada al usuario.' : 'Broadcast enviado.' })
    setTimeout(() => setMessage(null), 4000)
  }

  const scheduleNotification = async () => {
    if (!notifySchedule.title.trim() || !notifySchedule.body.trim() || !notifySchedule.send_at) return
    await supabase.from('scheduled_notifications').insert({
      title: notifySchedule.title,
      body: notifySchedule.body,
      language: notifySchedule.language,
      send_at: notifySchedule.send_at,
      url: notifySchedule.url || null
    })
    setMessage({ type: 'success', text: 'Notificación programada.' })
    setTimeout(() => setMessage(null), 3000)
  }

  // ── Nuevas funciones Control Tower v3.0 ───────────────────────────────────

  const logAdminAction = async (action, targetId, metadata = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('admin_actions_log').insert({
        admin_email: user?.email ?? 'unknown',
        action,
        target_id: String(targetId),
        metadata
      })
    } catch {
      // log silencioso — no interrumpe el flujo principal
    }
  }

  const forcePro = async (userId, active) => {
    await supabase.rpc('admin_force_pro', { p_target_user_id: userId, p_active: active })
    await logAdminAction('force_pro', userId, { active })
    setMessage({ type: 'success', text: `Plan ${active ? 'Pro activado' : 'revertido a Free'}.` })
    setTimeout(() => setMessage(null), 3000)
    fetchAdminData()
  }

  const pingSupabase = async () => {
    const start = Date.now()
    await supabase.from('app_settings').select('key').limit(1)
    return Date.now() - start
  }

  return (
    <AdminDashboard
      version={version}
      appVersion={appVersion}
      setAppVersion={setAppVersion}
      onClose={onClose}
      stats={stats}
      users={users}
      habitStats={habitStats}
      appMetrics={appMetrics}
      maintenance={maintenance}
      maintenanceMessage={maintenanceMessage}
      whitelist={whitelist}
      whitelistInput={whitelistInput}
      feedbackReports={feedbackReports}
      notifyNow={notifyNow}
      notifySchedule={notifySchedule}
      loading={loading}
      message={message}
      setMaintenance={setMaintenance}
      setMaintenanceMessage={setMaintenanceMessage}
      setWhitelistInput={setWhitelistInput}
      setNotifyNow={setNotifyNow}
      setNotifySchedule={setNotifySchedule}
      onSave={handleUpdateSettings}
      onSendNotification={sendNotificationNow}
      onScheduleNotification={scheduleNotification}
      onToggleBlockUser={toggleBlockUser}
      onDeleteUserData={deleteUserData}
      onDeleteUser={deleteUser}
      onSaveMaintenanceMessage={saveMaintenanceMessage}
      onAddWhitelist={addWhitelistEmail}
      onRemoveWhitelist={removeWhitelistEmail}
      onUpdateFeedback={updateFeedbackStatus}
      onDeleteFeedback={deleteFeedbackReport}
      onForcePro={forcePro}
      onLogAction={logAdminAction}
      onPingSupabase={pingSupabase}
      bannerTextES={bannerTextES} setBannerTextES={setBannerTextES}
      bannerTextEN={bannerTextEN} setBannerTextEN={setBannerTextEN}
      updateId={updateId} setUpdateId={setUpdateId}
      updateTitleES={updateTitleES} setUpdateTitleES={setUpdateTitleES}
      updateSubtitleES={updateSubtitleES} setUpdateSubtitleES={setUpdateSubtitleES}
      updateItemsES={updateItemsES} setUpdateItemsES={setUpdateItemsES}
      updateTitleEN={updateTitleEN} setUpdateTitleEN={setUpdateTitleEN}
      updateSubtitleEN={updateSubtitleEN} setUpdateSubtitleEN={setUpdateSubtitleEN}
      updateItemsEN={updateItemsEN} setUpdateItemsEN={setUpdateItemsEN}
      onClearAnnouncement={clearAnnouncement}
      UPDATE_ICON_OPTIONS={UPDATE_ICON_OPTIONS}
      addUpdateItem={addUpdateItem}
      updateItemField={updateItemField}
      removeUpdateItem={removeUpdateItem}
    />
  )
}
