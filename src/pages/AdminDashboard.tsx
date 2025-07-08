import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { Dialog } from "@headlessui/react";
import ThemeToggle from "../components/ThemeToggle";
//import { v4 as uuidv4 } from "uuid";

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

export default function AdminDashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [isFarmerModalOpen, setFarmerModalOpen] = useState(false);

  const [groupForm, setGroupForm] = useState({ name: "", type: "", location: "" });
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
      const g = await fetch("/api/groups").then((r) => r.json());
      const f = await fetch("/api/farmers").then((r) => r.json());
      setGroups(g);
      setFarmers(f);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const updateGroupStatus = async (id: string, status: string) => {
    await fetch(`/api/groups/${id}/${status}`, { method: "POST" });
    fetchData();
  };

  const submitGroup = async () => {
    const response = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(groupForm),
    });
    if (response.ok) {
      setGroupModalOpen(false);
      setGroupForm({ name: "", type: "", location: "" });
      fetchData();
    }
  };

  const submitFarmer = async () => {
    const response = await fetch("/api/farmers", {
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

  return (
    <MainLayout>
      <ThemeToggle />
      <div className="p-6 md:p-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-5xl font-bold font-ubuntu">Admin Dashboard</h1>
          <div className="space-x-3">
            <button
              onClick={() => setGroupModalOpen(true)}
              className="bg-brand-green text-white px-4 py-2 rounded 
                        hover:bg-white hover:text-brand-green 
                        dark:bg-white dark:text-brand-green dark:hover:bg-brand-green dark:hover:text-white 
                        border border-brand-green transition-colors duration-200"
            >
              + Register Group
            </button>

            <button
              onClick={() => setFarmerModalOpen(true)}
              className="bg-brand-green text-white px-4 py-2 rounded 
                        hover:bg-white hover:text-brand-green 
                        dark:bg-white dark:text-brand-green dark:hover:bg-brand-green dark:hover:text-white 
                        border border-brand-green transition-colors duration-200"
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
                          <button onClick={() => updateGroupStatus(g.id, "approved")} className="px-2 py-1 rounded bg-green-500 hover:bg-green-600 text-white">Approve</button>
                          <button onClick={() => updateGroupStatus(g.id, "rejected")} className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white">Reject</button>
                          <button onClick={() => updateGroupStatus(g.id, "pending")} className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white">Pending</button>
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
            <Dialog.Panel className="bg-white dark:bg-brand-dark p-6 rounded-xl max-w-md w-full shadow-lg">
              <Dialog.Title className="text-xl font-bold mb-4">Register New Group</Dialog.Title>
              <input className="w-full mb-2 p-2 border rounded" placeholder="Group Name" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} />
              <input className="w-full mb-2 p-2 border rounded" placeholder="Type (SACCO, Association, etc.)" value={groupForm.type} onChange={(e) => setGroupForm({ ...groupForm, type: e.target.value })} />
              <input className="w-full mb-4 p-2 border rounded" placeholder="Location" value={groupForm.location} onChange={(e) => setGroupForm({ ...groupForm, location: e.target.value })} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setGroupModalOpen(false)} className="px-3 py-2 bg-slate-500 text-white rounded">Cancel</button>
                <button onClick={submitGroup} className="px-3 py-2 bg-brand-green text-white rounded">Register</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        <Dialog open={isFarmerModalOpen} onClose={() => setFarmerModalOpen(false)} className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <Dialog.Panel className="bg-white dark:bg-brand-dark p-6 rounded-xl max-w-md w-full shadow-lg">
              <Dialog.Title className="text-xl font-bold mb-4">Register New Farmer</Dialog.Title>
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
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </MainLayout>
  );
}
// This code is a React component for an admin dashboard that allows administrators to manage groups and farmers.
// It includes functionalities to register new groups and farmers, view registered groups and farmers, and update the status of groups.
// The component uses React hooks for state management and effects, and it fetches data from an API.
// The UI is built using Tailwind CSS for styling, and it includes modal dialogs for group and farmer registration.
// The code is structured to be clean and maintainable, with clear separation of concerns for fetching  data, handling form submissions, and rendering the UI.
// The component is designed to be responsive and user-friendly, providing a seamless experience for administrators managing groups and farmers in the system.
// The use of TypeScript interfaces helps ensure type safety and clarity in the data structures used throughout the component.
