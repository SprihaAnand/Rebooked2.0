import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import PageLoader from "../common/PageLoader";

export const RequireAuth = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Restoring your secure session…" />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
};

export const RequireRole = ({ roles }) => {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

export const GuestOnly = () => {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <PageLoader label="Loading…" />;
  return isAuthenticated && user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};
