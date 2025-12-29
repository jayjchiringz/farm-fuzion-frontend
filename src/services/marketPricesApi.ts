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
    try {
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
    } catch (err) {
      console.error("❌ Error fetching market prices:", err);
      throw err;
    }
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

  // 🔄 Sync materialized view
  async sync(): Promise<{ message: string }> {
    const res = await axios.post<{ message: string }>(
      `${API_BASE}/market-prices/sync`
    );
    return res.data;
  },

  // 🔹 Get summary (latest per product)
  async getSummary(selectedCurrency: string): Promise<MarketPrice[]> {
    const res = await axios.get<{ data: MarketPrice[] }>(
      `${API_BASE}/market-prices/summary`
    );
    return res.data.data;
  },

};

// Add to your marketPricesApi.ts
export const getMarketDashboard = async (region?: string, limit?: number) => {
  const params = new URLSearchParams();
  if (region) params.append('region', region);
  if (limit) params.append('limit', limit.toString());
  
  const response = await fetch(`${API_BASE}/market-prices/dashboard?${params}`);
  return await response.json();
};

// In marketPricesApi.ts
export const getSummary = async (currency?: string) => {
  const params = new URLSearchParams();
  if (currency) params.append('currency', currency);
  
  const response = await fetch(`${API_BASE}/market-prices/summary?${params}`);
  const data = await response.json();
  return data.data;
};

export const getAll = async (
  page: number, 
  limit: number, 
  filters?: { product?: string; region?: string; currency?: string }
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (filters?.product) params.append('product', filters.product);
  if (filters?.region) params.append('region', filters.region);
  if (filters?.currency) params.append('currency', filters.currency);
  
  const response = await fetch(`${API_BASE}/market-prices?${params}`);
  return await response.json();
};