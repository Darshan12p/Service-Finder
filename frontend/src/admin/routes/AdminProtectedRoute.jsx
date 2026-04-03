import { Navigate, useLocation } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const location = useLocation();

  // ✅ admin session only (no user)
  const admin = JSON.parse(localStorage.getItem("admin") || "null");
  const adminToken = localStorage.getItem("adminToken") || admin?.token;

  // not logged in as admin
  if (!adminToken || admin?.role !== "admin") {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
};

export default AdminProtectedRoute;