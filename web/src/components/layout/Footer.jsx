import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Sparkles, Send, CheckCircle2, ArrowRight, Heart } from 'lucide-react';

const InstagramIcon = ({ size = 18, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export default function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Simulate subscribing
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      setEmail('');
    }, 1200);
  };

  return (
    <footer className="relative overflow-hidden border-t border-surface-200/60 bg-gradient-to-b from-white via-surface-50/40 to-surface-100/60 pt-16 pb-10 px-4 sm:px-6 lg:px-8">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary-100/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-accent-100/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Newsletter Section */}

        {/* Main Grid Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-surface-200/50">
          {/* Column 1: Branding */}
          <div className="flex flex-col space-y-4">
            <Link to="/" className="group inline-block w-fit">
              <img
                src="https://res.cloudinary.com/dldgj84bm/image/upload/v1784198779/ChatGPT_Image_Jul_16_2026_04_15_03_PM_wtomms.png"
                alt="Quikden Logo"
                className="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-103"
              />
            </Link>
            <p className="text-xs text-surface-500 leading-relaxed">
              Find flatmates, rooms, hostels, and land investments easily with premium visual searches and verified owner interactions.
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-50 border border-success-100 text-[11px] font-medium text-success-700">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
                </span>
                <span>{t('allSystemsOperational') || 'All Services Active'}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Explore properties */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-display font-bold text-xs text-surface-900 uppercase tracking-wider">
              {t('explore') || 'Explore'}
            </h4>
            <ul className="space-y-2.5 text-xs text-surface-600 font-medium">
              <li>
                <Link
                  to="/search?type=HOUSE_RENTAL"
                  className="hover:text-primary-600 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  {t('houses') || 'House Rentals'}
                </Link>
              </li>
              <li>
                <Link
                  to="/search?type=ROOM_SHARING"
                  className="hover:text-primary-600 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  {t('rooms') || 'Room Sharing'}
                </Link>
              </li>
              <li>
                <Link
                  to="/search?type=HOSTEL"
                  className="hover:text-primary-600 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  {t('hostels') || 'Hostels & PG'}
                </Link>
              </li>
              <li>
                <Link
                  to="/search?type=LAND_SALE"
                  className="hover:text-primary-600 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  {t('land') || 'Land Sales'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Company / Navigation */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-display font-bold text-xs text-surface-900 uppercase tracking-wider">
              {t('company') || 'Company'}
            </h4>
            <ul className="space-y-2.5 text-xs text-surface-600 font-medium">
              <li>
                <Link
                  to="/"
                  className="hover:text-primary-600 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  {t('home') || 'Home'}
                </Link>
              </li>
              <li>
                <Link
                  to="/search"
                  className="hover:text-primary-600 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  {t('Browse') || 'Browse All'}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-primary-600 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  {t('aboutUs') || 'About Us'}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:quikden.com@gmail.com"
                  className="hover:text-primary-600 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  {t('support') || 'Support Desk'}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Socials */}
          <div className="flex flex-col space-y-4">
            <h4 className="font-display font-bold text-xs text-surface-900 uppercase tracking-wider">
              {t('contactUs') || 'Contact Us'}
            </h4>
            <div className="space-y-3">
              <a
                href="mailto:quikden.com@gmail.com"
                className="inline-flex items-center gap-2 text-xs text-surface-600 hover:text-primary-600 font-medium transition-colors"
              >
                <Mail size={14} className="text-surface-400 shrink-0" />
                <span>quikden.com@gmail.com</span>
              </a>
              <div className="flex gap-3 items-center pt-1">
                <a
                  href="https://instagram.com/quikden"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-white rounded-xl hover:bg-primary-50 text-surface-500 hover:text-primary-600 border border-surface-200/80 shadow-sm transition-all hover:scale-110"
                  title="Instagram"
                >
                  <InstagramIcon size={18} />
                </a>
                <a
                  href="mailto:quikden.com@gmail.com"
                  className="p-2.5 bg-white rounded-xl hover:bg-primary-50 text-surface-500 hover:text-primary-600 border border-surface-200/80 shadow-sm transition-all hover:scale-110"
                  title="Gmail"
                >
                  <Mail size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-footer: Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-[11px] text-surface-500 flex items-center gap-1.5 font-medium">
            <span>&copy; {new Date().getFullYear()} Quikden</span>
            <span>&middot;</span>
            <span>{t('madeInIndia') || 'Made with care in India'}</span>
            <Heart size={10} className="text-red-500 fill-red-500 animate-pulse" />
          </p>
          <p className="text-[10px] text-surface-400 font-semibold tracking-wide uppercase">
            {t('allRightsReserved') || 'All Rights Reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}

