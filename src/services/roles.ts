// farm-fuzion-frontend/src/services/roles.ts
import { api } from "./api";

// farm-fuzion-frontend/src/services/roles.ts

const BASE_URL = "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/getRoles";
const CREATE_URL = "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/createRole";
const UPDATE_URL = "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/updateRole";
const DELETE_URL = "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/deleteRole";

export async function getRoles(): Promise<any[]> {
  try {
    const res = await fetch(BASE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Important for CORS with credentials
      mode: "cors", // Explicitly set CORS mode
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Roles fetch failed:", res.status, errorText);
      return [];
    }
    
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch roles:", err);
    return [];
  }
}
export async function createRole(payload: { name: string; description?: string }) {
  try {
    const res = await fetch(CREATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to create role");
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to create role:", err);
    throw err;
  }
}
export async function updateRole(id: string, payload: { name: string; description?: string }) {
  try {
    // ✅ Send ID in URL path, not in body
    const res = await fetch(`${UPDATE_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), // Only name and description in body
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to update role");
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to update role:", err);
    throw err;
  }
}
export async function deleteRole(id: string) {
  try {
    // ✅ Send ID in URL path, not in body
    const res = await fetch(`${DELETE_URL}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to delete role");
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to delete role:", err);
    throw err;
  }
}
