import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastPayload {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastItem extends ToastPayload {
  id: string;
}

type ToastListener = (payload: ToastPayload) => void;
const listeners = new Set<ToastListener>();

/**
 * Global imperative helper to trigger a toast notification from anywhere in the app
 * (components, CRUD handlers, storage utilities, or global error handlers).
 */
export function showToast(payload: ToastPayload) {
  listeners.forEach((listener) => listener(payload));
}

interface ToastContextValue {
  notify: (payload: ToastPayload) => void;
}

const ToastContext = createContext<ToastContextValue>({
  notify: showToast,
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode; lang?: 'hi' | 'en' }> = ({
  children,
  lang = 'en',
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (payload: ToastPayload) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = payload.duration ?? (payload.type === 'error' ? 5000 : 3200);
      setToasts((prev) => [{ ...payload, id }, ...prev.slice(0, 2)]);

      if (duration > 0) {
        window.setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  useEffect(() => {
    listeners.add(addToast);
    return () => {
      listeners.delete(addToast);
    };
  }, [addToast]);

  // Global uncaught error & unhandled promise rejection listeners
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      // Ignore benign ResizeObserver or WebSocket HMR warnings in preview
      const msg = event.message || '';
      if (
        msg.includes('ResizeObserver') ||
        msg.includes('WebSocket') ||
        msg.includes('vite')
      ) {
        return;
      }
      addToast({
        type: 'error',
        title: lang === 'hi' ? 'सिस्टम एरर (Unexpected Error)' : 'Unexpected Error Detected',
        message: msg || (lang === 'hi' ? 'कोई अनपेक्षित तकनीकी समस्या आई।' : 'An unexpected runtime issue occurred.'),
        duration: 5500,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonMsg =
        event.reason?.message ||
        (typeof event.reason === 'string' ? event.reason : '');
      if (
        !reasonMsg ||
        reasonMsg.includes('WebSocket') ||
        reasonMsg.includes('vite') ||
        reasonMsg.includes('AbortError')
      ) {
        return;
      }
      addToast({
        type: 'error',
        title: lang === 'hi' ? 'प्रोसेस फेल हुआ (Operation Error)' : 'Operation Failed',
        message: reasonMsg,
        duration: 5500,
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addToast, lang]);

  return (
    <ToastContext.Provider value={{ notify: addToast }}>
      {children}

      {/* Floating Notification Container */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-3 pointer-events-none flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const styleConfig = {
              success: {
                bg: 'bg-emerald-950/95 dark:bg-emerald-950/95 border-emerald-500/80 text-white',
                iconBg: 'bg-emerald-500/20 text-emerald-400',
                Icon: CheckCircle2,
              },
              error: {
                bg: 'bg-rose-950/95 dark:bg-rose-950/95 border-rose-500/80 text-white',
                iconBg: 'bg-rose-500/20 text-rose-400',
                Icon: AlertOctagon,
              },
              warning: {
                bg: 'bg-amber-950/95 dark:bg-amber-950/95 border-amber-500/80 text-white',
                iconBg: 'bg-amber-500/20 text-amber-400',
                Icon: AlertTriangle,
              },
              info: {
                bg: 'bg-slate-900/95 dark:bg-slate-800/95 border-blue-500/80 text-white',
                iconBg: 'bg-blue-500/20 text-blue-400',
                Icon: Info,
              },
            }[t.type];

            const IconComp = styleConfig.Icon;

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className={`pointer-events-auto rounded-2xl border px-3.5 py-2.5 shadow-2xl backdrop-blur-md flex items-start gap-2.5 ${styleConfig.bg}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${styleConfig.iconBg}`}
                >
                  <IconComp className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black tracking-tight leading-snug">
                    {t.title}
                  </p>
                  {t.message && (
                    <p className="text-[11px] font-medium text-slate-200/90 mt-0.5 leading-snug break-words">
                      {t.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
