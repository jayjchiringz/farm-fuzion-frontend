// farm-fuzion-frontend/src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { Dialog, DialogTitle, DialogPanel } from "@headlessui/react";
import ThemeToggle from "../components/ThemeToggle";
import axios from "axios"; 
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../lib/firebase";
import { getRoles, createRole, updateRole, deleteRole } from "../services/roles";
import { 
  Users, UsersRound, Group, ShieldCheck, PlusSquare, Settings, Menu, 
  Plus, LogOut, Settings2, Building2, UserPlus, FileText, CheckCircle,
  XCircle, Clock, ChevronRight, ChevronLeft, Search, Filter, RefreshCw,
  Sparkles, BarChart3, Home, LayoutDashboard, UserCog, FolderTree,
  X, MapPin, Info, AlertTriangle, Trash2
} from "lucide-react";
import { constituencies, counties, county, wards } from "kenya-locations";
import { OverviewStats, GroupStats, FarmerStats } from "../components/Dashboard/DashboardStatsUI";
import { usePagination } from "../hooks/usePagination";
import PaginationFooter from "../components/Pagination/PaginationFooter";

const BASE_URL = import.meta.env.MODE === "development"
  ? "/api"
  : "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/api";

/*Interfaces*/
// -------------------------------------------------------------------------------------------------------------------------------  
interface Group {
  id: string; 
  name: string; 
  type: string; 
  location: string;
  status: string;
  remarks?: string;
  registration_number?: string;
  documents?: { doc_type: string; path?: string }[];
}

interface Farmer {
  id: number; 
  first_name: string; 
  middle_name: string; 
  last_name: string; 
  email: string; 
  group_id: string;
}

interface GroupType {
  id: string; 
  name: string;
}

interface Stats {
  totalGroups: number;
  totalFarmers: number;
  statusCounts: Record<string, number>;
  farmerByGroup: Array<{ group_name: string; count: number }>;
}
// -------------------------------------------------------------------------------------------------------------------------------  

const sanitizeKey = (key: string) =>
  key.toLowerCase().replace(/[^a-z0-9]/gi, "_");

/*--Admin Panel*/
// -------------------------------------------------------------------------------------------------------------------------------  
export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openGroupSub, setOpenGroupSub] = useState(false);
  const [openUserSub, setOpenUserSub] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [groupTypes, setGroupTypes] = useState<GroupType[]>([]);
  const [documentTypes, setDocumentTypes] = useState<{ doc_type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingGroupId, setUpdatingGroupId] = useState<string | null>(null);
  
  // Modal States
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [isFarmerModalOpen, setFarmerModalOpen] = useState(false);
  const [isGroupTypeModalOpen, setGroupTypeModalOpen] = useState(false);
  const [isUserRoleModalOpen, setUserRoleModalOpen] = useState(false);
  const [isFarmerViewModalOpen, setFarmerViewModalOpen] = useState(false);
  const [selectedGroupForFarmers, setSelectedGroupForFarmers] = useState<Group | null>(null);

  // Form States
  const [groupForm, setGroupForm] = useState({
    name: "",
    group_type_id: "",
    county:"",
    constituency:"",
    ward:"",
    location: "",
    registration_number: "",
    description: "",
    documentRequirements: [] as { doc_type: string; is_required: boolean }[],
    uploadedDocs: {} as Record<string, File>,
  });

  const [farmerForm, setFarmerForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    group_id: "",
    dob: "",
    id_passport_no: "",
    county:"",
    constituency:"",
    ward:"",
    location: "",
    address: "",
    mobile: "",
  });

  const [newGroupType, setNewGroupType] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDocType, setNewDocType] = useState("");
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [stats, setStats] = useState<Stats>({
    totalGroups: 0,
    totalFarmers: 0,
    statusCounts: {},
    farmerByGroup: [],
  });

  // Search and Filter States
  const [groupSearch, setGroupSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const admin = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = admin.first_name || admin.email?.split('@')[0] || 'Administrator';

  useEffect(() => { 
    fetchData(); 
  }, []);

  useEffect(() => {
    if (documentTypes.length > 0) {
      setGroupForm((prev) => ({
        ...prev,
        documentRequirements: documentTypes.map((d) => ({
          doc_type: d.doc_type,
          is_required: false,
        })),
      }));
    }
  }, [documentTypes]);

  useEffect(() => {
    fetchRoles();
    fetchStats();
  }, []);

  const fetchRoles = async () => {
    try {
      const roles = await getRoles();
      setUserRoles(Array.isArray(roles) ? roles : []);
    } catch (error) {
      console.error("Error in fetchRoles:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BASE_URL}/stats/summary`);
      const json = await res.json();
      setStats(json);
    } catch (err) {
      console.error("📉 Stats fetch failed:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, farmersRes, typesRes, docsRes] = await Promise.all([
        fetch(`${BASE_URL}/groups`),
        fetch(`${BASE_URL}/farmers`),
        fetch(`${BASE_URL}/groups-types`),
        fetch(`${BASE_URL}/document-types`),
      ]);

      const safeJson = async (res: Response, label: string) => {
        const clone = res.clone();
        try {
          return await res.json();
        } catch {
          const fallback = await clone.text();
          console.error(`❌ ${label} JSON parse error:`, fallback);
          return [];
        }
      };

      const groupsData = await safeJson(groupsRes, "Groups");
      const farmersData = await safeJson(farmersRes, "Farmers");
      const typesData = await safeJson(typesRes, "GroupTypes");
      const docsData = await safeJson(docsRes, "DocumentTypes");

      setGroups(Array.isArray(groupsData) ? groupsData : []);
      setFarmers(Array.isArray(farmersData) ? farmersData : []);
      setGroupTypes(Array.isArray(typesData) ? typesData : []);
      setDocumentTypes(Array.isArray(docsData) ? docsData.sort((a, b) => 
        a.doc_type.localeCompare(b.doc_type)
      ) : []);
    } catch (err) {
      console.error("🚨 fetchData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchRoles(), fetchStats()]);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const updateGroupStatus = async (id: string, status: string) => {
    try {
      setUpdatingGroupId(id);
      let endpoint = `${BASE_URL}/groups/${id}/approve`;
      let body;

      if (status === "rejected") {
        endpoint = `${BASE_URL}/groups/${id}/reject`;
        body = JSON.stringify({ remarks: "Rejected by admin" });
      } else if (status === "pending") {
        endpoint = `${BASE_URL}/groups/${id}/reject`;
        body = JSON.stringify({ remarks: "Reverted to pending", revertToPending: true });
      }

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        ...(body ? { body } : {}),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Status update failed:", errText);
        alert(`Failed: ${errText}`);
        return;
      }

      await fetchData();
    } catch (err) {
      console.error("Update error:", err);
      alert("Something went wrong.");
    } finally {
      setUpdatingGroupId(null);
    }
  };

  const submitGroup = async () => {
    try {
      // Validate required fields
      const requiredFields = [
        { field: groupForm.name, name: "Group Name" },
        { field: groupForm.group_type_id, name: "Group Type" },
        { field: groupForm.county, name: "County" },
        { field: groupForm.constituency, name: "Constituency" },
        { field: groupForm.ward, name: "Ward" },
        { field: groupForm.location, name: "Location" },
        { field: groupForm.registration_number, name: "Registration Number" },
      ];

      const missingFields = requiredFields
        .filter(item => !item.field || item.field.trim() === "")
        .map(item => item.name);

      if (missingFields.length > 0) {
        alert(`Please fill in the following required fields:\n- ${missingFields.join('\n- ')}`);
        return;
      }

      // Validate that at least one required document is selected
      const hasRequiredDocs = groupForm.documentRequirements.some(r => r.is_required);
      if (!hasRequiredDocs) {
        alert("Please select at least one required document type.");
        return;
      }

      setLoading(true);
      const uploadedPaths: { [docType: string]: string } = {};

      // Upload files to Firebase Storage
      for (const r of groupForm.documentRequirements) {
        const file = groupForm.uploadedDocs[r.doc_type];
        if (r.is_required && file instanceof File) {
          const ext = file.name.split(".").pop();
          const path = `group_docs/${uuidv4()}.${ext}`;
          const fileRef = ref(storage, path);
          await uploadBytes(fileRef, file);
          uploadedPaths[r.doc_type] = path;
        }
      }

      // Prepare payload with proper structure
      const payload = {
        name: groupForm.name.trim(),
        group_type_id: groupForm.group_type_id,
        county: groupForm.county,
        constituency: groupForm.constituency,
        ward: groupForm.ward,
        location: groupForm.location.trim(),
        registration_number: groupForm.registration_number.trim(),
        description: groupForm.description?.trim() || "",
        requirements: groupForm.documentRequirements.map((r) => ({
          doc_type: r.doc_type,
          is_required: r.is_required,
          file_path: uploadedPaths[r.doc_type] || null,
        })),
      };

      console.log("Submitting group with payload:", payload);

      // Send metadata to Cloud Function
      const res = await fetch("https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/registerWithDocs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();
      
      if (!res.ok) {
        console.error("Server error response:", responseData);
        throw new Error(responseData.error || "Cloud function failed");
      }

      const { id: groupId } = responseData;

      // Save requirements metadata
      const metaRes = await fetch(`${BASE_URL}/groups/${groupId}/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements: groupForm.documentRequirements.filter((r) => r.is_required),
        }),
      });

      if (!metaRes.ok) throw new Error("Requirement save failed");

      // Success! Reset form
      setGroupModalOpen(false);
      setGroupForm({
        name: "",
        group_type_id: "",
        county: "",
        constituency: "",
        ward: "",
        location: "",
        registration_number: "",
        description: "",
        documentRequirements: documentTypes.map((d) => ({
          doc_type: d.doc_type,
          is_required: false,
        })),
        uploadedDocs: {},
      });

      alert("✅ Group registered successfully!");
      fetchData();
    } catch (err: any) {
      console.error("❌ Group creation failed:", err);
      alert(
        `Group registration failed:\n${
          err.message || "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const submitFarmer = async () => {
    try {
      const response = await fetch(`${BASE_URL}/farmers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: farmerForm.first_name,
          middle_name: farmerForm.middle_name,
          last_name: farmerForm.last_name,
          dob: farmerForm.dob,
          id_passport_no: farmerForm.id_passport_no,
          county: farmerForm.county,
          constituency: farmerForm.constituency,
          ward: farmerForm.ward,
          location: farmerForm.location,
          address: farmerForm.address,
          mobile: farmerForm.mobile,
          email: farmerForm.email,
          group_id: farmerForm.group_id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || "Unknown error");
      }

      setFarmerModalOpen(false);
      setFarmerForm({
        first_name: "",
        middle_name: "",
        last_name: "",
        dob: "",
        id_passport_no: "",
        county:"",
        constituency:"",
        ward:"",
        location: "",
        address: "",
        mobile: "",
        email: "",
        group_id: "",
      });

      fetchData();
    } catch (err: any) {
      console.error("❌ Farmer registration failed:", err);
      alert(`Farmer registration failed:\n${err.message}`);
    }
  };

  const handleAddGroupType = async () => {
    try {
      const res = await fetch(`${BASE_URL}/groups-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupType }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Group type creation failed:", errorText);
        alert(`Failed to add group type: ${errorText}`);
        return;
      }

      setEditingId(null);
      setNewGroupType("");
      await fetchData();
    } catch (err) {
      console.error("Network or server error:", err);
      alert("Something went wrong while adding group type.");
    }
  };

  const handleUpdateGroupType = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/groups-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupType }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Update failed:", errorText);
        alert(`Failed to update group type: ${errorText}`);
        return;
      }

      setEditingId(null);
      setNewGroupType("");
      await fetchData();
    } catch (err) {
      console.error("Network or server error during update:", err);
      alert("An unexpected error occurred while updating the group type.");
    }
  };

  const handleDeleteGroupType = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to deactivate this group type?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${BASE_URL}/groups-types/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Deletion failed:", errorText);
        alert(`Failed to delete group type: ${errorText}`);
        return;
      }

      await fetchData();
    } catch (err) {
      console.error("Network or server error during deletion:", err);
      alert("An unexpected error occurred while deleting the group type.");
    }
  };

  const addDocumentType = async () => {
    if (!newDocType.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/document-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_type: newDocType }),
      });

      if (!res.ok) throw new Error(await res.text());
      setNewDocType("");
      await fetchData();
    } catch (err) {
      alert("Failed to add document type.");
      console.error(err);
    }
  };

  const deleteDocumentType = async (doc_type: string) => {
    if (!window.confirm(`Remove "${doc_type}"?`)) return;
    try {
      const res = await fetch(`${BASE_URL}/document-types/${encodeURIComponent(doc_type)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());

      await fetchData();
    } catch (err) {
      alert("Failed to delete document type.");
      console.error(err);
    }
  };
  
  const requiredDocsValid = groupForm.documentRequirements
    .filter((r) => r.is_required)
    .every((r) => !!groupForm.uploadedDocs[r.doc_type]);

  const handleAssignGroup = async (farmerId: number, groupId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/farmers/${farmerId}/group`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId }),
      });

      if (!res.ok) throw new Error("Group assignment failed");

      fetchData();
    } catch (err) {
      console.error("❌ Failed to assign group:", err);
      alert("Failed to assign group. Please try again.");
    }
  };

  const handleAddUserRole = async () => {
    const added = await createRole({ name: newRoleName });
    setUserRoles([...userRoles, added]);
    setNewRoleName("");
  };

  const handleUpdateUserRole = async (id: string) => {
    const updated = await updateRole(id, { name: newRoleName });
    setUserRoles(userRoles.map((r) => (r.id === id ? updated : r)));
    setEditingId(null);
  };

  const handleDeleteUserRole = async (id: string) => {
    await deleteRole(id);
    setUserRoles(userRoles.filter((r) => r.id !== id));
  };

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.clear();
    
    // Clear any session storage if used
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = "/login";
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: <CheckCircle size={14} /> };
      case 'pending':
        return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: <Clock size={14} /> };
      case 'rejected':
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: <XCircle size={14} /> };
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', icon: null };
    }
  };

  // Filter groups based on search and status
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
                         group.location?.toLowerCase().includes(groupSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || group.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    page: groupPage,
    perPage: groupPerPage,
    setPage: setGroupPage,
    setPerPage: setGroupPerPage,
    maxPage: groupMaxPage,
    paginatedItems: paginatedGroups,
  } = usePagination(filteredGroups);

  const {
    page: farmerPage,
    perPage: farmerPerPage,
    setPage: setFarmerPage,
    setPerPage: setFarmerPerPage,
    maxPage: farmerMaxPage,
    paginatedItems: paginatedFarmers,
  } = usePagination(farmers);

  return (
    <MainLayout>
      <ThemeToggle />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Sophisticated Sidebar with Translucent Effects */}
        <aside
          className={`${
            isSidebarOpen ? "w-72" : "w-24"
          } transition-all duration-500 ease-in-out 
            bg-brand-green/95 backdrop-blur-md
            dark:bg-gray-900/95 dark:backdrop-blur-md
            text-white flex flex-col justify-between py-8 px-4 shadow-2xl relative overflow-hidden
            border-r border-white/10`}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(0,0,0,0.05)_0%,_transparent_50%)]"></div>
          
          {/* Sidebar Header */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              {/* Logo with subtle elegance */}
              <div className="transition-all duration-500">
                {isSidebarOpen ? (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="/Logos/FF Logo only transparent background.png"
                        alt="Farm Fuzion"
                        className="h-12 w-12 object-contain relative z-10 opacity-90 hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <span className="text-xl font-light text-white/90 tracking-wide">Admin Panel</span>
                  </div>
                ) : (
                  <div className="relative flex justify-center">
                    <img
                      src="/Logos/FF Logo only transparent background.png"
                      alt="FF"
                      className="h-14 w-14 object-contain mx-auto transition-all duration-300 hover:scale-110 opacity-90 hover:opacity-100"
                    />
                  </div>
                )}
              </div>
              
              {/* Subtle toggle button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 backdrop-blur-sm text-white/70 hover:text-white"
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            </div>

            {/* Navigation with refined styling */}
            <nav className="space-y-1">
              <NavItem 
                icon={<LayoutDashboard size={isSidebarOpen ? 18 : 22} />}
                label="Dashboard"
                active={true}
                collapsed={!isSidebarOpen}
              />

              {/* Manage Groups */}
              <div>
                <button
                  onClick={() => setOpenGroupSub(!openGroupSub)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 group ${
                    !isSidebarOpen && 'justify-center'
                  }`}
                >
                  <Building2 size={isSidebarOpen ? 18 : 22} className="text-white/80 group-hover:text-white" />
                  {isSidebarOpen && (
                    <span className="flex-1 text-left text-sm font-medium text-white/80 group-hover:text-white">Manage Groups</span>
                  )}
                  {isSidebarOpen && (
                    <ChevronRight 
                      size={14} 
                      className={`text-white/60 transition-transform duration-300 ${openGroupSub ? 'rotate-90' : ''}`} 
                    />
                  )}
                </button>
                
                {isSidebarOpen && openGroupSub && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-2">
                    <SubNavItem 
                      icon={<Plus size={14} />}
                      label="Register Group"
                      onClick={() => setGroupModalOpen(true)}
                    />
                    <SubNavItem 
                      icon={<FolderTree size={14} />}
                      label="Group Types"
                      onClick={() => setGroupTypeModalOpen(true)}
                    />
                  </div>
                )}
              </div>

              {/* Manage Users */}
              <div>
                <button
                  onClick={() => setOpenUserSub(!openUserSub)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 group ${
                    !isSidebarOpen && 'justify-center'
                  }`}
                >
                  <UsersRound size={isSidebarOpen ? 18 : 22} className="text-white/80 group-hover:text-white" />
                  {isSidebarOpen && (
                    <span className="flex-1 text-left text-sm font-medium text-white/80 group-hover:text-white">Manage Users</span>
                  )}
                  {isSidebarOpen && (
                    <ChevronRight 
                      size={14} 
                      className={`text-white/60 transition-transform duration-300 ${openUserSub ? 'rotate-90' : ''}`} 
                    />
                  )}
                </button>
                
                {isSidebarOpen && openUserSub && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-2">
                    <SubNavItem 
                      icon={<UserPlus size={14} />}
                      label="Register Farmer"
                      onClick={() => setFarmerModalOpen(true)}
                    />
                    <SubNavItem 
                      icon={<ShieldCheck size={14} />}
                      label="User Roles"
                      onClick={() => setUserRoleModalOpen(true)}
                    />
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Logout Button - Fixed with better visibility and click handling */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer ${
              !isSidebarOpen ? 'justify-center' : ''
            } bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500/50`}
            title="Logout"
            type="button"
          >
            <LogOut size={isSidebarOpen ? 20 : 24} className="transition-transform duration-300 group-hover:translate-x-1" />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Admin avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {adminName.charAt(0)}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Welcome back, {adminName}!
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={14} className="text-purple-600" />
                      Super Admin
                    </span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span>Last login: Today 9:41 AM</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
                  disabled={refreshing}
                >
                  <RefreshCw size={20} className={refreshing ? 'animate-spin text-brand-green' : 'text-gray-600 dark:text-gray-400'} />
                </button>
                
                <ThemeToggle />
              </div>
            </div>
          </div>
          {/* Dashboard Content */}
          <div className="p-6">
            {/* Welcome Banner */}
            <div className="mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-16 -mb-16"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Farm Fuzion Administration</h2>
                <p className="text-white/90 max-w-2xl">
                  Manage groups, farmers, and system configurations from one central dashboard.
                </p>
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
                    <Sparkles size={16} />
                    <span className="text-sm">System Overview</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
                    <BarChart3 size={16} />
                    <span className="text-sm">Live Stats</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <MetricCard
                label="Total Groups"
                value={stats.totalGroups.toString()}
                icon={<Building2 size={24} />}
                trend="+12% this month"
                color="from-blue-500 to-indigo-600"
              />
              <MetricCard
                label="Total Farmers"
                value={stats.totalFarmers.toString()}
                icon={<Users size={24} />}
                trend="+8% this month"
                color="from-green-500 to-emerald-600"
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
              </div>
            ) : (
              <>
                {/* Groups Section */}
                <section className="mb-12">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Building2 size={24} className="text-purple-600" />
                      Registered SACCOs & Groups
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({filteredGroups.length} total)
                      </span>
                    </h2>
                    
                    <div className="flex flex-wrap gap-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search groups..."
                          value={groupSearch}
                          onChange={(e) => setGroupSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      
                      {/* Status Filter */}
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">All Status</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">Type</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">Location</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">Reg. No</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">Documents</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                          {paginatedGroups.map((g) => {
                            const statusBadge = getStatusBadge(g.status);
                            return (
                              <tr
                                key={g.id}
                                onClick={() => {
                                  setSelectedGroupForFarmers(g);
                                  setFarmerViewModalOpen(true);
                                }}
                                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150 group"
                              >
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                  {g.name}
                                </td>
                                <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                  {g.type}
                                </td>
                                <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                  {g.location}
                                </td>
                                <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                  {g.registration_number || "—"}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {g.documents?.length ? (
                                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                      <FileText size={14} />
                                      {g.documents.length} uploaded
                                    </span>
                                  ) : (
                                    <span className="text-red-500">None</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                                    {statusBadge.icon}
                                    {g.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateGroupStatus(g.id, "approved");
                                      }}
                                      disabled={updatingGroupId === g.id}
                                      className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium disabled:opacity-50 transition-colors"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateGroupStatus(g.id, "pending");
                                      }}
                                      disabled={updatingGroupId === g.id}
                                      className="px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium disabled:opacity-50 transition-colors"
                                    >
                                      Suspend
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    <PaginationFooter
                      page={groupPage}
                      maxPage={groupMaxPage}
                      perPage={groupPerPage}
                      setPage={setGroupPage}
                      setPerPage={setGroupPerPage}
                    />
                  </div>
                </section>

                {/* View All Farmers Button */}
                <section className="mt-8">
                  <button
                    onClick={() => {
                      setSelectedGroupForFarmers(null);
                      setFarmerViewModalOpen(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
                  >
                    <Users size={20} />
                    View All Farmers
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      {/* ✅ Farmer View Modal */}
      <Dialog
        open={isFarmerViewModalOpen}
        onClose={() => setFarmerViewModalOpen(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen px-4">
          <DialogPanel className="w-full max-w-6xl p-6 bg-white dark:bg-brand-dark rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto transition-all duration-200">
            <DialogTitle className="text-2xl font-bold text-brand-green dark:text-brand-apple mb-6 font-ubuntu tracking-tight">
              {selectedGroupForFarmers
                ? `Farmers in ${selectedGroupForFarmers.name}`
                : "All Registered Farmers"}
            </DialogTitle>

            <div className="overflow-x-auto rounded-xl border dark:border-slate-700 shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-brand-green text-white dark:bg-brand-apple dark:text-brand-dark">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2 text-center">Email</th>
                    <th className="px-4 py-2 text-center">Group</th>
                  </tr>
                </thead>
                <tbody>
                  {farmers
                    .filter((f) =>
                      selectedGroupForFarmers ? f.group_id === selectedGroupForFarmers.id : true
                    )
                    .slice(
                      (farmerPage - 1) * farmerPerPage,
                      farmerPage * farmerPerPage
                    )
                    .map((f) => {
                      const group = groups.find((g) => g.id === f.group_id);
                      return (
                        <tr
                          key={f.id}
                          className="odd:bg-slate-100 dark:odd:bg-[#033127] dark:hover:bg-brand-apple/10 transition-colors duration-150"
                        >
                          <td className="px-4 py-2 font-medium dark:text-gray-100">
                            {f.first_name} {f.middle_name} {f.last_name}
                          </td>
                          <td className="px-4 py-2 text-center dark:text-gray-200">{f.email}</td>
                          <td className="px-4 py-2 text-center dark:text-gray-200">
                            {group ? (
                              group.name
                            ) : (
                              <select
                                className="p-1 border rounded text-sm dark:bg-brand-dark dark:border-gray-600 dark:text-gray-200"
                                onChange={(e) => handleAssignGroup(f.id, e.target.value)}
                                defaultValue=""
                              >
                                <option value="" disabled>Select Group</option>
                                {groups.map((g) => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <PaginationFooter
              page={farmerPage}
              maxPage={farmerMaxPage}
              perPage={farmerPerPage}
              setPage={setFarmerPage}
              setPerPage={setFarmerPerPage}
            />
          </DialogPanel>
        </div>
      </Dialog>
        {/* Register Group Modal */}
        <Dialog open={isGroupModalOpen} onClose={() => setGroupModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={() => setGroupModalOpen(false)} />
            
            <DialogPanel className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl transform transition-all animate-slide-up">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-brand-green to-green-600 dark:from-gray-800 dark:to-gray-900 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Building2 size={24} className="text-white" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold text-white">
                        Register New Group
                      </DialogTitle>
                      <p className="text-sm text-white/80">Fill in the details to register a new SACCO or group</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setGroupModalOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Form content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-6">
                  {['Basic Info', 'Location', 'Documents'].map((step, idx) => (
                    <div key={idx} className="flex items-center flex-1">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        idx === 0 ? 'bg-brand-green text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {idx + 1}
                      </div>
                      {idx < 2 && <div className="flex-1 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700" />}
                    </div>
                  ))}
                </div>

                {/* Required fields indicator */}
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <span className="text-red-500">*</span>
                  <span className="text-gray-600 dark:text-gray-400">Required fields</span>
                </div>

                {/* Basic Information Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Info size={18} className="text-brand-green" />
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Group Name */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Group Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all"
                        placeholder="e.g., Molo Farmers SACCO"
                        value={groupForm.name}
                        onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                      />
                    </div>

                    {/* Group Type */}
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Group Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-brand-green focus:border-transparent"
                        value={groupForm.group_type_id}
                        onChange={(e) => setGroupForm({ ...groupForm, group_type_id: e.target.value })}
                      >
                        <option value="">Select Type</option>
                        {groupTypes.map((type) => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Registration Number */}
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Registration Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-brand-green focus:border-transparent"
                        placeholder="e.g., SACCO/2024/12345"
                        value={groupForm.registration_number}
                        onChange={(e) => setGroupForm({ ...groupForm, registration_number: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-brand-green" />
                    Location Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* County */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        County <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-brand-green focus:border-transparent"
                        value={groupForm.county}
                        onChange={(e) => {
                          const county = e.target.value;
                          setGroupForm({ ...groupForm, county, constituency: "", ward: "" });
                        }}
                      >
                        <option value="">Select County</option>
                        {counties.map((c) => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Constituency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Constituency <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-brand-green focus:border-transparent"
                        value={groupForm.constituency}
                        onChange={(e) =>
                          setGroupForm({ ...groupForm, constituency: e.target.value, ward: "" })
                        }
                        disabled={!groupForm.county}
                      >
                        <option value="">Select Constituency</option>
                        {constituencies
                          .filter((c) => c.county === groupForm.county)
                          .map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Ward */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ward <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-brand-green focus:border-transparent"
                        value={groupForm.ward}
                        onChange={(e) => setGroupForm({ ...groupForm, ward: e.target.value })}
                        disabled={!groupForm.constituency}
                      >
                        <option value="">Select Ward</option>
                        {wards
                          .filter((w) => w.constituency === groupForm.constituency)
                          .map((w) => (
                            <option key={w.name} value={w.name}>
                              {w.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Physical Location */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Physical Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-brand-green focus:border-transparent"
                        placeholder="e.g., Near Molo Market, along Nakuru-Eldoret road"
                        value={groupForm.location}
                        onChange={(e) => setGroupForm({ ...groupForm, location: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Description - Optional */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-brand-green focus:border-transparent"
                    placeholder="Brief description of the group's activities and objectives..."
                    rows={3}
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  />
                </div>

                {/* Documents Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-brand-green" />
                    Required Documents <span className="text-red-500">*</span>
                  </h3>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Select the documents required for registration and upload them
                  </p>

                  <div className="space-y-4">
                    {groupForm.documentRequirements.map((item, i) => (
                      <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.is_required}
                              onChange={(e) => {
                                const newList = [...groupForm.documentRequirements];
                                newList[i].is_required = e.target.checked;
                                setGroupForm({ ...groupForm, documentRequirements: newList });
                              }}
                              className="w-4 h-4 text-brand-green border-gray-300 rounded focus:ring-brand-green"
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{item.doc_type}</span>
                          </label>
                          {item.is_required && (
                            <span className="text-xs px-2 py-1 bg-brand-green/10 text-brand-green rounded-full">
                              Required
                            </span>
                          )}
                        </div>

                        {item.is_required && (
                          <div className="mt-2">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Upload file (PDF, JPG, PNG)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-green file:text-white hover:file:bg-green-700"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setGroupForm((prev) => ({
                                    ...prev,
                                    uploadedDocs: {
                                      ...prev.uploadedDocs,
                                      [item.doc_type]: file,
                                    },
                                  }));
                                }}
                              />
                              {groupForm.uploadedDocs[item.doc_type] && (
                                <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                              )}
                            </div>
                            {groupForm.uploadedDocs[item.doc_type] && (
                              <p className="text-xs text-green-600 mt-1">
                                ✓ {groupForm.uploadedDocs[item.doc_type].name}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation Summary */}
                {!requiredDocsValid && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Please upload all required documents
                    </p>
                  </div>
                )}
              </div>

              {/* Footer with actions */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setGroupModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitGroup}
                    disabled={loading || !requiredDocsValid}
                    className="px-6 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Register Group
                      </>
                    )}
                  </button>
                </div>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

      {/* Farmer Registration Modal */}
      <Dialog open={isFarmerModalOpen} onClose={() => setFarmerModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={() => setFarmerModalOpen(false)} />
          
          <DialogPanel className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl transform transition-all animate-slide-up">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-gray-800 dark:to-gray-900 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <UserPlus size={24} className="text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-white">
                      Register New Farmer
                    </DialogTitle>
                    <p className="text-sm text-white/80">Add a new farmer to the platform</p>
                  </div>
                </div>
                <button
                  onClick={() => setFarmerModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            {/* Form content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-6">
                {['Personal Info', 'Location', 'Account'].map((step, idx) => (
                  <div key={idx} className="flex items-center flex-1">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      idx === 0 ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {idx + 1}
                    </div>
                    {idx < 2 && <div className="flex-1 h-0.5 mx-2 bg-gray-200 dark:bg-gray-700" />}
                  </div>
                ))}
              </div>

              {/* Required fields indicator */}
              <div className="flex items-center gap-2 mb-4 text-sm">
                <span className="text-red-500">*</span>
                <span className="text-gray-600 dark:text-gray-400">Required fields</span>
              </div>

              {/* Personal Information Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <UserCog size={18} className="text-green-600" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="e.g., John"
                      value={farmerForm.first_name}
                      onChange={(e) => setFarmerForm({ ...farmerForm, first_name: e.target.value })}
                    />
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Middle Name
                    </label>
                    <input
                      className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="e.g., Mwangi"
                      value={farmerForm.middle_name}
                      onChange={(e) => setFarmerForm({ ...farmerForm, middle_name: e.target.value })}
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="e.g., Doe"
                      value={farmerForm.last_name}
                      onChange={(e) => setFarmerForm({ ...farmerForm, last_name: e.target.value })}
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={farmerForm.dob}
                      onChange={(e) => setFarmerForm({ ...farmerForm, dob: e.target.value })}
                    />
                  </div>

                  {/* ID/Passport Number */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ID/Passport Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 29810809"
                      value={farmerForm.id_passport_no}
                      onChange={(e) => setFarmerForm({ ...farmerForm, id_passport_no: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-green-600" />
                  Location Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* County */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      County <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={farmerForm.county}
                      onChange={(e) => {
                        const county = e.target.value;
                        setFarmerForm({ ...farmerForm, county, constituency: "", ward: "" });
                      }}
                    >
                      <option value="">Select County</option>
                      {counties.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Constituency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Constituency <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={farmerForm.constituency}
                      onChange={(e) =>
                        setFarmerForm({ ...farmerForm, constituency: e.target.value, ward: "" })
                      }
                      disabled={!farmerForm.county}
                    >
                      <option value="">Select Constituency</option>
                      {constituencies
                        .filter((c) => c.county === farmerForm.county)
                        .map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Ward */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ward <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={farmerForm.ward}
                      onChange={(e) => setFarmerForm({ ...farmerForm, ward: e.target.value })}
                      disabled={!farmerForm.constituency}
                    >
                      <option value="">Select Ward</option>
                      {wards
                        .filter((w) => w.constituency === farmerForm.constituency)
                        .map((w) => (
                          <option key={w.name} value={w.name}>
                            {w.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Physical Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Physical Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Vuga Village, Boma la Mwatsama"
                      value={farmerForm.location}
                      onChange={(e) => setFarmerForm({ ...farmerForm, location: e.target.value })}
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address
                    </label>
                    <input
                      className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 123 Main Street"
                      value={farmerForm.address}
                      onChange={(e) => setFarmerForm({ ...farmerForm, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users size={18} className="text-green-600" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mobile Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 0707098495"
                      value={farmerForm.mobile}
                      onChange={(e) => setFarmerForm({ ...farmerForm, mobile: e.target.value })}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., farmer@example.com"
                      value={farmerForm.email}
                      onChange={(e) => setFarmerForm({ ...farmerForm, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Group Assignment */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Building2 size={18} className="text-green-600" />
                  Group Assignment
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-3 border rounded-lg text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={farmerForm.group_id}
                    onChange={(e) => setFarmerForm({ ...farmerForm, group_id: e.target.value })}
                  >
                    <option value="">Select a group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Farmers must be assigned to a group
                  </p>
                </div>
              </div>

              {/* Validation Summary */}
              {(!farmerForm.first_name || !farmerForm.last_name || !farmerForm.email || !farmerForm.mobile || !farmerForm.group_id) && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    Please fill in all required fields
                  </p>
                </div>
              )}
            </div>

            {/* Footer with actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFarmerModalOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitFarmer}
                  disabled={loading || !farmerForm.first_name || !farmerForm.last_name || !farmerForm.email || !farmerForm.mobile || !farmerForm.group_id}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Register Farmer
                    </>
                  )}
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Group Type Modal */}
      <Dialog
        open={isGroupTypeModalOpen}
        onClose={() => setGroupTypeModalOpen(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={() => setGroupTypeModalOpen(false)} />
          
          <DialogPanel className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl transform transition-all animate-slide-up">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <FolderTree size={24} className="text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-white">
                      Manage Group Types
                    </DialogTitle>
                    <p className="text-sm text-white/80">Add, edit, or remove group categories</p>
                  </div>
                </div>
                <button
                  onClick={() => setGroupTypeModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Existing Group Types List */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <FolderTree size={16} className="text-purple-600" />
                  Existing Group Types
                </h3>
                
                {groupTypes.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FolderTree size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No group types yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add your first group type below</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupTypes.map((type) => (
                      <div
                        key={type.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <FolderTree size={14} className="text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {type.name}
                          </span>
                        </div>
                        
                        {editingId === type.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newGroupType}
                              onChange={(e) => setNewGroupType(e.target.value)}
                              className="w-32 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="New name"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateGroupType(type.id)}
                              disabled={!newGroupType.trim()}
                              className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                              title="Save"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setNewGroupType("");
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="Cancel"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingId(type.id);
                                setNewGroupType(type.name);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-700"
                              title="Edit"
                            >
                              <Settings size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteGroupType(type.id)}
                              className="p-1 text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Group Type */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Plus size={16} className="text-green-600" />
                  Add New Group Type
                </h3>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGroupType}
                    onChange={(e) => setNewGroupType(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddGroupType()}
                    placeholder="e.g., SACCO, Cooperative, Self-Help Group"
                    className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddGroupType}
                    disabled={!newGroupType.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Press Enter to add quickly
                </p>
              </div>

              {/* Info Note */}
              <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <Info size={14} className="mt-0.5 flex-shrink-0" />
                  <span>
                    Group types help categorize different kinds of farming groups. 
                    Examples: SACCOs, Farmer Cooperatives, Self-Help Groups, etc.
                  </span>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setGroupTypeModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* User Roles Modal */}
      <Dialog
        open={isUserRoleModalOpen}
        onClose={() => setUserRoleModalOpen(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" onClick={() => setUserRoleModalOpen(false)} />
          
          <DialogPanel className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl transform transition-all animate-slide-up">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <ShieldCheck size={24} className="text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-white">
                      Manage User Roles
                    </DialogTitle>
                    <p className="text-sm text-white/80">Define and manage user permissions</p>
                  </div>
                </div>
                <button
                  onClick={() => setUserRoleModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Existing Roles List */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-600" />
                  Existing Roles
                </h3>
                
                {userRoles.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <ShieldCheck size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No roles yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add your first role below</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userRoles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {role.name}
                            </span>
                            {role.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{role.description}</p>
                            )}
                          </div>
                        </div>
                        
                        {editingId === role.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newRoleName}
                              onChange={(e) => setNewRoleName(e.target.value)}
                              className="w-32 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="New name"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateUserRole(role.id)}
                              disabled={!newRoleName.trim()}
                              className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                              title="Save"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setNewRoleName("");
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="Cancel"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingId(role.id);
                                setNewRoleName(role.name);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-700"
                              title="Edit"
                            >
                              <Settings size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUserRole(role.id)}
                              className="p-1 text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Role */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Plus size={16} className="text-green-600" />
                  Add New Role
                </h3>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddUserRole()}
                    placeholder="e.g., Farm Manager, Extension Officer, Field Agent"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddUserRole}
                      disabled={!newRoleName.trim()}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Add Role
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Press Enter to add quickly
                </p>
              </div>

              {/* Info Note */}
              <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                  <Info size={14} className="mt-0.5 flex-shrink-0" />
                  <span>
                    User roles determine what actions different users can perform in the system. 
                    Examples: Farmer, Agronomist, Extension Officer, Admin.
                  </span>
                </p>
              </div>

              {/* Sample Roles Card */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Sparkles size={12} className="text-yellow-500" />
                  Suggested Roles
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Farmer', 'Agronomist', 'Extension Officer', 'Admin', 'Field Agent', 'Veterinarian'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setNewRoleName(suggestion)}
                      className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setUserRoleModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </MainLayout>
  );
}

// ==================== Subcomponents ====================

function NavItem({ icon, label, active = false, collapsed }: any) {
  return (
    <div
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-white/15 text-white' 
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <span className={active ? 'text-white' : 'text-white/70'}>{icon}</span>
      {!collapsed && <span className="text-sm font-light tracking-wide">{label}</span>}
    </div>
  );
}

function SubNavItem({ icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white/90 hover:bg-white/5 rounded-lg transition-all duration-300"
    >
      <span className="opacity-70">{icon}</span>
      <span className="font-light">{label}</span>
    </button>
  );
}

function MetricCard({ label, value, icon, trend, color }: any) {
  return (
    <div className="relative group cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-90`}></div>
      <div className="absolute inset-0 bg-white/20 group-hover:opacity-0 transition-opacity"></div>
      <div className="relative p-6 text-white">
        <div className="flex justify-between items-start mb-2">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            {icon}
          </div>
        </div>
        <p className="text-sm opacity-90 mb-1">{label}</p>
        <p className="text-3xl font-bold mb-1">{value}</p>
        <p className="text-xs opacity-75">{trend}</p>
      </div>
    </div>
  );
}