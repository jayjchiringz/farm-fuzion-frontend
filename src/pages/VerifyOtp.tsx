import { useState } from "react";
import { verifyOtp } from "../services/auth";
import { useNavigate } from "react-router-dom";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem("pendingEmail") || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      sessionStorage.setItem("user", email); // Mark logged in
      navigate("/dashboard");
    } catch (err) {
      alert("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <form onSubmit={handleVerify} className="bg-white p-8 shadow rounded w-96 space-y-4">
        <h1 className="text-xl font-semibold">Enter OTP</h1>
        <input
          type="text"
          placeholder="Enter OTP"
          className="w-full p-2 border rounded"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}
