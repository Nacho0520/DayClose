import { useState, useEffect } from 'react'
import { Megaphone } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'

export default function TopBanner() {
  const [message, setMessage] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 1. Carga inicial del anuncio
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

    // 2. Escucha en tiempo real
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
          initial={{ y: -50, opacity: 0, x: '-50%' }} // x: -50% es para centrarlo perfectamente
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: -50, opacity: 0, x: '-50%' }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          // Posición 'fixed' en 'top-6' (misma altura que el botón sidebar) y centrado
          // z-40 para que esté por debajo del sidebar (z-50) pero sobre el contenido
          className="fixed top-6 left-1/2 z-40 w-auto max-w-[65%] md:max-w-md pointer-events-none"
        >
          {/* Contenedor visual estilo 'Pill' de Apple */}
          <div className="flex items-center gap-3 bg-indigo-600/95 backdrop-blur-xl px-5 py-3 rounded-full shadow-[0_8px_30px_rgba(79,70,229,0.4)] border border-white/10 pointer-events-auto">
            <div className="p-1.5 bg-white/20 rounded-full animate-pulse shrink-0">
              <Megaphone size={14} className="text-white" />
            </div>
            <p className="text-xs font-bold text-white tracking-wide uppercase leading-none truncate">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}