import { motion, AnimatePresence } from 'framer-motion';
import { Home, BarChart3, LayoutGrid } from 'lucide-react';

export default function Dock({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Inicio' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
    { id: 'apps', icon: LayoutGrid, label: 'Más' },
  ];

  return (
    // "bottom-6 left-4 right-4": Crea el margen para el efecto flotante
    // "max-w-md mx-auto": Evita que se estire demasiado en pantallas grandes
    <div className="fixed bottom-6 left-4 right-4 z-40 flex justify-center pointer-events-none">
      <motion.nav 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md flex items-center justify-around bg-neutral-800/80 backdrop-blur-2xl py-4 rounded-[2.5rem] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center flex-1 py-1 active:scale-90 transition-transform"
            >
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-300 ${
                  isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-neutral-500'
                }`} 
              />
              <AnimatePresence>
                {isActive && (
                  <motion.div 
                    layoutId="dock-dot"
                    className="absolute -bottom-1.5 h-1 w-1 bg-white rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  />
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}