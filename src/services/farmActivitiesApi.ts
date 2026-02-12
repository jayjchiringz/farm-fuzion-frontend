// farm-fuzion-frontend/src/services/farmActivitiesApi.ts
import axios from "axios";
import { components } from "../../types/api";

// ============================================
// TYPES
// ============================================

export type FarmSeason = {
  id?: number;
  farmer_id: number;
  season_name: string;
  season_type: "long_rains" | "short_rains" | "dry_season" | "irrigated";
  target_crop: string;
  location: string;
  county?: string;
  sub_county?: string;
  acreage: number;
  start_date: string;
  expected_end_date: string;
  status?: "planned" | "active" | "completed" | "cancelled";
  notes?: string;
  weather_zone?: string;
  soil_type?: string;
  created_at?: string;
  updated_at?: string;
};

export type SeasonActivity = {
  id?: number;
  season_id?: number;
  activity_type: "land_preparation" | "planting" | "fertilizer_application" | "pest_control" | 
                 "weeding" | "irrigation" | "harvesting" | "post_harvest" | "monitoring";
  activity_name: string;
  description?: string;
  planned_date: string;
  actual_date?: string;
  deadline_date?: string;
  status?: "pending" | "in_progress" | "completed" | "delayed" | "cancelled";
  priority?: "low" | "medium" | "high" | "critical";
  assigned_to?: string;
  notes?: string;
  cost_estimate?: number;
  actual_cost?: number;
  weather_notes?: string;
  completion_percentage?: number;
  created_at?: string;
  updated_at?: string;
};

export type FarmDiaryEntry = {
  id?: number;
  farmer_id: number;
  season_id?: number;
  entry_date?: string;
  title?: string;
  entry_type: "observation" | "issue" | "milestone" | "weather" | "expense" | "harvest" | "learning";
  content: string;
  weather_condition?: string;
  temperature?: number;
  rainfall_mm?: number;
  related_activity_id?: number;
  tags?: string[];
  images_urls?: string[];
  created_at?: string;
  updated_at?: string;
};

export type FarmAlert = {
  id?: number;
  farmer_id: number;
  season_id?: number;
  activity_id?: number;
  alert_type: "reminder" | "warning" | "system" | "weather" | "market";
  title: string;
  message: string;
  alert_date: string;
  alert_time?: string;
  status?: "pending" | "sent" | "read" | "dismissed";
  priority?: "low" | "medium" | "high" | "critical";
  repeat_pattern?: string;
  repeat_until?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

export type CropPlanningRequest = {
  farmer_id: number;
  crop_name: string;
  location: string;
  county?: string;
  sub_county?: string;
  acreage: number;
  start_date: string;
  soil_type?: string;
  farming_method?: "rainfed" | "irrigated" | "greenhouse";
};

export type DashboardResponse = {
  seasons_summary: {
    total: number;
    active: number;
    upcoming: number;
  };
  activities_summary: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  recent_diary_entries: FarmDiaryEntry[];
  upcoming_alerts: FarmAlert[];
  season_progress: Array<{
    season_id: number;
    season_name: string;
    progress_percentage: number;
    next_activity: SeasonActivity | null;
  }>;
};

export type Crop = {
  id: number;
  crop_name: string;
  scientific_name?: string;
  category: string;
  growth_days: number;
  description?: string;
};

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net";

export const farmActivitiesApi = {
  // ============================================
  // CROPS
  // ============================================
  async getCrops(): Promise<{ data: Crop[] }> {
    const res = await axios.get(`${API_BASE}/farm-activities/crops`);
    return res.data;
  },

  // ============================================
  // PLANNING
  // ============================================
  async generatePlan(request: CropPlanningRequest): Promise<{
    season: FarmSeason;
    activities: SeasonActivity[];
  }> {
    const res = await axios.post(`${API_BASE}/farm-activities/plan`, request);
    return res.data;
  },

  // ============================================
  // SEASONS & ACTIVITIES
  // ============================================
  async createSeasonWithActivities(data: {
    season: Omit<FarmSeason, "id">;
    activities?: Omit<SeasonActivity, "id" | "season_id">[];
  }): Promise<{ season_id: number; activity_ids: number[] }> {
    const res = await axios.post(`${API_BASE}/farm-activities/seasons`, data);
    return res.data;
  },

  async getFarmerSeasons(
    farmerId: number,
    status?: string,
    year?: number
  ): Promise<{ data: FarmSeason[]; summary: any }> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (year) params.append("year", String(year));
    
    const res = await axios.get(
      `${API_BASE}/farm-activities/seasons/farmer/${farmerId}`,
      { params }
    );
    return res.data;
  },

  async getSeasonActivities(
    seasonId: number,
    status?: string,
    type?: string
  ): Promise<{ data: SeasonActivity[]; summary: any }> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (type) params.append("type", type);
    
    const res = await axios.get(
      `${API_BASE}/farm-activities/seasons/${seasonId}/activities`,
      { params }
    );
    return res.data;
  },

  async updateActivity(
    activityId: number,
    updates: Partial<SeasonActivity>
  ): Promise<SeasonActivity> {
    const res = await axios.put(
      `${API_BASE}/farm-activities/activities/${activityId}`,
      updates
    );
    return res.data;
  },

  // ============================================
  // FARM DIARY
  // ============================================
  async createDiaryEntry(entry: Omit<FarmDiaryEntry, "id">): Promise<{ id: number }> {
    const res = await axios.post(`${API_BASE}/farm-activities/diary`, entry);
    return res.data;
  },

  async getFarmerDiaryEntries(
    farmerId: number,
    options?: {
      start_date?: string;
      end_date?: string;
      entry_type?: string;
      season_id?: number;
      page?: number;
      limit?: number;
    }
  ): Promise<{ data: FarmDiaryEntry[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams();
    if (options?.start_date) params.append("start_date", options.start_date);
    if (options?.end_date) params.append("end_date", options.end_date);
    if (options?.entry_type) params.append("entry_type", options.entry_type);
    if (options?.season_id) params.append("season_id", String(options.season_id));
    if (options?.page) params.append("page", String(options.page));
    if (options?.limit) params.append("limit", String(options.limit));
    
    const res = await axios.get(
      `${API_BASE}/farm-activities/diary/farmer/${farmerId}`,
      { params }
    );
    return res.data;
  },

  // ============================================
  // ALERTS
  // ============================================
  async getFarmerAlerts(
    farmerId: number,
    options?: {
      status?: string;
      priority?: string;
      from_date?: string;
      to_date?: string;
    }
  ): Promise<{ data: FarmAlert[]; summary: any }> {
    const params = new URLSearchParams();
    if (options?.status) params.append("status", options.status);
    if (options?.priority) params.append("priority", options.priority);
    if (options?.from_date) params.append("from_date", options.from_date);
    if (options?.to_date) params.append("to_date", options.to_date);
    
    const res = await axios.get(
      `${API_BASE}/farm-activities/alerts/farmer/${farmerId}`,
      { params }
    );
    return res.data;
  },

  async updateAlertStatus(
    alertId: number,
    status: "sent" | "read" | "dismissed"
  ): Promise<FarmAlert> {
    const res = await axios.put(
      `${API_BASE}/farm-activities/alerts/${alertId}/status`,
      { status }
    );
    return res.data;
  },

  // ============================================
  // DASHBOARD
  // ============================================
  async getDashboard(farmerId: number): Promise<DashboardResponse> {
    const res = await axios.get(`${API_BASE}/farm-activities/dashboard/${farmerId}`);
    return res.data;
  },
};
