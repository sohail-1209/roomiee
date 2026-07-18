// Sidebar — dashboard navigation, role-aware menu items with collapse support
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Heart,
  SendHorizontal,
  MessageSquare,
  User,
  ListChecks,
  PlusSquare,
  BarChart2,
  Users,
  Flag,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';


// ─── Per-role menu configs ─────────────────────────────────────────────────
export const MENUS = {
  TENANT: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'dashboardMenu' },
    { to: '/dashboard/my-listings', icon: ListChecks, label: 'myListingsMenu' },
    { to: '/dashboard/listings/new', icon: PlusSquare, label: 'addListingMenu' },
    { to: '/dashboard/saved', icon: Heart, label: 'savedListingsMenu' },
    { to: '/dashboard/requests', icon: SendHorizontal, label: 'myRequestsMenu' },
    { to: '/dashboard/chats', icon: MessageSquare, label: 'chatsMenu' },
    { to: '/dashboard/profile', icon: User, label: 'profileMenu' },
  ],
  OWNER: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'dashboardMenu' },
    { to: '/dashboard/listings', icon: ListChecks, label: 'myListingsMenu' },
    { to: '/dashboard/listings/new', icon: PlusSquare, label: 'addListingMenu' },
    { to: '/dashboard/saved', icon: Heart, label: 'savedListingsMenu' },
    { to: '/dashboard/requests', icon: SendHorizontal, label: 'requestsMenu' },
    { to: '/dashboard/chats', icon: MessageSquare, label: 'chatsMenu' },
    { to: '/dashboard/analytics', icon: BarChart2, label: 'analyticsMenu' },
    { to: '/dashboard/profile', icon: User, label: 'profileMenu' },
  ],
  ADMIN: [
    { to: '/admin', icon: LayoutDashboard, label: 'dashboardMenu' },
    { to: '/admin', icon: Users, label: 'users' },
    { to: '/admin', icon: ListChecks, label: 'listingsTab' },
    { to: '/admin', icon: Flag, label: 'reports' },
    { to: '/admin', icon: BarChart2, label: 'analyticsMenu' },
  ],
};

// ─── Single nav item ───────────────────────────────────────────────────────
function SidebarItem({ to, icon: Icon, label, end, collapsed }) {
  const { t } = useTranslation();

  const link = (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5'
        } ${isActive
          ? 'bg-primary-50 text-primary-700 shadow-sm shadow-primary-500/5'
          : 'text-surface-500 hover:bg-surface-100 hover:text-surface-800'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={19}
            strokeWidth={isActive ? 2.2 : 1.8}
            className={`shrink-0 transition-colors duration-150 ${isActive ? 'text-primary-600' : 'text-surface-400 group-hover:text-surface-600'
              }`}
          />
          {!collapsed && (
            <span className="truncate">{t(label)}</span>
          )}
          {isActive && (
            <span
              className={`absolute ${collapsed
                  ? 'bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px]'
                  : 'right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5'
                } rounded-full bg-primary-500`}
            />
          )}
        </>
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <div className="relative group/tooltip">
        {link}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-surface-800 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50 shadow-lg">
          {t(label)}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-surface-800" />
        </div>
      </div>
    );
  }

  return link;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────
/**
 * @param {{ role: 'TENANT' | 'OWNER' | 'ADMIN', collapsed: boolean, onToggle: () => void }} props
 */
export default function Sidebar({ role, collapsed = false, onToggle }) {
  const { t } = useTranslation();
  const items = MENUS[role] ?? MENUS.TENANT;

  return (
    <aside
      className={`flex flex-col h-full bg-surface-50/80 backdrop-blur-xl border-r border-surface-100/60 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? 'px-2 py-4' : 'px-3 py-4 sm:py-6'
        }`}
    >
      {/* Section label */}
      {!collapsed && (
        <p className="px-3 py-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-surface-400">
          {role === 'ADMIN' ? t('adminPanel') : t('myAccount')}
        </p>
      )}

      <nav className={`flex flex-col gap-0.5 flex-1 ${collapsed ? 'items-center' : ''}`}>
        {items.map((item, idx) => (
          <SidebarItem
            key={idx}
            to={item.to}
            icon={item.icon}
            label={item.label}
            end={idx === 0}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Toggle button */}
      <div className={`border-t border-surface-200/60 ${collapsed ? 'pt-2 mt-1' : 'pt-3 mt-2'}`}>
        <button
          onClick={onToggle}
          className={`group flex items-center rounded-xl transition-all duration-200 w-full ${collapsed
              ? 'justify-center w-10 h-10 mx-auto text-surface-500 hover:bg-surface-100 hover:text-surface-800'
              : 'gap-2.5 px-3 py-2.5 text-surface-500 hover:bg-surface-100 hover:text-surface-800'
            }`}
          title={collapsed ? t('expandSidebar') : t('collapseSidebar')}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} strokeWidth={2} />
          ) : (
            <>
              <PanelLeftClose size={18} strokeWidth={2} />
              <span className="text-xs font-semibold tracking-wide">{t('collapseSidebar') || 'Collapse'}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
