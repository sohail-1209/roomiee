// DashboardLayout — full sidebar (desktop) + quick-nav + bottom bar (mobile)
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileQuickNav from './MobileQuickNav';
import BottomNavbar from './BottomNavbar';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  const role = user?.role ?? 'TENANT';

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col bg-surface-50">

        {/* ── Mobile quick-nav row ──────────────────────────────────────── */}
        <MobileQuickNav />

        <div className="flex flex-1">
          {/* ── Full sidebar (desktop, ≥ lg) ────────────────────────────── */}
          <div className="hidden lg:flex lg:flex-shrink-0">
            <div className="w-60 flex flex-col sticky top-14 h-[calc(100vh-3.5rem)]">
              <Sidebar role={role} />
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
