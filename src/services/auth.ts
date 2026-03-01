// farm-fuzion-frontend\src\services\auth.ts
export async function verifyOtp(email: string, otp: string) {
  try {
    const response = await fetch(`https://api-ugbghpzhpa-uc.a.run.app/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    if (!response.ok) {
      if (response.status === 429) {
        // Try to get retry-after header
        const retryAfter = response.headers.get('retry-after');
        const error = await response.text();
        throw new Error(`Too many requests. Please try again in ${retryAfter || 60} seconds.`);
      }
      
      const error = await response.json().catch(() => ({ error: 'Verification failed' }));
      throw new Error(error.error || 'Verification failed');
    }

    const data = await response.json();
    
    // Ensure the user object has the expected structure
    if (data.user) {
      // Make sure we have role information
      if (!data.user.role_name && data.user.role) {
        data.user.role_name = data.user.role;
      }
    }
    
    return data;
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
}
