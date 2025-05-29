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
import { useEffect, useState } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const email = localStorage.getItem("user");

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

  // Theme toggle
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark(!isDark);
    localStorage.setItem("theme", !isDark ? "dark" : "light");
  };

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 text-brand-dark dark:bg-brand-dark dark:text-white font-ubuntu">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-brand-dark text-brand-dark dark:text-white flex flex-col shadow-lg">
        <div className="p-6 border-b border-slate-200 dark:border-brand-green">
          <img
            src="/Logos/Green_Logo_and_name_transparent_background_deep_dark_font.png"
            alt="Farm Fuzion Logo"
            className="mx-auto w-72 md:w-80 lg:w-[300px] h-auto mb-6"
          />
        </div>
        <nav className="flex-1 px-4 py-6 space-y-3">
          <SidebarLink to="/dashboard" label="Dashboard" icon="🏠" />
          <SidebarLink to="/products" label="Farm Products" icon="🚜" />
          <SidebarLink to="/logistics" label="Logistics" icon="🚚" />
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-brand-green">
          <button
            onClick={logout}
            className="w-full px-3 py-2 rounded font-semibold transition-colors text-brand-dark dark:text-white hover:bg-brand-dark hover:text-brand-apple"
          >
            🔓 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-slate-50 dark:bg-brand-dark text-brand-dark dark:text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-[46px] leading-[64px] font-bold font-ubuntu">
              Welcome, {email}
            </h1>
            <p className="text-lg text-brand-green font-baloo">
              Sustained Agri-Business
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3 py-1 rounded text-sm font-medium border border-brand-green hover:bg-brand-apple hover:text-white transition-colors"
          >
            {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

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
          <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow border dark:border-brand-green">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="name" stroke={isDark ? "#fff" : "#000"} />
                <YAxis stroke={isDark ? "#fff" : "#000"} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#00231d" : "#fff",
                    color: isDark ? "#8dc71d" : "#0d5b10",
                    borderColor: "#8dc71d",
                  }}
                />
                <Bar dataKey="quantity" fill="#0d5b10" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sidebar Link Component
function SidebarLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <Link
      to={to}
      className="block px-3 py-2 rounded transition-colors text-brand-dark dark:text-white hover:bg-brand-dark hover:text-brand-apple"
    >
      {icon} {label}
    </Link>
  );
}

// Card Component
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
    <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-md border border-slate-200 dark:border-brand-green">
      <h2 className="text-lg font-semibold mb-2 text-brand-dark dark:text-white">{title}</h2>
      <p className="text-sm text-brand-dark/70 dark:text-white/70">{desc}</p>
      <Link
        to={link}
        className="text-brand-green font-medium hover:underline mt-3 inline-block"
      >
        {linkText}
      </Link>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-brand-dark text-center p-4 rounded-lg shadow border dark:border-brand-green">
      <div className="text-2xl font-bold text-brand-green">{value}</div>
      <div className="text-sm text-slate-500 dark:text-white/70 mt-1">{label}</div>
    </div>
  );
}
