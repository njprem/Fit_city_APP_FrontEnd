import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken, getUser } from "../services/auth/authService";

export default function RequireAuth() {
  const token = getToken();
  const user = getUser();
  const location = useLocation();

  // If not logged in → send to unauthorized gate
  if (!token || !user) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  // Extract role (check both role_name and roles[0])
  const role =
    user.role_name ||
    (Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0].role_name : null);

  // Role-based redirect
  if (role === "admin") {
    return <Outlet />; // allow admin pages
  }

  // For regular users, allow access to protected routes
  if (role === "user") {
    return <Outlet />; // allow user access to protected routes
  }

  // Fallback for unknown roles
  return <Navigate to="/unauthorized" replace state={{ from: location }} />;
}
