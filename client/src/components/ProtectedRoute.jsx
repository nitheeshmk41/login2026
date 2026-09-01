import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isAdminRole, isCoordinatorRole, isRegistrationDeskRole } from '../store/authStore';
import { Loader2 } from 'lucide-react';

/**
 * 4-role model:
 *  requireRole="admin"       → admin
 *  requireRole="coordinator" → coordinator
 *  requireRole="participant" → participant
 *  requireRole="alumni"      → alumni (not used for portal login)
 *  (no requireRole)          → any authenticated user
 */
export const ProtectedRoute = ({ children, requireRole }) => {
  const { isAuthenticated, isInitialized, survivor } = useAuthStore();

  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#050505]">
        <Loader2 className="w-12 h-12 text-[#D90429] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole) {
    const userRole = survivor?.role || 'participant';
    const isAdmin = isAdminRole(userRole);
    const isDesk = isRegistrationDeskRole(userRole);
    const isCoord = isCoordinatorRole(userRole);
    const isParticipant = userRole === 'participant';

    if (requireRole === 'admin') {
      if (!isAdmin && !isDesk) return <Navigate to="/dashboard" replace />;
    } else if (requireRole === 'coordinator') {
      if (!isAdmin && !isDesk && !isCoord) return <Navigate to="/dashboard" replace />;
    } else if (requireRole === 'participant') {
      if (isAdmin || isDesk) return <Navigate to="/dashboard/admin" replace />;
      if (isCoord) return <Navigate to="/dashboard/coordinator" replace />;
      if (!isParticipant) return <Navigate to="/" replace />;
    } else if (requireRole === 'alumni') {
      return <Navigate to="/" replace />;
    }
  }

  return children || <Outlet />;
};
