// Navbar — fixed top, responsive, auth-aware with notification bell & avatar dropdown
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
  CheckCheck,
  Download,
  BedDouble,
  LandPlot,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/endpoints';
import { timeAgo } from '../../utils/helpers';
import Avatar from '../ui/Avatar';

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
  const queryClient = useQueryClient();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);

  // PWA install prompt — store globally
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      window.__deferredInstallPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPrompt || window.__deferredInstallPrompt;
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        window.__deferredInstallPrompt = null;
        setDeferredPrompt(null);
      }
    } else {
      // Fallback: show instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in window);
      if (isIOS) {
        toast('To install: Tap Share → "Add to Home Screen"', { duration: 5000, icon: '📱' });
      } else {
        toast('To install: tap ⋮ menu → "Add to Home screen"', { duration: 5000, icon: '📱' });
      }
    }
  };

  const showInstall = !isStandalone && (isInstallable || window.innerWidth < 768);

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
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
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
  const unreadCount = notifData?.filter((n) => !n.read).length ?? 0;

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: (id) => notificationsAPI.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const isOwner = user?.role === 'OWNER';

  return (
    <>
      {/* ── Main bar ───────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-40 bg-surface-50/80 backdrop-blur-xl border-b border-surface-100/60 transition-shadow duration-300 ${
          scrolled ? 'shadow-md' : 'shadow-none'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600 text-white">
              <Home size={16} strokeWidth={2.5} />
            </span>
            <span className="font-display font-bold text-xl gradient-text">Houziee</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            <DesktopNavLink to="/">Home</DesktopNavLink>
            <DesktopNavLink to="/search">Search</DesktopNavLink>
            <DesktopNavLink to="/search?type=ROOM_SHARING">Room Sharing</DesktopNavLink>
            <DesktopNavLink to="/search?type=HOSTEL">Hostels</DesktopNavLink>
            <DesktopNavLink to="/search?type=LAND_SALE">Land Sale</DesktopNavLink>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-2">

            {user ? (
              <>
                {/* Notification bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    className="relative btn btn-ghost btn-sm p-2 rounded-xl"
                    aria-label="Notifications"
                    onClick={() => setNotifOpen((v) => !v)}
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-danger-500 text-white text-[10px] font-bold px-1 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-96 card py-0 z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
                        <h3 className="font-semibold text-surface-900 text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead.mutate()}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                          >
                            <CheckCheck size={14} />
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto max-h-72">
                        {notifData?.length === 0 ? (
                          <div className="px-4 py-8 text-center text-surface-400 text-sm">
                            No notifications yet
                          </div>
                        ) : (
                          notifData?.slice(0, 20).map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => {
                                markAsRead.mutate(notif.id);
                                if (notif.data?.chatId) {
                                  navigate(`/dashboard/chats/${notif.data.chatId}`);
                                } else if (notif.data?.requestId) {
                                  navigate('/dashboard/requests');
                                } else if (notif.data?.listingId) {
                                  navigate(`/listing/${notif.data.listingId}`);
                                }
                                setNotifOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-surface-50 transition-colors border-b border-surface-50 ${
                                !notif.read ? 'bg-primary-50/40' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                  !notif.read ? 'bg-primary-500' : 'bg-transparent'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-surface-900">{notif.title}</p>
                                  <p className="text-sm text-surface-600 line-clamp-2 mt-0.5">{notif.body}</p>
                                  <p className="text-xs text-surface-400 mt-1">{timeAgo(notif.createdAt)}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-surface-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    {/* Avatar */}
                    <Avatar src={user.profileImage} name={user.name} size="sm" className="border-2 border-primary-100" />
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
                {showInstall && (
                  <button onClick={handleInstall} className="btn-outline btn-md flex items-center gap-1.5">
                    <Download size={15} /> Install App
                  </button>
                )}
                <Link to="/login" className="btn-ghost btn-md">Login</Link>
                <Link to="/register" className="btn-primary btn-md">Register</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <div className="flex items-center gap-1 md:hidden">
              {showInstall && (
                <button onClick={handleInstall} className="btn btn-ghost p-2 rounded-xl" aria-label="Install App">
                  <Download size={20} />
                </button>
              )}
              <button
                className="btn btn-ghost p-2 rounded-xl"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
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
        className={`fixed top-16 left-0 right-0 z-30 bg-surface-50/95 backdrop-blur-xl border-b border-surface-100/60 shadow-xl md:hidden transition-transform duration-300 ${
          mobileOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
          <MobileNavLink to="/" icon={Home} onClick={() => setMobileOpen(false)}>Home</MobileNavLink>
          <MobileNavLink to="/search" icon={Search} onClick={() => setMobileOpen(false)}>Search</MobileNavLink>
          <MobileNavLink to="/search?type=ROOM_SHARING" icon={Users} onClick={() => setMobileOpen(false)}>Room Sharing</MobileNavLink>
          <MobileNavLink to="/search?type=HOSTEL" icon={BedDouble} onClick={() => setMobileOpen(false)}>Hostels</MobileNavLink>
          <MobileNavLink to="/search?type=LAND_SALE" icon={LandPlot} onClick={() => setMobileOpen(false)}>Land Sale</MobileNavLink>

          {!user && (
            <div className="pt-3 border-t border-surface-100 flex flex-col gap-2">
              {showInstall && (
                <button
                  onClick={() => { handleInstall(); setMobileOpen(false); }}
                  className="btn-outline btn-md w-full justify-center flex items-center gap-2"
                >
                  <Download size={16} /> Install App
                </button>
              )}
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
            <div className="pt-3 border-t border-surface-100 space-y-2">
              {showInstall && (
                <button
                  onClick={() => { handleInstall(); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  <Download size={18} />
                  Install App
                </button>
              )}
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
