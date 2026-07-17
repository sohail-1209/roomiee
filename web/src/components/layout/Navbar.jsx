// Navbar — Google M3 style, simplified (icon sidebar handles dashboard nav)
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Home, Search, Bell, Menu, X, ChevronDown, User,
  LayoutDashboard, LogOut, CheckCheck,
  BedDouble, LandPlot, Users,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/endpoints';
import { timeAgo } from '../../utils/helpers';
import Avatar from '../ui/Avatar';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const NAV_ITEMS = [
  {
    label: 'houses', baseType: 'HOUSE_RENTAL', icon: Home, children: [
      { label: 'bhk1', query: { type: 'HOUSE_RENTAL', bhk: '1' } },
      { label: 'bhk2', query: { type: 'HOUSE_RENTAL', bhk: '2' } },
      { label: 'bhk3', query: { type: 'HOUSE_RENTAL', bhk: '3' } },
      { label: 'bhk4', query: { type: 'HOUSE_RENTAL', bhk: '4' } },
      { label: 'allHouses', query: { type: 'HOUSE_RENTAL' } },
    ]
  },
  {
    label: 'rooms', baseType: 'ROOM_SHARING', icon: Users, children: [
      { label: 'person1', query: { type: 'ROOM_SHARING', sharing: '1' } },
      { label: 'person2', query: { type: 'ROOM_SHARING', sharing: '2' } },
      { label: 'person3', query: { type: 'ROOM_SHARING', sharing: '3' } },
      { label: 'allRooms', query: { type: 'ROOM_SHARING' } },
    ]
  },
  {
    label: 'hostels', baseType: 'HOSTEL', icon: BedDouble, children: [
      { label: 'sharing1', query: { type: 'HOSTEL', sharing: '1' } },
      { label: 'sharing2', query: { type: 'HOSTEL', sharing: '2' } },
      { label: 'sharing3', query: { type: 'HOSTEL', sharing: '3' } },
      { label: 'allHostels', query: { type: 'HOSTEL' } },
    ]
  },
  {
    label: 'land', baseType: 'LAND_SALE', icon: LandPlot, children: [
      { label: 'residentialPlot', query: { type: 'LAND_SALE', category: 'residential' } },
      { label: 'commercialPlot', query: { type: 'LAND_SALE', category: 'commercial' } },
      { label: 'farmLand', query: { type: 'LAND_SALE', category: 'farm' } },
      { label: 'allLand', query: { type: 'LAND_SALE' } },
    ]
  },
];

const BROWSE_ITEMS = [
  { to: '/', label: 'home', icon: Home },
  { to: '/search?type=HOUSE_RENTAL', label: 'houses', icon: Home },
  { to: '/search?type=ROOM_SHARING', label: 'rooms', icon: Users },
  { to: '/search?type=HOSTEL', label: 'hostels', icon: BedDouble },
  { to: '/search?type=LAND_SALE', label: 'land', icon: LandPlot },
];

function buildSearchURL(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
  return `/search?${sp.toString()}`;
}

function createRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
  ripple.className = 'ripple';
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  const isNavActive = useCallback((baseType) => {
    return new URLSearchParams(location.search).get('type') === baseType;
  }, [location.search]);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsAPI.getAll,
    select: (res) => res.data?.data ?? [],
    enabled: !!user,
    refetchInterval: 60_000,
  });
  const unreadCount = notifData?.filter((n) => !n.read).length ?? 0;

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

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const activeType = new URLSearchParams(location.search).get('type');

  return (
    <>
      <style>{`
        @keyframes dropdown-pop {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .nav-dropdown-menu {
          opacity: 0;
          visibility: hidden;
          transform: translateY(-4px) scale(0.97);
          transition: opacity 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1), visibility 0.2s;
          pointer-events: none;
        }
        .nav-dropdown-open .nav-dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .nav-dropdown-open > a > .chevron-icon {
          transform: rotate(180deg);
        }
        .chevron-icon {
          transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>

      {/* ── Top Bar ──────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-md border-b border-surface-100/50'
          : 'bg-white/80 backdrop-blur-md'
          }`}
      >
        <nav className="px-4 sm:px-6 h-14 md:h-20 flex items-center justify-between gap-4">
          {/* Left: hamburger + logo + quick link */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Hamburger — hidden on dashboard pages (icon sidebar handles nav) */}
            {!isDashboard && (
              <button
                className="md:hidden p-2 -ml-2 rounded-xl hover:bg-surface-100 active:bg-surface-100 transition-colors"
                onClick={(e) => { createRipple(e); setMobileOpen((v) => !v); }}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}

            <Link to="/" className="shrink-0 group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 ring-2 ring-white/60 ring-offset-1 ring-offset-primary-50" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.25), rgba(20,184,166,0.15))', backdropFilter: 'blur(12px) saturate(1.8)', WebkitBackdropFilter: 'blur(12px) saturate(1.8)', border: '1px solid rgba(255,255,255,0.5)' }}>
                <img src="https://res.cloudinary.com/dldgj84bm/image/upload/v1784198779/ChatGPT_Image_Jul_16_2026_04_15_03_PM_wtomms.png" alt="Quikden" className="w-7 h-7 md:w-9 md:h-9 object-cover rounded-full" />
              </div>
            </Link>

            {/* Quick link: Dashboard on public pages, Home on dashboard pages */}
            {user && (
              <Link
                to={isDashboard ? '/' : '/dashboard'}
                className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold transition-colors active:bg-primary-100"
              >
                {isDashboard ? <Home size={13} /> : <LayoutDashboard size={13} />}
                {isDashboard ? t('home') : t('dashboard')}
              </Link>
            )}
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5 bg-surface-100/70 rounded-full px-1.5 py-1">
            <Link
              to="/"
              className={`ripple-container px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${location.pathname === '/' && !location.search ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-500 hover:text-surface-800 hover:bg-white/50'
                }`              }
            >
              {t('home')}
            </Link>

            {NAV_ITEMS.map((item, idx) => {
              const active = isNavActive(item.baseType);
              return (
                <div
                  key={item.baseType}
                  className="relative"
                  data-nav-dropdown={idx}
                  onMouseEnter={() => {
                    clearTimeout(document._navTimers?.[idx]);
                    document._navTimers = document._navTimers || {};
                    document._navTimers[idx] = setTimeout(() => {
                      document.querySelectorAll(`[data-nav-dropdown]`).forEach((el) => el.classList.remove('nav-dropdown-open'));
                      document.querySelector(`[data-nav-dropdown="${idx}"]`)?.classList.add('nav-dropdown-open');
                    }, 100);
                  }}
                  onMouseLeave={() => {
                    clearTimeout(document._navTimers?.[idx]);
                    document._navTimers = document._navTimers || {};
                    document._navTimers[idx] = setTimeout(() => {
                      document.querySelector(`[data-nav-dropdown="${idx}"]`)?.classList.remove('nav-dropdown-open');
                    }, 250);
                  }}
                >
                  <Link
                    to={buildSearchURL({ type: item.baseType })}
                    onClick={createRipple}
                    className={`ripple-container flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${active ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-500 hover:text-surface-800 hover:bg-white/50'
                      }`}
                  >
                    {t(item.label)}
                    <ChevronDown size={13} className="chevron-icon" />
                  </Link>

                  <div className="nav-dropdown-menu absolute left-1/2 -translate-x-1/2 top-full pt-2 w-52 z-50">
                    <div className="bg-white rounded-2xl border border-surface-200/60 py-1.5" style={{ boxShadow: 'var(--md-sys-elevation-3)' }}>
                      <div className="px-3.5 py-2 border-b border-surface-100 mb-1">
                        <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">{t(item.label)}</p>
                      </div>
                      {item.children.map((child, i) => (
                        <Link
                          key={child.label}
                          to={buildSearchURL(child.query)}
                          style={{ animationDelay: `${i * 30}ms` }}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-surface-600 hover:bg-primary-50 hover:text-primary-700 transition-colors rounded-lg mx-1.5"
                        >
                          <item.icon size={14} className="text-surface-400 group-hover:text-primary-500" />
                          {t(child.label)}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    className="relative p-2.5 rounded-xl hover:bg-surface-100 active:bg-surface-200 transition-colors"
                    onClick={() => setNotifOpen((v) => !v)}
                  >
                    <Bell size={20} className="text-surface-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-danger-500 text-white text-[9px] font-bold px-1 animate-glow">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-h-[70vh] rounded-2xl bg-white border border-surface-200/60 py-0 z-50 overflow-hidden" style={{ boxShadow: 'var(--md-sys-elevation-4)' }}>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
                        <h3 className="font-semibold text-surface-900 text-sm">{t('notifications')}</h3>
                        {unreadCount > 0 && (
                          <button onClick={() => markAllAsRead.mutate()} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                            <CheckCheck size={14} /> {t('markAllRead')}
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto max-h-[60vh]">
                        {notifData?.length === 0 ? (
                          <div className="px-4 py-10 text-center text-surface-400 text-sm">
                            <Bell size={32} className="mx-auto mb-2 opacity-30" />
                            <p>{t('noNotifications')}</p>
                          </div>
                        ) : (
                          notifData?.slice(0, 20).map((notif, i) => (
                            <button
                              key={notif.id}
                              onClick={() => {
                                markAsRead.mutate(notif.id);
                                if (notif.data?.chatId) navigate(`/dashboard/chats/${notif.data.chatId}`);
                                else if (notif.data?.requestId) navigate('/dashboard/requests');
                                else if (notif.data?.listingId) navigate(`/listing/${notif.data.listingId}`);
                                setNotifOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-surface-50 active:bg-surface-100 transition-colors border-b border-surface-50 last:border-0 ${!notif.read ? 'bg-primary-50/30' : ''}`}
                              style={{ animation: `slide-up 0.3s cubic-bezier(0.16,1,0.3,1) ${i * 30}ms both` }}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.read ? 'bg-primary-500' : 'bg-surface-300'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-surface-900">{notif.title}</p>
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

                {/* Avatar */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-surface-100 active:bg-surface-200 transition-colors"
                  >
                    <Avatar src={user.profileImage} name={user.name} size="sm" />
                    <ChevronDown size={14} className={`text-surface-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-surface-200/60 py-1.5 z-50" style={{ boxShadow: 'var(--md-sys-elevation-3)' }}>
                      <div className="px-4 py-3 border-b border-surface-100 mb-1">
                        <p className="text-sm font-semibold text-surface-900 truncate">{user.name}</p>
                        <p className="text-xs text-surface-400 truncate">{user.email}</p>
                      </div>
                      {[
                        { to: '/dashboard/profile', icon: User, label: t('myProfile') },
                        { to: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
                      ].map(({ to, icon: Icon, label }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 active:bg-surface-100 transition-colors"
                        >
                          <Icon size={16} className="text-surface-400" />
                          {label}
                        </Link>
                      ))}
                      <div className="border-t border-surface-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                        >
                          <LogOut size={16} />
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors rounded-full hover:bg-surface-100">{t('login')}</Link>
                <Link to="/register" className="btn-primary btn-sm ripple-container" onClick={createRipple}>{t('signup')}</Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* ── Mobile Drawer — Public pages only (browse items) ──── */}
      {mobileOpen && !isDashboard && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-14 left-0 right-0 bg-white border-b border-surface-100 p-3 space-y-0.5 z-50 animate-slide-down max-h-[calc(100dvh-3.5rem)] overflow-y-auto" style={{ boxShadow: 'var(--md-sys-elevation-4)' }}>
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-surface-400">
              {t('explore')}
            </p>

            {BROWSE_ITEMS.map(({ to, label, icon: Icon }, i) => {
              const toType = new URLSearchParams(to.split('?')[1]).get('type');
              const isActive = toType === activeType;

              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-surface-700 hover:bg-surface-50 active:bg-surface-100'
                  }`}
                  style={{ animation: `slide-up 0.3s cubic-bezier(0.16,1,0.3,1) ${i * 35}ms both` }}
                >
                  <Icon size={18} className={isActive ? 'text-primary-600' : 'text-surface-400'} />
                  {t(label)}
                </Link>
              );
            })}

            {!user && (
              <div className="pt-3 mt-1 border-t border-surface-100 flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-outline btn-md w-full justify-center">{t('login')}</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary btn-md w-full justify-center">{t('signup')}</Link>
              </div>
            )}

            {user && (
              <div className="pt-2 mt-1 border-t border-surface-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                >
                  <LogOut size={18} />
                  {t('logout')}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ── Install FAB (mobile, not logged in or no install) ────── */}
      {!user && installPrompt && (
        <button
          onClick={handleInstall}
          className="fixed bottom-6 right-6 z-50 md:hidden w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center animate-bounce-subtle"
        >
          <Download size={22} />
        </button>
      )}

      {/* Spacer for fixed top navbar */}
      <div className="h-14" />
    </>
  );
}
