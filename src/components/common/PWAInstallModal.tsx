import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  Download,
  Smartphone,
  CheckCircle,
  Share2,
  PlusSquare,
  X,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  FileDown,
  AlertCircle,
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'hi' | 'en';
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  lang = 'hi',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);
  const [copiedType, setCopiedType] = useState<'dev' | 'pre' | null>(null);
  const [activeTab, setActiveTab] = useState<'webapk' | 'apkfile'>('webapk');
  const [downloadingLauncher, setDownloadingLauncher] = useState(false);

  if (!isOpen) return null;

  // Current active origin (works immediately in logged-in session)
  const currentOrigin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-dev-keszuztslacjj6fe73osqn-933720006345.asia-east1.run.app';

  const devUrl = currentOrigin.includes('ais-pre-')
    ? currentOrigin.replace('ais-pre-', 'ais-dev-')
    : currentOrigin;

  const publicShareUrl = currentOrigin.includes('ais-dev-')
    ? currentOrigin.replace('ais-dev-', 'ais-pre-')
    : 'https://ais-pre-keszuztslacjj6fe73osqn-933720006345.asia-east1.run.app';

  // Use current working origin by default so it never 404s before Share is toggled
  const primaryUrl = currentOrigin;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(
    primaryUrl
  )}`;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleCopyUrl = async (urlToCopy: string, type: 'dev' | 'pre') => {
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = urlToCopy;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const msg =
      lang === 'hi'
        ? `*DukaanVyapar Mobile App (APK)* 📲\nअपने फोन के Chrome ब्राउज़र में यह लिंक खोलें और "Install App" पर टैप करें:\n\n1. Direct Link (Logged-in): ${devUrl}\n2. Shared Link (After enabling Share in AI Studio): ${publicShareUrl}`
        : `*DukaanVyapar Mobile App (APK)* 📲\nOpen this link in Chrome on your Android phone and tap "Install App":\n\n1. Direct Link: ${devUrl}\n2. Shared Link: ${publicShareUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const handleDownloadInstallerPackage = () => {
    setDownloadingLauncher(true);
    const htmlContent = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#059669" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>DukaanVyapar App Installer</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 24px; max-width: 420px; width: 100%; padding: 28px 24px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .logo { width: 72px; height: 72px; background: linear-gradient(135deg, #10b981, #047857); border-radius: 20px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; color: white; box-shadow: 0 10px 25px rgba(16,185,129,0.4); }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 6px; color: #ffffff; }
    p.sub { font-size: 13px; color: #94a3b8; margin-bottom: 20px; }
    .steps { background: #0f172a; border-radius: 16px; padding: 16px; text-align: left; margin-bottom: 20px; border: 1px solid #334155; font-size: 13px; line-height: 1.6; color: #cbd5e1; }
    .steps strong { color: #34d399; }
    .btn { display: block; width: 100%; background: linear-gradient(135deg, #10b981, #059669); color: white; font-weight: 800; font-size: 14px; padding: 14px 18px; border-radius: 14px; text-decoration: none; box-shadow: 0 10px 20px rgba(16,185,129,0.3); margin-bottom: 10px; }
    .btn-sec { display: block; width: 100%; background: #334155; color: #e2e8f0; font-weight: 700; font-size: 13px; padding: 12px 18px; border-radius: 14px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">DV</div>
    <h1>DukaanVyapar App</h1>
    <p class="sub">Billing, Udhar & Box-Ladi Stock App</p>
    <div class="steps">
      <p><strong>फोन में APK ऐप की तरह इनस्टॉल करने के लिए:</strong></p>
      <p>1. नीचे दिए हरे बटन पर टैप करके ऐप खोलें।</p>
      <p>2. Chrome के ऊपर कोने में <strong>3 डॉट्स (⋮)</strong> पर टैप करें।</p>
      <p>3. <strong>"Install app" (ऐप इंस्टॉल करें)</strong> या <strong>"Add to Home screen"</strong> चुनें।</p>
    </div>
    <a class="btn" href="${devUrl}">🚀 Open Active App Link (Direct)</a>
    <a class="btn-sec" href="${publicShareUrl}">🌐 Open Shared Public Link</a>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DukaanVyapar_App_Installer.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloadingLauncher(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-4 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-emerald-100 hover:text-white p-1.5 rounded-full hover:bg-emerald-800/50 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl shadow-md p-2 flex items-center justify-center shrink-0">
              <img src="/icon.svg" alt="App Icon" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 bg-emerald-400/20 border border-emerald-300/30 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-emerald-100">
                  Android WebAPK & iOS
                </span>
              </div>
              <h3 className="text-base font-black mt-0.5">
                {lang === 'hi' ? 'फोन में ऐप इनस्टॉल करें (APK)' : 'Install Mobile App (APK)'}
              </h3>
              <p className="text-[11px] text-emerald-100">
                {lang === 'hi'
                  ? '100% ऑफलाइन चलता है • बिना Play Store के सीधा इनस्टॉल'
                  : 'Works 100% Offline • Direct Phone Installation'}
              </p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 bg-black/20 p-1 rounded-xl mt-3">
            <button
              type="button"
              onClick={() => setActiveTab('webapk')}
              className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'webapk'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-emerald-100 hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'सीधा फोन में इनस्टॉल' : 'Direct Phone Install'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('apkfile')}
              className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'apkfile'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-emerald-100 hover:bg-white/10'
              }`}
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'APK फ़ाइल डाउनलोड' : 'Download APK File'}</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {installSuccess || isInstalled ? (
            <div className="text-center py-6 space-y-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
              <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h4 className="font-black text-slate-900 dark:text-white text-base">
                {lang === 'hi' ? 'ऐप आपके फोन में इनस्टॉल हो चुका है!' : 'App Installed on Your Phone!'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {lang === 'hi'
                  ? 'अब आप अपने फोन की होम स्क्रीन पर DukaanVyapar आइकन से सीधे ऐप चला सकते हैं।'
                  : "You can now open DukaanVyapar directly from your phone's Home Screen / App Drawer."}
              </p>
            </div>
          ) : activeTab === 'webapk' ? (
            <>
              {/* Direct 1-Tap Install if supported in current browser context */}
              {isInstallable && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-emerald-950 dark:text-emerald-100 text-xs block">
                        {lang === 'hi' ? '1-टैप एंड्रॉइड WebAPK इंस्टॉलेशन तैयार है!' : '1-Tap Android WebAPK Ready!'}
                      </span>
                      <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                        {lang === 'hi'
                          ? 'नीचे बटन दबाते ही यह ऐप आपके फोन में असली APK की तरह इनस्टॉल हो जाएगा।'
                          : 'Tap below to install directly into your phone app drawer.'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl font-black text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {lang === 'hi' ? 'अभी फोन में इनस्टॉल करें (Install App)' : 'Install App on Phone Now'}
                    </span>
                  </button>
                </div>
              )}

              {/* Important Note about 404 on ais-pre vs ais-dev */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-3 space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-950 dark:text-amber-200 leading-relaxed">
                    <strong className="font-black block">
                      {lang === 'hi'
                        ? 'महत्वपूर्ण: यदि लिंक खोलने पर 404 Error आए तो क्या करें?'
                        : 'Important: Why did the link show 404 Error?'}
                    </strong>
                    {lang === 'hi' ? (
                      <>
                        1. नीचे दिए <strong>"1. Direct Active Link (ais-dev)"</strong> को उसी फोन/ब्राउज़र में खोलें जहाँ आपकी Gmail ID (<code>mohdSR242@gmail.com</code>) लॉगिन है — यह तुरंत खुलेगा!<br />
                        2. या AI Studio में ऊपर दाईं ओर <strong>Share (शेयर आइकन)</strong> या <strong>Deploy (रॉकेट आइकन)</strong> दबाकर ऐप को Public कर दें, उसके बाद Public लिंक भी हर जगह खुलेगा।
                      </>
                    ) : (
                      <>
                        1. Use the <strong>Direct Active Link (ais-dev)</strong> below in the browser where your Google account is signed in.<br />
                        2. Or click the <strong>Share / Deploy</strong> button at the top-right of AI Studio to activate the Public Share URL.
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Both Links: Active Dev Link & Public Share Link */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3">
                {/* Link 1: Active Dev URL */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 block">
                    {lang === 'hi'
                      ? '1. Direct Active Link (तुरंत चालू लिंक - Gmail लॉगिन के साथ):'
                      : '1. Direct Active Link (Works Immediately):'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={devUrl}
                      className="flex-1 bg-emerald-50/60 dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(devUrl, 'dev')}
                      className={`px-2.5 py-1.5 rounded-lg font-extrabold text-xs flex items-center gap-1 shrink-0 transition ${
                        copiedType === 'dev'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {copiedType === 'dev' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === 'dev' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={devUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg flex items-center gap-1 shrink-0 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </a>
                  </div>
                </div>

                {/* Link 2: Public Share URL */}
                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400 block">
                    {lang === 'hi'
                      ? '2. Public Share Link (AI Studio में Share ऑन करने के बाद):'
                      : '2. Public Share Link (Requires clicking Share in AI Studio):'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={publicShareUrl}
                      className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(publicShareUrl, 'pre')}
                      className={`px-2.5 py-1.5 rounded-lg font-extrabold text-xs flex items-center gap-1 shrink-0 transition ${
                        copiedType === 'pre'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {copiedType === 'pre' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === 'pre' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'दोनों लिंक WhatsApp पर भेजें' : 'Send Links to WhatsApp'}</span>
                </button>

                {/* Scannable QR Code for Phone Camera */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <img
                    src={qrCodeUrl}
                    alt="Scan QR to install on phone"
                    className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white shrink-0"
                  />
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{lang === 'hi' ? 'फोन कैमरे से QR स्कैन करें' : 'Scan QR with Phone Camera'}</span>
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {lang === 'hi'
                        ? 'Chrome में खुलने के बाद ऊपर (⋮) मेन्यू दबाएं और "Install app" या "Add to Home screen" चुनें।'
                        : 'Once open in Chrome, tap the (⋮) menu at top-right and select "Install app" or "Add to Home screen".'}
                    </p>
                  </div>
                </div>
              </div>

              {isIOS && (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-3 space-y-1.5">
                  <h4 className="font-bold text-xs text-blue-950 dark:text-blue-200">iPhone / iPad (Safari):</h4>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300">
                    1. Tap <Share2 className="w-3.5 h-3.5 inline" /> <strong>Share</strong> in Safari toolbar → 2. Tap <PlusSquare className="w-3.5 h-3.5 inline" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* TAB 2: Download Standalone Installer & PWABuilder APK */
            <div className="space-y-3">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <FileDown className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-emerald-950 dark:text-emerald-100 text-xs">
                      {lang === 'hi'
                        ? 'पोर्टेबल ऐप इंस्टॉलर फ़ाइल डाउनलोड करें'
                        : 'Download Portable App Installer File'}
                    </h4>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
                      {lang === 'hi'
                        ? 'यह फ़ाइल आपके फोन के Downloads फोल्डर में सेव हो जाएगी। इसे कभी भी खोलकर आप वन-टैप में ऐप चला या इनस्टॉल कर सकते हैं।'
                        : 'Saves a standalone installer launcher directly to your phone Downloads folder.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadInstallerPackage}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {downloadingLauncher
                      ? lang === 'hi'
                        ? 'डाउनलोड हो रहा है...'
                        : 'Downloading Installer...'
                      : lang === 'hi'
                      ? 'इंस्टॉलर फ़ाइल डाउनलोड करें (Download Installer)'
                      : 'Download App Installer File'}
                  </span>
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-xs">
                      {lang === 'hi'
                        ? 'AI Studio से पब्लिक क्लाउड लिंक कैसे चालू करें?'
                        : 'How to Enable Public Cloud URL in AI Studio:'}
                    </h4>
                    <ol className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 space-y-1 list-decimal list-inside">
                      <li>
                        {lang === 'hi'
                          ? 'AI Studio स्क्रीन में सबसे ऊपर दाईं ओर (Top-Right) "Share" या "Deploy (🚀)" आइकन पर टैप करें।'
                          : 'Tap the "Share" or "Deploy (🚀)" icon at the top-right of the AI Studio screen.'}
                      </li>
                      <li>
                        {lang === 'hi'
                          ? '"Public" स्विच ऑन करें — इसके बाद आपका `ais-pre-...` लिंक बिना किसी 404 Error के किसी भी फोन में खुलेगा!'
                          : 'Turn on the "Public" toggle or click Deploy — your shared link will then open on any phone without 404!'}
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl transition"
          >
            {lang === 'hi' ? 'बंद करें (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
