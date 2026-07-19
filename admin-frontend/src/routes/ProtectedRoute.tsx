import { Navigate, Outlet, useLocation } from "react-router-dom";

type ProtectedRouteProps = {
  isAuthenticated: boolean;
};

export function ProtectedRoute({ isAuthenticated }: ProtectedRouteProps) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
