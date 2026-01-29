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
          initial={{ y: -50, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: -50, opacity: 0, x: '-50%' }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          // Ajuste de posición: top-6 para alinear con el botón menú
          // max-w-[85%] permite que en móviles crezca si hay mucho texto
          className="fixed top-6 left-1/2 z-40 w-auto max-w-[85%] md:max-w-md pointer-events-none"
        >
          {/* ESTILO VISUAL ACTUALIZADO:
             - bg-neutral-900/80: Fondo oscuro sutil (menos llamativo)
             - backdrop-blur-xl: Efecto cristal premium
             - border-white/10: Borde apenas visible para separar del fondo
          */}
          <div className="flex items-center gap-3 bg-neutral-900/80 backdrop-blur-xl pl-4 pr-5 py-3 rounded-[2rem] shadow-2xl border border-white/5 pointer-events-auto">
            
            {/* Icono sutil */}
            <div className="p-1.5 bg-white/5 rounded-full shrink-0">
              <Megaphone size={14} className="text-neutral-400" />
            </div>
            
            {/* Texto adaptable: quitamos 'truncate' y 'leading-none' */}
            <p className="text-xs font-medium text-neutral-200 tracking-wide leading-snug break-words text-left">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}