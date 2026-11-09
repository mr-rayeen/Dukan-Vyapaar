import React from 'react';
import { motion } from 'motion/react';
import { Home, Receipt, Boxes, Camera, BarChart3 } from 'lucide-react';

export type TabKey = 'home' | 'billing' | 'inventory' | 'scan' | 'reports';

interface BottomNavigationProps {
  currentTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  cartCount: number;
  lowStockCount: number;
  lang: 'hi' | 'en';
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabChange,
  cartCount,
  lowStockCount,
  lang,
}) => {
  const tabs = [
    {
      key: 'home' as TabKey,
      icon: Home,
      labelEn: 'Home',
      labelHi: 'होम',
    },
    {
      key: 'billing' as TabKey,
      icon: Receipt,
      labelEn: 'Billing',
      labelHi: 'बिलिंग',
      badge: cartCount > 0 ? cartCount : undefined,
      badgeColor: 'bg-emerald-600',
    },
    {
      key: 'inventory' as TabKey,
      icon: Boxes,
      labelEn: 'Inventory',
      labelHi: 'स्टॉक',
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500',
    },
    {
      key: 'scan' as TabKey,
      icon: Camera,
      labelEn: 'Scan Bill',
      labelHi: 'पर्ची स्कैन',
      isSpecial: true,
    },
    {
      key: 'reports' as TabKey,
      icon: BarChart3,
      labelEn: 'Reports',
      labelHi: 'हिसाब',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 py-1 max-w-md mx-auto transition-colors duration-200">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          const Icon = tab.icon;

          if (tab.isSpecial) {
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange(tab.key)}
                className="relative -top-4 flex flex-col items-center group active:scale-95 transition-transform duration-200"
              >
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  animate={{ scale: isActive ? 1.08 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className={`w-13 h-13 rounded-full flex items-center justify-center text-white shadow-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-gradient-to-tr from-blue-700 to-indigo-600 ring-4 ring-blue-100 dark:ring-blue-900/50'
                      : 'bg-gradient-to-tr from-blue-600 to-indigo-500 group-hover:scale-105'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
                <span
                  className={`text-[10px] font-bold mt-1 tracking-tight transition-colors duration-200 ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-400 font-extrabold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {lang === 'hi' ? tab.labelHi : tab.labelEn}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center relative transition-colors duration-200 active:scale-95 ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full ${tab.badgeColor} text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs animate-in zoom-in`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight transition-all duration-200 ${
                  isActive ? 'font-extrabold' : 'font-medium'
                }`}
              >
                {lang === 'hi' ? tab.labelHi : tab.labelEn}
              </span>
              {isActive && (
                <motion.span
                  layoutId="activeBottomTabIndicator"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  className="w-5 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full mt-0.5"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

