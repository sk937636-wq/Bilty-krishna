import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);
    if (isIosDevice) {
      setActiveTab('ios');
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Install prompt error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg border border-blue-400/30">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Mobile Me App Install Karein
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Free
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Play Store ki tarah Phone Screen par chalayein
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700">
          {/* Quick Native Install button if available */}
          {deferredPrompt && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1-Click Fast Install Available!</span>
                </h3>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Niche button dabate hi phone par app install ho jayegi.
                </p>
              </div>
              <button
                onClick={handleNativeInstall}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Now</span>
              </button>
            </div>
          )}

          {installedSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
              <h3 className="text-sm font-bold text-emerald-900">App Successfully Installed!</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Ab aap phone ki home screen par 'Bilty App' icon par tap karke ise sidha open kar sakte hain.
              </p>
            </div>
          )}

          {/* OS Switcher Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Android (Chrome / Samsung)
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              iPhone / iPad (Safari)
            </button>
          </div>

          {/* Android Steps */}
          {activeTab === 'android' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 font-medium">
                Android Phone me install karne ke 3 aasan steps:
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    Chrome browser me upar right side 3 dots (
                    <MoreVertical className="w-3.5 h-3.5 text-slate-700 inline" />
                    ) par tap karein
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    Chrome ya browser open karein jahan yeh link khula hua hai.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-900">
                    Menu me "Install app" ya "Add to Home screen" par click karein
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    Hindi me: "ऐप इंस्टॉल करें" ya "होम स्क्रीन में जोड़ें" likha aayega.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-900">
                    "Install" button dabayein
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    Kuch hi seconds me aapke mobile me Bilty App ka icon aa jayega.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* iOS Steps */}
          {activeTab === 'ios' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 font-medium">
                iPhone / iPad Safari me install karne ke 3 steps:
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    Niche Safari toolbar me Share button (
                    <Share className="w-3.5 h-3.5 text-blue-600 inline" />
                    ) par tap karein
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    Square box jisme upar ki taraf arrow bana hota hai.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    Scroll karke "Add to Home Screen" (
                    <PlusSquare className="w-3.5 h-3.5 text-slate-700 inline" />
                    ) par click karein
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    List me niche scroll karenge toh yeh option dikhai dega.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-900">
                    Upar right corner me "Add" par click karein
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    Ab aapke iPhone ki home screen par Bilty App ka icon ban jayega!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits Box */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-1.5">
              Mobile App ke Fayde:
            </h4>
            <ul className="text-xs text-slate-600 space-y-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Bina browser URL bar ke full-screen native app chalegi</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Internet slow hone par bhi purani bilties offline khulengi</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>1-click me direct PDF export aur WhatsApp share</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Transport Bilty System v1.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Samajh Gaya (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
