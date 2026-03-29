// farm-fuzion-frontend/src/services/cooperativeApi.ts
import { API_BASE } from "./config";

// Add the public API URL from environment
const PUBLIC_API_URL = import.meta.env.VITE_PUBLIC_API_URL || "https://farmfuzion-public-api.onrender.com";
const PUBLIC_API_KEY = import.meta.env.VITE_PUBLIC_API_KEY || "76071ef74feb1524869b8d3cb3ce05eb";

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
  source_farmer_id?: number;
  source_farm_product_id?: string;
  source_farmer_name?: string;
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

  // NEW: Call the public marketplace API with API key
  private async fetchPublicAPI(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': PUBLIC_API_KEY,
      ...options.headers,
    };

    const response = await fetch(`${PUBLIC_API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.detail || error.error || `HTTP ${response.status}`);
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

  // Create new product listing (Group Admin creates product)
  async createProduct(product: Omit<CooperativeProduct, 'id' | 'cooperative_id' | 'created_at' | 'total_price'>): Promise<CooperativeProduct> {
    const response = await this.fetchWithAuth('/cooperatives/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return response;
  }

  /*
  // NEW: Publish farmer's product to public marketplace (with API key)
  async publishToPublicMarketplace(product: {
    farm_product_id: string;
    product_name: string;
    category: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    certification?: string;
    description?: string;
    farmer_id: number;  // This is the numeric farmer ID
  }): Promise<CooperativeProduct> {
    // Get the group ID for this farmer
    // Note: The farmer might be assigned to a group, so we need to fetch that
    const farmerResponse = await this.fetchWithAuth(`/farmers/${product.farmer_id}/group`);
    const farmerData = await farmerResponse;
    
    if (!farmerData.group_id) {
      throw new Error('Farmer not assigned to any group');
    }

    // Create the product in the cooperative database
    const response = await this.fetchWithAuth('/cooperatives/products/publish', {
      method: 'POST',
      body: JSON.stringify({
        ...product,
        group_id: farmerData.group_id,
      }),
    });
    
    return response;
  }
  */
 
  async publishToPublicMarketplace(product: {
    farm_product_id: string;
    product_name: string;
    category: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    certification?: string;
    description?: string;
    farmer_id: number;
    group_id: string;  // Add this
  }): Promise<CooperativeProduct> {
    // Create the product in the cooperative database
    const response = await this.fetchWithAuth('/cooperatives/products/publish', {
      method: 'POST',
      body: JSON.stringify({
        farm_product_id: product.farm_product_id,
        product_name: product.product_name,
        category: product.category,
        quantity: product.quantity,
        unit: product.unit,
        price_per_unit: product.price_per_unit,
        certification: product.certification,
        description: product.description,
        farmer_id: product.farmer_id,
        group_id: product.group_id,
      }),
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

  // Recall product back to farmer inventory
  async recallProduct(productId: string, quantity: number, reason: string): Promise<void> {
    await this.fetchWithAuth(`/cooperatives/products/${productId}/recall`, {
      method: 'POST',
      body: JSON.stringify({ quantity, reason }),
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

  // Complete order and update inventory
  async completeOrder(orderId: string): Promise<void> {
    await this.fetchWithAuth(`/cooperatives/orders/${orderId}/complete`, {
      method: 'PATCH',
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
