import { API_BASE } from "./config";

export async function registerFarmer(data: any) {
  const res = await fetch(`${API_BASE}/farmers`, {
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
