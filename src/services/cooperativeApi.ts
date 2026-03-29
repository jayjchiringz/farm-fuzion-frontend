// farm-fuzion-frontend/src/services/cooperativeApi.ts
import { API_BASE } from "./config";

// Add the public API URL from environment
const PUBLIC_API_URL = import.meta.env.VITE_PUBLIC_API_URL;
const PUBLIC_API_KEY = import.meta.env.VITE_PUBLIC_API_KEY;

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

export interface PublicProduct {
  id: string;
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
  created_at: string;
  cooperative_name?: string;
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

export interface MarketplaceStats {
  total_products: number;
  total_cooperatives: number;
  total_orders: number;
  categories: Array<{ name: string; count: number }>;
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

  // Call the public marketplace API (no auth required for GET, API key for POST)
  private async fetchPublicAPI(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Only add API key for non-GET requests that need authentication
    if (options.method && options.method !== 'GET' && PUBLIC_API_KEY) {
      headers['X-API-Key'] = PUBLIC_API_KEY;
    }

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

  // ============================================
  // COOPERATIVE MANAGEMENT (Authenticated)
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

  // Create new product listing (Group Admin creates product)
  async createProduct(product: Omit<CooperativeProduct, 'id' | 'cooperative_id' | 'created_at' | 'total_price'>): Promise<CooperativeProduct> {
    const response = await this.fetchWithAuth('/cooperatives/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return response;
  }

  // Publish farmer's product to cooperative marketplace
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
    group_id: string;
  }): Promise<CooperativeProduct> {
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

  // ============================================
  // PUBLIC MARKETPLACE (No authentication required)
  // ============================================

  // Get all products for public marketplace
  async getAllProducts(filters?: {
    category?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: PublicProduct[]; total: number; limit: number; offset: number }> {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.min_price) params.append("min_price", filters.min_price.toString());
    if (filters?.max_price) params.append("max_price", filters.max_price.toString());
    if (filters?.sort) params.append("sort", filters.sort);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());
    
    const response = await fetch(`${PUBLIC_API_URL}/api/v1/products?${params}`);
    if (!response.ok) throw new Error("Failed to fetch products");
    return response.json();
  }

  // Get single product by ID
  async getPublicProduct(productId: string): Promise<PublicProduct> {
    const response = await fetch(`${PUBLIC_API_URL}/api/v1/products/${productId}`);
    if (!response.ok) throw new Error("Product not found");
    return response.json();
  }

  // Get all product categories
  async getCategories(): Promise<{ categories: string[] }> {
    const response = await fetch(`${PUBLIC_API_URL}/api/v1/categories`);
    if (!response.ok) throw new Error("Failed to fetch categories");
    return response.json();
  }

  // Get marketplace statistics
  async getMarketplaceStats(): Promise<MarketplaceStats> {
    const response = await fetch(`${PUBLIC_API_URL}/api/v1/stats`);
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  }

  // Get open tenders (public)
  async getPublicTenders(): Promise<Tender[]> {
    const response = await fetch(`${PUBLIC_API_URL}/api/v1/tenders/open`);
    if (!response.ok) throw new Error("Failed to fetch tenders");
    return response.json();
  }

  // Create a bulk order (public - no auth required)
  async createBulkOrder(order: {
    product_id: string;
    buyer_name: string;
    buyer_company?: string;
    buyer_email: string;
    buyer_phone?: string;
    buyer_country: string;
    quantity: number;
    shipping_address?: string;
    notes?: string;
  }): Promise<{ id: string; order_number: string; total_amount: number; status: string }> {
    const response = await fetch(`${PUBLIC_API_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Order failed");
    }
    return response.json();
  }

  // Respond to a tender (requires API key - for cooperatives)
  async respondToPublicTender(tenderId: string, response: {
    cooperative_id: string;
    offered_price: number;
    available_quantity: number;
    delivery_timeline: number;
    message?: string;
  }): Promise<{ message: string; response_id: string }> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (PUBLIC_API_KEY) {
      headers['X-API-Key'] = PUBLIC_API_KEY;
    }
    
    const apiResponse = await fetch(`${PUBLIC_API_URL}/api/v1/tenders/${tenderId}/respond`, {
      method: 'POST',
      headers,
      body: JSON.stringify(response),
    });
    if (!apiResponse.ok) {
      const error = await apiResponse.json();
      throw new Error(error.detail || "Failed to respond to tender");
    }
    return apiResponse.json();
  }
}

export const cooperativeApi = new CooperativeApiService();