// MobileQuickNav — horizontal quick-nav row for mobile dashboard
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ListChecks, Heart, SendHorizontal, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TENANT_ITEMS = [
  { to: '/dashboard/my-listings', icon: ListChecks, label: 'myListingsMenu' },
  { to: '/dashboard/saved', icon: Heart, label: 'savedListingsMenu' },
  { to: '/dashboard/requests', icon: SendHorizontal, label: 'myRequestsMenu' },
  { to: '/dashboard/profile', icon: User, label: 'profileMenu' },
];

const OWNER_ITEMS = [
  { to: '/dashboard/listings', icon: ListChecks, label: 'myListingsMenu' },
  { to: '/dashboard/saved', icon: Heart, label: 'savedListingsMenu' },
  { to: '/dashboard/requests', icon: SendHorizontal, label: 'requestsMenu' },
  { to: '/dashboard/profile', icon: User, label: 'profileMenu' },
];

export default function MobileQuickNav() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const items = user?.role === 'OWNER' ? OWNER_ITEMS : TENANT_ITEMS;

  return (
    <div className="lg:hidden flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              isActive
                ? 'bg-primary-50 text-primary-700 shadow-sm'
                : 'bg-white text-surface-600 hover:bg-surface-50 border border-surface-100'
            }`
          }
        >
          <Icon size={14} />
          <span>{t(label)}</span>
        </NavLink>
      ))}
    </div>
  );
}
