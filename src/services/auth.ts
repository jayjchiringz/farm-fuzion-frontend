import { api } from "./api";

export const requestOtp = async (email: string) => {
  const res = await fetch("http://localhost:5001/farm-fuzion/us-central1/api/api/auth/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new Error("Failed to request OTP");
  }
};

export const verifyOtp = async (email: string, otp: string) => {
  const res = await fetch("http://localhost:5001/farm-fuzion/us-central1/api/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ OTP verification failed:", errorText);
    throw new Error("Invalid OTP");
  }

  return res.json();
};
