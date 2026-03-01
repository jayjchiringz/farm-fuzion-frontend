import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { verifyOtp } from "../services/auth";
import { useAuth } from "../contexts/AuthContext";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const email = localStorage.getItem("pendingEmail") || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Countdown timer for rate limit
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setRetryAfter(null);
      setCountdown(null);
      setError(""); // Clear the error when countdown finishes
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retryAfter) {
      setError(`Too many attempts. Please wait ${countdown} seconds.`);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await verifyOtp(email, otp);
      console.log("🔍 Auth response:", response);
      
      const { user } = response;

      if (!user) throw new Error("Missing user in response.");

      // Format user to match AuthContext User interface
      const formattedUser = {
        id: user.id,
        email: user.email,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role_id: user.role_id,
        role_name: user.role_name || user.role,
        role_description: user.role_description || null,
        group_id: user.group_id || null,
        created_at: user.created_at || new Date().toISOString()
      };

      console.log("✅ Formatted user:", formattedUser);

      // Set user via context
      setUser(formattedUser);
      
      // Store token if present
      if (response.token) {
        localStorage.setItem("token", response.token);
      }

      // Clear pending email
      localStorage.removeItem("pendingEmail");

      // Navigate based on role
      if (formattedUser.role_name?.toLowerCase() === "admin") {
        navigate("/admin-dashboard");
      } else if (formattedUser.role_name?.toLowerCase() === "farmer") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
      
    } catch (err: any) {
      console.error("🚨 Verification failed:", err);
      
      // Check for rate limit error
      if (err.message?.includes('429') || err.message?.includes('Too many requests')) {
        const match = err.message?.match(/try again in (\d+) seconds/);
        const waitTime = match ? parseInt(match[1]) : 60;
        setRetryAfter(waitTime);
        setCountdown(waitTime);
        setError(`Too many attempts. Please wait ${waitTime} seconds.`);
      } else {
        setError(err.message || "Verification failed");
      }
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

        {error && (
          <div className={`${retryAfter ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded relative`}>
            {error}
            {countdown !== null && (
              <div className="mt-2 w-full bg-yellow-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / (retryAfter || 60)) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

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
            disabled={loading || !!retryAfter}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !!retryAfter}
          className="w-full bg-brand-green text-[#8dc71d] py-3 rounded font-semibold hover:bg-brand-dark hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-300"
        >
          {loading ? "Verifying..." : retryAfter ? `Wait ${countdown}s` : "Verify OTP"}
        </button>

        {retryAfter && (
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Too many attempts. Please wait {countdown} seconds before trying again.
          </p>
        )}
      </form>
    </div>
  );
}
