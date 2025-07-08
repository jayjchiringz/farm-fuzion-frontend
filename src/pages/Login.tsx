import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestOtp } from "../services/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await requestOtp(email); // now returns { message, role }
      const { role } = response;

      if (!role) {
        throw new Error("Unable to determine user role.");
      }

      // Save email and role for next step
      localStorage.setItem("pendingEmail", email);
      localStorage.setItem("pendingRole", role);

      navigate("/verify");
    } catch (err) {
      alert(err instanceof Error ? err.message : "OTP request failed");
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
          <h1 className="text-3xl font-bold mb-1">Welcome to Farm Fuzion</h1>
          <p className="text-brand-green dark:text-brand-apple text-lg font-baloo -mt-2">
            Sustained Agri-Business
          </p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-brand-apple rounded focus:outline-none focus:ring-2 focus:ring-brand-green tracking-widest text-center text-lg bg-white dark:bg-[#144034]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-brand-green text-[#8dc71d] py-3 rounded font-semibold 
            transition-colors duration-300 
            hover:bg-brand-dark hover:text-white
            disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>
    </div>
  );
}
