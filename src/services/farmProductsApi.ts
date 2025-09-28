// farm-fuzion-frontend/src/services/farmProductsApi.ts
import axios from "axios";
import { components } from "../../types/api"; // ✅ generated OpenAPI types

// ✅ Alias FarmProduct schema
export type FarmProduct = components["schemas"]["FarmProduct"] & {
  id?: string | number;
  spoilage_reason?: string;
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net";

// ✅ Allowed product statuses
export type ProductStatus = "available" | "sold" | "hidden";

export const farmProductsApi = {
  // 🔍 Get all products (with optional filters)
  async getAll(category?: string, status?: ProductStatus): Promise<FarmProduct[]> {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (status) params.append("status", status);

    const res = await axios.get<FarmProduct[]>(`${API_BASE}/farm-products`, { params });
    return res.data;
  },

  // 👨‍🌾 Get products by farmer
  async getFarmerProducts(farmerId: string): Promise<FarmProduct[]> {
    const res = await axios.get<FarmProduct[]>(`${API_BASE}/farm-products/farmer/${farmerId}`);
    return res.data;
  },

  // ➕ Add new product
  async add(product: Omit<FarmProduct, "id">): Promise<FarmProduct> {
    const res = await axios.post<FarmProduct>(`${API_BASE}/farm-products`, product);
    return res.data;
  },

  // ♻️ Update product
  async update(id: string | number, updates: Partial<FarmProduct>): Promise<FarmProduct> {
    const res = await axios.put<FarmProduct>(`${API_BASE}/farm-products/${id}`, updates);
    return res.data;
  },

  // 🗑️ Delete product
  async remove(id: string | number): Promise<{ success: boolean }> {
    const res = await axios.delete<{ success: boolean }>(`${API_BASE}/farm-products/${id}`);
    return res.data;
  },

  // ⚠️ Mark product as spoiled
  async markSpoiled(id: string | number, spoilage_reason: string): Promise<FarmProduct> {
    const res = await axios.put<FarmProduct>(`${API_BASE}/farm-products/${id}`, {
      status: "hidden" as ProductStatus,
      spoilage_reason,
    });
    return res.data;
  },
};
