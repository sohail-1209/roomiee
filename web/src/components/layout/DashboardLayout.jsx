// DashboardLayout — persistent sidebar (desktop) + collapsible drawer (mobile)
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const role = user?.role ?? 'TENANT';

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-4rem)] flex bg-surface-50">

      {/* ── Desktop sidebar (always visible ≥ lg) ────────────────────────── */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-60 flex flex-col sticky top-16 h-[calc(100vh-4rem)]">
          <Sidebar role={role} />
        </div>
      </div>

      {/* ── Mobile sidebar overlay ────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-16 left-0 bottom-0 z-40 w-64 transition-transform duration-300 ease-in-out lg:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar role={role} />
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar with hamburger */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-surface-100 sticky top-16 z-20">
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className="btn btn-ghost p-2 rounded-xl"
            aria-label={drawerOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-sm font-semibold text-surface-700">
            {role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}
          </span>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
    </>
  );
}

