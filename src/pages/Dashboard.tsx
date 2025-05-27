import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem("user");

  const logout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-green-800 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-green-700">🌾 Farm Fuzion</div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/dashboard" className="block hover:bg-green-700 px-3 py-2 rounded">🏠 Dashboard</Link>
          <Link to="/products" className="block hover:bg-green-700 px-3 py-2 rounded">🚜 Farm Products</Link>
          <Link to="/logistics" className="block hover:bg-green-700 px-3 py-2 rounded">🚚 Logistics</Link>
        </nav>
        <div className="p-4 border-t border-green-700">
          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 py-2 px-4 rounded text-white"
          >
            🔓 Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <div className="text-2xl font-semibold mb-6">Welcome, {email}</div>
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
      </main>
    </div>
  );
}

function Card({ title, desc, link, linkText }: { title: string; desc: string; link: string; linkText: string }) {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p>{desc}</p>
      <Link to={link} className="text-green-700 hover:underline mt-2 inline-block">
        {linkText}
      </Link>
    </div>
  );
}
