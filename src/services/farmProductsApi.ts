// farm-fuzion-frontend/src/services/farmProductsApi.ts
import axios from "axios";
import { components } from "../../types/api"; // ✅ generated OpenAPI types

// ✅ Alias the FarmProduct schema
export type FarmProduct = components["schemas"]["FarmProduct"];

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net";

export const farmProductsApi = {
  // 🔍 Get all products (with optional filters)
  async getAll(category?: string, status?: string): Promise<FarmProduct[]> {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (status) params.append("status", status);

    const res = await axios.get(`${API_BASE}/farm-products`, { params });
    return res.data;
  },

  // 👨‍🌾 Get products by farmer
  async getFarmerProducts(farmerId: string): Promise<FarmProduct[]> {
    const res = await axios.get(`${API_BASE}/farm-products/farmer/${farmerId}`);
    return res.data;
  },

  // ➕ Add new product
  async add(product: Omit<FarmProduct, "id">) {
    const res = await axios.post(`${API_BASE}/farm-products`, product);
    return res.data;
  },

  // ♻️ Update product (general purpose)
  async update(id: string, updates: Partial<FarmProduct>) {
    const res = await axios.put(`${API_BASE}/farm-products/${id}`, updates);
    return res.data;
  },

  // 🗑️ Delete product
  async remove(id: string) {
    const res = await axios.delete(`${API_BASE}/farm-products/${id}`);
    return res.data;
  },

  // ⚠️ Report spoilage (shortcut API)
  async markSpoiled(id: string, spoilage_reason: string) {
    const res = await axios.put(`${API_BASE}/farm-products/${id}`, {
      status: "hidden",
      spoilage_reason,
    });
    return res.data;
  },
};
