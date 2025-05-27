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
      sessionStorage.setItem("pendingEmail", email);
      navigate("/verify");
    } catch (err) {
      alert("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-100">
      <form onSubmit={handleOtpRequest} className="bg-white p-8 shadow rounded w-96 space-y-4">
        <h1 className="text-xl font-semibold">Farm Fuzion Login</h1>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>
    </div>
  );
}
