// DashboardLayout — collapsible sidebar (desktop) + quick-nav + bottom bar (mobile)
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileQuickNav from './MobileQuickNav';
import BottomNavbar from './BottomNavbar';
import { useAuth } from '../../context/AuthContext';

const STORAGE_KEY = 'sidebar-collapsed';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  const role = user?.role ?? 'TENANT';

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch { /* noop */ }
  }, [collapsed]);

  return (
    <>
      <Navbar />
      <div className="lg:pt-9 min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-5rem)] flex flex-col bg-surface-50">

        {/* ── Mobile quick-nav row ──────────────────────────────────────── */}
        <MobileQuickNav />

        <div className="flex flex-1">
          {/* ── Collapsible sidebar (desktop, ≥ lg) ───────────────────── */}
          <div className="hidden lg:flex lg:flex-shrink-0">
            <div
              className={`flex flex-col sticky top-20 h-[calc(100vh-5rem)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${collapsed ? 'w-[68px]' : 'w-60'
                }`}
            >
              <Sidebar
                role={role}
                collapsed={collapsed}
                onToggle={() => setCollapsed((v) => !v)}
              />
            </div>
          </div>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1 p-3 sm:p-4 lg:p-8 pb-20 lg:pb-8">
              {children ? children : <Outlet />}
            </main>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom navbar ────────────────────────────────────────── */}
      <BottomNavbar />
    </>
  );
}
