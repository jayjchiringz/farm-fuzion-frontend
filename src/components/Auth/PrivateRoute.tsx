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
    // Farmer trying to access farmer dashboard but not a farmer
    if (isGroupAdmin) {
      return <Navigate to="/group-dashboard" replace />;
    }
    if (isAdmin) {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/admin-dashboard" replace />;
  }

  if (isGroupAdminDashboard && !isGroupAdmin) {
    // Non-group admin trying to access group dashboard
    if (isFarmer) {
      return <Navigate to="/dashboard" replace />;
    }
    if (isAdmin) {
      // Admins can also access group dashboard? Maybe they should be able to view all
      // For now, allow admins to access group dashboard
      // return <Navigate to="/admin-dashboard" replace />;
      // Uncomment the line above if you want to restrict admins from group dashboard
    }
    // If admin, allow access (optional - for oversight)
  }

  if (isAdminRoute && isFarmer) {
    // Farmer trying to access admin routes
    return <Navigate to="/dashboard" replace />;
  }

  if (isAdminRoute && isGroupAdmin && !isAdmin) {
    // Group admin trying to access super admin routes
    // Group admins should not have access to super admin features
    if (location.pathname === "/admin-dashboard") {
      // Group admin trying to access main admin dashboard - redirect to group dashboard
      return <Navigate to="/group-dashboard" replace />;
    }
    // For other admin routes, restrict access
    return <Navigate to="/group-dashboard" replace />;
  }

  // Check for specific role requirements
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRoleLower = userRole?.toLowerCase();
    
    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => 
      role.toLowerCase() === userRoleLower ||
      (role.toLowerCase() === 'admin' && isAdmin) ||
      (role.toLowerCase() === 'farmer' && isFarmer) ||
      (role.toLowerCase() === 'group_admin' && isGroupAdmin)
    );
    
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
