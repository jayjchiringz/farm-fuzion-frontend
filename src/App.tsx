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
import { AuthProvider } from "./contexts/AuthContext";
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

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/admin-dashboard"
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/register-farmer"
              element={
                <PrivateRoute>
                  <RegisterFarmerUnderGroup />
                </PrivateRoute>
              }
            />
            
            <Route path="/loans" element={<Loans />} />
            <Route path="/repayments/:loanId" element={<LoanRepayments />} />
            
            <Route 
              path="/admin/users/roles" 
              element={
                <PrivateRoute>
                  <UserRoleManagement />
                </PrivateRoute>
              } 
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </MainLayout>
      </CurrencyProvider>
    </AuthProvider>
  );
}

function RedirectBasedOnAuth() {
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "farmer") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/admin-dashboard" replace />;
}