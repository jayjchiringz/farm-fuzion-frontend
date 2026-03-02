// src/services/roles.ts
import { API_BASE } from "./config";

export async function getRoles(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/roles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Roles fetch failed:", res.status, errorText);
      return [];
    }
    
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to fetch roles:", err);
    return [];
  }
}

export async function createRole(payload: { name: string; description?: string }) {
  try {
    const res = await fetch(`${API_BASE}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(async () => ({ error: await res.text() }));
      throw new Error(errorData.error || "Failed to create role");
    }
    
    const data = await res.json();
    return data.role || data;
  } catch (err) {
    console.error("Failed to create role:", err);
    throw err;
  }
}

export async function updateRole(id: string, payload: { name: string; description?: string }) {
  try {
    const res = await fetch(`${API_BASE}/roles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(async () => ({ error: await res.text() }));
      throw new Error(errorData.error || "Failed to update role");
    }
    
    return await res.json();
  } catch (err) {
    console.error("Failed to update role:", err);
    throw err;
  }
}

export async function deleteRole(id: string) {
  try {
    const res = await fetch(`${API_BASE}/roles/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(async () => ({ error: await res.text() }));
      throw new Error(errorData.error || "Failed to delete role");
    }
    
    return await res.json();
  } catch (err) {
    console.error("Failed to delete role:", err);
    throw err;
  }
}
