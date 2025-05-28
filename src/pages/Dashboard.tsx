// farm-fuzion-frontend/src/pages/Dashboard.tsx

import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const email = localStorage.getItem("user");
  const location = useLocation();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-brand-dark text-white font-ubuntu">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-green flex flex-col shadow-lg">
        <div className="p-6 border-b border-brand-dark">
          <img
            srcSet="
              /Logos/Green_Logo_and_name_transparent_background_deep_dark_font.png 1x,
              /Logos/Green_Logo_and_name_transparent_background_deep_dark_font.png 2x
            "
            src="/Logos/Green_Logo_and_name_transparent_background_deep_dark_font.png"
            alt="Farm Fuzion Logo"
            className="mx-auto w-72 md:w-80 lg:w-[300px] h-auto mb-4"
          />
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarLink to="/dashboard" label="Dashboard" icon="🏠" active={location.pathname === "/dashboard"} />
          <SidebarLink to="/products" label="Farm Products" icon="🚜" active={location.pathname === "/products"} />
          <SidebarLink to="/logistics" label="Logistics" icon="🚚" active={location.pathname === "/logistics"} />
        </nav>
        <div className="p-4 border-t border-brand-dark">
          <button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 py-2 px-4 rounded text-white font-semibold transition-colors duration-300"
          >
            🔓 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto bg-slate-50 text-brand-dark">
        <h1 className="text-3xl font-bold text-brand-green mb-4">
          Welcome, {email}
        </h1>

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
          <h2 className="text-xl font-bold mb-3">Platform Snapshot</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Registered Farmers" value="1,280+" />
            <StatCard label="Farm Products" value="6,742" />
            <StatCard label="Deliveries" value="1,205" />
            <StatCard label="Institutions Onboarded" value="18" />
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({
  to,
  label,
  icon,
  active,
}: {
  to: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded transition-colors font-medium ${
        active
          ? "bg-brand-dark text-white"
          : "bg-brand-green hover:bg-brand-dark"
      }`}
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
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <h2 className="text-lg font-semibold mb-2 text-brand-dark">{title}</h2>
      <p className="text-sm text-slate-600">{desc}</p>
      <Link
        to={link}
        className="text-brand-green font-medium hover:underline mt-3 inline-block"
      >
        {linkText}
      </Link>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white text-center p-4 rounded-lg shadow border">
      <div className="text-2xl font-bold text-brand-green">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}
