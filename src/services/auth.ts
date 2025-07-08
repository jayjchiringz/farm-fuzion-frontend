import { api } from "./api";

export const requestOtp = async (email: string) => {
  const res = await fetch("https://us-central1-farm-fuzion.cloudfunctions.net/api/auth/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Failed to request OTP");
  }

  return await res.json(); // Includes role
};

export const verifyOtp = async (email: string, otp: string) => {
  //const res = await fetch("http://localhost:5001/farm-fuzion/us-central1/api/auth/verify-otp", {
  const res = await fetch("https://us-central1-farm-fuzion.cloudfunctions.net/api/auth/verify-otp", {  
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "OTP verification failed");
  }

  return await res.json();
};
