import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { Dialog, DialogTitle, DialogPanel } from "@headlessui/react";
import ThemeToggle from "../components/ThemeToggle";
import axios from "axios"; 
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { storage } from "../lib/firebase";
import { getRoles, createRole, updateRole, deleteRole } from "../services/roles";
import { Users, UsersRound, Group, ShieldCheck, PlusSquare, Settings, Menu, Plus, LogOut, Settings2 } from "lucide-react"; // Optional: Use icon lib
import { constituencies, counties, county, wards } from "kenya-locations";
import { OverviewStats, GroupStats, FarmerStats } from "../components/Dashboard/DashboardStatsUI";
import { usePagination } from "../hooks/usePagination";
import PaginationFooter from "../components/Pagination/PaginationFooter";

const BASE_URL = import.meta.env.MODE === "development"
  ? "/api"
  : "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/api";

/*Interfaces*/
// -------------------------------------------------------------------------------------------------------------------------------  
interface Group {id: string; name: string; type: string; location: string;status: string;remarks?: string;
  registration_number?: string;
  documents?: { doc_type: string; path?: string }[];
}

interface Farmer {id: number; first_name: string; middle_name: string; last_name: string; email: string; group_id: string;}

interface GroupType {id: string; name: string;}
// -------------------------------------------------------------------------------------------------------------------------------  

const sanitizeKey = (key: string) =>
  key.toLowerCase().replace(/[^a-z0-9]/gi, "_");

/*--Admin Panel*/
// -------------------------------------------------------------------------------------------------------------------------------  
export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openGroupSub, setOpenGroupSub] = useState(false);
  const [openUserSub, setOpenUserSub] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [groupTypes, setGroupTypes] = useState<GroupType[]>([]);
  const [documentTypes, setDocumentTypes] = useState<{ doc_type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingGroupId, setUpdatingGroupId] = useState<string | null>(null);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [isFarmerModalOpen, setFarmerModalOpen] = useState(false);
  const [isGroupTypeModalOpen, setGroupTypeModalOpen] = useState(false);

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
  const [isUserRoleModalOpen, setUserRoleModalOpen] = useState(false);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [newRoleName, setNewRoleName] = useState("");

  useEffect(() => { fetchData(); }, []);

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

  // 🛰️ Load roles on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const res = (await getRoles()) as unknown as any[];
    setUserRoles(res);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BASE_URL}/stats/summary`);
        const json = await res.json();
        setStats(json);
      } catch (err) {
        console.error("📉 Stats fetch failed:", err);
      }
    };

    fetchStats();
  }, []);

  const fetchData = async () => {
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
          throw new Error(`${label} failed`);
        }
      };

      setGroups(await safeJson(groupsRes, "Groups"));
      setFarmers(await safeJson(farmersRes, "Farmers"));
      setGroupTypes(await safeJson(typesRes, "GroupTypes"));
      setDocumentTypes((await safeJson(docsRes, "DocumentTypes")).sort((a: { doc_type: string; }, b: { doc_type: any; }) => a.doc_type.localeCompare(b.doc_type)));
    } catch (err) {
      console.error("🚨 fetchData error:", err);
    } finally {
      setLoading(false);
    }
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

      // 🔼 Upload files to Firebase Storage
      for (const r of groupForm.documentRequirements) {
        const file = groupForm.uploadedDocs[r.doc_type];
        if (r.is_required && file instanceof File) {
          const ext = file.name.split(".").pop();
          const path = `group_docs/${uuidv4()}.${ext}`;
          const fileRef = ref(storage, path);
          await uploadBytes(fileRef, file); // 📡 Upload
          uploadedPaths[r.doc_type] = path; // 🧾 Store for API payload
        }
      }

      // 📨 Send metadata to your Cloud Function
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

      // 🗃️ Save requirements metadata (if needed)
      const metaRes = await fetch(`${BASE_URL}/groups/${groupId}/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements: groupForm.documentRequirements.filter((r) => r.is_required),
        }),
      });

      if (!metaRes.ok) throw new Error("Requirement save failed");

      // ✅ UI Reset
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
  
  // ✅ Check if all required documents are uploaded
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

      fetchData(); // Refresh the table with updated group
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

  const {
    page: groupPage,
    perPage: groupPerPage,
    setPage: setGroupPage,
    setPerPage: setGroupPerPage,
    maxPage: groupMaxPage,
    paginatedItems: paginatedGroups,
  } = usePagination(groups);

  const {
    page: farmerPage,
    perPage: farmerPerPage,
    setPage: setFarmerPage,
    setPerPage: setFarmerPerPage,
    maxPage: farmerMaxPage,
    paginatedItems: paginatedFarmers,
  } = usePagination(farmers);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const [stats, setStats] = useState({
    totalGroups: 0,
    totalFarmers: 0,
    statusCounts: {},
    farmerByGroup: [],
  });

  const [isFarmerViewModalOpen, setFarmerViewModalOpen] = useState(false);
  const [selectedGroupForFarmers, setSelectedGroupForFarmers] = useState<Group | null>(null);

  return (
    <MainLayout>
      <ThemeToggle />
      <div className="flex min-h-screen">
        {/* Collapsible Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? "w-64" : "w-16"
          } transition-all duration-300 
            bg-brand-green 
            dark:bg-brand-dark 
            text-white flex flex-col justify-between py-6 px-4 shadow-lg`}
        >
          {/* Toggle Button */}
          <div className="mb-6">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full px-2 text-left text-brand-apple dark:text-brand-apple hover:text-gray-300 transition"
            >
              {isSidebarOpen ? "← Collapse" : "→"}
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Manage Group */}
            <div>
              <button
                onClick={() => setOpenGroupSub(!openGroupSub)}
                className="flex items-center gap-2 w-full px-2 py-2 rounded hover:bg-white/20 transition"
              >
                <Group className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="font-semibold text-brand-apple dark:text-brand-apple">Manage Groups</span>}
              </button>
              {isSidebarOpen && openGroupSub && (
                <div className="ml-6 mt-1 space-y-2">
                  <button
                    onClick={() => setGroupModalOpen(true)}
                    className="w-full text-left text-sm hover:text-brand-apple"
                  >
                    <Plus className="inline w-4 h-4 mr-1" />
                    Register Group
                  </button>
                  <button
                    onClick={() => setGroupTypeModalOpen(true)}
                    className="w-full text-left text-sm hover:text-brand-apple"
                  >
                    <Settings className="inline w-4 h-4 mr-1" />
                    Group Types
                  </button>
                </div>
              )}
            </div>

            {/* Manage Users */}
            <div>
              <button
                onClick={() => setOpenUserSub(!openUserSub)}
                className="flex items-center gap-2 w-full px-2 py-2 rounded hover:bg-white/20 transition"
              >
                <UsersRound className="w-5 h-5 shrink-0" />
                {isSidebarOpen && <span className="font-semibold text-brand-apple dark:text-brand-apple">Manage Users</span>}
              </button>
              {isSidebarOpen && openUserSub && (
                <div className="ml-6 mt-1 space-y-2">
                  <button
                    onClick={() => setFarmerModalOpen(true)}
                    className="w-full text-left text-sm hover:text-brand-apple"
                  >
                    <Plus className="inline w-4 h-4 mr-1" />
                    Register Farmer
                  </button>
                  <button
                    onClick={() => setUserRoleModalOpen(true)}
                    className="w-full text-left text-sm hover:text-brand-apple"
                  >
                    <ShieldCheck className="inline w-4 h-4 mr-1" />
                    User Roles
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="mt-6 flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-white justify-center"
          >
            <LogOut className="w-4 h-4" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 md:p-10 bg-gray-50 dark:bg-brand-dark text-gray-900 dark:text-white overflow-y-auto">
          <div className="flex items-center gap-4 mb-6">
            {/* Logo with theme switching */}
            <img
              src="/Logos/FF Logo only transparent background.png"
              alt="Farm Fuzion Logo"
              className="h-12 w-auto dark:hidden"
            />
            <img
              src="/Logos/FF Logo only transparent background.png"
              alt="Farm Fuzion Logo"
              className="h-12 w-auto hidden dark:block"
            />

            <h1 className="text-3xl md:text-5xl font-bold font-ubuntu text-brand-apple dark:text-brand-apple">
              Farm Fuzion's Admin
            </h1>
          </div>
          <div className="flex flex-wrap gap-6">
            <OverviewStats
              totalGroups={stats.totalGroups}
              totalFarmers={stats.totalFarmers}
            />
            {/*}
            <GroupStats statusCounts={stats.statusCounts} />
            <FarmerStats farmerByGroup={stats.farmerByGroup} />
            */}
          </div>
          {loading ? (
            <p className="text-brand-apple dark:text-brand-apple">Loading data...</p>
          ) : (
            <>
              <section className="mb-12">
                <h2 className="text-2xl font-bold font-ubuntu mb-4 text-brand-apple dark:text-brand-apple">Registered SACCOs & Groups</h2>
                <div className="flex flex-wrap gap-6">
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border dark:border-slate-700 text-sm">
                    <thead>
                      <tr className="bg-brand-green text-white dark:bg-brand-apple dark:text-brand-dark">
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Location</th>
                        <th className="p-2">Reg. No</th>
                        <th className="p-2">Documents</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedGroups.map((g) => (
                        <tr
                          key={g.id}
                          onClick={() => {
                            setSelectedGroupForFarmers(g);
                            setFarmerViewModalOpen(true);
                          }}
                          className="cursor-pointer odd:bg-slate-100 dark:odd:bg-[#033127] dark:hover:bg-brand-apple/10 hover:bg-slate-200 transition-colors duration-150"
                        >
                          <td className="p-2 font-medium dark:text-gray-100">{g.name}</td>
                          <td className="p-2 text-center dark:text-gray-200">{g.type}</td>
                          <td className="p-2 text-center dark:text-gray-200">{g.location}</td>
                          <td className="p-2 text-center dark:text-gray-200">{g.registration_number ?? "—"}</td>
                          <td className="p-2 text-center dark:text-gray-200">
                            {g.documents?.length ? (
                              `${g.documents.length} uploaded`
                            ) : (
                              <span className="text-red-500">None</span>
                            )}
                          </td>
                          <td className="p-2 text-center capitalize dark:text-gray-200">{g.status}</td>
                          <td className="p-2 text-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateGroupStatus(g.id, "approved");
                              }}
                              disabled={updatingGroupId === g.id}
                              className="px-2 py-1 rounded bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                            >
                              {updatingGroupId === g.id ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateGroupStatus(g.id, "pending");
                              }}
                              disabled={updatingGroupId === g.id}
                              className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-50"
                            >
                              {updatingGroupId === g.id ? "..." : "Suspend"}
                            </button>
                          </td>
                        </tr>

                      ))}
                    </tbody>
                    <PaginationFooter
                      page={groupPage}
                      maxPage={groupMaxPage}
                      perPage={groupPerPage}
                      setPage={setGroupPage}
                      setPerPage={setGroupPerPage}
                    />
                  </table>
                </div>
              </section>

              {/* ✅ Trigger Button */}
              <section className="mt-10">
                <button
                  onClick={() => {
                    setSelectedGroupForFarmers(null);
                    setFarmerViewModalOpen(true);
                  }}
                  className="px-4 py-2 bg-brand-green text-white rounded hover:bg-brand-apple"
                >
                  View All Farmers
                </button>
              </section>

              {/* ✅ Modal Table */}
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

              {/*}
              <section>
                <h2 className="text-2xl font-bold font-ubuntu mb-4 text-brand-apple dark:text-brand-apple">Registered Farmers</h2>
                <div className="flex flex-wrap gap-6">
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border dark:border-slate-700 text-sm">
                    <thead>
                      <tr className="bg-brand-green text-white dark:bg-brand-apple dark:text-brand-dark">
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Group</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFarmers.map((f) => {
                        const group = groups.find((g) => g.id === f.group_id);
                        return (
                          <tr key={f.id} className="odd:bg-slate-100 dark:odd:bg-[#033127]">
                            <td className="p-2 font-medium">
                              {f.first_name} {f.middle_name} {f.last_name}
                            </td>
                            <td className="p-2 text-center">{f.email}</td>
                            <td className="p-2 text-center">
                              {group ? (
                                group.name
                              ) : (
                                <select
                                  className="p-1 border rounded text-sm dark:bg-brand-dark dark:border-gray-600"
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
                    <PaginationFooter
                      page={farmerPage}
                      maxPage={farmerMaxPage}
                      perPage={farmerPerPage}
                      setPage={setFarmerPage}
                      setPerPage={setFarmerPerPage}
                    />
                  </table>
                </div>
              </section>
              */}

              {/* User Roles */}
            </>
          )}

          <Dialog open={isGroupModalOpen} onClose={() => setGroupModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
            <DialogPanel className="bg-white dark:bg-brand-dark p-6 rounded-xl max-w-md w-full shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Manage Groups
              </h2>

              <input
                className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                placeholder="Group Name"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              />

              <label htmlFor="group-type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Group Type
              </label>
              <select
                id="group-type-select"
                className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                value={groupForm.group_type_id}
                onChange={(e) => setGroupForm({ ...groupForm, group_type_id: e.target.value })}
              >
                <option value="">Select Type</option>
                {groupTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>

              {/* 🗺️ County */}
              <select
                className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
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

              {/* 🟨 Constituency */}
              <select
                className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
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

              {/* 🟥 Ward */}
              <select
                className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
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

              <input
                className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                placeholder="Physical Location / Landmark"
                value={groupForm.location}
                onChange={(e) => setGroupForm({ ...groupForm, location: e.target.value })}
              />

              <input
                className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"              placeholder="Group Registration Number"
                value={groupForm.registration_number}
                onChange={(e) =>
                  setGroupForm({ ...groupForm, registration_number: e.target.value })
                }
              />

              <h3 className="font-semibold mt-4 mb-2 text-gray-900 dark:text-white">Required Documents</h3>
              {groupForm.documentRequirements.map((item, i) => (
                <div key={i} className="mb-2">
                  <label className="block text-gray-900 dark:text-white mb-1">
                    <input
                      type="checkbox"
                      checked={item.is_required}
                      onChange={(e) => {
                        const newList = [...groupForm.documentRequirements];
                        newList[i].is_required = e.target.checked;
                        setGroupForm({ ...groupForm, documentRequirements: newList });
                      }}
                    />
                    <span className="ml-2">{item.doc_type}</span>
                  </label>

                  {item.is_required && (
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full border rounded p-1 text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
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
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2">
                <button onClick={() => setGroupModalOpen(false)} className="px-3 py-2 bg-slate-500 text-white rounded">
                  Cancel
                </button>
                <button
                  disabled={!groupForm.name || !groupForm.group_type_id || !groupForm.location || !groupForm.registration_number || !requiredDocsValid}
                  onClick={submitGroup}
                  className="px-3 py-2 bg-brand-green text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Register
                </button>
              </div>

              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Manage Required Documents</h3>

                <div className="space-y-2">
                  {documentTypes.map((doc) => (
                    <div key={doc.doc_type} className="flex justify-between items-center text-gray-900 dark:text-white">
                      <span>{doc.doc_type}</span>
                      <button
                        onClick={() => deleteDocumentType(doc.doc_type)}
                        className="text-sm text-red-600 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="New document type"
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    className="flex-1 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                  />
                  <button
                    disabled={!newDocType.trim() || documentTypes.some((d) => d.doc_type === newDocType.trim())}
                    className="bg-brand-green text-white px-4 py-2 rounded disabled:opacity-50"
                    onClick={addDocumentType}
                  >
                    Add
                  </button>
                </div>
              </div>
            </DialogPanel>
            </div>
          </Dialog>

          <Dialog open={isFarmerModalOpen} onClose={() => setFarmerModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <DialogPanel className="bg-white dark:bg-brand-dark p-6 rounded-xl max-w-md w-full shadow-lg">
                <DialogTitle className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  Register Farmer
                </DialogTitle>

                {/* ✍️ Identity */}
                <input className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                  placeholder="First Name"
                  value={farmerForm.first_name}
                  onChange={(e) => setFarmerForm({ ...farmerForm, first_name: e.target.value })}
                />
                <input className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                  placeholder="Middle Name"
                  value={farmerForm.middle_name}
                  onChange={(e) => setFarmerForm({ ...farmerForm, middle_name: e.target.value })}
                />
                <input className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                  placeholder="Last Name"
                  value={farmerForm.last_name}
                  onChange={(e) => setFarmerForm({ ...farmerForm, last_name: e.target.value })}
                />

                {/* 🗓️ Additional Info */}
                <input
                  type="date"
                  className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                  value={farmerForm.dob}
                  onChange={(e) => setFarmerForm({ ...farmerForm, dob: e.target.value })}
                  placeholder="MM/DD/YYYY"
                />
                <small className="text-gray-500 dark:text-gray-400 block mb-2">Date of Birth (MM/DD/YYYY)</small>

                <input className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                  placeholder="ID / Passport No"
                  value={farmerForm.id_passport_no}
                  onChange={(e) => setFarmerForm({ ...farmerForm, id_passport_no: e.target.value })}
                />
                {/* 🗺️ County */}
                <select
                  className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
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

                {/* 🟨 Constituency */}
                <select
                  className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
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

                {/* 🟥 Ward */}
                <select
                  className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
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
                <input className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                  placeholder="Physical Location / Landmark"
                  value={farmerForm.location}
                  onChange={(e) => setFarmerForm({ ...farmerForm, location: e.target.value })}
                />
                <input className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                  placeholder="Address"
                  value={farmerForm.address}
                  onChange={(e) => setFarmerForm({ ...farmerForm, address: e.target.value })}
                />
                <input className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                  placeholder="Mobile"
                  value={farmerForm.mobile}
                  onChange={(e) => setFarmerForm({ ...farmerForm, mobile: e.target.value })}
                />

                {/* 📧 Email */}
                <input type="email" className="w-full mb-2 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                  placeholder="Email"
                  value={farmerForm.email}
                  onChange={(e) => setFarmerForm({ ...farmerForm, email: e.target.value })}
                />

                {/* 🧑‍🌾 Group Select */}
                <label htmlFor="group-select" className="sr-only">Select Group</label>
                <select id="group-select"
                  className="w-full mb-4 p-2 border rounded text-gray-900 dark:text-white dark:bg-brand-dark dark:border-gray-600"
                  value={farmerForm.group_id}
                  onChange={(e) => setFarmerForm({ ...farmerForm, group_id: e.target.value })}
                >
                  <option value="">Select Group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>

                {/* 🎛️ Actions */}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setFarmerModalOpen(false)} className="px-3 py-2 bg-slate-500 text-white rounded">Cancel</button>
                  <button onClick={submitFarmer} className="px-3 py-2 bg-brand-green text-white rounded">Register</button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>

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

                <div className="space-y-2">
                  {groupTypes.map((type) => (
                    <div key={type.id} className="flex justify-between items-center">
                      {editingId === type.id ? (
                        <>
                          <input
                            value={newGroupType}
                            onChange={(e) => setNewGroupType(e.target.value)}
                            placeholder="Edit group type name"
                            aria-label="Group type name"
                            className="flex-1 mr-2 p-2 border rounded dark:bg-brand-dark dark:text-white dark:border-gray-600"
                          />
                          <button
                            className="text-green-600 dark:text-green-400 font-semibold"
                            onClick={() => handleUpdateGroupType(type.id)}
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-900 dark:text-white">{type.name}</span>
                          <div className="space-x-2">
                            <button
                              className="text-blue-600 dark:text-blue-400 font-semibold"
                              onClick={() => {
                                setEditingId(type.id);
                                setNewGroupType(type.name);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 dark:text-red-400 font-semibold"
                              onClick={() => handleDeleteGroupType(type.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <input
                    placeholder="New group type"
                    aria-label="New group type"
                    value={newGroupType}
                    onChange={(e) => setNewGroupType(e.target.value)}
                    className="w-full p-2 border rounded mb-2 dark:bg-brand-dark dark:text-white dark:border-gray-600"
                  />
                  <button
                    onClick={handleAddGroupType}
                    className="w-full bg-brand-green text-white py-2 rounded disabled:opacity-50"
                    disabled={!newGroupType}
                  >
                    Add Group Type
                  </button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
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

                <div className="space-y-2">
                  {userRoles.map((role) => (
                    <div key={role.id} className="flex justify-between items-center">
                      {editingId === role.id ? (
                        <>
                          <input
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="Edit role name"
                            className="flex-1 mr-2 p-2 border rounded dark:bg-brand-dark dark:text-white dark:border-gray-600"
                          />
                          <button
                            className="text-green-600 dark:text-green-400 font-semibold"
                            onClick={() => handleUpdateUserRole(role.id)}
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-900 dark:text-white">{role.name}</span>
                          <div className="space-x-2">
                            <button
                              className="text-blue-600 dark:text-blue-400 font-semibold"
                              onClick={() => {
                                setEditingId(role.id);
                                setNewRoleName(role.name);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 dark:text-red-400 font-semibold"
                              onClick={() => handleDeleteUserRole(role.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <input
                    placeholder="New role name"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full p-2 border rounded mb-2 dark:bg-brand-dark dark:text-white dark:border-gray-600"
                  />
                  <button
                    onClick={handleAddUserRole}
                    className="w-full bg-brand-green text-white py-2 rounded disabled:opacity-50"
                    disabled={!newRoleName}
                  >
                    Add Role
                  </button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>

        </main>
      </div>
    </MainLayout>
  );
}
// -------------------------------------------------------------------------------------------------------------------------------  