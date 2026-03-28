// farm-fuzion-frontend/src/services/cooperativeMarketplaceApi.ts
import { API_BASE } from "./config";

export interface CooperativeProduct {
  id: string;
  group_id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  currency: string;
  total_price: number;
  available: boolean;
  certification?: string;
  description?: string;
  source_farmer_id?: number;
  source_farm_product_id?: string;
  created_at: string;
}

export interface CooperativeOrder {
  id: string;
  cooperative_product_id: string;
  product_name: string;
  buyer_name: string;
  buyer_company?: string;
  buyer_email: string;
  buyer_phone?: string;
  buyer_country: string;
  quantity: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  tracking_number?: string;
  created_at: string;
}

class CooperativeMarketplaceService {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Publish farmer's product to cooperative marketplace
  async publishToCooperative(data: {
    farm_product_id: string;
    product_name: string;
    category: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    certification?: string;
    description?: string;
    farmer_id: number;
  }): Promise<CooperativeProduct> {
    const response = await this.fetchWithAuth('/cooperatives/products/publish', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  }

  // Get cooperative products (for Group Admin)
  async getCooperativeProducts(): Promise<CooperativeProduct[]> {
    const response = await this.fetchWithAuth('/cooperatives/products');
    return response;
  }

  // Update cooperative product (for Group Admin)
  async updateCooperativeProduct(productId: string, updates: Partial<CooperativeProduct>): Promise<CooperativeProduct> {
    const response = await this.fetchWithAuth(`/cooperatives/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return response;
  }

  // Recall product back to farmer inventory (Group Admin action)
  async recallProduct(productId: string, quantity: number, reason: string): Promise<void> {
    const response = await this.fetchWithAuth(`/cooperatives/products/${productId}/recall`, {
      method: 'POST',
      body: JSON.stringify({ quantity, reason }),
    });
    return response;
  }

  // Get orders for cooperative
  async getCooperativeOrders(): Promise<CooperativeOrder[]> {
    const response = await this.fetchWithAuth('/cooperatives/orders');
    return response;
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<void> {
    await this.fetchWithAuth(`/cooperatives/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, tracking_number: trackingNumber }),
    });
  }
}

export const cooperativeMarketplaceApi = new CooperativeMarketplaceService();