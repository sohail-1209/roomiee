// Main App — routing + providers
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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
const HostelDetail   = lazy(() => import('./pages/HostelDetail'));
const LandDetail     = lazy(() => import('./pages/LandDetail'));
const LoginPage      = lazy(() => import('./pages/LoginPage'));
const RegisterPage   = lazy(() => import('./pages/RegisterPage'));
const CompleteProfilePage = lazy(() => import('./pages/CompleteProfilePage'));
const VerifyEmailPage     = lazy(() => import('./pages/VerifyEmailPage'));
const ChatPage       = lazy(() => import('./pages/ChatPage'));
const ProfilePage    = lazy(() => import('./pages/ProfilePage'));
const AboutPage      = lazy(() => import('./pages/AboutPage'));

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

// Xiayoki Chatbot
import XiayokiChatbot from './components/xiayoki/XiayokiChatbot';

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
const PageLoader = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50">
      <div className="flex flex-col items-center gap-4">
        {/* Animated house icon */}
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
            {/* House body */}
            <rect x="16" y="30" width="32" height="24" rx="3" fill="#e2e8f0" stroke="#0d9488" strokeWidth="2">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </rect>
            {/* Roof */}
            <path d="M12 32 L32 14 L52 32" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <animate attributeName="stroke-dasharray" values="0,100;60,40;0,100" dur="2.5s" repeatCount="indefinite" />
            </path>
            {/* Door */}
            <rect x="27" y="38" width="10" height="16" rx="2" fill="#0d9488" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" repeatCount="indefinite" />
            </rect>
            {/* Window */}
            <rect x="19" y="34" width="6" height="6" rx="1" fill="#0d9488" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.8s" repeatCount="indefinite" />
            </rect>
            <rect x="39" y="34" width="6" height="6" rx="1" fill="#0d9488" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.8s" begin="0.3s" repeatCount="indefinite" />
            </rect>
          </svg>
          {/* Floating dots */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="absolute -top-2 right-3 w-1.5 h-1.5 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="absolute top-0 -right-2 w-1 h-1 bg-primary-200 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-sm font-semibold text-surface-700">{t('loading')}</p>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

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
                <Route path="/about"    element={<AboutPage />} />
                <Route path="/listing/:id" element={<ListingDetail />} />
                <Route path="/room/:id"    element={<RoomDetail />} />
                <Route path="/hostel/:id"  element={<HostelDetail />} />
                <Route path="/land/:id"    element={<LandDetail />} />
                <Route path="/login"    element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/complete-profile" element={<CompleteProfilePage />} />

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
                    <ProtectedRoute allowedRoles={['TENANT', 'OWNER']}>
                      <SavedPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/my-listings" element={
                    <ProtectedRoute allowedRoles={['TENANT']}>
                      <MyListingsPage />
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
                    <ProtectedRoute allowedRoles={['OWNER', 'TENANT']}>
                      <CreateListing />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard/listings/:id/edit" element={
                    <ProtectedRoute allowedRoles={['OWNER', 'TENANT']}>
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

            {/* Global toast notifications — Glass style */}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3500,
                style: {
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(20px) saturate(1.8)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.5), 0 8px 32px rgba(0,0,0,0.1)',
                  padding: '12px 16px',
                  color: '#1e293b',
                },
                success: {
                  iconTheme: { primary: '#0d9488', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#fff' },
                },
              }}
            />

            {/* Xiayoki AI Chatbot */}
            <XiayokiChatbot />

          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
