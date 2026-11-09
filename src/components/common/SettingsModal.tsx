import React, { useState, useRef } from 'react';
import {
  Bill,
  Expense,
  Product,
  ShopSettings,
  StockMovement,
  SupplierPurchase,
} from '../../types';
import {
  AppBackupPayload,
  createBackupPayload,
  parseAndValidateBackupJson,
} from '../../utils/storage';
import { showToast } from './ToastProvider';
import {
  X,
  Store,
  Save,
  RotateCcw,
  Download,
  Upload,
  FileJson,
  ReceiptText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface SettingsModalProps {
  settings: ShopSettings;
  products?: Product[];
  bills?: Bill[];
  purchases?: SupplierPurchase[];
  expenses?: Expense[];
  movements?: StockMovement[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: ShopSettings) => void;
  onRestoreBackup?: (backup: AppBackupPayload) => void;
  onResetDemoData: () => void;
  lang: 'hi' | 'en';
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  products = [],
  bills = [],
  purchases = [],
  expenses = [],
  movements = [],
  isOpen,
  onClose,
  onSave,
  onRestoreBackup,
  onResetDemoData,
  lang,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<{
    fileName: string;
    payload: AppBackupPayload;
  } | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setFormData({ ...settings });
      setShowResetConfirm(false);
      setPendingBackup(null);
      setBackupError(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // Trigger browser download of JSON backup file
  const handleDownloadBackup = (backupType: 'full' | 'bills_only') => {
    try {
      setBackupError(null);
      const payload = createBackupPayload(
        {
          settings: formData,
          products,
          bills,
          purchases,
          expenses,
          movements,
        },
        backupType
      );

      const jsonString = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const dateStamp = new Date().toISOString().split('T')[0];
      const safeShop = (formData.shopName || 'Dukan-Vyapaar')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 28);

      const fileName =
        backupType === 'bills_only'
          ? `${safeShop}-All-Bills-Backup-${dateStamp}.json`
          : `${safeShop}-Full-Backup-${dateStamp}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);

      showToast({
        type: 'success',
        title:
          backupType === 'bills_only'
            ? lang === 'hi'
              ? 'सभी बिलों का बैकअप डाउनलोड हो गया!'
              : 'All Bills Backup Downloaded!'
            : lang === 'hi'
            ? 'पूरा दुकान बैकअप डाउनलोड हो गया!'
            : 'Full Shop Backup Downloaded!',
        message:
          backupType === 'bills_only'
            ? `${bills.length} Sale Bills + ${purchases.length} Purchase Bills (${fileName})`
            : `${products.length} Items, ${bills.length} Sale Bills, ${purchases.length} Purchase Bills, ${expenses.length} Expenses`,
      });
    } catch (err: any) {
      const msg = err?.message || 'Could not generate backup file.';
      setBackupError(msg);
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'बैकअप डाउनलोड फेल हुआ' : 'Backup Download Failed',
        message: msg,
      });
    }
  };

  // Handle JSON Backup File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setBackupError(null);
    const reader = new FileReader();
    reader.onerror = () => {
      const msg =
        lang === 'hi'
          ? 'फाइल पढ़ने में समस्या आई। कृपया सही JSON फाइल चुनें।'
          : 'Could not read the selected file.';
      setBackupError(msg);
      showToast({
        type: 'error',
        title: lang === 'hi' ? 'फाइल रीड एरर' : 'File Read Error',
        message: msg,
      });
    };

    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || '');
        const validated = parseAndValidateBackupJson(text);
        setPendingBackup({
          fileName: file.name,
          payload: validated,
        });
        showToast({
          type: 'info',
          title:
            lang === 'hi'
              ? 'बैकअप फाइल तैयार है — नीचे पुष्टि करें'
              : 'Backup File Verified — Confirm Restore Below',
          message: file.name,
        });
      } catch (err: any) {
        const msg = err?.message || 'Invalid backup file';
        setBackupError(msg);
        setPendingBackup(null);
        showToast({
          type: 'error',
          title: lang === 'hi' ? 'गलत बैकअप फाइल!' : 'Invalid Backup File',
          message: msg,
        });
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!pendingBackup || !onRestoreBackup) return;
    onRestoreBackup(pendingBackup.payload);
    setPendingBackup(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-200" />
            <h3 className="font-extrabold text-base">
              {lang === 'hi' ? 'दुकान प्रोफाइल व डेटा बैकअप' : 'Shop Profile & Data Backup'}
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
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto text-xs flex-1">
          {/* Hidden JSON File Input for Restore */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* DATA BACKUP & RESTORE SECTION (For Phone Change / Safety) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50/70 to-emerald-50/50 dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-800 border-2 border-blue-200/80 dark:border-blue-800/60 space-y-3 shadow-2xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileJson className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-xs text-slate-900 dark:text-white">
                    {lang === 'hi'
                      ? 'डेटा बैकअप व रीस्टोर (JSON Backup)'
                      : 'Data Backup & Restore (JSON)'}
                  </h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                    {lang === 'hi'
                      ? 'फोन बदलने पर स्टॉक, सारे बिल, उधार और खर्च सुरक्षित रखें'
                      : 'Keep all products, bills, udhar & expenses safe when changing phones'}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Stored Data Counts */}
            <div className="grid grid-cols-4 gap-1.5 text-center bg-white/90 dark:bg-slate-900/90 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">
                  {lang === 'hi' ? 'आइटम' : 'Items'}
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-white">
                  {products.length}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                  {lang === 'hi' ? 'बिक्री बिल' : 'Sale Bills'}
                </span>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                  {bills.length}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 block uppercase">
                  {lang === 'hi' ? 'खरीद बिल' : 'Pur. Bills'}
                </span>
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-400">
                  {purchases.length}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 block uppercase">
                  {lang === 'hi' ? 'खर्च' : 'Expenses'}
                </span>
                <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                  {expenses.length}
                </span>
              </div>
            </div>

            {/* Backup Error Message if any */}
            {backupError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-700 rounded-xl text-rose-800 dark:text-rose-200 text-[11px] font-bold flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{backupError}</span>
              </div>
            )}

            {/* Pending Restore Confirmation Box */}
            {pendingBackup ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border-2 border-emerald-500 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-black text-emerald-950 dark:text-emerald-100 block truncate">
                      {pendingBackup.fileName}
                    </span>
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block mt-0.5 font-semibold">
                      {pendingBackup.payload.backupType === 'bills_only'
                        ? lang === 'hi'
                          ? `बिलों का बैकअप: ${pendingBackup.payload.bills?.length || 0} बिक्री बिल, ${pendingBackup.payload.purchases?.length || 0} खरीद बिल`
                          : `Bills Backup: ${pendingBackup.payload.bills?.length || 0} Sale Bills, ${pendingBackup.payload.purchases?.length || 0} Purchase Bills`
                        : lang === 'hi'
                        ? `पूरा बैकअप: ${pendingBackup.payload.products?.length || 0} आइटम, ${pendingBackup.payload.bills?.length || 0} बिक्री बिल, ${pendingBackup.payload.purchases?.length || 0} खरीद बिल, ${pendingBackup.payload.expenses?.length || 0} खर्च`
                        : `Full Backup: ${pendingBackup.payload.products?.length || 0} Items, ${pendingBackup.payload.bills?.length || 0} Sale Bills, ${pendingBackup.payload.purchases?.length || 0} Pur. Bills, ${pendingBackup.payload.expenses?.length || 0} Expenses`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-[11px] rounded-lg shadow-xs transition flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'hi' ? 'हाँ, डेटा रीस्टोर करें' : 'Yes, Restore Data Now'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingBackup(null)}
                    className="py-2 px-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] rounded-lg transition"
                  >
                    {lang === 'hi' ? 'रद्द' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* 1. Download Full App Backup Button */}
                <button
                  type="button"
                  onClick={() => handleDownloadBackup('full')}
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {lang === 'hi'
                      ? 'पूरा डेटा बैकअप डाउनलोड करें (Full JSON)'
                      : 'Download Full Backup (All Data + Bills)'}
                  </span>
                </button>

                {/* 2. Download All Bills Backup Button & Upload Restore Button */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadBackup('bills_only')}
                    className="py-2 px-2.5 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 font-extrabold text-[11px] rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <ReceiptText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">
                      {lang === 'hi' ? 'सारे बिल बैकअप' : 'Backup All Bills'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-2.5 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 font-extrabold text-[11px] rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">
                      {lang === 'hi' ? 'बैकअप अपलोड करें' : 'Restore / Import'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

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
