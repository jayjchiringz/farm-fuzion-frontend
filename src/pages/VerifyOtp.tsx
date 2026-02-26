import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyOtp } from "../services/auth";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const email = localStorage.getItem("pendingEmail") || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await verifyOtp(email, otp);
      console.log("🔍 Auth response:", response);
      
      const { user } = response;

      if (!user) throw new Error("Missing user in response.");

      // Ensure we have a role
      const role = user.role;
      if (!role) {
        console.error("No role in user object:", user);
        throw new Error("Invalid user data: missing role");
      }

      // Store user
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", role);

      console.log("✅ Authenticated:", role, user);

      // Navigate based on role
      if (role === "admin") {
        navigate("/admin-dashboard");
      } else if (role === "farmer") {
        navigate("/dashboard");
      } else if (role === "sacco") {
        navigate("/sacco-dashboard"); // You may need to create this
      } else {
        // Default fallback
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("🚨 Verification failed:", err);
      alert(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-brand-dark text-brand-dark dark:text-brand-apple font-ubuntu transition-colors duration-300">
      <form
        onSubmit={handleVerify}
        className="bg-white dark:bg-[#0a3d32] p-10 shadow-2xl rounded-lg w-full max-w-md space-y-6 transition-colors duration-300"
      >
        <div className="text-center">
          <img
            src="/Logos/Green_Logo_and_name_transparent_background_deep_dark_font.png"
            alt="Farm Fuzion Logo Light"
            className="block dark:hidden mx-auto w-72 mb-6"
          />
          <img
            src="/Logos/Green_Logo_and_name_transparent_background_apple_green_font.png"
            alt="Farm Fuzion Logo Dark"
            className="hidden dark:block mx-auto w-72 mb-6"
          />
          <h1 className="text-3xl font-bold mb-1">OTP Verification</h1>
          <p className="text-lg font-baloo -mt-2">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium">{email}</span>
          </p>
        </div>

        <div>
          <label htmlFor="otp" className="block text-sm font-medium mb-1">
            One-Time Password (OTP)
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="6-digit code"
            className="w-full p-3 border border-brand-apple rounded focus:outline-none focus:ring-2 focus:ring-brand-green tracking-widest text-center text-lg bg-white dark:bg-[#144034]"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-green text-[#8dc71d] py-3 rounded font-semibold hover:bg-brand-dark hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-300"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}
