import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bug, Wand2, X, Image as ImageIcon, MessageSquarePlus, Zap } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../lib/supabaseClient'

const MotionDiv = motion.div

export default function FeedbackSection({ user }) {
  const { t } = useLanguage()
  const [isOpen,            setIsOpen]            = useState(false)
  const [type,              setType]              = useState('bug')
  const [title,             setTitle]             = useState('')
  const [message,           setMessage]           = useState('')
  const [screenshotFile,    setScreenshotFile]    = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState('')
  const [status,            setStatus]            = useState('idle')
  const [error,             setError]             = useState('')

  // ── Portal — sin tocar ────────────────────────────────────────────────────
  const renderPortal = (node) => {
    if (typeof document === 'undefined') return null
    return createPortal(node, document.body)
  }

  // ── Lógica de envío — sin tocar ───────────────────────────────────────────
  const handleSubmit = async () => {
    if (!message.trim() || !user?.id) return
    setStatus('loading')
    setError('')
    try {
      let screenshotUrl = null
      if (screenshotFile) {
        if (screenshotFile.size > 3 * 1024 * 1024) {
          setError(t('feedback_screenshot_too_large'))
          setStatus('idle')
          return
        }
        const ext  = screenshotFile.name.split('.').pop() || 'png'
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('feedback')
          .upload(path, screenshotFile, { upsert: true, contentType: screenshotFile.type })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('feedback').getPublicUrl(path)
        screenshotUrl = data?.publicUrl || null
      }

      const payload = {
        user_id:        user.id,
        type,
        title:          title.trim() || null,
        message:        message.trim(),
        screenshot_url: screenshotUrl,
      }
      const { error: insertError } = await supabase.from('feedback_reports').insert([payload])
      if (insertError) throw insertError

      try {
        const { data: admins } = await supabase.rpc('get_admin_user_ids')
        const adminIds = (admins || []).map(row => row.user_id).filter(Boolean)
        if (adminIds.length > 0) {
          await supabase.functions.invoke('push-notification', {
            body: {
              title:    t('feedback_push_title'),
              body:     t('feedback_push_body'),
              url:      'https://dayclose.vercel.app',
              user_ids: adminIds,
            },
          })
        }
      } catch {
        // silencia errores de notificación al admin — no críticos
      }

      setStatus('success')
      setTitle('')
      setMessage('')
      setScreenshotFile(null)
      setScreenshotPreview('')
      setTimeout(() => { setIsOpen(false); setStatus('idle') }, 1200)
    } catch (err) {
      console.error('[FeedbackSection] Error enviando reporte:', err?.message)
      setError(err?.message || t('feedback_error'))
      setStatus('idle')
    }
  }

  return (
    <div className="bg-neutral-800/20 rounded-[2.5rem] border border-white/5 p-6 shadow-xl relative overflow-hidden mb-6 text-left">

      {/* ── Cabecera Maestra ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquarePlus size={18} className="text-white" />
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
            {t('feedback_title')}
          </h2>
        </div>
        {/* Botón de acción rápida a la derecha del header */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-neutral-700/30 border-white/10 text-neutral-300 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          {t('feedback_action')}
        </button>
      </div>

      {/* ── Descripción debajo del header ────────────────────────── */}
      <p className="text-[11px] text-neutral-500 font-medium leading-relaxed">
        {t('feedback_desc')}
      </p>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: Formulario de reporte — lógica sin tocar
      ══════════════════════════════════════════════════════════════ */}
      {renderPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="feedback-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setIsOpen(false)}
            >
              <MotionDiv
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{   opacity: 0, y: 8,   scale: 0.97 }}
                transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                className="w-full max-w-md bg-neutral-900 rounded-[2rem] p-5 shadow-2xl border border-white/5"
                onClick={e => e.stopPropagation()}
              >
                {/* Cabecera del modal */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-black text-white">{t('feedback_modal_title')}</h3>
                    <p className="text-[11px] text-neutral-500">{t('feedback_modal_subtitle')}</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-9 w-9 rounded-full border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Error banner */}
                {error && (
                  <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                    {error}
                  </div>
                )}

                {/* Tipo de reporte */}
                <div className="flex gap-2 mb-3">
                  {[
                    { id: 'bug',  Icon: Bug,   label: t('feedback_type_bug')  },
                    { id: 'idea', Icon: Wand2, label: t('feedback_type_idea') },
                  ].map(({ id, Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setType(id)}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold border transition-all active:scale-95 ${
                        type === id
                          ? 'bg-white text-black border-white'
                          : 'bg-white/5 text-neutral-300 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>

                {/* Campos */}
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t('feedback_title_placeholder')}
                  className="w-full rounded-xl bg-neutral-950 border border-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 mb-3"
                />
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t('feedback_message_placeholder')}
                  className="w-full h-28 rounded-xl bg-neutral-950 border border-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 resize-none"
                />

                {/* Adjuntar captura */}
                <div className="mt-3 flex items-center gap-3">
                  <label className="flex items-center gap-2 text-[11px] text-neutral-300 bg-white/5 border border-white/10 px-3 py-2 rounded-full cursor-pointer hover:bg-white/10 transition-colors">
                    <ImageIcon size={14} />
                    {t('feedback_attach')}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setScreenshotFile(file)
                        setScreenshotPreview(URL.createObjectURL(file))
                      }}
                    />
                  </label>
                  {screenshotPreview && (
                    <div className="h-10 w-10 rounded-xl overflow-hidden border border-white/10">
                      <img src={screenshotPreview} alt="preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Acciones del modal */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-xs text-neutral-400 px-3 py-2 rounded-full border border-white/10 hover:text-white transition-colors"
                  >
                    {t('feedback_cancel')}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={status === 'loading' || !message.trim()}
                    className="text-xs text-black bg-white px-4 py-2 rounded-full font-black disabled:opacity-40 active:scale-95 transition-all"
                  >
                    {status === 'success' ? `✓ ${t('feedback_sent')}` : t('feedback_submit')}
                  </button>
                </div>
              </MotionDiv>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}