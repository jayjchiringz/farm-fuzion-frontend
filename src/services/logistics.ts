// farm-fuzion-frontend/src/services/logisticsService.ts
import { API_BASE } from "./config";
import { getAuthToken } from "./auth";

export interface Parcel {
  tracking_number: string;
  status: string;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  origin_location: number | null;
  destination: number | null;
  origin_station?: string;
  destination_station?: string;
  parcel_type: number;
  parcel_type_name?: string;
  description: string;
  created_at: string;
  updated_at: string;
  delivery_to_address: boolean;
  delivery_cost: number;
  current_latitude?: number;
  current_longitude?: number;
}

export interface LogisticsStats {
  total_parcels: number;
  in_transit: number;
  delivered: number;
  pending_pickup: number;
}

export interface DashboardData {
  stats: LogisticsStats;
  recent_parcels: Parcel[];
}

class LogisticsService {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = getAuthToken();
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

  // Get dashboard data
  async getDashboard(): Promise<DashboardData> {
    return this.fetchWithAuth('/api/logistics/dashboard');
  }

  // Get all parcels
  async getParcels(): Promise<Parcel[]> {
    const data = await this.fetchWithAuth('/api/logistics/parcels');
    return data.results || data;
  }

  // Get single parcel
  async getParcel(trackingNumber: string): Promise<Parcel> {
    return this.fetchWithAuth(`/api/logistics/parcels/${trackingNumber}`);
  }

  // Create new parcel
  async createParcel(parcelData: Partial<Parcel>): Promise<Parcel> {
    return this.fetchWithAuth('/api/logistics/parcels', {
      method: 'POST',
      body: JSON.stringify(parcelData),
    });
  }

  // Track parcel
  async trackParcel(trackingNumber: string): Promise<any> {
    return this.fetchWithAuth(`/api/logistics/track/${trackingNumber}`);
  }

  // Get parcel events
  async getParcelEvents(trackingNumber: string): Promise<any[]> {
    const data = await this.fetchWithAuth(`/api/logistics/parcels/${trackingNumber}/events`);
    return data.events || data;
  }
}

export default new LogisticsService();
