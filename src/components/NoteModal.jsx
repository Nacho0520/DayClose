import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

function NoteModal({ isOpen, habitTitle, onSave, onSkip }) {
  const [note, setNote] = useState('')
  const { t } = useLanguage()

  useEffect(() => {
    if (isOpen) setNote('')
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-700 p-6 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-white">{t('what_happened')}</h2>
        {habitTitle && (
          <p className="mb-4 text-sm text-neutral-400">
            {t('habit_label')} <span className="font-medium text-neutral-100">{habitTitle}</span>
          </p>
        )}
        <textarea
          className="mb-4 h-32 w-full resize-none rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-neutral-400 focus:outline-none"
          placeholder={t('note_placeholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => onSkip?.()} className="text-sm font-medium text-neutral-400 hover:text-neutral-200">
            {t('skip')}
          </button>
          <button type="button" onClick={() => onSave?.(note.trim())} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-200">
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NoteModal