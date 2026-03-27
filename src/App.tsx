// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import Dashboard from "./pages/Dashboard";
import GroupAdminDashboard from "./pages/GroupAdminDashboard";
import PrivateRoute from "./components/Auth/PrivateRoute";
import MainLayout from "./layouts/MainLayout";
import RegisterFarmerUnderGroup from "./pages/RegisterFarmerUnderGroup";
import Loans from "./pages/Loans";
import LoanRepayments from "./pages/LoanRepayments";
import AdminDashboard from "./pages/AdminDashboard";
import UserRoleManagement from './pages/admin/UserRoleManagement';
import PublicMarketplace from "./pages/PublicMarketplace";

import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CurrencyProvider } from './contexts/CurrencyContext';

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <MainLayout>
          <Routes>
            <Route path="/" element={<RedirectBasedOnAuth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<VerifyOtp />} />

            {/* Farmer only routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute requiredRole="farmer">
                  <Dashboard />
                </PrivateRoute>
              }
            />
            
            {/* Group Admin routes - Cooperative/Group Dashboard */}
            <Route
              path="/group-dashboard"
              element={
                <PrivateRoute requiredRole="group_admin">
                  <GroupAdminDashboard />
                </PrivateRoute>
              }
            />
            
            {/* Admin only routes */}
            <Route
              path="/admin-dashboard"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/admin/users/roles"
              element={
                <PrivateRoute requiredRole="admin">
                  <UserRoleManagement />
                </PrivateRoute>
              }
            />
            
            {/* Routes accessible by both admin and group_admin */}
            <Route
              path="/register-farmer"
              element={
                <PrivateRoute requiredRole={['admin', 'group_admin']}>
                  <RegisterFarmerUnderGroup />
                </PrivateRoute>
              }
            />
            
            {/* Public routes (still require authentication but no specific role) */}
            <Route path="/loans" element={
              <PrivateRoute>
                <Loans />
              </PrivateRoute>
            } />
            
            <Route path="/repayments/:loanId" element={
              <PrivateRoute>
                <LoanRepayments />
              </PrivateRoute>
            } />

            <Route path="/marketplace" element={<PublicMarketplace />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </MainLayout>
      </CurrencyProvider>
    </AuthProvider>
  );
}

// Separate component to use the auth context
function RedirectBasedOnAuth() {
  const { user, isFarmer, isAdmin, isGroupAdmin, userRole } = useAuth();
  
  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Log the user role for debugging
  console.log("🔐 RedirectBasedOnAuth - User role:", userRole, "isGroupAdmin:", isGroupAdmin);

  // Redirect based on role name from database
  if (isFarmer) {
    return <Navigate to="/dashboard" replace />;
  }

  // Group Admin - redirect to their cooperative dashboard
  if (isGroupAdmin) {
    return <Navigate to="/group-dashboard" replace />;
  }

  // Admin and super admin go to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  // For any other roles, default to admin dashboard
  console.warn("⚠️ Unknown user role, defaulting to admin dashboard:", userRole);
  return <Navigate to="/admin-dashboard" replace />;
}
