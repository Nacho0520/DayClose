import { useState, useEffect } from 'react'

function NoteModal({ isOpen, habitTitle, onSave, onSkip }) {
  const [note, setNote] = useState('')

  useEffect(() => {
    if (isOpen) {
      setNote('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    onSave?.(note.trim())
  }

  const handleSkip = () => {
    onSkip?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-700 p-6 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-white">
          ¿Qué pasó?
        </h2>
        {habitTitle && (
          <p className="mb-4 text-sm text-neutral-400">
            Hábito: <span className="font-medium text-neutral-100">{habitTitle}</span>
          </p>
        )}
        <textarea
          className="mb-4 h-32 w-full resize-none rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-neutral-400 focus:outline-none"
          placeholder="Escribe una nota rápida (opcional)..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm font-medium text-neutral-400 hover:text-neutral-200"
          >
            Omitir
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-200"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default NoteModal

