import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { Dialog, DialogTitle, DialogPanel } from "@headlessui/react";
import ThemeToggle from "../components/ThemeToggle";

const BASE_URL = import.meta.env.MODE === "development"
  ? "/api"
  : "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/api";

interface Group {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  remarks?: string;
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

export default function AdminDashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [isFarmerModalOpen, setFarmerModalOpen] = useState(false);

  const [groupTypes, setGroupTypes] = useState<GroupType[]>([]);
  const [groupForm, setGroupForm] = useState({ name: "", group_type_id: "", location: "" });

  const [isGroupTypeModalOpen, setGroupTypeModalOpen] = useState(false);
  const [newGroupType, setNewGroupType] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [farmerForm, setFarmerForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    group_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, farmersRes, typesRes] = await Promise.all([
        fetch(`${BASE_URL}/groups`),
        fetch(`${BASE_URL}/farmers`),
        fetch(`${BASE_URL}/groups-types`),
      ]);

      const safeJson = async (res: Response, label: string) => {
        const clone = res.clone(); // ⚠️ clone allows second read
        try {
          return await res.json();
        } catch (err) {
          const fallback = await clone.text();
          console.error(`❌ ${label} JSON parse error:`, fallback);
          throw new Error(`${label} failed`);
        }
      };

      const groups = await safeJson(groupsRes, "Groups");
      const farmers = await safeJson(farmersRes, "Farmers");
      const groupTypes = await safeJson(typesRes, "GroupTypes");

      setGroups(groups);
      setFarmers(farmers);
      setGroupTypes(groupTypes);
    } catch (err) {
      console.error("🚨 fetchData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const [updatingGroupId, setUpdatingGroupId] = useState<string | null>(null);

  const updateGroupStatus = async (id: string, status: string) => {
    try {
      setUpdatingGroupId(id);

      let endpoint = `${BASE_URL}/groups/${id}/approve`;
      let body: string | undefined = undefined;

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
      const response = await fetch(`${BASE_URL}/groups/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(groupForm),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Group creation failed:", errorText);
        alert(`Failed to create group: ${errorText}`);
        return;
      }

      setGroupModalOpen(false);
      setGroupForm({ name: "", group_type_id: "", location: "" });
      fetchData();
    } catch (err) {
      console.error("Error submitting group:", err);
      alert("Something went wrong while registering group.");
    }
  };

  const submitFarmer = async () => {
    const response = await fetch(`${BASE_URL}/farmers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(farmerForm),
    });
    if (response.ok) {
      setFarmerModalOpen(false);
      setFarmerForm({ first_name: "", middle_name: "", last_name: "", email: "", group_id: "" });
      fetchData();
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

  return (
    <MainLayout>
      <ThemeToggle />
      <div className="p-6 md:p-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-5xl font-bold font-ubuntu">Admin Dashboard</h1>
          <div className="space-x-3">
            <button
              onClick={() => setGroupTypeModalOpen(true)}
              className="bg-transparent text-brand-dark border border-brand-green  
                        px-4 py-2 rounded transition-colors duration-200
                        hover:bg-brand-green hover:text-white hover:border-brand-green 
                        dark:bg-transparent dark:text-white dark:hover:bg-brand-green dark:hover:text-white dark:hover:border-brand-green"
            >
              ⚙️ Manage Group Types
            </button>
            <button
              onClick={() => setGroupModalOpen(true)}
              className="bg-transparent text-brand-dark border border-brand-green  
                        px-4 py-2 rounded transition-colors duration-200
                        hover:bg-brand-green hover:text-white hover:border-brand-green 
                        dark:bg-transparent dark:text-white dark:hover:bg-brand-green dark:hover:text-white dark:hover:border-brand-green"
            >
              + Register Group
            </button>
            <button
              onClick={() => setFarmerModalOpen(true)}
              className="bg-transparent text-brand-dark border border-brand-green  
                        px-4 py-2 rounded transition-colors duration-200
                        hover:bg-brand-green hover:text-white hover:border-brand-green 
                        dark:bg-transparent dark:text-white dark:hover:bg-brand-green dark:hover:text-white dark:hover:border-brand-green"
            >
              + Register Farmer
            </button>
          </div>
        </div>
        {loading ? (
          <p>Loading data...</p>
        ) : (
          <>
            <section className="mb-12">
              <h2 className="text-2xl font-bold font-ubuntu mb-4">Registered SACCOs & Groups</h2>
              <div className="overflow-x-auto">
                <table className="w-full border dark:border-slate-700 text-sm">
                  <thead>
                    <tr className="bg-brand-green text-white dark:bg-brand-apple dark:text-brand-dark">
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Location</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => (
                      <tr key={g.id} className="odd:bg-slate-100 dark:odd:bg-[#033127]">
                        <td className="p-2 font-medium">{g.name}</td>
                        <td className="p-2 text-center">{g.type}</td>
                        <td className="p-2 text-center">{g.location}</td>
                        <td className="p-2 text-center capitalize">{g.status}</td>
                        <td className="p-2 text-center space-x-2">
                          <button
                            onClick={() => updateGroupStatus(g.id, "approved")}
                            disabled={updatingGroupId === g.id}
                            className="px-2 py-1 rounded bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                          >
                            {updatingGroupId === g.id ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => updateGroupStatus(g.id, "rejected")}
                            disabled={updatingGroupId === g.id}
                            className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                          >
                            {updatingGroupId === g.id ? "..." : "Reject"}
                          </button>
                          <button
                            onClick={() => updateGroupStatus(g.id, "pending")}
                            disabled={updatingGroupId === g.id}
                            className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-50"
                          >
                            {updatingGroupId === g.id ? "..." : "Pending"}
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold font-ubuntu mb-4">Registered Farmers</h2>
              <div className="overflow-x-auto">
                <table className="w-full border dark:border-slate-700 text-sm">
                  <thead>
                    <tr className="bg-brand-green text-white dark:bg-brand-apple dark:text-brand-dark">
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Group ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmers.map((f) => (
                      <tr key={f.id} className="odd:bg-slate-100 dark:odd:bg-[#033127]">
                        <td className="p-2 font-medium">{f.first_name} {f.middle_name} {f.last_name}</td>
                        <td className="p-2 text-center">{f.email}</td>
                        <td className="p-2 text-center">{f.group_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <Dialog open={isGroupModalOpen} onClose={() => setGroupModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
          <DialogPanel className="bg-white dark:bg-brand-dark p-6 rounded-xl max-w-md w-full shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Manage Group Types
            </h2>

            <input
              className="w-full mb-2 p-2 border rounded"
              placeholder="Group Name"
              value={groupForm.name}
              onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
            />

            <label htmlFor="group-type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Type
            </label>
            <select
              id="group-type-select"
              className="w-full mb-2 p-2 border rounded"
              value={groupForm.group_type_id}
              onChange={(e) => setGroupForm({ ...groupForm, group_type_id: e.target.value })}
            >
              <option value="">Select Type</option>
              {groupTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>

            <input
              className="w-full mb-4 p-2 border rounded"
              placeholder="Location"
              value={groupForm.location}
              onChange={(e) => setGroupForm({ ...groupForm, location: e.target.value })}
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setGroupModalOpen(false)} className="px-3 py-2 bg-slate-500 text-white rounded">
                Cancel
              </button>
              <button
                disabled={!groupForm.name || !groupForm.group_type_id || !groupForm.location}
                onClick={submitGroup}
                className="px-3 py-2 bg-brand-green text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Register
              </button>
            </div>
          </DialogPanel>
          </div>
        </Dialog>

        <Dialog open={isFarmerModalOpen} onClose={() => setFarmerModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <DialogPanel className="bg-white dark:bg-brand-dark p-6 rounded-xl max-w-md w-full shadow-lg">
              <DialogTitle className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Register New Farmer
              </DialogTitle>

              <input className="w-full mb-2 p-2 border rounded" placeholder="First Name" value={farmerForm.first_name} onChange={(e) => setFarmerForm({ ...farmerForm, first_name: e.target.value })} />
              <input className="w-full mb-2 p-2 border rounded" placeholder="Middle Name" value={farmerForm.middle_name} onChange={(e) => setFarmerForm({ ...farmerForm, middle_name: e.target.value })} />
              <input className="w-full mb-2 p-2 border rounded" placeholder="Last Name" value={farmerForm.last_name} onChange={(e) => setFarmerForm({ ...farmerForm, last_name: e.target.value })} />
              <input className="w-full mb-2 p-2 border rounded" placeholder="Email" type="email" value={farmerForm.email} onChange={(e) => setFarmerForm({ ...farmerForm, email: e.target.value })} />
              <label htmlFor="group-select" className="sr-only">Select Group</label>
              <select id="group-select" className="w-full mb-4 p-2 border rounded" value={farmerForm.group_id} onChange={(e) => setFarmerForm({ ...farmerForm, group_id: e.target.value })}>
                <option value="">Select Group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
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

      </div>
    </MainLayout>
  );
}
