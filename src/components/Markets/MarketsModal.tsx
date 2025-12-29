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
} from "lucide-react";

interface MarketPricesModalProps {
  farmerId?: string;
  onClose: () => void;
  onMarketAdded?: () => Promise<void> | void;
}

type TabType = "dashboard" | "market" | "add" | "insights";

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

  // Render current tab content
  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard": return renderDashboard();
      case "market": return renderMarketPrices();
      case "add": return renderAddEdit();
      case "insights": return renderInsights();
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
