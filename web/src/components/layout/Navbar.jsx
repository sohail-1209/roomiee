// Navbar — fixed top, responsive, auth-aware with notification bell & avatar dropdown
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  Search,
  Users,
  Bell,
  Menu,
  X,
  ChevronDown,
  User,
  LayoutDashboard,
  ListPlus,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/endpoints';

// ─── Desktop NavLink helper ────────────────────────────────────────────────
const DesktopNavLink = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `relative text-sm font-medium px-1 py-0.5 transition-colors duration-200 after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary-600 after:transition-all after:duration-200 ${
        isActive
          ? 'text-primary-600 after:w-full'
          : 'text-surface-600 hover:text-surface-900 after:w-0 hover:after:w-full'
      }`
    }
  >
    {children}
  </NavLink>
);

// ─── Mobile NavLink helper ─────────────────────────────────────────────────
const MobileNavLink = ({ to, icon: Icon, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
        isActive
          ? 'bg-primary-50 text-primary-700'
          : 'text-surface-700 hover:bg-surface-100'
      }`
    }
  >
    <Icon size={18} />
    {children}
  </NavLink>
);

// ─── Navbar ────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Unread notification count — only fetch when logged in
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsAPI.getAll,
    select: (res) => res.data?.data ?? [],
    enabled: !!user,
    refetchInterval: 60_000,
  });
  const unreadCount = notifData?.filter((n) => !n.isRead).length ?? 0;

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const isOwner = user?.role === 'OWNER';

  // Avatar initials fallback
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      {/* ── Main bar ───────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-b border-surface-100 transition-shadow duration-300 ${
          scrolled ? 'shadow-md' : 'shadow-none'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600 text-white">
              <Home size={16} strokeWidth={2.5} />
            </span>
            <span className="font-display font-bold text-xl gradient-text">Roomiee</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            <DesktopNavLink to="/">Home</DesktopNavLink>
            <DesktopNavLink to="/search">Search</DesktopNavLink>
            <DesktopNavLink to="/room-sharing">Room Sharing</DesktopNavLink>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-2">

            {user ? (
              <>
                {/* Notification bell */}
                <Link
                  to="/dashboard/notifications"
                  className="relative btn btn-ghost btn-sm p-2 rounded-xl"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-danger-500 text-white text-[10px] font-bold px-1 leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Avatar dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-surface-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    {/* Avatar */}
                    {user.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-primary-100"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center border-2 border-primary-100">
                        {initials}
                      </span>
                    )}
                    <span className="hidden sm:block text-sm font-medium text-surface-800 max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-surface-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown panel */}
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 card py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-surface-100 mb-1">
                        <p className="text-sm font-semibold text-surface-900 truncate">{user.name}</p>
                        <p className="text-xs text-surface-400 truncate">{user.email}</p>
                      </div>

                      <DropdownItem to="/dashboard/profile" icon={User} onClick={() => setDropdownOpen(false)}>
                        My Profile
                      </DropdownItem>
                      <DropdownItem to="/dashboard" icon={LayoutDashboard} onClick={() => setDropdownOpen(false)}>
                        Dashboard
                      </DropdownItem>
                      {isOwner && (
                        <DropdownItem to="/dashboard/listings" icon={ListPlus} onClick={() => setDropdownOpen(false)}>
                          My Listings
                        </DropdownItem>
                      )}

                      <div className="border-t border-surface-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 rounded-lg transition-colors duration-150"
                        >
                          <LogOut size={15} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Guest buttons */
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="btn-ghost btn-md">Login</Link>
                <Link to="/register" className="btn-primary btn-md">Register</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden btn btn-ghost p-2 rounded-xl"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile slide-out drawer ────────────────────────────────────────── */}
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-16 left-0 right-0 z-30 bg-white border-b border-surface-100 shadow-xl md:hidden transition-transform duration-300 ${
          mobileOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
          <MobileNavLink to="/" icon={Home} onClick={() => setMobileOpen(false)}>Home</MobileNavLink>
          <MobileNavLink to="/search" icon={Search} onClick={() => setMobileOpen(false)}>Search</MobileNavLink>
          <MobileNavLink to="/room-sharing" icon={Users} onClick={() => setMobileOpen(false)}>Room Sharing</MobileNavLink>

          {!user && (
            <div className="pt-3 border-t border-surface-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="btn-outline btn-md w-full justify-center"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="btn-primary btn-md w-full justify-center"
              >
                Register
              </Link>
            </div>
          )}

          {user && (
            <div className="pt-3 border-t border-surface-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-danger-600 hover:bg-danger-50 transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Spacer so content doesn't hide under fixed navbar */}
      <div className="h-16" />
    </>
  );
}

// ─── Dropdown item helper ──────────────────────────────────────────────────
function DropdownItem({ to, icon: Icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 hover:text-surface-900 rounded-lg transition-colors duration-150"
    >
      <Icon size={15} className="text-surface-400" />
      {children}
    </Link>
  );
}
