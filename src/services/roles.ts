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
