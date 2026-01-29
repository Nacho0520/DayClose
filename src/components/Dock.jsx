import { motion, AnimatePresence } from 'framer-motion';
import { Home, BarChart3, LayoutGrid } from 'lucide-react';

export default function Dock({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Inicio' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
    { id: 'apps', icon: LayoutGrid, label: 'Más' },
  ];

  return (
    // z-40 para quedar por debajo del Sidebar (z-50+)
    // pb-8 para dar margen extra en dispositivos con notch inferior (iPhone)
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <motion.nav 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full flex items-center justify-around bg-neutral-900/80 backdrop-blur-3xl pt-4 pb-8 border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pointer-events-auto"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center flex-1 py-2 active:scale-90 transition-transform"
            >
              <Icon 
                size={26} 
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-300 ${
                  isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-neutral-500'
                }`} 
              />
              {isActive && (
                <motion.div 
                  layoutId="dock-dot"
                  className="absolute -bottom-1 h-1 w-1 bg-white rounded-full"
                />
              )}
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}