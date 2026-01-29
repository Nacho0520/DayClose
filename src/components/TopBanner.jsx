import { useState, useEffect } from 'react'
import { Megaphone } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'

export default function TopBanner() {
  const [message, setMessage] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
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
          // Animación de altura para que empuje el contenido suavemente al aparecer
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          // CAMBIO CLAVE: Quitamos 'fixed'. Ahora es un bloque flexible centrado.
          // pt-6: Margen superior para separarse del techo.
          // mb-2: Margen inferior para separarse del dashboard.
          className="w-full flex justify-center pt-6 mb-2 px-4 relative z-30"
        >
          {/* Mantenemos la estética 'Pill' de Apple pero estática en flujo */}
          <div className="flex items-center gap-4 bg-neutral-900/90 backdrop-blur-xl pl-5 pr-8 py-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/5 max-w-4xl mx-auto">
            <div className="p-1.5 bg-white/5 rounded-full shrink-0">
              <Megaphone size={14} className="text-neutral-400" />
            </div>
            
            <p className="text-xs font-medium text-neutral-200 tracking-wide leading-snug text-left min-w-[200px] md:min-w-[300px]">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}