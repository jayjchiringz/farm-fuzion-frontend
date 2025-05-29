import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { requestOtp } from "../services/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestOtp(email);
      localStorage.setItem("pendingEmail", email);
      navigate("/verify");
    } catch (err) {
      alert("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-brand-dark text-brand-dark dark:text-brand-apple font-ubuntu transition-colors duration-300">
      <form
        onSubmit={handleOtpRequest}
        className="bg-white dark:bg-[#0a3d32] p-10 shadow-2xl rounded-lg w-full max-w-md space-y-6 transition-colors duration-300"
      >
        {/* Logo */}
        <div className="text-center">
          {/* Light Mode Logo */}
          <img
            src="/Logos/Green_Logo_and_name_transparent_background_deep_dark_font.png"
            alt="Farm Fuzion Logo Light"
            className="block dark:hidden mx-auto w-72 md:w-80 lg:w-[340px] h-auto mb-6"
          />
          {/* Dark Mode Logo */}
          <img
            src="/Logos/Green_Logo_and_name_transparent_background_apple_green_font.png"
            alt="Farm Fuzion Logo Dark"
            className="hidden dark:block mx-auto w-72 md:w-80 lg:w-[340px] h-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-brand-dark dark:text-brand-apple mb-1">
            Welcome to Farm Fuzion
          </h1>
          <p className="text-brand-green dark:text-brand-apple text-lg font-baloo -mt-2">
            Sustained Agri-Business
          </p>
        </div>

        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-brand-dark dark:text-brand-apple mb-1"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-brand-apple rounded focus:outline-none focus:ring-2 focus:ring-brand-green tracking-widest text-center text-lg bg-white dark:bg-[#144034] text-brand-dark dark:text-brand-apple"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-brand-green text-white py-3 rounded font-semibold transition hover:bg-brand-dark ${
            loading && "opacity-60 cursor-not-allowed"
          }`}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        {/* Actions */}
        <div className="flex justify-between text-sm mt-2 font-medium">
          <Link
            to="/register"
            className="text-brand-green dark:text-brand-apple hover:underline hover:text-brand-dark dark:hover:text-white"
          >
            New Farmer? Register here!
          </Link>
          <Link
            to="/forgot-password"
            className="text-brand-green dark:text-brand-apple hover:underline hover:text-brand-dark dark:hover:text-white"
          >
            Forgot Password?
          </Link>
        </div>
      </form>
    </div>
  );
}
