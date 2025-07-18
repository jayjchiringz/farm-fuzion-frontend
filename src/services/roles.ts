import { api } from "./api";

export async function getRoles(): Promise<any[]> {
  try {
    const res = await api.get("/roles");
    return res.data;
  } catch (err) {
    console.error("Failed to fetch roles:", err);
    return [];
  }
}

export async function createRole(payload: { name: string; description?: string }) {
  try {
    const res = await api.post("/roles", payload);
    return res.data;
  } catch (err) {
    console.error("Failed to create role:", err);
    throw err;
  }
}

export async function updateRole(id: string, payload: { name: string; description?: string }) {
  try {
    const res = await api.patch(`/roles/${id}`, payload);
    return res.data;
  } catch (err) {
    console.error("Failed to update role:", err);
    throw err;
  }
}

export async function deleteRole(id: string) {
  try {
    const res = await api.delete(`/roles/${id}`);
    return res.data;
  } catch (err) {
    console.error("Failed to delete role:", err);
    throw err;
  }
}
