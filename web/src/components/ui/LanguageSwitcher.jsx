import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ur', label: 'اردو' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-surface-100 text-surface-600 text-sm transition-colors"
        title="Change language"
      >
        <Languages className="w-4 h-4" />
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-surface-200/60 rounded-2xl z-50 overflow-hidden min-w-[140px]" style={{ boxShadow: 'var(--md-sys-elevation-3)' }}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLang(lang.code)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-left ${
                i18n.language === lang.code
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'text-surface-700 hover:bg-surface-50'
              }`}
            >
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
