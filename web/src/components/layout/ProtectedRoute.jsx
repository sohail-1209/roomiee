// ProtectedRoute — guards routes by authentication status and allowed roles
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * @param {{ allowedRoles?: string[] }} props
 *   allowedRoles — array of role strings (e.g. ['OWNER', 'ADMIN']).
 *   Omit to allow any authenticated user.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ── Auth still resolving ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-3 text-surface-500">
        <Loader2 size={36} className="animate-spin text-primary-600" />
        <p className="text-sm font-medium">Loading…</p>
      </div>
    );
  }

  // ── Not authenticated → go to login, remember return path ─────────────
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Wrong role → back to home ─────────────────────────────────────────
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // ── Authorised ────────────────────────────────────────────────────────
  return children ? children : <Outlet />;
}

