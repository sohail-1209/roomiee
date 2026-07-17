import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';

const InstagramIcon = ({ size = 16, className = '' }) => (
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

  return (
    <footer className="border-t border-surface-200/50 bg-gradient-to-b from-white to-surface-50 pt-12 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main sections grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-surface-200/40">
          {/* Column 1: Logo & About description */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
            <Link to="/" className="group inline-block">
              <img 
                src="https://res.cloudinary.com/dldgj84bm/image/upload/v1784198779/ChatGPT_Image_Jul_16_2026_04_15_03_PM_wtomms.png" 
                alt="Quikden Logo" 
                className="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-103" 
              />
            </Link>
            <p className="text-xs text-surface-450 max-w-xs leading-relaxed">
              {t('footerAbout') || 'Find flatmates, rooms, hostels, and land investments easily with premium visual searches and verified owner interactions.'}
            </p>
          </div>

          {/* Column 2: Navigation links */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <h4 className="font-display font-semibold text-xs text-surface-900 uppercase tracking-wider">
              {t('quickLinks') || 'Quick Links'}
            </h4>
            <div className="flex gap-4 sm:gap-6 text-xs font-semibold text-surface-600">
              <Link to="/" className="hover:text-primary-600 hover:underline transition-all">
                {t('home') || 'Home'}
              </Link>
              <Link to="/search" className="hover:text-primary-600 hover:underline transition-all">
                {t('browse') || 'Browse'}
              </Link>
              <Link to="/about" className="hover:text-primary-600 hover:underline transition-all">
                {t('aboutUs') || 'About Us'}
              </Link>
            </div>
          </div>

          {/* Column 3: Contact & Social connects */}
          <div className="flex flex-col items-center md:items-end justify-center md:justify-start space-y-3 text-center md:text-right">
            <h4 className="font-display font-semibold text-xs text-surface-900 uppercase tracking-wider">
              {t('contactUs') || 'Contact Us'}
            </h4>
            <a href="mailto:quikden.com@gmail.com" className="text-xs text-surface-600 hover:text-primary-600 transition-colors font-medium">
              quikden.com@gmail.com
            </a>
            <div className="flex gap-2.5 items-center mt-1">
              <a
                href="https://instagram.com/quikden"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white rounded-xl hover:bg-primary-50 text-surface-500 hover:text-primary-600 border border-surface-200/60 transition-all hover:scale-105 shadow-sm"
                title="Instagram"
              >
                <InstagramIcon size={16} />
              </a>
              <a
                href="mailto:quikden.com@gmail.com"
                className="p-2 bg-white rounded-xl hover:bg-primary-50 text-surface-500 hover:text-primary-600 border border-surface-200/60 transition-all hover:scale-105 shadow-sm"
                title="Gmail"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Sub-footer: Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-[11px] text-surface-400">
            &copy; {new Date().getFullYear()} Quikden &middot; {t('madeInIndia')}
          </p>
          <p className="text-[10px] text-surface-300">
            {t('allRightsReserved') || 'All Rights Reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
