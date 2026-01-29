import { useState, useEffect } from 'react'
import { Megaphone } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion' // Añadido para animaciones suaves

export default function TopBanner() {
  const [message, setMessage] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Función para obtener el mensaje
    const fetchAnnouncement = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('message')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data && data.message) {
        setMessage(data.message)
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    fetchAnnouncement()

    // ESCUCHA EN TIEMPO REAL: Si actualizas desde el admin, cambia al instante en todos los usuarios
    const channel = supabase
      .channel('public:announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        fetchAnnouncement()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <AnimatePresence>
      {isVisible && message && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative z-50 overflow-hidden"
        >
          {/* Diseño estilo 'Glass' integrado con la App */}
          <div className="bg-indigo-500/10 backdrop-blur-md border-b border-indigo-500/20 text-indigo-200">
            <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-center text-center gap-3">
              <div className="p-1 bg-indigo-500/20 rounded-full animate-pulse">
                <Megaphone size={14} className="text-indigo-400" />
              </div>
              <p className="text-xs font-bold tracking-wide uppercase leading-tight text-indigo-100">
                {message}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}