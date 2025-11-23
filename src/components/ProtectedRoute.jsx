// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, role }) {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const storedRole = localStorage.getItem("role");

  // Not logged in at all
  if (!user || !storedRole) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role trying to access wrong dashboard
  if (storedRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
