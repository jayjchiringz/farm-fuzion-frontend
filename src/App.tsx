import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/Auth/PrivateRoute";

export default function App() {
  return (
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
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function RedirectBasedOnAuth() {
  const isLoggedIn = !!sessionStorage.getItem("user");
  return <Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />;
}
