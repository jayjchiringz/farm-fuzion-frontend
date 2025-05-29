export async function registerFarmer(data: any) {
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/farmers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Registration failed");
  }

  return await res.json();
}
