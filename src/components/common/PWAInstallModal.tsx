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
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'webapk' | 'apkfile'>('webapk');
  const [downloadingLauncher, setDownloadingLauncher] = useState(false);

  if (!isOpen) return null;

  // Use the public shared app URL or current origin for phone installation
  const appUrl =
    typeof window !== 'undefined'
      ? window.location.origin.includes('ais-dev-')
        ? window.location.origin.replace('ais-dev-', 'ais-pre-')
        : window.location.origin
      : 'https://ais-pre-keszuztslacjj6fe73osqn-933720006345.asia-east1.run.app';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(
    appUrl
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = appUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const msg =
      lang === 'hi'
        ? `*DukaanVyapar Mobile App (APK)* 📲\nअपने फोन के Chrome ब्राउज़र में यह लिंक खोलें और "Install App" पर टैप करें:\n${appUrl}`
        : `*DukaanVyapar Mobile App (APK)* 📲\nOpen this link in Chrome on your Android phone and tap "Install App":\n${appUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    const a = document.createElement('a');
    a.href = waUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  // Download a standalone mobile installer HTML package that the user can save & open on their phone
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
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 24px; max-width: 400px; width: 100%; padding: 28px 24px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .logo { width: 72px; height: 72px; background: linear-gradient(135deg, #10b981, #047857); border-radius: 20px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 900; color: white; box-shadow: 0 10px 25px rgba(16,185,129,0.4); }
    h1 { font-size: 22px; font-weight: 800; margin-bottom: 6px; color: #ffffff; }
    p.sub { font-size: 13px; color: #94a3b8; margin-bottom: 20px; }
    .steps { background: #0f172a; border-radius: 16px; padding: 16px; text-align: left; margin-bottom: 20px; border: 1px solid #334155; font-size: 13px; line-height: 1.6; color: #cbd5e1; }
    .steps strong { color: #34d399; }
    .btn { display: block; width: 100%; background: linear-gradient(135deg, #10b981, #059669); color: white; font-weight: 800; font-size: 15px; padding: 15px 20px; border-radius: 14px; text-decoration: none; box-shadow: 0 10px 20px rgba(16,185,129,0.3); margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">DV</div>
    <h1>DukaanVyapar App</h1>
    <p class="sub">Billing, Udhar & Box-Ladi Stock App</p>
    <div class="steps">
      <p><strong>फोन में APK ऐप की तरह इनस्टॉल करने के लिए:</strong></p>
      <p>1. नीचे दिए हरे बटन <strong>"Open & Install App"</strong> पर टैप करें।</p>
      <p>2. Chrome के ऊपर कोने में <strong>3 डॉट्स (⋮)</strong> पर टैप करें।</p>
      <p>3. <strong>"Install app" (ऐप इंस्टॉल करें)</strong> या <strong>"Add to Home screen"</strong> चुनें।</p>
    </div>
    <a class="btn" href="${appUrl}">🚀 Open & Install App Now</a>
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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800 flex flex-col max-h-[92vh]">
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
            <div className="text-center py-6 space-y-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="font-black text-slate-900 text-base">
                {lang === 'hi' ? 'ऐप आपके फोन में इनस्टॉल हो चुका है!' : 'App Installed on Your Phone!'}
              </h4>
              <p className="text-xs text-slate-600">
                {lang === 'hi'
                  ? 'अब आप अपने फोन की होम स्क्रीन पर DukaanVyapar आइकन से सीधे ऐप चला सकते हैं।'
                  : "You can now open DukaanVyapar directly from your phone's Home Screen / App Drawer."}
              </p>
            </div>
          ) : activeTab === 'webapk' ? (
            <>
              {/* Direct 1-Tap Install if supported in current browser context */}
              {isInstallable && (
                <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-emerald-950 text-xs block">
                        {lang === 'hi' ? '1-टैप एंड्रॉइड WebAPK इंस्टॉलेशन तैयार है!' : '1-Tap Android WebAPK Ready!'}
                      </span>
                      <span className="text-[11px] text-emerald-800">
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

              {/* Step-by-step Android Chrome WebAPK Guide */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>
                      {lang === 'hi'
                        ? 'फोन में असली ऐप (WebAPK) कैसे इनस्टॉल करें?'
                        : 'How to Install as Android App (WebAPK):'}
                    </span>
                  </span>
                </div>

                <ol className="space-y-2 text-[11px] text-slate-700 font-medium">
                  <li className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      {lang === 'hi' ? (
                        <>
                          नीचे से <strong>ऐप का लिंक कॉपी करें</strong> या <strong>QR कोड स्कैन करें</strong> और अपने फोन के <strong>Chrome ब्राउज़र</strong> में खोलें।
                        </>
                      ) : (
                        <>
                          Copy the App Link below or scan the QR code and open it in <strong>Chrome browser</strong> on your Android phone.
                        </>
                      )}
                    </div>
                  </li>
                  <li className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      {lang === 'hi' ? (
                        <>
                          Chrome में ऊपर दाईं तरफ <strong>3 डॉट्स (⋮)</strong> पर टैप करें और <strong>"Install app" (ऐप इंस्टॉल करें)</strong> या <strong>"Add to Home screen"</strong> पर दबाएं।
                        </>
                      ) : (
                        <>
                          Tap the Chrome menu <strong>(⋮)</strong> at top-right and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                        </>
                      )}
                    </div>
                  </li>
                  <li className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      {lang === 'hi' ? (
                        <>
                          <strong>Install</strong> दबाते ही 2 सेकंड में आपके फोन में <strong>DukaanVyapar APK</strong> इनस्टॉल हो जाएगा जो बिना इंटरनेट के भी चलेगा!
                        </>
                      ) : (
                        <>
                          Android will automatically build and install the <strong>DukaanVyapar WebAPK</strong> in your App Drawer with full offline support!
                        </>
                      )}
                    </div>
                  </li>
                </ol>
              </div>

              {/* Copy Link & WhatsApp Share + QR Code */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 block">
                  {lang === 'hi' ? 'आपका मोबाइल ऐप लिंक (App Install Link):' : 'Your Direct Mobile App Link:'}
                </label>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-[11px] font-mono text-slate-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-3 py-2 rounded-lg font-extrabold text-xs flex items-center gap-1 shrink-0 transition ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? (lang === 'hi' ? 'कॉपी हो गया' : 'Copied!') : (lang === 'hi' ? 'कॉपी' : 'Copy')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'WhatsApp पर भेजें' : 'Send to WhatsApp'}</span>
                  </button>

                  <a
                    href={appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? 'नए टैब में खोलें' : 'Open Direct Link'}</span>
                  </a>
                </div>

                {/* Scannable QR Code for Phone Camera */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <img
                    src={qrCodeUrl}
                    alt="Scan QR to install on phone"
                    className="w-20 h-20 rounded-lg border border-slate-200 p-1 bg-white shrink-0"
                  />
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'hi' ? 'फोन कैमरे से QR स्कैन करें' : 'Scan QR with Phone Camera'}</span>
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {lang === 'hi'
                        ? 'अपने फोन से यह QR स्कैन करके सीधे Chrome में खोलें और "Install App" दबाएं।'
                        : 'Scan this QR code with your phone to open directly in Chrome and tap "Install App".'}
                    </p>
                  </div>
                </div>
              </div>

              {isIOS && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1.5">
                  <h4 className="font-bold text-xs text-blue-950">iPhone / iPad (Safari):</h4>
                  <p className="text-[11px] text-blue-800">
                    1. Tap <Share2 className="w-3.5 h-3.5 inline" /> <strong>Share</strong> in Safari toolbar → 2. Tap <PlusSquare className="w-3.5 h-3.5 inline" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* TAB 2: Download Standalone Installer & PWABuilder APK */
            <div className="space-y-3">
              {/* Option 1: Instant App Installer File Download */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <FileDown className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-emerald-950 text-xs">
                      {lang === 'hi'
                        ? 'विकल्प 1: पोर्टेबल ऐप इंस्टॉलर फ़ाइल डाउनलोड करें'
                        : 'Option 1: Download Portable App Installer File'}
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
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

              {/* Option 2: Build Signed Android .APK via PWABuilder */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Smartphone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-slate-900 text-xs">
                      {lang === 'hi'
                        ? 'विकल्प 2: PWABuilder से `.apk` फ़ाइल जनरेट करें'
                        : 'Option 2: Generate Signed `.apk` File via PWABuilder'}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      {lang === 'hi'
                        ? 'हमने इस ऐप में पूरा Android Manifest और Service Worker जोड़ दिया है। यदि आपको अलग से `.apk` फ़ाइल चाहिए, तो नीचे बटन दबाकर PWABuilder पर "Package for Store -> Android APK" डाउनलोड कर सकते हैं:'
                        : 'This app is fully configured with a Web App Manifest & Service Worker. To generate a standalone signed `.apk` binary, open PWABuilder below and click "Package for Store -> Android":'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied' : '1. Copy URL'}</span>
                  </button>

                  <a
                    href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{lang === 'hi' ? '2. APK जनरेटर खोलें (PWABuilder)' : '2. Open APK Builder'}</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
          >
            {lang === 'hi' ? 'बंद करें (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
