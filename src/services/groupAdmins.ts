// farm-fuzion-frontend/src/services/groupAdmins.ts
import { API_BASE } from "./config";

export interface GroupAdminData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  mobile: string;
  group_id: string;
  role_id?: string;
}

export async function registerGroupAdmin(data: GroupAdminData) {
  const response = await fetch(`${API_BASE}/group-admins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Registration failed");
  }

  return await response.json();
}

export async function getGroupsForAssignment(): Promise<{ id: string; name: string }[]> {
  try {
    const response = await fetch(`${API_BASE}/groups?status=approved`);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch groups:", error);
    return [];
  }
}
