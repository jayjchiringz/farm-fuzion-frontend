// farm-fuzion-frontend/src/services/farmProductsApi.ts
import axios from "axios";
import { components } from "../../types/api"; // ✅ generated OpenAPI types

// ✅ Alias FarmProduct schema with frontend extensions
export type FarmProduct = components["schemas"]["FarmProduct"] & {
  id?: string | number;
  spoilage_reason?: string;
};

// ✅ Allowed product statuses
export type ProductStatus = "available" | "sold" | "hidden";

// ✅ API response with pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net";

export const farmProductsApi = {
  // 🔍 Get all products (with filters + pagination)
  async getAll(
    category?: string,
    status?: ProductStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<FarmProduct>> {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (status) params.append("status", status);
    params.append("page", String(page));
    params.append("limit", String(limit));

    const res = await axios.get<PaginatedResponse<FarmProduct>>(
      `${API_BASE}/farm-products`,
      { params }
    );
    return res.data;
  },

  // 👨‍🌾 Get products by farmer (with pagination + filters)
  async getFarmerProducts(
    farmerId: string,
    page: number = 1,
    limit: number = 10,
    filters?: { search?: string; category?: string; status?: ProductStatus }
  ): Promise<PaginatedResponse<FarmProduct>> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (filters?.search) params.append("search", filters.search);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.status) params.append("status", filters.status);

    const res = await axios.get<PaginatedResponse<FarmProduct>>(
      `${API_BASE}/farm-products/farmer/${farmerId}`,
      { params }
    );
    return res.data;
  },

  // ➕ Add new product
  async add(product: Omit<FarmProduct, "id">): Promise<FarmProduct> {
    const res = await axios.post<FarmProduct>(
      `${API_BASE}/farm-products`,
      product
    );
    return res.data;
  },

  // ♻️ Update product
  async update(
    id: string | number,
    updates: Partial<FarmProduct>
  ): Promise<FarmProduct> {
    const res = await axios.put<FarmProduct>(
      `${API_BASE}/farm-products/${id}`,
      updates
    );
    return res.data;
  },

  // 🗑️ Delete product
  async remove(id: string | number): Promise<{ success: boolean }> {
    const res = await axios.delete<{ success: boolean }>(
      `${API_BASE}/farm-products/${id}`
    );
    return res.data;
  },

  // ⚠️ Mark product as spoiled
  async markSpoiled(
    id: string | number,
    spoilage_reason: string
  ): Promise<FarmProduct> {
    const res = await axios.put<FarmProduct>(
      `${API_BASE}/farm-products/${id}`,
      {
        status: "hidden" as ProductStatus,
        spoilage_reason,
      }
    );
    return res.data;
  },
};
