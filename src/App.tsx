// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/Auth/PrivateRoute";
import MainLayout from "./layouts/MainLayout";
import RegisterFarmerUnderGroup from "./pages/RegisterFarmerUnderGroup";
import Loans from "./pages/Loans";
import LoanRepayments from "./pages/LoanRepayments";
import AdminDashboard from "./pages/AdminDashboard";
import UserRoleManagement from './pages/admin/UserRoleManagement';

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
            
            {/* Routes accessible by both admin and sacco */}
            <Route
              path="/register-farmer"
              element={
                <PrivateRoute requiredRole={['admin', 'sacco']}>
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
  const { user, isFarmer, isAdmin } = useAuth();
  
  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role name from database
  if (isFarmer) {
    return <Navigate to="/dashboard" replace />;
  }

  // Admin and any other roles go to admin dashboard
  // This can be expanded later for SACCO-specific dashboards
  if (isAdmin) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  // For any other roles (like sacco), send to admin dashboard for now
  // Later we can add a SACCO-specific dashboard
  return <Navigate to="/admin-dashboard" replace />;
}
