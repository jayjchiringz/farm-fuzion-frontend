import { useState } from "react";
import { requestOtp } from "../services/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestOtp(email);
      localStorage.setItem("pendingEmail", email); // switched from sessionStorage
      navigate("/verify");
    } catch (err) {
      alert("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-brand.dark font-ubuntu">
      <form
        onSubmit={handleOtpRequest}
        className="bg-white p-10 shadow-2xl rounded-lg w-full max-w-md space-y-6"
      >
        {/* Logo */}
        <div className="text-center">
          <img
            src="/logo.svg"
            alt="Farm Fuzion Logo"
            className="mx-auto w-20 h-20 mb-4"
          />
          <h1 className="text-3xl font-bold text-brand.dark mb-1">
            Welcome to Farm Fuzion
          </h1>
          <p className="text-brand.green text-lg font-baloo -mt-2">
            Sustained Agri-Business
          </p>
        </div>

        {/* Email input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-brand.dark mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-brand.apple rounded focus:outline-none focus:ring-2 focus:ring-brand.green"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-brand.green text-white py-3 rounded font-semibold transition hover:bg-brand.dark ${
            loading && "opacity-60 cursor-not-allowed"
          }`}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>
    </div>
  );
}
