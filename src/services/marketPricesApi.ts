// farm-fuzion-frontend/src/services/marketPricesApi.ts
import axios from "axios";
import { components } from "../../types/api"; // ✅ OpenAPI-generated types

// ✅ Alias MarketPrice schema with frontend extensions
export type MarketPrice = components["schemas"]["MarketPrice"] & {
  id?: string | number;
};

// ✅ API response with pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net";

export const marketPricesApi = {
  // 🔍 Get all market prices (with filters + pagination)
  async getAll(
    page: number = 1,
    limit: number = 10,
    filters?: { product?: string; region?: string; category?: string }
  ): Promise<PaginatedResponse<MarketPrice>> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (filters?.product) params.append("product", filters.product);
    if (filters?.region) params.append("region", filters.region);
    if (filters?.category) params.append("category", filters.category);

    const res = await axios.get<PaginatedResponse<MarketPrice>>(
      `${API_BASE}/market-prices`,
      { params }
    );
    return res.data;
  },

  // ➕ Add new market price
  async add(price: Omit<MarketPrice, "id">): Promise<MarketPrice> {
    const res = await axios.post<MarketPrice>(
      `${API_BASE}/market-prices`,
      price
    );
    return res.data;
  },

  // ♻️ Update market price
  async update(
    id: string | number,
    updates: Partial<MarketPrice>
  ): Promise<MarketPrice> {
    const res = await axios.put<MarketPrice>(
      `${API_BASE}/market-prices/${id}`,
      updates
    );
    return res.data;
  },

  // 🗑️ Delete market price
  async remove(id: string | number): Promise<{ success: boolean }> {
    const res = await axios.delete<{ success: boolean }>(
      `${API_BASE}/market-prices/${id}`
    );
    return res.data;
  },
};
