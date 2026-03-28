// farm-fuzion-frontend/src/services/cooperativeApi.ts
import { API_BASE } from "./config";

// Add the public API URL from environment
const PUBLIC_API_URL = import.meta.env.VITE_PUBLIC_API_URL || "https://farmfuzion-public-api.onrender.com";
const PUBLIC_API_KEY = import.meta.env.VITE_PUBLIC_API_KEY || "";

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
  // Add these for tracking
  source_farmer_id?: number;
  source_farm_product_id?: string;
  source_farmer_name?: string;  // Added for display
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

export interface PublicProductResponse {
  data: CooperativeProduct[];
  total: number;
  limit: number;
  offset: number;
}

export interface MarketplaceStats {
  total_products: number;
  total_cooperatives: number;
  total_orders: number;
  categories: { name: string; count: number }[];
}

export interface CategoriesResponse {
  categories: string[];
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

  // ============================================
  // Public API Methods (for marketplace)
  // ============================================

  // Get all products from public API
  async getAllProducts(params?: {
    category?: string;
    min_price?: number;
    max_price?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<PublicProductResponse> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.min_price) queryParams.append('min_price', params.min_price.toString());
    if (params?.max_price) queryParams.append('max_price', params.max_price.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const url = `${PUBLIC_API_URL}/api/v1/products${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch products');
    }
    
    return response.json();
  }

  // Get all categories from public API
  async getCategories(): Promise<CategoriesResponse> {
    const response = await fetch(`${PUBLIC_API_URL}/api/v1/categories`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch categories');
    }
    
    return response.json();
  }

  // Get marketplace stats from public API
  async getMarketplaceStats(): Promise<MarketplaceStats> {
    const response = await fetch(`${PUBLIC_API_URL}/api/v1/stats`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch stats');
    }
    
    return response.json();
  }

  // Get single product from public API
  async getPublicProduct(productId: string): Promise<CooperativeProduct> {
    const response = await fetch(`${PUBLIC_API_URL}/api/v1/products/${productId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch product');
    }
    
    return response.json();
  }

  // ============================================
  // Authenticated Methods (for group admin)
  // ============================================

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

  // Create new product listing (posts to public API)
  async createProduct(product: Omit<CooperativeProduct, 'id' | 'cooperative_id' | 'created_at' | 'total_price'>): Promise<CooperativeProduct> {
    const response = await fetch(`${PUBLIC_API_URL}/api/v1/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PUBLIC_API_KEY,
      },
      body: JSON.stringify(product),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create product');
    }
    
    return response.json();
  }

  // Update product in public API
  async updateProduct(productId: string, updates: Partial<CooperativeProduct>): Promise<CooperativeProduct> {
    const response = await fetch(`${PUBLIC_API_URL}/api/v1/products/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': PUBLIC_API_KEY,
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update product');
    }
    
    return response.json();
  }

  // Delete product from public API
  async deleteProduct(productId: string): Promise<void> {
    const response = await fetch(`${PUBLIC_API_URL}/api/v1/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': PUBLIC_API_KEY,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete product');
    }
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

  // Recall product back to farmer inventory
  async recallProduct(productId: string, quantity: number, reason: string): Promise<void> {
    await this.fetchWithAuth(`/cooperatives/products/${productId}/recall`, {
      method: 'POST',
      body: JSON.stringify({ quantity, reason }),
    });
  }

}

export const cooperativeApi = new CooperativeApiService();
