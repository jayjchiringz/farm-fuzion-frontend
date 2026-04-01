// farm-fuzion-frontend/src/pages/PublicMarketplace.tsx
import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, Filter, Package, MapPin, DollarSign, TrendingUp, 
  Globe, Leaf, Award, Shield, Truck, CreditCard, Users,
  ChevronLeft, ChevronRight, X, Loader2, AlertCircle,
  Star, Calendar, ArrowUpRight, ShoppingCart, Building2,
  Menu, ChevronDown, LogOut, LayoutDashboard, BarChart3,
  Sparkles, Home, Settings, HelpCircle, Bell, Sun, Moon,
  User, Wallet, TrendingDown, Activity, ArrowUp, ArrowDown,
  Bot, MessageCircle
} from "lucide-react";
import { useCurrency } from "../contexts/CurrencyContext";
import ThemeToggle from "../components/ThemeToggle";
import MainLayout from "../layouts/MainLayout";
import KnowledgeModal from "../components/Knowledge/KnowledgeModal";
import { useAuth } from "../contexts/AuthContext";

// Public API URL
const PUBLIC_API_URL = import.meta.env.VITE_PUBLIC_API_URL || "https://farmfuzion-public-api.onrender.com";

interface PublicProduct {
  id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  currency: string;
  total_price: number;
  available: boolean;
  certification?: string;
  description?: string;
  created_at: string;
  cooperative_name?: string;
  source_farmer_name?: string;
}

interface MarketplaceStats {
  total_products: number;
  total_cooperatives: number;
  total_orders: number;
  categories: Array<{ name: string; count: number }>;
}

interface MarketPrice {
  product_name: string;
  retail_price: number;
  unit: string;
  region?: string;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  weekly_change?: number;
}

export default function PublicMarketplace() {
  const { user } = useAuth();
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  
  // Responsive sidebar state - default collapsed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'marketplace' | 'analytics'>('marketplace');
  const [isMobile, setIsMobile] = useState(false);
  
  // Marketplace state
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Order form
  const [orderForm, setOrderForm] = useState({
    buyer_name: "",
    buyer_company: "",
    buyer_email: "",
    buyer_phone: "",
    buyer_country: "Kenya",
    quantity: 1,
    shipping_address: "",
    notes: ""
  });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  
  const { formatKES } = useCurrency();
  const itemsPerPage = 12;

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const closeSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (search) params.append("search", search);
      if (priceRange.min > 0) params.append("min_price", priceRange.min.toString());
      if (priceRange.max < 1000000) params.append("max_price", priceRange.max.toString());
      params.append("sort", sortBy);
      params.append("limit", itemsPerPage.toString());
      params.append("offset", ((currentPage - 1) * itemsPerPage).toString());

      const response = await fetch(`${PUBLIC_API_URL}/api/v1/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      
      const data = await response.json();
      setProducts(data.data || []);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Unable to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search, priceRange, sortBy, currentPage]);

  // Fetch market prices from FarmFuzion backend
  const fetchMarketPrices = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://farm-fuzion-backend.onrender.com/api'}/market-prices/summary?currency=KES`);
      if (response.ok) {
        const data = await response.json();
        setMarketPrices(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching market prices:", err);
    }
  };

  // Fetch stats and categories
  const fetchStatsAndCategories = async () => {
    try {
      const [statsRes, categoriesRes] = await Promise.all([
        fetch(`${PUBLIC_API_URL}/api/v1/stats`),
        fetch(`${PUBLIC_API_URL}/api/v1/categories`)
      ]);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchMarketPrices();
    fetchStatsAndCategories();
  }, [fetchProducts]);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setOrderSubmitting(true);
    try {
      const response = await fetch(`${PUBLIC_API_URL}/api/v1/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          buyer_name: orderForm.buyer_name,
          buyer_company: orderForm.buyer_company || undefined,
          buyer_email: orderForm.buyer_email,
          buyer_phone: orderForm.buyer_phone || undefined,
          buyer_country: orderForm.buyer_country,
          quantity: orderForm.quantity,
          shipping_address: orderForm.shipping_address || undefined,
          notes: orderForm.notes || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Order failed");
      }
      
      const result = await response.json();
      setOrderSuccess(`Order #${result.id.slice(0, 12)} created! Total: ${formatKES(result.total_amount)}`);
      setOrderForm({
        buyer_name: "",
        buyer_company: "",
        buyer_email: "",
        buyer_phone: "",
        buyer_country: "Kenya",
        quantity: 1,
        shipping_address: "",
        notes: ""
      });
      setTimeout(() => setOrderSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to place order. Please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setPriceRange({ min: 0, max: 1000000 });
    setSortBy("newest");
    setCurrentPage(1);
  };

  const getCertificationBadge = (certification?: string) => {
    if (!certification) return null;
    const badges: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      organic: { color: "bg-green-100 text-green-800", icon: <Leaf size={12} />, label: "Organic" },
      "fair-trade": { color: "bg-blue-100 text-blue-800", icon: <Award size={12} />, label: "Fair Trade" },
      "rainforest-alliance": { color: "bg-emerald-100 text-emerald-800", icon: <Shield size={12} />, label: "Rainforest Alliance" },
    };
    const badge = badges[certification.toLowerCase()];
    if (!badge) return null;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  // Analytics Tab - Market Prices & Trends
  const AnalyticsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">Market Intelligence</h2>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Real-time agricultural market prices and trends</p>
      </div>

      {/* Market Summary Stats - Responsive grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Products Tracked" value={stats.total_products.toString()} icon={<Package size={18} />} color="from-blue-500 to-blue-600" />
          <StatCard label="Cooperatives" value={stats.total_cooperatives.toString()} icon={<Building2 size={18} />} color="from-purple-500 to-purple-600" />
          <StatCard label="Global Orders" value={stats.total_orders.toString()} icon={<Truck size={18} />} color="from-orange-500 to-orange-600" />
          <StatCard label="Categories" value={categories.length.toString()} icon={<TrendingUp size={18} />} color="from-green-500 to-green-600" />
        </div>
      )}

      {/* Market Prices Table - Horizontal scroll on mobile */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-brand-green/10 rounded-lg">
              <DollarSign size={18} className="text-brand-green" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">Current Market Prices</h3>
              <p className="text-xs text-gray-500">Benchmark retail prices per unit</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] md:min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Price (KES/unit)</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {marketPrices.slice(0, 10).map((price, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-3 md:px-6 py-2 md:py-4 font-medium text-sm md:text-base">{price.product_name}</td>
                  <td className="px-3 md:px-6 py-2 md:py-4">
                    <span className="font-bold text-brand-green text-sm md:text-base">{formatKES(price.retail_price)}</span>
                    <span className="text-xs text-gray-500 ml-1">/{price.unit || 'kg'}</span>
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4">
                    {price.trend === 'UP' && <span className="flex items-center gap-1 text-green-600 text-sm"><ArrowUp size={12} /> +{price.weekly_change?.toFixed(1)}%</span>}
                    {price.trend === 'DOWN' && <span className="flex items-center gap-1 text-red-600 text-sm"><ArrowDown size={12} /> {price.weekly_change?.toFixed(1)}%</span>}
                    {(!price.trend || price.trend === 'STABLE') && <span className="text-gray-500 text-sm">Stable</span>}
                  </td>
                  <td className="px-3 md:px-6 py-2 md:py-4 text-gray-500 text-sm">{price.region || 'National'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Market Insights - Responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <InsightCard 
          title="Best Time to Sell" 
          icon={<TrendingUp size={18} />} 
          description="Prices typically peak during harvest season (July-September). Consider holding produce for better returns."
          color="green"
        />
        <InsightCard 
          title="Buyer's Market" 
          icon={<TrendingDown size={18} />} 
          description="Best time to buy is during peak harvest (January-March). Prices are typically 15-20% lower."
          color="orange"
        />
        <InsightCard 
          title="Market Outlook" 
          icon={<Activity size={18} />} 
          description="Stable demand expected. International buyers showing increased interest in Kenyan organic produce."
          color="blue"
        />
      </div>
    </div>
  );

  // Marketplace Tab (Products Grid)
  const MarketplaceTab = () => (
    <>
      {/* Search and Filter Bar - Stack on mobile */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 mb-6 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base" 
              />
            </div>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base"
            >
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm md:text-base"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <button 
              onClick={resetFilters} 
              className="px-3 md:px-4 py-2 text-gray-600 hover:text-gray-900 text-sm md:text-base"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid - Responsive columns */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-brand-green" /></div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-red-600">{error}</p>
          <button onClick={fetchProducts} className="mt-4 px-4 py-2 bg-brand-green text-white rounded-lg">Try Again</button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium">No products found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {products.map(product => (
              <div 
                key={product.id} 
                onClick={() => { setSelectedProduct(product); setShowDetailModal(true); }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="p-3 md:p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base md:text-lg group-hover:text-brand-green transition-colors truncate max-w-[150px] md:max-w-[200px]">
                      {product.product_name}
                    </h3>
                    {getCertificationBadge(product.certification)}
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-500">Quantity:</span>
                      <span>{product.quantity} {product.unit}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-bold text-brand-green">{formatKES(product.price_per_unit)}/{product.unit}</span>
                    </div>
                    {product.cooperative_name && (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Cooperative:</span>
                        <span className="truncate max-w-[120px] md:max-w-[150px]">{product.cooperative_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={10} />{formatDate(product.created_at)}
                    </div>
                    <button className="text-brand-green text-xs md:text-sm font-medium flex items-center gap-1">
                      View Details<ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination - Responsive */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
                className="p-1.5 md:p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs md:text-sm">Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
                className="p-1.5 md:p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );

  // Product Detail Modal - Responsive
  const ProductDetailModal = () => {
    if (!selectedProduct) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 md:p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-900 p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="pr-4">
              <h2 className="text-lg md:text-xl font-bold">{selectedProduct.product_name}</h2>
              {selectedProduct.cooperative_name && (
                <p className="text-xs md:text-sm text-gray-500">by {selectedProduct.cooperative_name}</p>
              )}
            </div>
            <button 
              onClick={() => { setShowDetailModal(false); setSelectedProduct(null); }} 
              className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
          
          <div className="p-3 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Product Info */}
              <div className="space-y-3 md:space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 md:p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Product Details</h3>
                  <div className="space-y-2 text-xs md:text-sm">
                    <div className="flex justify-between flex-wrap gap-1">
                      <span className="text-gray-500">Available:</span>
                      <span className="font-medium">{selectedProduct.quantity} {selectedProduct.unit}</span>
                    </div>
                    <div className="flex justify-between flex-wrap gap-1">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-bold text-brand-green">{formatKES(selectedProduct.price_per_unit)}/{selectedProduct.unit}</span>
                    </div>
                    <div className="flex justify-between flex-wrap gap-1">
                      <span className="text-gray-500">Total Value:</span>
                      <span>{formatKES(selectedProduct.total_price)}</span>
                    </div>
                    <div className="flex justify-between flex-wrap gap-1">
                      <span className="text-gray-500">Category:</span>
                      <span>{selectedProduct.category || "General"}</span>
                    </div>
                    <div className="flex justify-between flex-wrap gap-1">
                      <span className="text-gray-500">Listed:</span>
                      <span>{formatDate(selectedProduct.created_at)}</span>
                    </div>
                  </div>
                </div>
                {selectedProduct.description && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 md:p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 text-sm md:text-base">Description</h3>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{selectedProduct.description}</p>
                  </div>
                )}
              </div>
              
              {/* Order Form - Scrollable on mobile */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 md:p-4 rounded-lg max-h-[60vh] md:max-h-full overflow-y-auto">
                <h3 className="font-semibold mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base"><ShoppingCart size={16} /> Place Bulk Order</h3>
                {orderSuccess && <div className="mb-3 p-2 md:p-3 bg-green-100 dark:bg-green-900/20 text-green-800 rounded-lg text-xs md:text-sm">✅ {orderSuccess}</div>}
                <form onSubmit={handleOrderSubmit} className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                    <div>
                      <label className="block text-xs md:text-sm font-medium mb-1">Full Name *</label>
                      <input type="text" required value={orderForm.buyer_name} onChange={(e) => setOrderForm({ ...orderForm, buyer_name: e.target.value })}
                        className="w-full p-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium mb-1">Company</label>
                      <input type="text" value={orderForm.buyer_company} onChange={(e) => setOrderForm({ ...orderForm, buyer_company: e.target.value })}
                        className="w-full p-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="Company Name" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                    <div>
                      <label className="block text-xs md:text-sm font-medium mb-1">Email *</label>
                      <input type="email" required value={orderForm.buyer_email} onChange={(e) => setOrderForm({ ...orderForm, buyer_email: e.target.value })}
                        className="w-full p-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="buyer@example.com" />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium mb-1">Phone</label>
                      <input type="tel" value={orderForm.buyer_phone} onChange={(e) => setOrderForm({ ...orderForm, buyer_phone: e.target.value })}
                        className="w-full p-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="+254..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                    <div>
                      <label className="block text-xs md:text-sm font-medium mb-1">Country *</label>
                      <input type="text" required value={orderForm.buyer_country} onChange={(e) => setOrderForm({ ...orderForm, buyer_country: e.target.value })}
                        className="w-full p-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="Kenya" />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium mb-1">Quantity ({selectedProduct.unit}) *</label>
                      <input type="number" min="1" max={selectedProduct.quantity} required value={orderForm.quantity}
                        onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full p-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700" />
                      <p className="text-xs text-gray-500 mt-1">Max: {selectedProduct.quantity} {selectedProduct.unit}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1">Shipping Address</label>
                    <textarea value={orderForm.shipping_address} onChange={(e) => setOrderForm({ ...orderForm, shipping_address: e.target.value })}
                      rows={2} className="w-full p-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="Full delivery address" />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1">Notes</label>
                    <textarea value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                      rows={2} className="w-full p-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="Special instructions..." />
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-2 md:p-3 rounded-lg">
                    <div className="flex justify-between text-xs md:text-sm mb-1">
                      <span>Subtotal:</span>
                      <span>{formatKES(selectedProduct.price_per_unit * orderForm.quantity)}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm mb-2">
                      <span>Shipping:</span>
                      <span>To be calculated</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700 text-sm md:text-base">
                      <span>Estimated Total:</span>
                      <span className="text-brand-green">{formatKES(selectedProduct.price_per_unit * orderForm.quantity)}</span>
                    </div>
                  </div>
                  <button type="submit" disabled={orderSubmitting}
                    className="w-full bg-brand-green text-white py-2.5 md:py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base">
                    {orderSubmitting ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><ShoppingCart size={16} /> Place Order</>}
                  </button>
                  <p className="text-xs text-center text-gray-500">Payment options will be sent via email. Our team will contact you within 24 hours.</p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Insight Card Component
  const InsightCard = ({ title, icon, description, color }: { 
    title: string; 
    icon: React.ReactNode; 
    description: string; 
    color: 'green' | 'orange' | 'blue';
  }) => {
    const colorClasses: Record<'green' | 'orange' | 'blue', string> = {
      green: "from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 border-green-100 dark:border-gray-700 text-green-800 dark:text-green-300",
      orange: "from-orange-50 to-yellow-50 dark:from-gray-800 dark:to-gray-900 border-orange-100 dark:border-gray-700 text-orange-800 dark:text-orange-300",
      blue: "from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-blue-100 dark:border-gray-700 text-blue-800 dark:text-blue-300",
    };
    
    return (
      <div className={`bg-gradient-to-br ${colorClasses[color]} p-3 md:p-4 rounded-xl border`}>
        <h3 className="font-semibold mb-1 md:mb-2 flex items-center gap-1 md:gap-2 text-sm md:text-base">{icon} {title}</h3>
        <p className="text-xs md:text-sm">{description}</p>
      </div>
    );
  };

  return (
    <MainLayout>
      <ThemeToggle />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Sidebar - Fixed position on mobile */}
        <aside
          className={`${
            isSidebarOpen ? "w-64 md:w-72" : "w-20 md:w-24"
          } transition-all duration-500 ease-in-out 
            fixed md:relative z-50
            bg-brand-green/95 backdrop-blur-md
            dark:bg-gray-900/95 dark:backdrop-blur-md
            text-white flex flex-col justify-between py-6 md:py-8 px-3 md:px-4 shadow-2xl
            border-r border-white/10
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(0,0,0,0.05)_0%,_transparent_50%)]"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="transition-all duration-500">
                {isSidebarOpen ? (
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="relative">
                      <img
                        src="/Logos/FF Logo only transparent background.png"
                        alt="Farm Fuzion"
                        className="h-10 w-10 md:h-12 md:w-12 object-contain"
                      />
                    </div>
                    <span className="text-lg md:text-xl font-light text-white/90 tracking-wide">Global Market</span>
                  </div>
                ) : (
                  <div className="relative flex justify-center">
                    <img
                      src="/Logos/FF Logo only transparent background.png"
                      alt="FF"
                      className="h-10 w-10 md:h-14 md:w-14 object-contain mx-auto"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-all duration-300 backdrop-blur-sm text-white/70 hover:text-white hidden md:block"
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>

            <nav className="space-y-1">
              <NavItem 
                icon={<Globe size={isSidebarOpen ? 18 : 22} />}
                label="Marketplace"
                active={activeTab === 'marketplace'}
                onClick={() => { setActiveTab('marketplace'); closeSidebar(); }}
                collapsed={!isSidebarOpen}
              />
              <NavItem 
                icon={<BarChart3 size={isSidebarOpen ? 18 : 22} />}
                label="Market Analytics"
                active={activeTab === 'analytics'}
                onClick={() => { setActiveTab('analytics'); closeSidebar(); }}
                collapsed={!isSidebarOpen}
              />
              <NavItem 
                icon={<Bot size={isSidebarOpen ? 18 : 22} />}
                label="Mkulima Halisi"
                active={showKnowledgeModal}
                onClick={() => { setShowKnowledgeModal(true); closeSidebar(); }}
                collapsed={!isSidebarOpen}
              />
            </nav>
          </div>

          {/* Stats Card in Sidebar */}
          {stats && isSidebarOpen && (
            <div className="relative z-10 mb-3 md:mb-4 p-2 md:p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-xs text-white/70 mb-1 md:mb-2">Global Marketplace</p>
              <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span>Products:</span>
                  <span className="font-medium">{stats.total_products}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cooperatives:</span>
                  <span className="font-medium">{stats.total_cooperatives}</span>
                </div>
                <div className="flex justify-between">
                  <span>Orders:</span>
                  <span className="font-medium">{stats.total_orders}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="relative z-10">
            <button
              onClick={() => window.location.href = "/login"}
              className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                !isSidebarOpen ? 'justify-center' : ''
              } bg-white/10 hover:bg-white/20 text-white text-sm md:text-base`}
              title="Sign In"
            >
              <LogOut size={isSidebarOpen ? 18 : 20} />
              {isSidebarOpen && <span className="font-medium">Sign In</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleSidebar}
          className="fixed top-3 left-3 z-60 md:hidden text-white bg-brand-green rounded-lg p-2 shadow-lg hover:bg-green-700 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full">
          {/* Top Bar */}
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-3 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-4 ml-10 md:ml-0">
                <div className="relative">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-brand-green to-green-600 flex items-center justify-center">
                    <Globe size={16} className="md:w-5 md:h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-base md:text-xl font-bold text-gray-900 dark:text-white">Global Marketplace</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Buy directly from Kenyan cooperatives</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowKnowledgeModal(true)}
                  className="relative p-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg transition-all"
                  title="Ask Mkulima Halisi"
                >
                  <Bot size={18} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>

          <div className="p-3 md:p-6">
            {/* Hero Section - Responsive */}
            <div className="bg-gradient-to-r from-brand-green to-green-700 rounded-xl md:rounded-2xl p-4 md:p-6 text-white mb-6 md:mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white/10 rounded-full -mr-10 -mt-10 md:-mr-20 md:-mt-20"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 md:w-48 md:h-48 bg-white/10 rounded-full -ml-8 -mb-8 md:-ml-16 md:-mb-16"></div>
              <div className="relative z-10">
                <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">FarmFuzion Global Agro-Marketplace</h1>
                <p className="text-sm md:text-base text-white/90 max-w-2xl">
                  Connect directly with Kenyan cooperatives. Buy fresh produce, grains, and agricultural products in bulk.
                </p>
                <div className="flex flex-wrap gap-2 md:gap-3 mt-3 md:mt-4">
                  <div className="flex items-center gap-1 md:gap-2 bg-white/20 rounded-full px-2 py-1 md:px-3 md:py-1.5">
                    <Leaf size={12} className="md:w-4 md:h-4" /><span className="text-xs md:text-sm">Certified Organic</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 bg-white/20 rounded-full px-2 py-1 md:px-3 md:py-1.5">
                    <Truck size={12} className="md:w-4 md:h-4" /><span className="text-xs md:text-sm">Bulk Shipping</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 bg-white/20 rounded-full px-2 py-1 md:px-3 md:py-1.5">
                    <Shield size={12} className="md:w-4 md:h-4" /><span className="text-xs md:text-sm">Verified Suppliers</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'marketplace' ? <MarketplaceTab /> : <AnalyticsTab />}

            {/* Trust Badges */}
            <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                <div className="flex items-center gap-1 md:gap-2 text-gray-500 text-xs md:text-sm"><Shield size={16} /><span>Secure Transactions</span></div>
                <div className="flex items-center gap-1 md:gap-2 text-gray-500 text-xs md:text-sm"><CreditCard size={16} /><span>Multiple Payment Options</span></div>
                <div className="flex items-center gap-1 md:gap-2 text-gray-500 text-xs md:text-sm"><Truck size={16} /><span>Global Shipping</span></div>
                <div className="flex items-center gap-1 md:gap-2 text-gray-500 text-xs md:text-sm"><Users size={16} /><span>Direct from Cooperatives</span></div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showDetailModal && <ProductDetailModal />}

      {/* Knowledge Modal - Mkulima Halisi Assistant (No Login Required) */}
      {showKnowledgeModal && (
        <KnowledgeModal
          farmerId={user?.id || 'guest'}  // Use 'guest' for non-logged-in users
          farmerName={user?.first_name || 'Guest Farmer'}
          onClose={() => setShowKnowledgeModal(false)}
        />
      )}

      {/* If user not logged in, show simplified version */}
      {showKnowledgeModal && !user && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md p-6">
            <div className="text-center mb-4">
              <Bot size={48} className="mx-auto text-brand-green mb-3" />
              <h3 className="text-xl font-bold mb-2">Welcome to Mkulima Halisi!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to chat with our AI farming assistant. Get personalized advice on crops, market prices, and farming tips.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowKnowledgeModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => window.location.href = "/login"}
                className="flex-1 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

// ==================== Subcomponents ====================

function NavItem({ icon, label, active = false, onClick, collapsed }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-white/15 text-white' 
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <span className={active ? 'text-white' : 'text-white/70'}>{icon}</span>
      {!collapsed && <span className="text-xs md:text-sm font-light tracking-wide">{label}</span>}
    </button>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className={`bg-gradient-to-r ${color} rounded-lg md:rounded-xl p-3 md:p-4 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs opacity-90">{label}</p>
          <p className="text-lg md:text-2xl font-bold">{value}</p>
        </div>
        <div className="p-1.5 md:p-2 bg-white/20 rounded-lg">{icon}</div>
      </div>
    </div>
  );
}
