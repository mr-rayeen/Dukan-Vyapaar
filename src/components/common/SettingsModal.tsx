import React, { useState } from 'react';
import { ShopSettings } from '../../types';
import { X, Store, Save, RotateCcw, Smartphone, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  settings: ShopSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: ShopSettings) => void;
  onResetDemoData: () => void;
  lang: 'hi' | 'en';
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSave,
  onResetDemoData,
  lang,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...settings });
      setShowResetConfirm(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-200" />
            <h3 className="font-extrabold text-base">
              {lang === 'hi' ? 'दुकान प्रोफाइल व सेटिंग' : 'Shop Profile & Settings'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-emerald-100 hover:text-white hover:bg-emerald-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto text-xs">
          {/* Theme Toggle in Settings */}
          {onToggleDarkMode && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {lang === 'hi' ? 'डार्क मोड (Dark Mode)' : 'Appearance / Dark Theme'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isDarkMode
                    ? (lang === 'hi' ? 'रात में दुकानदारी के लिए आसान थीम' : 'Night-friendly high contrast theme')
                    : (lang === 'hi' ? 'उजाला (Light) थीम सक्रिय है' : 'Light clean theme active')}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  isDarkMode ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          <div>
            <label className="text-slate-600 dark:text-slate-300 font-bold block mb-1">
              Shop Name (दुकान / फर्म का नाम)
            </label>
            <input
              type="text"
              required
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-600 dark:text-slate-300 font-bold block mb-1">
              Tagline / Business Type
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-600 dark:text-slate-300 font-bold block mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-600 dark:text-slate-300 font-bold block mb-1">GSTIN (Optional)</label>
              <input
                type="text"
                value={formData.gstNumber || ''}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-600 dark:text-slate-300 font-bold block mb-1">Address / Mandi Location</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-600 dark:text-slate-300 font-bold block mb-1">UPI ID for WhatsApp Payments</label>
            <input
              type="text"
              placeholder="e.g. mobile@upi"
              value={formData.upiId || ''}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            {showResetConfirm ? (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-xl flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-200">
                  {lang === 'hi' ? 'डेमो डेटा रीसेट करें?' : 'Reset to demo data?'}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onResetDemoData();
                      setShowResetConfirm(false);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] rounded-lg"
                  >
                    {lang === 'hi' ? 'हाँ, रीसेट' : 'Yes, Reset'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-lg"
                  >
                    {lang === 'hi' ? 'रद्द' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-600 dark:text-slate-400 font-semibold text-[11px] rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Store Products & Stock</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
