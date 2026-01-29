import { motion } from 'framer-motion';
import { Home, BarChart3, LayoutGrid } from 'lucide-react';

export default function Dock({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Inicio' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
    { id: 'apps', icon: LayoutGrid, label: 'Más' },
  ];

  return (
    <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-8 bg-neutral-900/70 backdrop-blur-2xl px-8 py-4 rounded-[2.5rem] border border-white/5 shadow-2xl pointer-events-auto"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center group"
            >
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-300 ${
                  isActive ? 'text-white scale-110' : 'text-neutral-500 group-hover:text-neutral-300'
                }`} 
              />
              {isActive && (
                <motion.div 
                  layoutId="dock-dot"
                  className="absolute -bottom-2 h-1 w-1 bg-white rounded-full"
                />
              )}
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}