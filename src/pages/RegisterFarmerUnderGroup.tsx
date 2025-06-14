// src/pages/RegisterFarmerUnderGroup.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerFarmer } from "../services/farmers";
import ThemeToggle from "../components/ThemeToggle";
import axios from "axios";

type Group = {
  id: string;
  name: string;
};

export default function RegisterFarmerUnderGroup() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    dob: "",
    id_passport_no: "",
    location: "",
    address: "",
    mobile: "",
    email: "",
    group_id: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Load groups from backend
    const fetchGroups = async () => {
      try {
        const res = await axios.get("/api/groups"); // ✅ endpoint must exist
        setGroups(res.data);
      } catch (err) {
        console.error("Failed to fetch groups", err);
      }
    };
    fetchGroups();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registerFarmer(form);
      alert("Farmer registered successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to register farmer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-brand-dark text-brand-dark dark:text-brand-apple transition-colors duration-300 font-ubuntu">
      <ThemeToggle />
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#0a3d32] p-10 rounded-lg shadow-xl w-full max-w-2xl space-y-4"
      >
        <div className="text-center">
          <img
            src="/Logos/Green_Logo_and_name_transparent_background_deep_dark_font.png"
            alt="Farm Fuzion Light"
            className="block dark:hidden mx-auto w-60 mb-4"
          />
          <img
            src="/Logos/Green_Logo_and_name_transparent_background_apple_green_font.png"
            alt="Farm Fuzion Dark"
            className="hidden dark:block mx-auto w-60 mb-4"
          />
          <h2 className="text-2xl font-bold mb-1">Register Farmer Under Group</h2>
          <p className="text-brand-green dark:text-brand-apple font-baloo text-lg -mt-2">Admin Access Only</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" name="first_name" value={form.first_name} onChange={handleChange} required />
          <Input label="Middle Name" name="middle_name" value={form.middle_name} onChange={handleChange} />
          <Input label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} required />
          <Input label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} required />
          <Input label="ID/Passport No." name="id_passport_no" value={form.id_passport_no} onChange={handleChange} required />
          <Input label="Location" name="location" value={form.location} onChange={handleChange} required />
          <Input label="Address" name="address" value={form.address} onChange={handleChange} required />
          <Input label="Mobile" name="mobile" value={form.mobile} onChange={handleChange} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        {/* 🔽 Group Selection */}
        <div>
          <label htmlFor="group_id" className="block text-sm font-medium mb-1">
            Assign to Group
          </label>
          <select
            id="group_id"
            name="group_id"
            value={form.group_id}
            onChange={handleChange}
            required
            className="w-full p-3 border border-brand-apple rounded bg-white dark:bg-[#144034] text-brand-dark dark:text-brand-apple focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="">Select Group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-brand-green text-[#8dc71d] py-3 rounded font-semibold 
            transition-colors duration-300 
            hover:bg-brand-dark hover:text-white
            disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {loading ? "Registering..." : "Register Farmer"}
        </button>
      </form>
    </div>
  );
}

function Input({ label, name, ...props }: any) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        {...props}
        className="w-full p-3 border border-brand-apple rounded bg-white dark:bg-[#144034] text-brand-dark dark:text-brand-apple focus:outline-none focus:ring-2 focus:ring-brand-green"
      />
    </div>
  );
}
