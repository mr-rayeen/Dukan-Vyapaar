import React from 'react';
import { ShopSettings } from '../../types';
import { Wifi, WifiOff, Download, Smartphone, Sun, Moon, Settings } from 'lucide-react';
import { AppLogo } from '../common/AppLogo';

interface MobileHeaderProps {
  settings: ShopSettings;
  isOnline: boolean;
  lang: 'hi' | 'en';
  onToggleLang: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenInstall: () => void;
  isDesktopFrame: boolean;
  onToggleDesktopFrame: () => void;
  onOpenSettings: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  settings,
  isOnline,
  lang,
  onToggleLang,
  isDarkMode,
  onToggleDarkMode,
  onOpenInstall,
  isDesktopFrame,
  onToggleDesktopFrame,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 px-3.5 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-2">
        {/* Left: App Logo + Shop Branding (Tap to open shop settings) */}
        <div
          onClick={onOpenSettings}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group select-none"
          title="Click to view/edit Shop Profile & Settings"
          role="button"
          tabIndex={0}
        >
          <AppLogo size={36} className="shrink-0 transition-transform group-hover:scale-105" />

          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-white truncate tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                {settings.shopName || 'Vyapar Box'}
              </h1>
              {/* Minimalist Live Sync Indicator Dot */}
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
                }`}
                title={isOnline ? 'Online Sync Active' : 'Offline Mode Active'}
              />
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
              <span className="truncate max-w-[110px] xs:max-w-[150px]">
                {settings.tagline || settings.phone || 'Box & Ladi Billing'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: Clean, Minimalist Icon Bar */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Offline badge when disconnected */}
          {!isOnline && (
            <div
              className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              title="Working offline"
            >
              <WifiOff className="w-3 h-3" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95 transition-all"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Language Toggle (Subtle Minimalist Badge) */}
          <button
            type="button"
            onClick={onToggleLang}
            className="h-8 px-2 flex items-center justify-center rounded-lg text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95 transition-all"
            title="Switch Language (हिन्दी / English)"
          >
            {lang === 'hi' ? 'EN' : 'हिन्दी'}
          </button>

          {/* Install Mobile PWA / APK App Button */}
          <button
            type="button"
            onClick={onOpenInstall}
            className="h-8 px-2.5 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg shadow-xs active:scale-95 transition-all"
            title="Download & Install Mobile APK"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px]">{lang === 'hi' ? 'APK ऐप' : 'APK / App'}</span>
          </button>

          {/* Desktop Simulator Toggle (Hidden on small mobile screens) */}
          <button
            type="button"
            onClick={onToggleDesktopFrame}
            className={`w-8 h-8 rounded-lg text-xs transition-all hidden md:flex items-center justify-center ${
              isDesktopFrame
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Phone Frame Simulator"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Quick Settings Icon */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            title="Shop Profile & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

