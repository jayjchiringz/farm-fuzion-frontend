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
      console.log("🔐 Verifying OTP for email:", email, "with code:", otp);

      const response = await verifyOtp(email, otp);
      console.log("🧪 Raw OTP verification response:", response);

      if (!response || typeof response !== "object") {
        console.error("❌ Response is not a valid object:", response);
        throw new Error("Invalid response from server.");
      }

      const farmer = response.farmer;
      console.log("🌾 Extracted farmer object:", farmer);

      if (!farmer || typeof farmer !== "object") {
        console.warn("⚠️ Farmer object is missing or not an object:", farmer);
        throw new Error("Farmer details not found.");
      }

      if (!farmer.first_name || typeof farmer.first_name !== "string") {
        console.warn("⚠️ Farmer first_name missing or invalid:", farmer.first_name);
        throw new Error("Farmer details incomplete.");
      }

      const savedData = JSON.stringify(farmer);
      localStorage.setItem("user", savedData);
      console.log("💾 Farmer saved to localStorage:", savedData);

      navigate("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OTP verification failed";
      console.error("🚨 Verification failed:", msg);
      alert(msg);
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
          <img
            src="/Logos/Green_Logo_and_name_transparent_background_deep_dark_font.png"
            alt="Farm Fuzion Logo Light"
            className="block dark:hidden mx-auto w-72 md:w-80 lg:w-[340px] h-auto mb-6"
          />
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
          className={`w-full bg-brand-green text-[#8dc71d] py-3 rounded font-semibold 
            transition-colors duration-300 
            hover:bg-brand-dark hover:text-white
            disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}
