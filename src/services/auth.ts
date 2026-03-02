// src/services/auth.ts
import { API_BASE } from "./config";

export async function verifyOtp(email: string, otp: string) {
  try {
    const response = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        throw new Error(`Too many requests. Please try again in ${retryAfter || 60} seconds.`);
      }
      
      const error = await response.json().catch(() => ({ error: 'Verification failed' }));
      throw new Error(error.error || 'Verification failed');
    }

    const data = await response.json();
    
    if (data.user && !data.user.role_name && data.user.role) {
      data.user.role_name = data.user.role;
    }
    
    return data;
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
}

// Add requestOtp function if missing
export async function requestOtp(email: string) {
  const response = await fetch(`${API_BASE}/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to request OTP");
  }

  return await response.json();
}
