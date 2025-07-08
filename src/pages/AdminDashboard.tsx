import React, { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { Link } from "react-router-dom";

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

  useEffect(() => {
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
    fetchData();
  }, []);

  const updateGroupStatus = async (id: string, status: string) => {
    await fetch(`/api/groups/${id}/${status}`, { method: "POST" });
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status } : g))
    );
  };

  return (
    <MainLayout>
      <div className="p-6 md:p-10">
        <h1 className="text-3xl md:text-5xl font-bold font-ubuntu mb-6">
          Admin Dashboard
        </h1>

        {loading ? (
          <p>Loading data...</p>
        ) : (
          <>
            {/* GROUPS */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold font-ubuntu mb-4">
                Registered SACCOs & Groups
              </h2>
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
                            className="px-2 py-1 rounded bg-green-500 hover:bg-green-600 text-white"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateGroupStatus(g.id, "rejected")}
                            className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => updateGroupStatus(g.id, "pending")}
                            className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
                          >
                            Pending
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* FARMERS */}
            <section>
              <h2 className="text-2xl font-bold font-ubuntu mb-4">
                Registered Farmers
              </h2>
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
                        <td className="p-2 font-medium">
                          {f.first_name} {f.middle_name} {f.last_name}
                        </td>
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
      </div>
    </MainLayout>
  );
}
