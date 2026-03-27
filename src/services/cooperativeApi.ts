// farm-fuzion-frontend/src/services/cooperativeApi.ts
import { API_BASE } from "./config";

export interface Cooperative {
  id: string;
  name: string;
  registration_number: string;
  county: string;
  constituency: string;
  ward: string;
  location: string;
  description: string;
  status: string;
  created_at: string;
}

export interface CooperativeProduct {
  id: string;
  cooperative_id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  currency: string;
  total_price: number;
  available: boolean;
  harvest_date?: string;
  expiry_date?: string;
  certification?: string;
  description?: string;
  images?: string[];
  created_at: string;
}

export interface BulkOrder {
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
  shipping_address?: string;
  shipping_method?: string;
  tracking_number?: string;
  created_at: string;
}

export interface Tender {
  id: string;
  title: string;
  description?: string;
  category?: string;
  quantity_needed: number;
  unit: string;
  deadline: string;
  buyer_name: string;
  buyer_company?: string;
  buyer_email: string;
  status: 'open' | 'closed' | 'awarded';
  created_at: string;
}

class CooperativeApiService {
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

  // Get cooperative details for current admin
  async getMyCooperative(): Promise<Cooperative | null> {
    try {
      const response = await this.fetchWithAuth('/cooperatives/my');
      return response;
    } catch {
      return null;
    }
  }

  // Get products for this cooperative
  async getCooperativeProducts(): Promise<CooperativeProduct[]> {
    const response = await this.fetchWithAuth('/cooperatives/products');
    return response;
  }

  // Create new product listing
  async createProduct(product: Omit<CooperativeProduct, 'id' | 'cooperative_id' | 'created_at' | 'total_price'>): Promise<CooperativeProduct> {
    const response = await this.fetchWithAuth('/cooperatives/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return response;
  }

  // Update product
  async updateProduct(productId: string, updates: Partial<CooperativeProduct>): Promise<CooperativeProduct> {
    const response = await this.fetchWithAuth(`/cooperatives/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return response;
  }

  // Delete product
  async deleteProduct(productId: string): Promise<void> {
    await this.fetchWithAuth(`/cooperatives/products/${productId}`, {
      method: 'DELETE',
    });
  }

  // Get orders for this cooperative
  async getOrders(): Promise<BulkOrder[]> {
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

  // Get open tenders
  async getOpenTenders(): Promise<Tender[]> {
    const response = await this.fetchWithAuth('/cooperatives/tenders/open');
    return response;
  }

  // Respond to tender
  async respondToTender(tenderId: string, response: {
    offered_price: number;
    available_quantity: number;
    delivery_timeline: number;
    message?: string;
  }): Promise<void> {
    await this.fetchWithAuth(`/cooperatives/tenders/${tenderId}/respond`, {
      method: 'POST',
      body: JSON.stringify(response),
    });
  }
}

export const cooperativeApi = new CooperativeApiService();
