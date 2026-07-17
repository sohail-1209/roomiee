// BottomNavbar — mobile-only bottom tab bar for dashboard
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, PlusSquare, MessageSquare } from 'lucide-react';

const TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'dashboard', end: true },
  { to: '/dashboard/listings/new', icon: PlusSquare, label: 'addListingMenu' },
  { to: '/dashboard/chats', icon: MessageSquare, label: 'chatsMenu' },
];

export default function BottomNavbar() {
  const { t } = useTranslation();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-t border-surface-100 safe-area-bottom">
      <div className="flex justify-around items-center h-14">
        {TABS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-primary-600'
                  : 'text-surface-400 active:text-surface-600'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-medium leading-none">{t(label)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
