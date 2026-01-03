// farm-fuzion-frontend/src/components/Markets/MarketPricesModal.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  marketPricesApi,
  MarketPrice,
  API_BASE,
  getMarketDashboard,
} from "../../services/marketPricesApi";
import { formatCurrency } from "../../utils/format";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Globe,
  Plus,
  Edit,
  Trash2,
  X,
  Package,
  ShoppingCart
} from "lucide-react";
import { marketplaceApi, ShoppingCart as ShoppingCartType, MarketplaceOrder, MarketplaceProduct } from "../../services/marketplaceApi";
import { formatCurrencyKES } from "../../utils/format";

interface MarketPricesModalProps {
  farmerId?: string;
  onClose: () => void;
  onMarketAdded?: () => Promise<void> | void;
}

type TabType = "dashboard" | "market" | "add" | "insights" | "marketplace" | "cart" | "orders";

export default function MarketPricesModal({
  farmerId,
  onClose,
  onMarketAdded,
}: MarketPricesModalProps) {
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabType>("dashboard");
  
  // Summary data
  const [summary, setSummary] = useState<MarketPrice[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<'KES' | 'USD' | 'UGX' | 'TZS'>('KES');
  
  // Add/Edit Form
  const [formData, setFormData] = useState<Partial<MarketPrice>>({
    product_name: "",
    category: "",
    region: "",
    retail_price: 0,
    farmgate_price: 0,
    unit: `${selectedCurrency}/kg`,
    benchmark: false,
  });
  const [editingId, setEditingId] = useState<string | number | null>(null);

  // Load data based on tab
  const loadData = async () => {
    setLoading(true);
    try {
      if (currentTab === "dashboard" || currentTab === "market") {
        // Load summary data
        let res = await marketPricesApi.getSummary(selectedCurrency);

        // Apply filters
        if (searchTerm) {
          res = res.filter((p) =>
            p.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        if (filterCategory) {
          res = res.filter((p) => p.category === filterCategory);
        }
        if (filterRegion) {
          res = res.filter((p) => p.region === filterRegion);
        }
        
        setSummary(res);

        // Load dashboard insights for dashboard tab
        if (currentTab === "dashboard") {
          const dashboardRes = await fetch(`${API_BASE}/market-prices/dashboard?limit=8`);
          if (dashboardRes.ok) {
            const dashboardJson = await dashboardRes.json();
            setDashboardData(dashboardJson);
          }
        }
      }
    } catch (err) {
      console.error("Error loading market data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTab, searchTerm, filterCategory, filterRegion, selectedCurrency]);

  // Calculate market metrics
  const marketMetrics = useMemo(() => {
    if (summary.length === 0) return null;
    
    const prices = summary.map(p => p.retail_price || 0).filter(p => p > 0);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const volatileProducts = summary.filter(p => {
      const volatility = p.volatility?.toLowerCase();
      return volatility === 'high' || volatility === 'medium' || volatility === 'volatile';
    }).length;

    return {
      avgPrice,
      maxPrice,
      minPrice,
      volatileProducts,
      totalProducts: summary.length,
      priceRange: maxPrice - minPrice,
    };
  }, [summary]);

  // Dynamic filter values
  const categories = useMemo(
    () => Array.from(new Set(summary.map((p) => p.category).filter(Boolean) ?? [])),
    [summary]
  );

  const regions = useMemo(
    () =>
      Array.from(new Set(
        summary
          .map((p) => p.region)
          .filter(Boolean)  // Filter out null/undefined here too
      )),
    [summary]
  );

  // Form submission
  const handleSubmit = async () => {
    if (!formData.product_name || !formData.retail_price) {
      alert("Please fill in required fields");
      return;
    }

    try {
      if (editingId) {
        await marketPricesApi.update(editingId, formData);
        alert("Market price updated successfully!");
      } else {
        await marketPricesApi.add(formData as Omit<MarketPrice, "id">);
        alert("Market price added successfully!");
      }
      
      // Reset form
      setFormData({
        product_name: "",
        category: "",
        region: "",
        retail_price: 0,
        farmgate_price: 0,
        unit: `${selectedCurrency}/kg`,
        benchmark: false,
      });
      setEditingId(null);
      
      // Refresh data
      loadData();
      if (onMarketAdded) onMarketAdded();
    } catch (err) {
      alert("Error saving market price");
      console.error(err);
    }
  };

  // Handle edit
  const handleEdit = (price: MarketPrice) => {
    setFormData(price);
    setEditingId(price.id!);
    setCurrentTab("add");
  };

  // Handle delete
  const handleDelete = async (id: string | number) => {
    if (confirm("Are you sure you want to delete this market price?")) {
      try {
        await marketPricesApi.remove(id);
        alert("Market price deleted successfully!");
        loadData();
      } catch (err) {
        alert("Error deleting market price");
        console.error(err);
      }
    }
  };

  // Render Dashboard Tab
  const renderDashboard = () => (
    <>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-brand-dark dark:text-brand-apple">
              Market Intelligence Dashboard
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Real-time agricultural market insights
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
              <Globe size={16} className="text-gray-500" />
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as any)}
                className="bg-transparent text-sm focus:outline-none"
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="UGX">UGX</option>
                <option value="TZS">TZS</option>
              </select>
            </div>
            
            <button
              onClick={loadData}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              disabled={loading}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        {marketMetrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BarChart3 className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg Price</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {formatCurrency(marketMetrics.avgPrice, selectedCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Highest</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {formatCurrency(marketMetrics.maxPrice, selectedCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Lowest</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {formatCurrency(marketMetrics.minPrice, selectedCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Volatile</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {marketMetrics.volatileProducts}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Insights */}
        {dashboardData && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-green-100 dark:border-gray-700">
              <h3 className="font-bold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                <TrendingUp size={18} />
                Best Opportunities
              </h3>
              <div className="space-y-2">
                {dashboardData.summary
                  ?.filter((item: any) => item.action_recommendation?.includes('sell'))
                  .slice(0, 3)
                  .map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                      <span className="font-medium">{item.product}</span>
                      <span className="text-green-600 dark:text-green-400 font-bold">
                        {formatCurrency(item.retail_price, selectedCurrency)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-yellow-100 dark:border-gray-700">
              <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
                <AlertTriangle size={18} />
                Price Alerts
              </h3>
              <div className="space-y-2">
                {dashboardData.summary
                  ?.filter((item: any) => item.trend === 'UP' && Math.abs(item.weekly_change) > 5)
                  .slice(0, 3)
                  .map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded">
                      <span className="font-medium">{item.product}</span>
                      <span className="text-green-600 font-bold">
                        +{item.weekly_change}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-blue-100 dark:border-gray-700">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Calendar size={18} />
                Market Timing
              </h3>
              <div className="space-y-3">
                <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Best to Buy</p>
                  <p className="font-bold text-lg text-blue-700 dark:text-blue-300">
                    {dashboardData.market_overview?.best_buy_product || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Render Market Prices Tab
  const renderMarketPrices = () => (
    <>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-brand-dark dark:text-brand-apple">
              Market Prices
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Current market prices and trends
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
              <Globe size={16} className="text-gray-500" />
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as any)}
                className="bg-transparent text-sm focus:outline-none"
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="UGX">UGX</option>
                <option value="TZS">TZS</option>
              </select>
            </div>
            
            <button
              onClick={loadData}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              disabled={loading}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Search size={20} />
              <span className="font-medium">Filters</span>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent w-full md:w-64"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.filter((cat): cat is string => Boolean(cat)).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
              >
                <option value="">All Regions</option>
                {regions.filter((r): r is string => Boolean(r)).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
          </div>
        ) : summary.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <BarChart3 className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              No market data found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your filters or add new market prices
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Prices ({selectedCurrency})
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {summary.map((p) => {
                    const priceChange = dashboardData?.summary?.find(
                      (item: any) => item.product === p.product_name
                    )?.weekly_change || 0;
                    
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {p.product_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {p.category} • {p.region} • {p.unit?.replace('$/kg', `${selectedCurrency}/kg`) || `${selectedCurrency}/kg`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex justify-between gap-4">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Retail:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCurrency(p.retail_price ?? null, selectedCurrency)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Farmgate:</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {formatCurrency(p.farmgate_price ?? null, selectedCurrency)}
                              </span>
                            </div>
                            {priceChange !== 0 && (
                              <div className="flex justify-between gap-4">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Weekly:</span>
                                <span className={`font-medium ${priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(p)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id!)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Render Add/Edit Tab
  const renderAddEdit = () => (
    <div className="mb-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-brand-dark dark:text-brand-apple">
          {editingId ? 'Edit Market Price' : 'Add New Market Price'}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          {editingId ? 'Update existing market price information' : 'Add new market price data'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.product_name || ''}
              onChange={(e) => setFormData({...formData, product_name: e.target.value})}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-transparent"
              placeholder="e.g., Tomatoes, Maize"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category || ''}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-transparent"
              placeholder="e.g., Vegetables, Grains"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Region
            </label>
            <input
              type="text"
              value={formData.region || ''}
              onChange={(e) => setFormData({...formData, region: e.target.value})}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-transparent"
              placeholder="e.g., Nairobi, Central"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unit
            </label>
            <select
              value={formData.unit || `${selectedCurrency}/kg`}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-transparent"
            >
              <option value={`${selectedCurrency}/kg`}>{selectedCurrency}/kg</option>
              <option value={`${selectedCurrency}/bag`}>{selectedCurrency}/bag</option>
              <option value={`${selectedCurrency}/ton`}>{selectedCurrency}/ton</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Retail Price ({selectedCurrency}) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.retail_price || ''}
              onChange={(e) => setFormData({...formData, retail_price: parseFloat(e.target.value)})}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Farmgate Price ({selectedCurrency})
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.farmgate_price || ''}
              onChange={(e) => setFormData({...formData, farmgate_price: parseFloat(e.target.value)})}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-transparent"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="benchmark"
            checked={formData.benchmark || false}
            onChange={(e) => setFormData({...formData, benchmark: e.target.checked})}
            className="rounded"
          />
          <label htmlFor="benchmark" className="text-sm text-gray-700 dark:text-gray-300">
            Mark as benchmark price
          </label>
        </div>
      </div>
    </div>
  );

  // Render AI Insights Tab
  const renderInsights = () => (
    <div className="mb-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-brand-dark dark:text-brand-apple">
          AI Market Insights
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Advanced market analysis and predictions
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-purple-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="text-purple-600 dark:text-purple-400" size={24} />
          <h4 className="text-lg font-bold text-purple-800 dark:text-purple-300">
            Predictive Analytics
          </h4>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Market Trend Prediction</p>
            <p className="font-medium text-gray-800 dark:text-white">
              {dashboardData?.market_overview?.overall_trend === 'BULLISH' ? '📈 Bullish market expected in next 30 days' :
               dashboardData?.market_overview?.overall_trend === 'BEARISH' ? '📉 Bearish trends detected' :
               '⚡ Market remains stable'}
            </p>
          </div>

          <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Best Trading Strategy</p>
            <p className="font-medium text-gray-800 dark:text-white">
              {dashboardData?.market_overview?.best_sell_product ? 
                `Consider selling ${dashboardData.market_overview.best_sell_product} for optimal returns` :
                'Hold positions for now'}
            </p>
          </div>

          <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Risk Assessment</p>
            <p className="font-medium text-gray-800 dark:text-white">
              {marketMetrics?.volatileProducts && marketMetrics.volatileProducts > 5 ? 
                `⚠️ High volatility detected in ${marketMetrics.volatileProducts} products` :
                '✅ Market volatility within normal range'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render marketplace tab
  const renderMarketplace = () => {
    const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([]);
    const [marketplaceLoading, setMarketplaceLoading] = useState(false);
    const [marketplaceFilters, setMarketplaceFilters] = useState({
      category: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      sort: 'newest',
      search: '',
    });

    // Load marketplace products
    const loadMarketplaceProducts = async () => {
      setMarketplaceLoading(true);
      try {
        const response = await marketplaceApi.getProducts({
          ...marketplaceFilters,
          category: marketplaceFilters.category || undefined,
          minPrice: marketplaceFilters.minPrice ? parseFloat(marketplaceFilters.minPrice) : undefined,
          maxPrice: marketplaceFilters.maxPrice ? parseFloat(marketplaceFilters.maxPrice) : undefined,
          location: marketplaceFilters.location || undefined,
          status: 'available',
          sort: marketplaceFilters.sort,
          search: marketplaceFilters.search || undefined,
          limit: 20,
        });
        setMarketplaceProducts(response.data || []);
      } catch (error) {
        console.error("Error loading marketplace products:", error);
      } finally {
        setMarketplaceLoading(false);
      }
    };

    // Add to cart function
    const handleAddToCart = async (product: MarketplaceProduct) => {
      if (!farmerId) {
        alert("Please login to add items to cart");
        return;
      }

      try {
        await marketplaceApi.addToCart({
          marketplace_product_id: product.id,
          quantity: 1,
          buyer_id: farmerId,
        });
        alert("Added to cart!");
      } catch (error) {
        console.error("Error adding to cart:", error);
        alert("Failed to add to cart");
      }
    };

    useEffect(() => {
      if (currentTab === "marketplace") {
        loadMarketplaceProducts();
      }
    }, [currentTab, marketplaceFilters]);

    return (
      <div className="mb-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-brand-dark dark:text-brand-apple">
            FarmFuzion Marketplace
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Buy and sell farm products directly with other farmers
          </p>
        </div>

        {/* Marketplace Filters */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={marketplaceFilters.search}
              onChange={(e) => setMarketplaceFilters({...marketplaceFilters, search: e.target.value})}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
            />
            <select
              value={marketplaceFilters.category}
              onChange={(e) => setMarketplaceFilters({...marketplaceFilters, category: e.target.value})}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
            >
              <option value="">All Categories</option>
              <option value="produce">Produce</option>
              <option value="inputs">Farm Inputs</option>
              <option value="services">Services</option>
            </select>
            <select
              value={marketplaceFilters.sort}
              onChange={(e) => setMarketplaceFilters({...marketplaceFilters, sort: e.target.value})}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
            <button
              onClick={loadMarketplaceProducts}
              className="bg-brand-green hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Marketplace Products Grid */}
        {marketplaceLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
          </div>
        ) : marketplaceProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ShoppingCart className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              No products available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Be the first to list your products!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketplaceProducts.map((product) => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                      {product.product_name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      By {product.first_name} {product.last_name}
                    </p>
                  </div>
                  <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-sm font-medium px-2 py-1 rounded">
                    {formatCurrencyKES(product.price)}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Quantity:</span>
                    <span className="font-medium">{product.quantity} {product.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Location:</span>
                    <span className="font-medium">{product.location || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Rating:</span>
                    <span className="font-medium">{product.rating.toFixed(1)} ⭐</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full bg-brand-green hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ... (after renderMarketplace function)

  // Render Cart Tab
  const renderCart = () => {
    const [cartData, setCartData] = useState<ShoppingCartType[]>([]);
    const [cartLoading, setCartLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

    const loadCart = async () => {
      if (!farmerId) return;
      
      setCartLoading(true);
      try {
        const response = await marketplaceApi.getCart(farmerId);
        setCartData(response.carts || []);
      } catch (error) {
        console.error("Error loading cart:", error);
      } finally {
        setCartLoading(false);
      }
    };

    const handleCheckout = async (cartId: string) => {
      if (!farmerId) {
        alert("Please login to checkout");
        return;
      }

      setCheckoutLoading(cartId);
      try {
        const result = await marketplaceApi.checkout({
          cart_id: cartId,
          buyer_id: farmerId,
          payment_method: "wallet",
          notes: "Order from FarmFuzion Marketplace",
        });
        
        alert(`Order ${result.order_number} created successfully! Total: ${formatCurrencyKES(result.total_amount)}`);
        
        // Refresh cart data
        loadCart();
        
        // Navigate to orders tab
        setCurrentTab("orders");
      } catch (error: any) {
        console.error("Checkout error:", error);
        alert(error.response?.data?.error || "Checkout failed. Please try again.");
      } finally {
        setCheckoutLoading(null);
      }
    };

    const handleRemoveItem = async (itemId: string) => {
      if (!farmerId) return;
      
      if (confirm("Remove this item from cart?")) {
        try {
          await marketplaceApi.removeCartItem(itemId, farmerId);
          loadCart(); // Refresh cart
        } catch (error) {
          console.error("Error removing item:", error);
          alert("Failed to remove item");
        }
      }
    };

    useEffect(() => {
      if (currentTab === "cart" && farmerId) {
        loadCart();
      }
    }, [currentTab, farmerId]);

    if (!farmerId) {
      return (
        <div className="mb-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ShoppingCart className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Please Sign In
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You need to be logged in to view your shopping cart
            </p>
            <button
              onClick={() => setCurrentTab("marketplace")}
              className="bg-brand-green hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Browse Products
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-brand-dark dark:text-brand-apple">
            🛍️ My Shopping Cart
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Review and checkout your selected items
          </p>
        </div>

        {cartLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
          </div>
        ) : cartData.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ShoppingCart className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Add some products from the marketplace to get started
            </p>
            <button
              onClick={() => setCurrentTab("marketplace")}
              className="bg-brand-green hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {cartData.map((cart) => (
              <div key={cart.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Cart Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                        Order from {cart.seller?.first_name} {cart.seller?.last_name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {cart.seller?.mobile ? `Contact: ${cart.seller.mobile}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-brand-green dark:text-brand-apple">
                        {formatCurrencyKES(cart.total)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Total for {cart.items.length} item{cart.items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cart Items */}
                <div className="p-4">
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 dark:text-white">
                                {item.product_name}
                              </h5>
                              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span>{item.quantity} × {formatCurrencyKES(item.unit_price)}</span>
                                <span>Total: {formatCurrencyKES(item.item_total)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 ml-4"
                          title="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Cart Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Items will be reserved for 24 hours after checkout
                    </div>
                    <button
                      onClick={() => handleCheckout(cart.id)}
                      disabled={checkoutLoading === cart.id}
                      className="bg-brand-green hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {checkoutLoading === cart.id ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={18} />
                          Checkout Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Cart Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl border border-blue-100 dark:border-gray-700">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="font-bold text-lg text-blue-800 dark:text-blue-300">
                    💰 Payment Information
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Payments are processed securely through FarmFuzion Wallet
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrencyKES(cartData.reduce((sum, cart) => sum + cart.total, 0))}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total across all carts
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Payment Method</div>
                  <div className="font-medium">FarmFuzion Wallet</div>
                </div>
                <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Escrow Protection</div>
                  <div className="font-medium text-green-600">✅ Active</div>
                </div>
                <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Delivery</div>
                  <div className="font-medium">Arrange with Seller</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Orders Tab
  const renderOrders = () => {
    const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
    const [statusFilter, setStatusFilter] = useState('');

    const loadOrders = async () => {
      if (!farmerId) return;
      
      setOrdersLoading(true);
      try {
        let response;
        if (activeTab === 'buyer') {
          response = await marketplaceApi.getBuyerOrders(farmerId, { 
            status: statusFilter || undefined 
          });
        } else {
          response = await marketplaceApi.getSellerOrders(farmerId, { 
            status: statusFilter || undefined 
          });
        }
        setOrders(response.data || []);
      } catch (error) {
        console.error("Error loading orders:", error);
      } finally {
        setOrdersLoading(false);
      }
    };

    const handleUpdateStatus = async (orderId: string, status: string) => {
      if (!farmerId) return;
      
      if (confirm(`Update order status to "${status}"?`)) {
        try {
          await marketplaceApi.updateOrderStatus(orderId, {
            status,
            farmer_id: farmerId,
          });
          loadOrders(); // Refresh orders
          alert("Order status updated successfully!");
        } catch (error) {
          console.error("Error updating order:", error);
          alert("Failed to update order status");
        }
      }
    };

    const handlePayment = async (orderId: string) => {
      if (!farmerId) return;
      
      try {
        await marketplaceApi.processPayment(orderId, {
          payment_method: "wallet",
          buyer_id: farmerId,
        });
        alert("Payment processed successfully!");
        loadOrders(); // Refresh orders
      } catch (error) {
        console.error("Payment error:", error);
        alert("Payment failed");
      }
    };

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'shipping': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      }
    };

    const getPaymentStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      }
    };

    useEffect(() => {
      if (currentTab === "orders" && farmerId) {
        loadOrders();
      }
    }, [currentTab, farmerId, activeTab, statusFilter]);

    if (!farmerId) {
      return (
        <div className="mb-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Package className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Please Sign In
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You need to be logged in to view your orders
            </p>
            <button
              onClick={() => setCurrentTab("marketplace")}
              className="bg-brand-green hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Browse Products
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-brand-dark dark:text-brand-apple">
                📦 My Orders
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Track and manage your marketplace orders
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCurrentTab("marketplace")}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>

        {/* Order Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('buyer')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'buyer'
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              👤 My Purchases
            </button>
            <button
              onClick={() => setActiveTab('seller')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'seller'
                  ? 'border-brand-green text-brand-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              🏪 My Sales
            </button>
          </div>

          {/* Filter Bar */}
          <div className="mt-4 flex flex-wrap gap-4 items-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Filter by status:
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipping">Shipping</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={loadOrders}
              className="bg-brand-green hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Package className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              No orders found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {activeTab === 'buyer' 
                ? "You haven't placed any orders yet"
                : "You haven't received any orders yet"}
            </p>
            <button
              onClick={() => setCurrentTab("marketplace")}
              className="bg-brand-green hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Order Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                          Order #{order.order_number}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                          Payment: {order.payment_status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {activeTab === 'buyer' 
                          ? `Seller: ${order.seller_first_name} ${order.seller_last_name}`
                          : `Buyer: ${order.buyer_first_name} ${order.buyer_last_name}`}
                        <span className="mx-2">•</span>
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-brand-green dark:text-brand-apple">
                        {formatCurrencyKES(order.total_amount)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {order.payment_method === 'wallet' ? 'Paid via Wallet' : `Paid via ${order.payment_method}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-3 mb-4">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-brand-green/10 flex items-center justify-center">
                            <Package size={18} className="text-brand-green" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.product_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.quantity} × {formatCurrencyKES(item.unit_price)}
                            </div>
                          </div>
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatCurrencyKES(item.total_price)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Actions */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {order.notes && (
                          <>
                            <span className="font-medium">Note:</span> {order.notes}
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {activeTab === 'seller' && order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                            >
                              Confirm Order
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                            >
                              Cancel Order
                            </button>
                          </>
                        )}
                        
                        {activeTab === 'seller' && order.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'shipping')}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            Mark as Shipping
                          </button>
                        )}
                        
                        {activeTab === 'seller' && order.status === 'shipping' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            Mark as Delivered
                          </button>
                        )}
                        
                        {activeTab === 'buyer' && order.payment_status === 'pending' && (
                          <button
                            onClick={() => handlePayment(order.id)}
                            className="bg-brand-green hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            Pay Now
                          </button>
                        )}
                        
                        {order.status === 'delivered' && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render current tab content
  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard": return renderDashboard();
      case "market": return renderMarketPrices();
      case "add": return renderAddEdit();
      case "insights": return renderInsights();
      case "marketplace": return renderMarketplace();
      case "cart": return renderCart();
      case "orders": return renderOrders();
      default: return renderDashboard();
    }
  };
  
  // Check if submit button should be enabled
  const isSubmitDisabled = currentTab === "add" && (!formData.product_name || !formData.retail_price);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-brand-dark rounded-lg w-[95%] max-w-6xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-green dark:text-brand-apple">
            🛒 Market Intelligence
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:underline">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: "dashboard", label: "Dashboard", icon: "📊" },
              { key: "market", label: "Market Prices", icon: "💰" },
              { key: "marketplace", label: "Marketplace", icon: "🛒" },
              { key: "cart", label: "My Cart", icon: "🛍️" },
              { key: "orders", label: "Orders", icon: "📦" },
              { key: "add", label: editingId ? "Edit Price" : "Add Price", icon: editingId ? "✏️" : "➕" },
              { key: "insights", label: "AI Insights", icon: "🤖" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  if (tab.key === "add") {
                    setFormData({
                      product_name: "",
                      category: "",
                      region: "",
                      retail_price: 0,
                      farmgate_price: 0,
                      unit: `${selectedCurrency}/kg`,
                      benchmark: false,
                    });
                    setEditingId(null);
                  }
                  setCurrentTab(tab.key as TabType);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
                  currentTab === tab.key
                    ? "bg-brand-green text-white shadow-lg"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          
          {currentTab === "add" ? (
            <button
              onClick={handleSubmit}
              className="bg-brand-green hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitDisabled || loading}
            >
              {loading ? "Saving..." : editingId ? "Update Price" : "Add Price"}
            </button>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {summary.length} products • Currency: {selectedCurrency}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
