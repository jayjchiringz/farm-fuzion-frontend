// farm-fuzion-frontend/src/pages/RegisterGroupAdmin.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerGroupAdmin, getGroupsForAssignment } from "../services/groupAdmins";
import ThemeToggle from "../components/ThemeToggle";
import { Building2, Mail, Phone, User, Shield } from "lucide-react";

interface Group {
  id: string;
  name: string;
}

export default function RegisterGroupAdmin() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    mobile: "",
    group_id: "",
  });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin" || user.role_name === "admin";

  // Redirect non-admin users
  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [isAdmin, navigate]);

  // Fetch available groups for assignment
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await getGroupsForAssignment();
        setGroups(data);
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
    setSuccess("");
    
    try {
      await registerGroupAdmin(form);
      setSuccess("Group Admin registered successfully!");
      setTimeout(() => {
        navigate("/admin-dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to register group admin.");
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
          <h2 className="text-2xl font-bold mb-1">Register Group Admin</h2>
          <p className="text-brand-green dark:text-brand-apple font-baloo text-lg -mt-2">
            Assign administrators to cooperatives
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-2 border border-green-200 dark:border-green-800">
            <Shield size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2 border border-red-200 dark:border-red-800">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="First Name" 
            name="first_name" 
            value={form.first_name} 
            onChange={handleChange} 
            required 
            icon={<User size={16} />}
          />
          <Input 
            label="Middle Name" 
            name="middle_name" 
            value={form.middle_name} 
            onChange={handleChange} 
            icon={<User size={16} />}
          />
          <Input 
            label="Last Name" 
            name="last_name" 
            value={form.last_name} 
            onChange={handleChange} 
            required 
            icon={<User size={16} />}
          />
          <Input 
            label="Email" 
            name="email" 
            type="email" 
            value={form.email} 
            onChange={handleChange} 
            required 
            icon={<Mail size={16} />}
          />
          <Input 
            label="Mobile Number" 
            name="mobile" 
            type="tel" 
            value={form.mobile} 
            onChange={handleChange} 
            required 
            icon={<Phone size={16} />}
          />
        </div>

        {/* Group Selection */}
        <div>
          <label htmlFor="group_id" className="text-sm font-medium mb-1 flex items-center gap-2">
            <Building2 size={16} />
            Assign to Cooperative/Group <span className="text-red-500">*</span>
          </label>
          <select
            id="group_id"
            name="group_id"
            value={form.group_id}
            onChange={handleChange}
            required
            className="w-full p-3 border border-brand-apple rounded bg-white dark:bg-[#144034] text-brand-dark dark:text-brand-apple focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="">Select a cooperative/group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Group Admins will have access to manage products for this cooperative
          </p>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <Shield size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              Group Admins can: manage cooperative products, process bulk orders, 
              respond to tenders, and view logistics reports.
            </span>
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold 
            transition-all duration-300 
            hover:from-purple-700 hover:to-indigo-700
            disabled:opacity-60 disabled:cursor-not-allowed
            flex items-center justify-center gap-2`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Registering...
            </>
          ) : (
            <>
              <Shield size={18} />
              Register Group Admin
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function Input({ label, name, icon, ...props }: any) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium mb-1 flex items-center gap-1">
        {icon}
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
