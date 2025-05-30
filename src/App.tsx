// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/Auth/PrivateRoute";
import MainLayout from "./layouts/MainLayout";
import RegisterFarmer from "./pages/RegisterFarmer";
import React from "react";

export default function App() {
  return (
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
        <Route path="/register" element={<RegisterFarmer />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </MainLayout>
  );
}

function RedirectBasedOnAuth() {
  const isLoggedIn = !!localStorage.getItem("user");
  return <Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />;
}
