// src/services/logistics.ts
import { API_BASE } from "./config";
import { getAuthToken } from "./auth";

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

  // Get all parcels for current farmer
  async getFarmerParcels() {
    return this.fetchWithAuth('/api/logistics/parcels');
  }

  // Create a new parcel
  async createParcel(parcelData: {
    sender_name: string;
    sender_phone: string;
    receiver_name: string;
    receiver_phone: string;
    origin_location: number; // station ID
    destination: number; // station ID
    parcel_type: number;
    description: string;
    delivery_to_address?: boolean;
    receiver_address?: string;
  }) {
    return this.fetchWithAuth('/api/logistics/parcels', {
      method: 'POST',
      body: JSON.stringify(parcelData),
    });
  }

  // Track a parcel by tracking number
  async trackParcel(trackingNumber: string) {
    return this.fetchWithAuth(`/api/logistics/track/${trackingNumber}`);
  }

  // Get logistics dashboard data
  async getDashboard() {
    return this.fetchWithAuth('/api/logistics/dashboard');
  }

  // Get parcel details
  async getParcelDetails(trackingNumber: string) {
    return this.fetchWithAuth(`/api/logistics/parcels/${trackingNumber}`);
  }
}

export default new LogisticsService();
