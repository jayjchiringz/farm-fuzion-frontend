export const requestOtp = async (email: string) => {
  //const res = await fetch("https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/api/auth/request-otp", {
  const res = await fetch("https://api-ugbghpzhpa-uc.a.run.app/auth/request-otp", {
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

// farm-fuzion-frontend\src\services\auth.ts
export async function verifyOtp(email: string, otp: string) {
  const response = await fetch(`https://api-ugbghpzhpa-uc.a.run.app/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Verification failed');
  }

  const data = await response.json();
  
  // Ensure the user object has the expected structure
  if (data.user) {
    // Make sure we have role information
    if (!data.user.role_name && data.user.role) {
      // Handle case where backend still sends old format
      data.user.role_name = data.user.role;
    }
  }
  
  return data;
}
