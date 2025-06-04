import { Link, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import ThemeToggle from "../components/ThemeToggle"; // ✅ Import the global toggle
import React,  { useState } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const farmer = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = `${farmer.first_name || ""} ${farmer.middle_name || ""}`.trim();

  const chartData = [
    { name: "Tomatoes", quantity: 400 },
    { name: "Maize", quantity: 300 },
    { name: "Beans", quantity: 500 },
    { name: "Wheat", quantity: 250 },
  ];

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
  <>
    <ThemeToggle />

    {/* 🔧 Floating Hamburger Icon Above Sidebar */}
    <button
      onClick={toggleSidebar}
      className="fixed top-4 left-4 z-60 md:hidden text-white bg-brand-green rounded p-2 shadow-lg focus:outline-none"
    >
      ☰
    </button>

    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`z-50 md:static fixed inset-y-0 left-0 w-64 bg-white dark:bg-brand-dark shadow-lg transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <img
            src="/Logos/Green_Logo_and_name_transparent_background_deep_dark_font.png"
            alt="Farm Fuzion Logo Light"
            className="block dark:hidden mx-auto w-72 md:w-80 lg:w-[300px] h-auto mb-6"
          />
          <img
            src="/Logos/Green_Logo_and_name_transparent_background_apple_green_font.png"
            alt="Farm Fuzion Logo Dark"
            className="hidden dark:block mx-auto w-72 md:w-80 lg:w-[300px] h-auto mb-6"
          />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-3">
          <SidebarLink to="/dashboard" label="Dashboard" icon="🏠" />
          <SidebarLink to="/products" label="Farm Products" icon="🚜" />
          <SidebarLink to="/logistics" label="Logistics" icon="🚚" />
          <SidebarLink to="/weather" label="Weather" icon="⛅" />
          <SidebarLink to="/currency" label="Currency" icon="💱" />
          <SidebarLink to="/region" label="Region" icon="🌍" />
          <SidebarLink to="/knowledge-hub" label="Knowledge Hub" icon="📚" />
          <SidebarLink to="/insurance" label="Insurance" icon="🛡️" />
          <SidebarLink to="/marketplace" label="Market" icon="🛒" />
          <SidebarLink to="/veterinary" label="Veterinary" icon="🐄" />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={logout}
            className="w-full px-3 py-2 rounded font-semibold transition-colors 
            text-brand-dark dark:text-brand-apple hover:bg-brand-dark dark:hover:bg-brand-apple 
            hover:text-brand-apple dark:hover:text-brand-dark"
          >
            🔓 Logout
          </button>
        </div>
      </aside>

      {/* Overlay on mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black opacity-40 z-40 md:hidden"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-brand-dark text-brand-dark dark:text-brand-apple p-6 md:p-8 transition-colors duration-300">
      {/* 👇 (Keep existing dashboard content here 👇) */}

          <h1 className="text-[46px] leading-[64px] font-bold mb-4 font-ubuntu">
            Welcome, {fullName}
          </h1>
          <p className="text-lg text-brand-green font-baloo mb-8">
            Sustained Agri-Business
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card
              title="Farm Products"
              desc="Track harvested items, units, storage, and status."
              link="/products"
              linkText="Manage Products →"
            />
            <Card
              title="Logistics"
              desc="Schedule delivery of produce and monitor transport."
              link="/logistics"
              linkText="Go to Logistics →"
            />
            <Card
              title="Loan Center"
              desc="Apply for farm loans and monitor repayments."
              link="/loans"
              linkText="Manage Loans →"
            />
            <Card
              title="Weather Forecast"
              desc="Track rainfall predictions, climate updates and forecasts."
              link="/weather"
              linkText="Check Weather →"
            />
            <Card
              title="Currency Converter"
              desc="Live exchange rates for agro-trade in your region."
              link="/currency"
              linkText="View Rates →"
            />
            <Card
              title="Region Settings"
              desc="Adjust your detected location or change manually."
              link="/region"
              linkText="Set Region →"
            />
            <Card
              title="Knowledge Hub"
              desc="Farming tutorials, tips and sustainable practices."
              link="/knowledge-hub"
              linkText="Explore Resources →"
            />
            <Card
              title="Insurance Plans"
              desc="Explore coverage for crops, livestock and more."
              link="/insurance"
              linkText="Review Policies →"
            />
            <Card
              title="Agro Marketplace"
              desc="Discover active markets and price benchmarks."
              link="/marketplace"
              linkText="Browse Markets →"
            />
            <Card
              title="Vet & Disease Services"
              desc="Get support for livestock meds, crop treatment & diseases."
              link="/veterinary"
              linkText="Vet Support →"
            />
          </div>

          <div className="mt-10">
            <h2 className="text-[46px] leading-[64px] font-bold mb-3 font-ubuntu">
              Platform Snapshot
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Registered Farmers" value="1,280+" />
              <StatCard label="Farm Products" value="6,742" />
              <StatCard label="Deliveries" value="1,205" />
              <StatCard label="Institutions Onboarded" value="18" />
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-bold mb-3">Top Products by Quantity</h2>
            <div className="bg-white dark:bg-[#022d26] p-6 rounded-lg shadow border border-slate-200 dark:border-slate-700">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#8dc71d" />
                  <YAxis stroke="#8dc71d" />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#8dc71d" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function SidebarLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <Link
      to={to}
      className="block px-3 py-2 rounded transition-colors text-brand-dark dark:text-brand-apple hover:bg-brand-dark dark:hover:bg-brand-apple hover:text-brand-apple dark:hover:text-brand-dark"
    >
      {icon} {label}
    </Link>
  );
}

function Card({
  title,
  desc,
  link,
  linkText,
}: {
  title: string;
  desc: string;
  link: string;
  linkText: string;
}) {
  return (
    <div className="bg-white dark:bg-[#0a3d32] p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 transition-colors duration-300">
      <h2 className="text-lg font-semibold mb-2 text-brand-dark dark:text-brand-apple">
        {title}
      </h2>
      <p className="text-sm text-brand-dark/70 dark:text-gray-300">{desc}</p>
      <Link
        to={link}
        className="text-brand-green dark:text-brand-apple font-medium hover:underline mt-3 inline-block"
      >
        {linkText}
      </Link>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-[#0f4439] text-center p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700 transition-colors duration-300">
      <div className="text-2xl font-bold text-brand-green dark:text-brand-apple">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-300 mt-1">{label}</div>
    </div>
  );
}
