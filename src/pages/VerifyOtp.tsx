import { useState } from "react";
import { verifyOtp } from "../services/auth";
import { useNavigate } from "react-router-dom";
import React from "react";

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
      const { farmer } = response;

      // Save full farmer name in storage
      localStorage.setItem("user", JSON.stringify(farmer));
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("OTP verification failed");
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
        {/* Logo + Branding */}
        <div className="text-center">
          {/* Light Logo */}
          <img
            src="/Logos/Green_Logo_and_name_transparent_background_deep_dark_font.png"
            alt="Farm Fuzion Logo Light"
            className="block dark:hidden mx-auto w-72 md:w-80 lg:w-[340px] h-auto mb-6"
          />
          {/* Dark Logo */}
          <img
            src="/Logos/Green_Logo_and_name_transparent_background_apple_green_font.png"
            alt="Farm Fuzion Logo Dark"
            className="hidden dark:block mx-auto w-72 md:w-80 lg:w-[340px] h-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-brand-dark dark:text-brand-apple mb-1">
            OTP Verification
          </h1>
          <p className="text-brand-green dark:text-brand-apple text-lg font-baloo -mt-2">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium">{email}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div>
          <label
            htmlFor="otp"
            className="block text-sm font-medium text-brand-dark dark:text-brand-apple mb-1"
          >
            One-Time Password (OTP)
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="6-digit code"
            className="w-full p-3 border border-brand-apple rounded focus:outline-none focus:ring-2 focus:ring-brand-green tracking-widest text-center text-lg bg-white dark:bg-[#144034] text-brand-dark dark:text-brand-apple"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-brand-green text-white py-3 rounded font-semibold transition hover:bg-brand-dark ${
            loading && "opacity-60 cursor-not-allowed"
          }`}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}
