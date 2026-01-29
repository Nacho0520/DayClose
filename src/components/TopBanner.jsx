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
          // CAMBIO VISUAL: Ancho flexible hasta un máximo amplio (max-w-4xl) para ser largo horizontalmente
          className="fixed top-6 left-1/2 z-40 w-auto max-w-[90%] md:max-w-4xl pointer-events-none"
        >
          <div className="flex items-center gap-4 bg-neutral-900/90 backdrop-blur-xl pl-5 pr-8 py-3 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/5 pointer-events-auto">
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