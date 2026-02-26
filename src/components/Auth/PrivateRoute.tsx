// src/components/Auth/PrivateRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface PrivateRouteProps {
  children: React.ReactElement;
  requiredRole?: string | string[]; // Optional: require specific role(s)
}

export default function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  const location = useLocation();
  const { user, isAdmin, isFarmer, loading } = useAuth();

  console.log('🔐 PrivateRoute - Auth state:', { 
    user: user ? { id: user.id, email: user.email, role_name: user.role_name } : null,
    isAdmin, 
    isFarmer, 
    loading, 
    path: location.pathname,
    requiredRole
  });

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
    </div>;
  }

  // Define route types based on path patterns
  const isFarmerDashboard = location.pathname.startsWith("/dashboard");
  const isAdminRoute = location.pathname.startsWith("/admin-dashboard") || 
                       location.pathname.startsWith("/register-farmer") ||
                       location.pathname.startsWith("/admin/");

  // Role-based access guard
  if (isFarmerDashboard && !isFarmer) {
    // If trying to access farmer dashboard but not a farmer
    return <Navigate to="/admin-dashboard" replace />;
  }

  if (isAdminRoute && isFarmer) {
    // If trying to access admin routes but is a farmer
    return <Navigate to="/dashboard" replace />;
  }

  // Check for specific role requirements
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRole = user.role_name?.toLowerCase();
    
    if (!userRole || !requiredRoles.some(role => role.toLowerCase() === userRole)) {
      // User doesn't have required role, redirect to appropriate dashboard
      return <Navigate to={isFarmer ? "/dashboard" : "/admin-dashboard"} replace />;
    }
  }

  return children;
}
