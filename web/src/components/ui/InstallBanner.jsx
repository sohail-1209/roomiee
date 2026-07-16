// InstallBanner — PWA install prompt + welcome message
import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('quikden-install-dismissed');
    const welcomed = localStorage.getItem('quikden-welcomed');

    if (!welcomed && ('standalone' in window.navigator || window.matchMedia('(display-mode: standalone)').matches)) {
      localStorage.setItem('quikden-welcomed', '1');
      setTimeout(() => {
        toast.success('Welcome to Quikden! Find your perfect home.', {
          duration: 5000,
          icon: <Sparkles size={18} className="text-primary-500" />,
        });
      }, 1500);
    }

    if (dismissed) return;

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    if (iOS) {
      setShowBanner(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      localStorage.setItem('quikden-welcomed', '1');
      toast.success('Quikden installed! Welcome aboard.', {
        duration: 5000,
        icon: <Sparkles size={18} className="text-primary-500" />,
      });
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('quikden-install-dismissed', '1');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40 animate-slide-up">
      <div className="glass-strong rounded-2xl p-4 shadow-xl border border-white/40">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-surface-100 transition-colors"
        >
          <X size={14} className="text-surface-400" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0 shadow-md">
            {isIOS ? <Smartphone size={18} className="text-white" /> : <Download size={18} className="text-white" />}
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <p className="text-sm font-semibold text-surface-900">Install Quikden</p>
            <p className="text-xs text-surface-500 mt-0.5">
              {isIOS
                ? 'Tap the share button then "Add to Home Screen"'
                : 'Add to your home screen for quick access'}
            </p>
          </div>
        </div>

        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="btn-primary btn-sm w-full mt-3 justify-center"
          >
            Install App
          </button>
        )}
      </div>
    </div>
  );
}
