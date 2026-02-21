// farm-fuzion-frontend/src/pages/Dashboard.tsx (UPDATED with real metrics)
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import ThemeToggle from "../components/ThemeToggle";
import React, { useState, useEffect } from "react";
import WalletModal from "../components/Wallet/WalletModal";
import ProductsModal from "../components/Products/ProductsModal";
import MarketsModal from "../components/Markets/MarketsModal";
import { formatCurrencyKES } from "../utils/format";

// API Base URL
const API_BASE = "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const farmer = JSON.parse(localStorage.getItem("user") || "{}");
  const farmerId = farmer?.id;

  // State for real data
  const [walletBalance, setWalletBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [activeListings, setActiveListings] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [marketPrices, setMarketPrices] = useState<any[]>([]);
  const [inventoryStats, setInventoryStats] = useState<{
    total: number;
    categories: Array<{ name: string; value: number }>;
  }>({ total: 0, categories: [] });
  const [loading, setLoading] = useState(true);

  // Construct name with proper handling of optional middle_name
  const fullName = (() => {
    // Try to get name from the schema fields
    const firstName = farmer.first_name || farmer.firstName || '';
    const middleName = farmer.middle_name || farmer.middleName || '';
    const lastName = farmer.last_name || farmer.lastName || '';
    
    // If we have at least first and last name
    if (firstName && lastName) {
      return middleName 
        ? `${firstName} ${middleName} ${lastName}`
        : `${firstName} ${lastName}`;
    }
    
    // Fallback options
    const possibleNames = [
      farmer.displayName,
      farmer.name,
      farmer.email?.split('@')[0],
      `Farmer ${farmer.id?.slice(0, 8) || farmer.user_id?.slice(0, 8)}`
    ];
    
    return possibleNames.find(name => name && name.trim().length > 0) || "Farmer";
  })();

  console.log("✅ Resolved fullName:", fullName);
  
  useEffect(() => {
    if (farmerId) {
      loadDashboardData();
    }
  }, [farmerId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        walletRes,
        ordersRes,
        listingsRes,
        pricesRes,
        inventoryRes,
        transactionsRes
      ] = await Promise.allSettled([
        fetch(`${API_BASE}/wallet/${farmerId}/balance`),
        fetch(`${API_BASE}/marketplace/orders/buyer/${farmerId}?status=pending`),
        fetch(`${API_BASE}/marketplace/products?farmer_id=${farmerId}&status=available`),
        fetch(`${API_BASE}/market-prices/summary`),
        fetch(`${API_BASE}/farm-products/farmer/${farmerId}`),
        fetch(`${API_BASE}/wallet/${farmerId}/transactions?limit=5`)
      ]);

      // Process wallet balance
      if (walletRes.status === 'fulfilled') {
        const data = await walletRes.value.json();
        setWalletBalance(data.balance || 0);
      }

      // Process pending orders
      if (ordersRes.status === 'fulfilled') {
        const data = await ordersRes.value.json();
        setPendingOrders(data.data?.length || 0);
      }

      // Process active listings
      if (listingsRes.status === 'fulfilled') {
        const data = await listingsRes.value.json();
        setActiveListings(data.data?.length || 0);
        const sales = data.data?.reduce((sum: number, item: any) => 
          sum + (item.price * item.quantity), 0) || 0;
        setTotalSales(sales);
      }

      // Process market prices - FIXED
      if (pricesRes.status === 'fulfilled') {
        const response = await pricesRes.value.json();
        console.log("Market prices response:", response);
        
        // The API returns { data: [...], currency, fx_rates, total_products }
        if (response && Array.isArray(response.data)) {
          setMarketPrices(response.data.slice(0, 5));
        } else {
          console.warn("Market prices data is not in expected format:", response);
          setMarketPrices([]);
        }
      }

      // Process inventory
      if (inventoryRes.status === 'fulfilled') {
        const data = await inventoryRes.value.json();
        
        const categoryCounts: Record<string, number> = {};
        
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((item: any) => {
            const category = item.category || 'Uncategorized';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          });
        }
        
        const categories = Object.entries(categoryCounts).map(([name, value]) => ({ 
          name, 
          value
        }));
        
        setInventoryStats({
          total: data.data?.length || 0,
          categories
        });
      }

      // Process recent transactions - FIXED
      if (transactionsRes.status === 'fulfilled') {
        const response = await transactionsRes.value.json();
        console.log("Transactions response:", response);
        
        // Based on your wallet endpoint, it returns { success, balance, transactions, pagination }
        if (response && response.success && Array.isArray(response.transactions)) {
          setRecentTransactions(response.transactions.slice(0, 3));
        } else {
          console.warn("Transactions data is not in expected format:", response);
          setRecentTransactions([]);
        }
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [walletOpen, setWalletOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [marketsOpen, setMarketsOpen] = useState(false);

  // Helper function to get emoji for product categories
  const getProductEmoji = (productName: string): string => {
    const name = productName.toLowerCase();
    if (name.includes('maize') || name.includes('corn')) return '🌽';
    if (name.includes('tomato')) return '🍅';
    if (name.includes('potato')) return '🥔';
    if (name.includes('onion')) return '🧅';
    if (name.includes('carrot')) return '🥕';
    if (name.includes('cabbage')) return '🥬';
    if (name.includes('bean') || name.includes('legume')) return '🫘';
    if (name.includes('wheat') || name.includes('grain')) return '🌾';
    if (name.includes('milk') || name.includes('dairy')) return '🥛';
    if (name.includes('egg')) return '🥚';
    if (name.includes('chicken') || name.includes('poultry')) return '🐔';
    if (name.includes('beef') || name.includes('cattle')) return '🐄';
    if (name.includes('coffee')) return '☕';
    if (name.includes('tea')) return '🫖';
    if (name.includes('fruit')) return '🍎';
    if (name.includes('vegetable')) return '🥦';
    return '🌱'; // Default
  };

  // Colors for pie chart
  const COLORS = ['#8dc71d', '#ff8042', '#ffbb28', '#00C49F', '#0088FE'];

  return (
    <>
      <ThemeToggle />

      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-60 md:hidden text-white bg-brand-green rounded p-2 shadow-lg focus:outline-none"
      >
        ☰
      </button>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar (unchanged) */}
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
            <button
              onClick={() => setProductsOpen(true)}
              className="w-full text-left px-3 py-2 rounded transition-colors text-brand-dark dark:text-brand-apple hover:bg-brand-dark dark:hover:bg-brand-apple hover:text-brand-apple dark:hover:text-brand-dark"
            >
              🚜 Inventory
            </button>
            <SidebarLink to="/logistics" label="Logistics" icon="🚚" />
            <SidebarLink to="/knowledge-hub" label="Knowledge Hub" icon="📚" />
            <SidebarLink to="/insurance" label="Insurance" icon="🛡️" />
            <SidebarLink to="/marketplace" label="Market" icon="🛒" />
            <SidebarLink to="/veterinary" label="Veterinary" icon="🐄" />
            {farmer?.role === "admin" && (
              <SidebarLink to="/register-farmer" label="Register Farmer" icon="📝" />
            )}
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
          <h1 className="text-[46px] leading-[64px] font-bold mb-4 font-ubuntu">
            {fullName}'s farm
          </h1>

          {/* Farmer's Key Metrics */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard 
                  label="Wallet Balance" 
                  value={formatCurrencyKES(walletBalance)}
                  icon="💰"
                  color="bg-green-100 dark:bg-green-900/30"
                />
                <StatCard 
                  label="Active Listings" 
                  value={activeListings.toString()}
                  icon="📦"
                  color="bg-blue-100 dark:bg-blue-900/30"
                />
                <StatCard 
                  label="Pending Orders" 
                  value={pendingOrders.toString()}
                  icon="⏳"
                  color="bg-yellow-100 dark:bg-yellow-900/30"
                />
                <StatCard 
                  label="Inventory Items" 
                  value={inventoryStats.total.toString()}
                  icon="🌾"
                  color="bg-purple-100 dark:bg-purple-900/30"
                />
              </div>

              {/* Quick Actions Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Recent Transactions */}
                <div className="bg-white dark:bg-[#0a3d32] p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>📋 Recent Transactions</span>
                    <button 
                      onClick={() => setWalletOpen(true)}
                      className="text-xs bg-brand-green text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      View All
                    </button>
                  </h3>
                  {recentTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {recentTransactions.map((tx: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                          <div>
                            <p className="font-medium">{tx.description || 'Transaction'}</p>
                            <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={tx.direction === 'in' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            {tx.direction === 'in' ? '+' : '-'}{formatCurrencyKES(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No recent transactions</p>
                  )}
                </div>

                {/* Top Market Prices - Enhanced with Tailwind */}
                <div className="bg-white dark:bg-[#0a3d32] p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 card-hover">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-brand-green/10 rounded-lg">
                        <span className="text-xl">💰</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-brand-dark dark:text-brand-apple">
                          Market Prices
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Current rates per unit
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setMarketsOpen(true)}
                      className="flex items-center gap-1 text-xs bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors group"
                    >
                      <span>View All</span>
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </button>
                  </div>

                  {marketPrices.length > 0 ? (
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 pb-1 border-b border-slate-200 dark:border-slate-700">
                        <span>Product</span>
                        <span>Price per unit</span>
                      </div>

                      {/* Price List - Using your scrollbar-thin class */}
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                        {marketPrices
                          .sort((a, b) => (b.retail_price || 0) - (a.retail_price || 0))
                          .map((price: any, idx: number) => (
                            <div 
                              key={idx} 
                              className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group table-row-enter"
                              style={{ animationDelay: `${idx * 100}ms` }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg opacity-50 group-hover:opacity-100 transition-opacity">
                                  {getProductEmoji(price.product_name)}
                                </span>
                                <div>
                                  <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                    {price.product_name}
                                  </span>
                                  <span className="text-xs text-gray-400 ml-2">
                                    {price.category || 'General'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`font-bold ${(price.weekly_change || 0) > 0 ? 'text-green-600 price-up' : 'text-red-600 price-down'}`}>
                                  {formatCurrencyKES(price.retail_price)}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">
                                  /{price.unit || 'unit'}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Footer with trend info */}
                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                        <span className="text-gray-500">
                          📊 {marketPrices.length} products tracked
                        </span>
                        <span className="text-brand-green flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          Live updates
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <div className="w-16 h-16 mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shimmer">
                        <span className="text-3xl">📊</span>
                      </div>
                      <p className="text-sm font-medium">No market prices available</p>
                      <p className="text-xs mt-1">Check back later for updates</p>
                      <button
                        onClick={() => setMarketsOpen(true)}
                        className="mt-3 text-brand-green text-sm hover:underline"
                      >
                        Browse Marketplace →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Inventory by Category Pie Chart */}
                <div className="bg-white dark:bg-[#0a3d32] p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-4">📊 Inventory by Category</h3>
                  {inventoryStats.categories.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={inventoryStats.categories}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {inventoryStats.categories.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No inventory data</p>
                  )}
                </div>

                {/* Market Price Trends Chart - FIXED */}
                <div className="bg-white dark:bg-[#0a3d32] p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-bold mb-4">📈 Market Price Trends</h3>
                  {Array.isArray(marketPrices) && marketPrices.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={marketPrices.slice(0, 5)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="product_name" stroke="#8dc71d" />
                        <YAxis stroke="#8dc71d" />
                        <Tooltip />
                        <Bar dataKey="retail_price" fill="#8dc71d" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No market price data available</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Action Cards (unchanged) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <Card
              title="My Wallet"
              desc="Top-up, view balance & track transactions"
              linkText="Open Wallet →"
              onClick={() => setWalletOpen(true)}
            />
            {walletOpen && (
              <WalletModal farmerId={farmer?.id} onClose={() => setWalletOpen(false)} />
            )}

            <Card
              title="Farm Inventory"
              desc="Track harvested items, units, storage, and status."
              linkText="Product Management →"
              onClick={() => setProductsOpen(true)}
            />
            {productsOpen && (
              <ProductsModal
                farmerId={farmer?.id}
                onClose={() => setProductsOpen(false)}
                onProductAdded={loadDashboardData}
              />
            )}
            
            <Card
              title="Agro Marketplace"
              desc="Discover active markets and price benchmarks."
              link="/marketplace"
              linkText="Browse Markets →"
              onClick={() => setMarketsOpen(true)}
            />
            {marketsOpen && (
              <MarketsModal
                farmerId={farmer?.id}
                onClose={() => setMarketsOpen(false)}
                onMarketAdded={loadDashboardData}
              />
            )}
            
            {/* Other cards unchanged */}
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
              title="Knowledge Hub"
              desc="Farming tutorials, tips and sustainable practices."
              link="/knowledge-hub"
              linkText="Explore Resources →"
            />
            <Card
              title="Logistics"
              desc="Schedule delivery of produce and monitor transport."
              link="/logistics"
              linkText="Go to Logistics →"
            />
            <Card
              title="Vet & Disease Services"
              desc="Get support for livestock meds, crop treatment & diseases."
              link="/veterinary"
              linkText="Vet Support →"
            />
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
  onClick,
}: {
  title: string;
  desc: string;
  link?: string;
  linkText: string;
  onClick?: () => void;
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (link) {
      navigate(link);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white dark:bg-[#0a3d32] p-6 rounded-lg shadow-md 
                 border border-slate-200 dark:border-slate-700 
                 transition-colors duration-300 cursor-pointer hover:shadow-lg"
    >
      <h2 className="text-lg font-semibold mb-2 text-brand-dark dark:text-brand-apple">
        {title}
      </h2>
      <p className="text-sm text-brand-dark/70 dark:text-gray-300">{desc}</p>
      <span className="text-brand-green dark:text-brand-apple font-medium hover:underline mt-3 inline-block">
        {linkText}
      </span>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className={`${color} p-4 rounded-lg shadow border border-slate-200 dark:border-slate-700 transition-colors duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-600 dark:text-slate-300">{label}</div>
          <div className="text-2xl font-bold text-brand-green dark:text-brand-apple mt-1">{value}</div>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
