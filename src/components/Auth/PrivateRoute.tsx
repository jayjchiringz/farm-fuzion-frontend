import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function PrivateRoute({ children }: { children: React.ReactElement }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) return <Navigate to="/login" replace />;

  // Role-based access guard
  const isFarmerDashboard = location.pathname.startsWith("/dashboard");
  const isAdminRoute = location.pathname.startsWith("/admin-dashboard") || location.pathname.startsWith("/register-farmer");

  if (isFarmerDashboard && user.role !== "farmer") {
    return <Navigate to="/admin-dashboard" replace />;
  }

  if (isAdminRoute && user.role === "farmer") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
