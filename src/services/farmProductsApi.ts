import axios from "axios";
import { components } from "../../types/api"; // ✅ generated types

// Alias the FarmProduct schema
export type FarmProduct = components["schemas"]["FarmProduct"];

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net";

export const farmProductsApi = {
  async getAll(category?: string, status?: string): Promise<FarmProduct[]> {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (status) params.append("status", status);

    const res = await axios.get(`${API_BASE}/farm-products`, { params });
    return res.data;
  },

  async getFarmerProducts(farmerId: string): Promise<FarmProduct[]> {
    const res = await axios.get(`${API_BASE}/farm-products/farmer/${farmerId}`);
    return res.data;
  },

  async add(product: Omit<FarmProduct, "id">) {
    const res = await axios.post(`${API_BASE}/farm-products`, product);
    return res.data;
  },

  async update(id: string, updates: Partial<FarmProduct>) {
    const res = await axios.put(`${API_BASE}/farm-products/${id}`, updates);
    return res.data;
  },

  async remove(id: string) {
    const res = await axios.delete(`${API_BASE}/farm-products/${id}`);
    return res.data;
  },
};
