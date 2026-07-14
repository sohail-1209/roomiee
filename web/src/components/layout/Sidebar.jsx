// Sidebar — dashboard navigation, role-aware menu items
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Heart,
  SendHorizontal,
  MessageSquare,
  User,
  Settings,
  ListChecks,
  PlusSquare,
  BarChart2,
  Users,
  FileText,
  Flag,
} from 'lucide-react';

// ─── Per-role menu configs ─────────────────────────────────────────────────
const MENUS = {
  TENANT: [
    { to: '/dashboard',               icon: LayoutDashboard, label: 'Dashboard'      },
    { to: '/dashboard/saved',         icon: Heart,           label: 'Saved Listings' },
    { to: '/dashboard/requests',      icon: SendHorizontal,  label: 'My Requests'    },
    { to: '/dashboard/chats',         icon: MessageSquare,   label: 'Chats'          },
    { to: '/dashboard/profile',       icon: User,            label: 'Profile'        },
    { to: '/dashboard/settings',      icon: Settings,        label: 'Settings'       },
  ],
  OWNER: [
    { to: '/dashboard',               icon: LayoutDashboard, label: 'Dashboard'      },
    { to: '/dashboard/listings',      icon: ListChecks,      label: 'My Listings'    },
    { to: '/dashboard/listings/new',  icon: PlusSquare,      label: 'Add Listing'    },
    { to: '/dashboard/requests',      icon: SendHorizontal,  label: 'Requests'       },
    { to: '/dashboard/chats',         icon: MessageSquare,   label: 'Chats'          },
    { to: '/dashboard/analytics',     icon: BarChart2,       label: 'Analytics'      },
    { to: '/dashboard/profile',       icon: User,            label: 'Profile'        },
  ],
  ADMIN: [
    { to: '/dashboard',               icon: LayoutDashboard, label: 'Dashboard'      },
    { to: '/dashboard/users',         icon: Users,           label: 'Users'          },
    { to: '/dashboard/listings',      icon: ListChecks,      label: 'Listings'       },
    { to: '/dashboard/reports',       icon: Flag,            label: 'Reports'        },
    { to: '/dashboard/analytics',     icon: BarChart2,       label: 'Analytics'      },
  ],
};

// ─── Single nav item ───────────────────────────────────────────────────────
function SidebarItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-primary-50 text-primary-700 shadow-sm'
            : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={`shrink-0 transition-colors duration-150 ${
              isActive ? 'text-primary-600' : 'text-surface-400 group-hover:text-surface-600'
            }`}
          />
          <span className="truncate">{label}</span>
          {/* Active indicator bar */}
          {isActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────
/**
 * @param {{ role: 'TENANT' | 'OWNER' | 'ADMIN' }} props
 */
export default function Sidebar({ role }) {
  const items = MENUS[role] ?? MENUS.TENANT;

  return (
    <aside className="flex flex-col h-full bg-white border-r border-surface-100 px-3 py-6 gap-1">
      {/* Section label */}
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-surface-400">
        {role === 'ADMIN' ? 'Admin Panel' : 'My Account'}
      </p>

      <nav className="flex flex-col gap-0.5">
        {items.map((item, idx) => (
          <SidebarItem
            key={idx}
            to={item.to}
            icon={item.icon}
            label={item.label}
            // Only the first item (Dashboard) uses exact matching
            end={idx === 0}
          />
        ))}
      </nav>
    </aside>
  );
}
