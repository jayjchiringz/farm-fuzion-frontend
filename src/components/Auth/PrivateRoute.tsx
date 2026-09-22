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
  const { user, isAdmin, isFarmer, isGroupAdmin, loading, userRole } = useAuth();

  console.log('🔐 PrivateRoute - Auth state:', { 
    user: user ? { id: user.id, email: user.email, role_name: user.role_name } : null,
    isAdmin, 
    isFarmer,
    isGroupAdmin,
    userRole,
    loading, 
    path: location.pathname,
    requiredRole
  });

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Define route types based on path patterns
  const isFarmerDashboard = location.pathname.startsWith("/dashboard");
  const isGroupAdminDashboard = location.pathname.startsWith("/group-dashboard");
  const isAdminRoute = location.pathname.startsWith("/admin-dashboard") || 
                       location.pathname.startsWith("/admin/") ||
                       location.pathname.startsWith("/register-farmer");

  // Role-based access guard - Redirect to appropriate dashboard based on role
  if (isFarmerDashboard && !isFarmer) {
    if (isGroupAdmin) {
      return <Navigate to="/group-dashboard" replace />;
    }
    if (isAdmin) {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/admin-dashboard" replace />;
  }

  if (isGroupAdminDashboard && !isGroupAdmin) {
    if (isFarmer) {
      return <Navigate to="/dashboard" replace />;
    }
    if (isAdmin) {
      // Allow admins to access group dashboard for oversight
      // return <Navigate to="/admin-dashboard" replace />;
    }
  }

  if (isAdminRoute && isFarmer) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isAdminRoute && isGroupAdmin && !isAdmin) {
    if (location.pathname === "/admin-dashboard") {
      return <Navigate to="/group-dashboard" replace />;
    }
    return <Navigate to="/group-dashboard" replace />;
  }

  // Check for specific role requirements
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRoleLower = userRole?.toLowerCase();
    
    // Normalize user role for comparison (convert "group admin" to "group_admin")
    const normalizedUserRole = userRoleLower === "group admin" ? "group_admin" : userRoleLower;
    
    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => {
      const normalizedRequired = role.toLowerCase();
      
      // Special handling for group_admin - compare normalized values
      if (normalizedRequired === "group_admin") {
        return normalizedUserRole === "group_admin" || userRoleLower === "group admin" || isGroupAdmin;
      }
      
      // Check using role flags for reliability
      if (normalizedRequired === "admin") {
        return isAdmin;
      }
      if (normalizedRequired === "farmer") {
        return isFarmer;
      }
      
      // Fallback to direct string comparison
      return normalizedUserRole === normalizedRequired;
    });
    
    if (!hasRequiredRole) {
      console.warn(`⛔ Access denied. User role: ${userRole}, Required: ${requiredRoles.join(', ')}`);
      
      // Redirect to appropriate dashboard based on user's actual role
      if (isFarmer) {
        return <Navigate to="/dashboard" replace />;
      }
      if (isGroupAdmin) {
        return <Navigate to="/group-dashboard" replace />;
      }
      if (isAdmin) {
        return <Navigate to="/admin-dashboard" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}
