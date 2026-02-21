// farm-fuzion-frontend/src/pages/Dashboard.tsx
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import ThemeToggle from "../components/ThemeToggle";
import React, { useState, useEffect } from "react";
import WalletModal from "../components/Wallet/WalletModal";
import ProductsModal from "../components/Products/ProductsModal";
import MarketsModal from "../components/Markets/MarketsModal";
import { formatCurrencyKES } from "../utils/format";
import CreditModal from "../components/Credit/CreditModal";
import { 
  Menu, ChevronLeft, ChevronRight, LogOut, Wallet, Package, 
  ShoppingCart, CreditCard, Cloud, DollarSign, BookOpen, 
  Truck, PawPrint, TrendingUp, Bell, Settings, HelpCircle,
  Home, BarChart3, Sparkles, RefreshCw
} from "lucide-react";

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
  const [refreshing, setRefreshing] = useState(false);

  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [greeting, setGreeting] = useState("");

  // Modal States
  const [walletOpen, setWalletOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [marketsOpen, setMarketsOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);

  const [farmerDetails, setFarmerDetails] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFarmerDetails = async () => {
      if (!farmerId) return;
      
      try {
        // If we don't have first_name in localStorage, fetch from API
        if (!farmer.first_name && farmerId) {
          console.log("🔍 Fetching farmer details for ID:", farmerId);
          
          // The working endpoint returns an array
          const response = await fetch(`${API_BASE}/farmers?id=${farmerId}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log("✅ Farmer details from API:", data);
            
            // The API returns an array - get the first item
            if (Array.isArray(data) && data.length > 0) {
              const farmerData = data[0];
              console.log("✅ Found farmer:", farmerData);
              setFarmerDetails(farmerData);
            } else {
              console.warn("No farmer data found in response");
            }
          } else {
            console.warn("Failed to fetch farmer details:", response.status);
          }
        }
      } catch (error) {
        console.error("Error fetching farmer details:", error);
      }
    };

    fetchFarmerDetails();
  }, [farmerId]);

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Get the farmer's first name from localStorage or fetched details
  const firstName = farmer.first_name || 
                    farmer.firstName || 
                    (Array.isArray(farmerDetails) && farmerDetails.length > 0 ? farmerDetails[0]?.first_name : null) ||
                    farmerDetails?.first_name || 
                    farmerDetails?.firstName || 
                    '';

  const displayName = firstName || farmer.email?.split('@')[0] || 'Farmer';

  console.log("✅ Farmer details array:", farmerDetails);
  console.log("✅ First name from API:", Array.isArray(farmerDetails) && farmerDetails.length > 0 ? farmerDetails[0]?.first_name : 'not found');
  console.log("✅ Final firstName:", firstName);
  console.log("✅ Final displayName:", displayName);

  useEffect(() => {
    if (farmerId) {
      loadDashboardData();
    }
  }, [farmerId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
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

      // Process market prices
      if (pricesRes.status === 'fulfilled') {
        const response = await pricesRes.value.json();
        if (response && Array.isArray(response.data)) {
          setMarketPrices(response.data.slice(0, 5));
        } else {
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

      // Process recent transactions
      if (transactionsRes.status === 'fulfilled') {
        const response = await transactionsRes.value.json();
        if (response && response.success && Array.isArray(response.transactions)) {
          setRecentTransactions(response.transactions.slice(0, 3));
        } else {
          setRecentTransactions([]);
        }
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

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
    return '🌱';
  };

  // Colors for pie chart
  const COLORS = ['#8dc71d', '#ff8042', '#ffbb28', '#00C49F', '#0088FE'];

  const sidebarWidth = sidebarCollapsed ? 'w-20' : 'w-64';

  return (
    <>
      <ThemeToggle />

      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-60 md:hidden text-white bg-brand-green rounded-lg p-2.5 shadow-lg hover:bg-green-700 transition-colors"
      >
        <Menu size={20} />
      </button>

      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Sidebar */}
        <aside
          className={`z-50 md:static fixed inset-y-0 left-0 ${sidebarWidth} bg-white dark:bg-gray-900 shadow-2xl transform transition-all duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 flex flex-col`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed ? (
                <img
                  src="/Logos/Green_Logo_and_name_transparent_background_deep_dark_font.png"
                  alt="Farm Fuzion"
                  className="h-10 object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-white font-bold text-xl">FF</span>
                </div>
              )}
              <button
                onClick={toggleSidebar}
                className="hidden md:block p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            <NavItem 
              icon={<Home size={20} />} 
              label="Dashboard" 
              to="/dashboard" 
              active 
              collapsed={sidebarCollapsed} 
            />
            <NavButton 
              icon={<Package size={20} />} 
              label="Inventory" 
              onClick={() => setProductsOpen(true)} 
              collapsed={sidebarCollapsed} 
            />
            <NavItem 
              icon={<Truck size={20} />} 
              label="Logistics" 
              to="/logistics" 
              collapsed={sidebarCollapsed} 
            />
            <NavItem 
              icon={<BookOpen size={20} />} 
              label="Knowledge Hub" 
              to="/knowledge-hub" 
              collapsed={sidebarCollapsed} 
            />
            <NavItem 
              icon={<CreditCard size={20} />} 
              label="Insurance" 
              to="/insurance" 
              collapsed={sidebarCollapsed} 
            />
            <NavItem 
              icon={<ShoppingCart size={20} />} 
              label="Market" 
              to="/marketplace" 
              collapsed={sidebarCollapsed} 
            />
            <NavItem 
              icon={<PawPrint size={20} />} 
              label="Veterinary" 
              to="/veterinary" 
              collapsed={sidebarCollapsed} 
            />
            
            {farmer?.role === "admin" && (
              <NavItem 
                icon={<Settings size={20} />} 
                label="Admin" 
                to="/register-farmer" 
                collapsed={sidebarCollapsed} 
              />
            )}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={logout}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut size={20} />
              {!sidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {greeting}, {firstName}! 👋
                </h1>
                <span className="hidden md:inline-block px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-sm font-medium">
                  Farmer
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
                  disabled={refreshing}
                >
                  <RefreshCw size={20} className={refreshing ? 'animate-spin text-brand-green' : ''} />
                </button>
                
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative">
                  <Bell size={20} />
                  {notifications > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                      {notifications}
                    </span>
                  )}
                </button>
                
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <HelpCircle size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-6">
            {/* Welcome Banner */}
            <div className="mb-8 bg-gradient-to-r from-brand-green to-green-600 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-16 -mb-16"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">{displayName}'s Farm</h2>
                <p className="text-white/90 max-w-2xl">
                  Your farm management dashboard. Track inventory, monitor market prices, 
                  manage your wallet, and access credit facilities all in one place.
                </p>
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
                    <Sparkles size={16} />
                    <span className="text-sm">AI Insights Available</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
                    <BarChart3 size={16} />
                    <span className="text-sm">Market Updated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-brand-green/30 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-brand-green border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
              </div>
            ) : (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <MetricCard 
                    label="Wallet Balance" 
                    value={formatCurrencyKES(walletBalance)}
                    icon={<Wallet size={24} />}
                    trend="+12.5%"
                    color="from-green-500 to-emerald-600"
                    onClick={() => setWalletOpen(true)}
                  />
                  <MetricCard 
                    label="Active Listings" 
                    value={activeListings.toString()}
                    icon={<Package size={24} />}
                    trend={activeListings > 0 ? '+2 new' : 'No change'}
                    color="from-blue-500 to-indigo-600"
                    onClick={() => setProductsOpen(true)}
                  />
                  <MetricCard 
                    label="Pending Orders" 
                    value={pendingOrders.toString()}
                    icon={<ShoppingCart size={24} />}
                    trend={pendingOrders > 0 ? 'Action needed' : 'All clear'}
                    color="from-yellow-500 to-orange-600"
                    onClick={() => setMarketsOpen(true)}
                  />
                  <MetricCard 
                    label="Inventory Items" 
                    value={inventoryStats.total.toString()}
                    icon={<Package size={24} />}
                    trend="+5 this month"
                    color="from-purple-500 to-pink-600"
                    onClick={() => setProductsOpen(true)}
                  />
                </div>

                {/* Quick Actions Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Recent Transactions */}
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-green/10 rounded-lg">
                            <Wallet size={20} className="text-brand-green" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
                            <p className="text-xs text-gray-500">Your latest wallet activity</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setWalletOpen(true)}
                          className="text-sm text-brand-green hover:text-green-700 font-medium flex items-center gap-1 group"
                        >
                          View All
                          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      {recentTransactions.length > 0 ? (
                        <div className="space-y-3">
                          {recentTransactions.map((tx: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors animate-slide-up"
                              style={{ animationDelay: `${idx * 100}ms` }}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  tx.direction === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                  {tx.direction === 'in' ? '↓' : '↑'}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{tx.description || 'Transaction'}</p>
                                  <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <span className={`font-bold ${
                                tx.direction === 'in' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {tx.direction === 'in' ? '+' : '-'}{formatCurrencyKES(tx.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Wallet size={40} className="mx-auto text-gray-300 mb-3" />
                          <p className="text-gray-500">No recent transactions</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Market Prices */}
                  <MarketPricesCard 
                    marketPrices={marketPrices}
                    onViewAll={() => setMarketsOpen(true)}
                    getProductEmoji={getProductEmoji}
                  />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Inventory Chart */}
                  <ChartCard title="Inventory Distribution" icon={<PieChart className="text-brand-green" />}>
                    {inventoryStats.categories.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={inventoryStats.categories}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
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
                      <EmptyState message="No inventory data" />
                    )}
                  </ChartCard>

                  {/* Price Trends Chart */}
                  <PriceTrendsCard marketPrices={marketPrices} />
                </div>

                {/* Action Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
                  <ActionCard
                    icon={<Wallet size={24} />}
                    title="My Wallet"
                    description="Manage your funds and transactions"
                    color="from-green-500 to-emerald-600"
                    onClick={() => setWalletOpen(true)}
                  />
                  
                  <ActionCard
                    icon={<Package size={24} />}
                    title="Farm Inventory"
                    description="Track your products and stock"
                    color="from-blue-500 to-indigo-600"
                    onClick={() => setProductsOpen(true)}
                  />
                  
                  <ActionCard
                    icon={<ShoppingCart size={24} />}
                    title="Marketplace"
                    description="Buy and sell farm products"
                    color="from-purple-500 to-pink-600"
                    onClick={() => setMarketsOpen(true)}
                  />
                  
                  <ActionCard
                    icon={<CreditCard size={24} />}
                    title="Credit Center"
                    description="Apply for loans and credit"
                    color="from-yellow-500 to-orange-600"
                    onClick={() => setCreditOpen(true)}
                  />
                  
                  <ActionCard
                    icon={<Cloud size={24} />}
                    title="Weather"
                    description="Forecast and climate data"
                    color="from-cyan-500 to-blue-600"
                    link="/weather"
                  />
                  
                  <ActionCard
                    icon={<DollarSign size={24} />}
                    title="Currency"
                    description="Live exchange rates"
                    color="from-emerald-500 to-teal-600"
                    link="/currency"
                  />
                  
                  <ActionCard
                    icon={<BookOpen size={24} />}
                    title="Knowledge Hub"
                    description="Farming resources and guides"
                    color="from-amber-500 to-yellow-600"
                    link="/knowledge-hub"
                  />
                  
                  <ActionCard
                    icon={<Truck size={24} />}
                    title="Logistics"
                    description="Schedule and track deliveries"
                    color="from-rose-500 to-pink-600"
                    link="/logistics"
                  />
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {walletOpen && (
        <WalletModal farmerId={farmer?.id} onClose={() => setWalletOpen(false)} />
      )}
      {productsOpen && (
        <ProductsModal
          farmerId={farmer?.id}
          onClose={() => setProductsOpen(false)}
          onProductAdded={loadDashboardData}
        />
      )}
      {marketsOpen && (
        <MarketsModal
          farmerId={farmer?.id}
          onClose={() => setMarketsOpen(false)}
          onMarketAdded={loadDashboardData}
        />
      )}
      {creditOpen && (
        <CreditModal
          farmerId={farmer?.id}
          onClose={() => setCreditOpen(false)}
        />
      )}
    </>
  );
}

// ==================== Subcomponents ====================

function NavItem({ icon, label, to, active = false, collapsed }: any) {
  return (
    <Link
      to={to}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
        active 
          ? 'bg-brand-green text-white shadow-md' 
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      } ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? label : ''}
    >
      {icon}
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}

function NavButton({ icon, label, onClick, collapsed }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ${
        collapsed ? 'justify-center' : ''
      }`}
      title={collapsed ? label : ''}
    >
      {icon}
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}

function MetricCard({ label, value, icon, trend, color, onClick }: any) {
  const trendIsPositive = trend?.includes('+') || trend?.includes('↑');
  
  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-90`}></div>
      <div className="absolute inset-0 bg-white/20 group-hover:opacity-0 transition-opacity"></div>
      <div className="relative p-4 text-white">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            {icon}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm ${
            trendIsPositive ? 'text-green-200' : 'text-red-200'
          }`}>
            {trend}
          </span>
        </div>
        <p className="text-sm opacity-90 mb-1">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function MarketPricesCard({ marketPrices, onViewAll, getProductEmoji }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-green/10 rounded-lg">
              <TrendingUp size={20} className="text-brand-green" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Market Prices</h3>
              <p className="text-xs text-gray-500">Current rates per unit</p>
            </div>
          </div>
          <button
            onClick={onViewAll}
            className="text-sm text-brand-green hover:text-green-700 font-medium flex items-center gap-1 group"
          >
            View All
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {marketPrices.length > 0 ? (
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
            {marketPrices.map((price: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors animate-slide-up"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getProductEmoji(price.product_name)}</span>
                  <div>
                    <p className="font-medium text-sm">{price.product_name}</p>
                    <p className="text-xs text-gray-500">{price.category || 'General'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-green">{formatCurrencyKES(price.retail_price)}</p>
                  <p className="text-xs text-gray-500">/{price.unit || 'unit'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No market prices available" />
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, icon, children }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function PriceTrendsCard({ marketPrices }: any) {
  return (
    <ChartCard title="Price Trends" icon={<TrendingUp size={20} className="text-brand-green" />}>
      {Array.isArray(marketPrices) && marketPrices.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={marketPrices.slice(0, 8)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8dc71d" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8dc71d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis dataKey="product_name" stroke="#8dc71d" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
            <YAxis stroke="#8dc71d" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`KSh ${value.toLocaleString()}`, 'Price']}
            />
            <Area
              type="monotone"
              dataKey="retail_price"
              stroke="#8dc71d"
              strokeWidth={3}
              fill="url(#priceGradient)"
              dot={{ fill: '#8dc71d', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState message="No price data available" />
      )}
    </ChartCard>
  );
}

function ActionCard({ icon, title, description, color, onClick, link }: any) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) onClick();
    else if (link) navigate(link);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${color} rounded-full -mr-10 -mt-10 opacity-20 group-hover:opacity-30 transition-opacity"></div>
      
      <div className="relative p-5">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} text-white flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
        <div className="flex items-center gap-1 text-brand-green font-medium text-sm group-hover:gap-2 transition-all">
          <span>Explore</span>
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <span className="text-2xl">📭</span>
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
