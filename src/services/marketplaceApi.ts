// farm-fuzion-frontend/src/services/marketplaceApi.ts
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 
  "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/api";

// Types matching backend schemas
export interface MarketplaceProduct {
  id: string;
  farm_product_id: string;
  farmer_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  price: number;
  category?: string;
  status: 'available' | 'sold' | 'reserved' | 'hidden';
  location?: string;
  rating: number;
  total_sales: number;
  created_at: string;
  updated_at: string;
  // Seller info (joined from farmers table)
  first_name?: string;
  last_name?: string;
  mobile?: string;
  farmer_rating?: number;
}

export interface ShoppingCart {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: 'active' | 'pending' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
  items: CartItem[];
  seller?: {
    first_name: string;
    last_name: string;
    mobile: string;
  };
  total: number;
}

export interface CartItem {
  id: string;
  cart_id: string;
  marketplace_product_id: string;
  quantity: number;
  unit_price: number;
  product_name: string;
  unit: string;
  item_total: number;
}

export interface MarketplaceOrder {
  id: string;
  order_number: string;
  buyer_id: string;
  seller_id: string;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled' | 'refunded';
  total_amount: number;
  shipping_address?: string;
  payment_method: 'wallet' | 'mpesa' | 'paybill' | 'cash';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  seller_first_name?: string;
  seller_last_name?: string;
  seller_mobile?: string;
  buyer_first_name?: string;
  buyer_last_name?: string;
  buyer_mobile?: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  marketplace_product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// API Service
export const marketplaceApi = {
  // Products
  getProducts: async (filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    farmer_id?: string;
    status?: string;
    sort?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const res = await axios.get(`${API_BASE}/marketplace/products?${params}`);
    return res.data;
  },

  getProduct: async (id: string) => {
    const res = await axios.get(`${API_BASE}/marketplace/products/${id}`);
    return res.data;
  },

  publishProduct: async (data: {
    farm_product_id: string;
    price: number;
    farmer_id: string;
  }) => {
    const res = await axios.post(`${API_BASE}/marketplace/products/publish`, data);
    return res.data;
  },

  updateProduct: async (id: string, updates: Partial<MarketplaceProduct>) => {
    const res = await axios.put(`${API_BASE}/marketplace/products/${id}`, updates);
    return res.data;
  },

  // Shopping Cart
  getCart: async (buyerId: string) => {
    const res = await axios.get(`${API_BASE}/marketplace/cart/${buyerId}`);
    return res.data;
  },

  addToCart: async (data: {
    marketplace_product_id: string;
    quantity: number;
    buyer_id: string;
  }) => {
    const res = await axios.post(`${API_BASE}/marketplace/cart/add`, data);
    return res.data;
  },

  removeCartItem: async (itemId: string, buyer_id: string) => {
    const res = await axios.delete(`${API_BASE}/marketplace/cart/item/${itemId}`, {
      data: { buyer_id }
    });
    return res.data;
  },

  // Orders
  checkout: async (data: {
    cart_id: string;
    shipping_address?: string;
    payment_method?: string;
    notes?: string;
    buyer_id: string;
  }) => {
    const res = await axios.post(`${API_BASE}/marketplace/cart/checkout`, data);
    return res.data;
  },

  getBuyerOrders: async (buyerId: string, filters?: { status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const res = await axios.get(`${API_BASE}/marketplace/orders/buyer/${buyerId}?${params}`);
    return res.data;
  },

  getSellerOrders: async (sellerId: string, filters?: { status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const res = await axios.get(`${API_BASE}/marketplace/orders/seller/${sellerId}?${params}`);
    return res.data;
  },

  updateOrderStatus: async (orderId: string, data: {
    status: string;
    tracking_number?: string;
    delivery_date?: string;
    farmer_id: string;
  }) => {
    const res = await axios.put(`${API_BASE}/marketplace/orders/${orderId}/status`, data);
    return res.data;
  },

  processPayment: async (orderId: string, data: {
    payment_method: string;
    phone_number?: string;
    account_number?: string;
    buyer_id: string;
  }) => {
    const res = await axios.post(`${API_BASE}/marketplace/orders/${orderId}/pay`, data);
    return res.data;
  },
};
