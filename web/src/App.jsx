// Main App — routing + providers
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages — lazy loaded for performance
import { lazy, Suspense } from 'react';
const HomePage       = lazy(() => import('./pages/HomePage'));
const SearchPage     = lazy(() => import('./pages/SearchPage'));
const ListingDetail  = lazy(() => import('./pages/ListingDetail'));
const RoomDetail     = lazy(() => import('./pages/RoomDetail'));
const LoginPage      = lazy(() => import('./pages/LoginPage'));
const RegisterPage   = lazy(() => import('./pages/RegisterPage'));
const ChatPage       = lazy(() => import('./pages/ChatPage'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage'));

// Dashboards
const TenantDashboard = lazy(() => import('./pages/dashboard/TenantDashboard'));
const OwnerDashboard  = lazy(() => import('./pages/dashboard/OwnerDashboard'));
const RequestsPage    = lazy(() => import('./pages/dashboard/RequestsPage'));
const SavedPage       = lazy(() => import('./pages/dashboard/SavedPage'));
const MyListingsPage  = lazy(() => import('./pages/dashboard/MyListingsPage'));
const CreateListing   = lazy(() => import('./pages/dashboard/CreateListing'));
const AnalyticsPage   = lazy(() => import('./pages/dashboard/AnalyticsPage'));

// Admin
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'));

// ─── Smart Dashboard redirect based on role ───────────
import { useAuth } from './context/AuthContext';

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'OWNER') return <Navigate to="/dashboard/owner" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard/tenant" replace />;
};

// ─── Page loading fallback ─────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-surface-400 font-medium">Loading…</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* ─ Public ─ */}
                <Route path="/"         element={<HomePage />} />
                <Route path="/search"   element={<SearchPage />} />
                <Route path="/listing/:id" element={<ListingDetail />} />
                <Route path="/room/:id"    element={<RoomDetail />} />
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* ─ Dashboard redirect ─ */}
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['TENANT', 'OWNER', 'ADMIN']}>
                    <DashboardRedirect />
                  </ProtectedRoute>
                } />

                {/* ─ Dashboard Layout Group ─ */}
                <Route element={
                  <ProtectedRoute allowedRoles={['TENANT', 'OWNER', 'ADMIN']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  {/* Tenant */}
                  <Route path="/dashboard/tenant" element={
                    <ProtectedRoute allowedRoles={['TENANT']}>
                      <TenantDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/saved" element={
                    <ProtectedRoute allowedRoles={['TENANT']}>
                      <SavedPage />
                    </ProtectedRoute>
                  } />

                  {/* Owner */}
                  <Route path="/dashboard/owner" element={
                    <ProtectedRoute allowedRoles={['OWNER']}>
                      <OwnerDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/listings" element={
                    <ProtectedRoute allowedRoles={['OWNER']}>
                      <MyListingsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/listings/new" element={
                    <ProtectedRoute allowedRoles={['OWNER']}>
                      <CreateListing />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/listings/:id/edit" element={
                    <ProtectedRoute allowedRoles={['OWNER']}>
                      <CreateListing />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/analytics" element={
                    <ProtectedRoute allowedRoles={['OWNER']}>
                      <AnalyticsPage />
                    </ProtectedRoute>
                  } />

                  {/* Shared (both roles) */}
                  <Route path="/dashboard/requests" element={
                    <ProtectedRoute allowedRoles={['TENANT', 'OWNER']}>
                      <RequestsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/chats" element={
                    <ProtectedRoute allowedRoles={['TENANT', 'OWNER']}>
                      <ChatPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/chats/:id" element={
                    <ProtectedRoute allowedRoles={['TENANT', 'OWNER']}>
                      <ChatPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/profile" element={
                    <ProtectedRoute allowedRoles={['TENANT', 'OWNER']}>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                </Route>

                {/* ─ Admin ─ */}
                <Route path="/admin/*" element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                {/* ─ 404 ─ */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>

            {/* Global toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: { fontFamily: 'Inter, sans-serif', fontSize: '14px', borderRadius: '12px' },
              }}
            />
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
