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
  Sparkles, BarChart3, Home, LayoutDashboard, UserCog, FolderTree
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

      // Send metadata to Cloud Function
      const res = await fetch("https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/registerWithDocs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupForm.name,
          group_type_id: groupForm.group_type_id,
          county: groupForm.county,
          constituency: groupForm.constituency,
          ward: groupForm.ward,
          location: groupForm.location,
          registration_number: groupForm.registration_number,
          description: groupForm.description || "",
          requirements: groupForm.documentRequirements.map((r) => ({
            doc_type: r.doc_type,
            is_required: r.is_required,
            file_path: uploadedPaths[r.doc_type] || null,
          })),
        }),
      });

      if (!res.ok) throw new Error("Cloud function failed");

      const { id: groupId } = await res.json();

      // Save requirements metadata
      const metaRes = await fetch(`${BASE_URL}/groups/${groupId}/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements: groupForm.documentRequirements.filter((r) => r.is_required),
        }),
      });

      if (!metaRes.ok) throw new Error("Requirement save failed");

      // Reset form
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

      fetchData();
    } catch (err: any) {
      console.error("❌ Group creation failed:", err);
      alert(
        `Group registration failed:\n${
          axios.isAxiosError(err) ? err.response?.data?.error || err.message : "Unknown error"
        }`
      );
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
    localStorage.clear();
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
        {/* Enhanced Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? "w-72" : "w-24"
          } transition-all duration-500 ease-in-out 
            bg-gradient-to-b from-brand-green to-green-700 
            dark:from-gray-900 dark:to-gray-800 
            text-white flex flex-col justify-between py-8 px-4 shadow-2xl relative overflow-hidden`}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full -ml-12 -mb-12"></div>
          
          {/* Sidebar Header */}
          <div>
            <div className="flex items-center justify-between mb-8">
              {/* Logo */}
              <div className="transition-all duration-500">
                {isSidebarOpen ? (
                  <div className="flex items-center gap-3">
                    <img
                      src="/Logos/FF Logo only transparent background.png"
                      alt="Farm Fuzion"
                      className="h-10 w-10 object-contain"
                    />
                    <span className="text-xl font-bold text-white">Admin Panel</span>
                  </div>
                ) : (
                  <img
                    src="/Logos/FF Logo only transparent background.png"
                    alt="FF"
                    className="h-12 w-12 object-contain mx-auto transition-all duration-300 hover:scale-110 hover:rotate-3"
                  />
                )}
              </div>
              
              {/* Toggle Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 hover:scale-110"
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {/* Dashboard Home */}
              <NavItem 
                icon={<LayoutDashboard size={isSidebarOpen ? 20 : 24} />}
                label="Dashboard"
                active={true}
                collapsed={!isSidebarOpen}
              />

              {/* Manage Groups */}
              <div>
                <button
                  onClick={() => setOpenGroupSub(!openGroupSub)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 group ${
                    !isSidebarOpen && 'justify-center'
                  }`}
                >
                  <Building2 size={isSidebarOpen ? 20 : 24} />
                  {isSidebarOpen && (
                    <span className="flex-1 text-left text-sm font-medium">Manage Groups</span>
                  )}
                  {isSidebarOpen && (
                    <ChevronRight 
                      size={16} 
                      className={`transition-transform duration-300 ${openGroupSub ? 'rotate-90' : ''}`} 
                    />
                  )}
                </button>
                
                {isSidebarOpen && openGroupSub && (
                  <div className="ml-4 mt-1 space-y-1 animate-slide-down">
                    <SubNavItem 
                      icon={<Plus size={16} />}
                      label="Register Group"
                      onClick={() => setGroupModalOpen(true)}
                    />
                    <SubNavItem 
                      icon={<FolderTree size={16} />}
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 group ${
                    !isSidebarOpen && 'justify-center'
                  }`}
                >
                  <UsersRound size={isSidebarOpen ? 20 : 24} />
                  {isSidebarOpen && (
                    <span className="flex-1 text-left text-sm font-medium">Manage Users</span>
                  )}
                  {isSidebarOpen && (
                    <ChevronRight 
                      size={16} 
                      className={`transition-transform duration-300 ${openUserSub ? 'rotate-90' : ''}`} 
                    />
                  )}
                </button>
                
                {isSidebarOpen && openUserSub && (
                  <div className="ml-4 mt-1 space-y-1 animate-slide-down">
                    <SubNavItem 
                      icon={<UserPlus size={16} />}
                      label="Register Farmer"
                      onClick={() => setFarmerModalOpen(true)}
                    />
                    <SubNavItem 
                      icon={<ShieldCheck size={16} />}
                      label="User Roles"
                      onClick={() => setUserRoleModalOpen(true)}
                    />
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white transition-all duration-300 hover:scale-105 group ${
              !isSidebarOpen && 'justify-center'
            }`}
          >
            <LogOut size={isSidebarOpen ? 20 : 24} />
            {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <span className="hidden md:inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-medium">
                  Administrator
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
                  disabled={refreshing}
                >
                  <RefreshCw size={20} className={refreshing ? 'animate-spin text-brand-green' : ''} />
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

      {/* Group Registration Modal */}
      <Dialog open={isGroupModalOpen} onClose={() => setGroupModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <DialogPanel className="bg-white dark:bg-brand-dark p-6 rounded-xl max-w-md w-full shadow-lg">
            <DialogTitle className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Register New Group
            </DialogTitle>
            {/* ... group form content ... */}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setGroupModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded-lg">
                Cancel
              </button>
              <button onClick={submitGroup} className="px-4 py-2 bg-brand-green text-white rounded-lg">
                Register
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Farmer Registration Modal */}
      <Dialog open={isFarmerModalOpen} onClose={() => setFarmerModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <DialogPanel className="bg-white dark:bg-brand-dark p-6 rounded-xl max-w-md w-full shadow-lg">
            <DialogTitle className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Register New Farmer
            </DialogTitle>
            {/* ... farmer form content ... */}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setFarmerModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded-lg">
                Cancel
              </button>
              <button onClick={submitFarmer} className="px-4 py-2 bg-brand-green text-white rounded-lg">
                Register
              </button>
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
        <div className="flex items-center justify-center min-h-screen">
          <DialogPanel className="bg-white dark:bg-brand-dark p-6 rounded-xl max-w-md w-full shadow-lg">
            <DialogTitle className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Manage Group Types
            </DialogTitle>
            {/* ... group type content ... */}
          </DialogPanel>
        </div>
      </Dialog>

      {/* User Role Modal */}
      <Dialog
        open={isUserRoleModalOpen}
        onClose={() => setUserRoleModalOpen(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <DialogPanel className="bg-white dark:bg-brand-dark p-6 rounded-xl max-w-md w-full shadow-lg">
            <DialogTitle className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Manage User Roles
            </DialogTitle>
            {/* ... user role content ... */}
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-white/20 text-white shadow-lg' 
          : 'text-white/80 hover:bg-white/10 hover:text-white'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <div className="relative">
        {icon}
        {active && (
          <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse blur-md -z-10"></div>
        )}
      </div>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}

function SubNavItem({ icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
    >
      {icon}
      <span>{label}</span>
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