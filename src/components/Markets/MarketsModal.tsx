// src/components/Markets/MarketsModal.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  marketPricesApi,
  MarketPrice as ApiMarketPrice,
  PaginatedResponse,
} from "../../services/marketPricesApi";
import { Edit, Plus, X, TrendingUp, TrendingDown, Calendar, AlertCircle, BarChart3, Search } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrencyKES } from "../../utils/format";

// ✅ Extend MarketPrice for frontend
export type MarketPrice = ApiMarketPrice & { id?: string | number };

interface MarketsModalProps {
  onClose: () => void;
  onMarketAdded: () => void;
  price?: MarketPrice;
  mode?: "add" | "edit" | "inventory";
}

export default function MarketsModal({
  onClose,
  onMarketAdded,
  price,
  mode = "inventory",
}: MarketsModalProps) {
  const [form, setForm] = useState<Partial<MarketPrice>>({
    product_name: "",
    category: "",
    unit: "",
    wholesale_price: null,
    retail_price: null,
    broker_price: null,
    farmgate_price: null,
    region: "",
    source: "",
    collected_at: new Date().toISOString(),
    benchmark: false,
    volatility: "stable",
    last_synced: new Date().toISOString(),
  });

  const [loading, setLoading] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "details" | "pricing" | "inventory" | "historical" | "intel"
  >(mode === "add" || mode === "edit" ? "details" : "inventory");

  // ✅ Inventory state
  const [inventory, setInventory] =
    useState<PaginatedResponse<MarketPrice> | null>(null);

  // ✅ Historical data
  const [history, setHistory] = useState<MarketPrice[]>([]);

  // ✅ Pagination + filters
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState("");

  // ✅ Refresh key
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // 🧠 Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // ✅ Intelligence data
  const [intelligenceData, setIntelligenceData] = useState<any>(null);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);

  // ✅ Modal animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // ✅ Pre-fill form if editing
  useEffect(() => {
    if (price) {
      setForm({
        ...price,
        wholesale_price: price.wholesale_price ?? null,
        retail_price: price.retail_price ?? null,
        broker_price: price.broker_price ?? null,
        farmgate_price: price.farmgate_price ?? null,
        benchmark: price.benchmark ?? false,
        volatility: price.volatility ?? "stable",
        last_synced: price.last_synced ?? new Date().toISOString(),
      });
      
      loadHistory(price.product_name);
      setActiveTab("historical");
    }
  }, [price]);

  // ✅ Load paginated inventory
  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const data = await marketPricesApi.getAll(currentPage, itemsPerPage, {
        product: debouncedSearch || undefined,
        region: filterRegion || undefined,
      });
      setInventory(data);
    } catch (err) {
      console.error("Error loading market prices:", err);
    } finally {
      setLoadingInventory(false);
    }
  };

  // ✅ Load full history
  const loadHistory = async (productName: string) => {
    try {
      const all = await marketPricesApi.getAll(1, 500, {
        product: productName.trim(),
      });
      setHistory(all.data);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  // ✅ Fetch intelligence
  const fetchIntelligence = async () => {
    if (!form.product_name) return;
    
    setLoadingIntelligence(true);
    try {
      const response = await fetch(
        `/api/market-prices/intelligence/${encodeURIComponent(form.product_name)}`
      );
      const data = await response.json();
      setIntelligenceData(data);
    } catch (error) {
      console.error('Failed to fetch intelligence:', error);
    } finally {
      setLoadingIntelligence(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "inventory") return;
    loadInventory();
  }, [activeTab, refreshKey, currentPage, debouncedSearch, filterRegion]);

  useEffect(() => {
    if (activeTab === "historical" && form.product_name) {
      loadHistory(form.product_name);
    }
  }, [activeTab, form.product_name]);

  // ✅ Historical data sorted
  const historicalData = useMemo(() => {
    if (!history.length) return [];
    return [...history].sort(
      (a, b) =>
        new Date(a.collected_at ?? "").getTime() -
        new Date(b.collected_at ?? "").getTime()
    );
  }, [history]);

  // ✅ Save with animation
  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = { ...form } as MarketPrice;

      if (price?.id || form.id) {
        await marketPricesApi.update(String(price?.id || form.id), payload);
      } else {
        await marketPricesApi.add(payload);
      }

      onMarketAdded();
      triggerRefresh();
      setActiveTab("inventory");
    } catch (err) {
      console.error("Error saving market price:", err);
      alert("⚠️ Failed to save market price. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Edit from inventory
  const handleEditFromInventory = (p: MarketPrice) => {
    setForm(p);
    setActiveTab("details");
  };

  // ✅ Add new
  const handleAddNew = () => {
    setForm({
      product_name: "",
      category: "",
      unit: "",
      wholesale_price: null,
      retail_price: null,
      broker_price: null,
      farmgate_price: null,
      region: "",
      source: "",
      collected_at: new Date().toISOString(),
      benchmark: false,
      volatility: "stable",
      last_synced: new Date().toISOString(),
    });
    setActiveTab("details");
  };

  // ✅ Close with animation
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const modalTitle =
    activeTab === "inventory"
      ? "Market Prices"
      : form.id || price?.id
      ? "Edit Market Price"
      : "Add Market Price";

  const totalPages = Math.ceil((inventory?.total ?? 0) / itemsPerPage);

  // Tab content with animation
  const TabContent = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <div 
      className="animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div 
        className={`bg-white dark:bg-brand-dark p-6 rounded-lg shadow-lg max-w-5xl w-full transform transition-all duration-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center">
              <BarChart3 className="text-brand-green dark:text-brand-apple" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-dark dark:text-brand-apple">
                {modalTitle}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeTab === 'intel' ? 'AI-Powered Market Intelligence' : 
                 activeTab === 'historical' ? 'Price History & Trends' :
                 activeTab === 'inventory' ? 'Browse Market Prices' : 'Edit Product Details'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeTab === "inventory" && (
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 bg-brand-green hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 card-hover"
              >
                <Plus size={16} /> Add Price
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-300"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        {activeTab !== "inventory" && (
          <div className="flex border-b mb-6 overflow-x-auto">
            {["details", "pricing", "historical", "intel"].map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium capitalize whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab
                    ? "border-b-2 border-brand-green text-brand-green bg-brand-green/5"
                    : "text-gray-500 hover:text-brand-green hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {tab === 'details' && '📝'}
                {tab === 'pricing' && '💰'}
                {tab === 'historical' && '📊'}
                {tab === 'intel' && '🧠'}
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin pr-2">
          {/* Details Tab */}
          {activeTab === "details" && (
            <TabContent delay={100}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-lg transition-all duration-300 focus:ring-2 focus:ring-brand-green focus:border-transparent"
                    value={form.product_name ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, product_name: e.target.value })
                    }
                    placeholder="e.g., Coffee Arabica"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-lg transition-all duration-300 focus:ring-2 focus:ring-brand-green focus:border-transparent"
                    value={form.category ?? ""}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g., Beverages"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-lg transition-all duration-300 focus:ring-2 focus:ring-brand-green focus:border-transparent"
                    value={form.unit ?? ""}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="e.g., kg, lb, tonne"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Region</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-lg transition-all duration-300 focus:ring-2 focus:ring-brand-green focus:border-transparent"
                    value={form.region ?? ""}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    placeholder="e.g., Global, East Africa"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-lg transition-all duration-300 focus:ring-2 focus:ring-brand-green focus:border-transparent"
                    value={form.source ?? ""}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    placeholder="e.g., WorldBank, Local Market"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Benchmark Price</label>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      id="benchmark"
                      checked={!!form.benchmark}
                      onChange={(e) =>
                        setForm({ ...form, benchmark: e.target.checked })
                      }
                      className="w-4 h-4 text-brand-green rounded focus:ring-brand-green"
                    />
                    <label htmlFor="benchmark" className="text-sm">
                      Mark as benchmark price (used for calculations)
                    </label>
                  </div>
                </div>
              </div>
            </TabContent>
          )}

          {/* Pricing Tab */}
          {activeTab === "pricing" && (
            <TabContent delay={100}>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-blue-600" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    All prices are in Kenyan Shillings (KES). Farmgate price is what farmers receive.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "wholesale_price", label: "Wholesale Price", icon: "🏪" },
                  { key: "retail_price", label: "Retail Price", icon: "🛒" },
                  { key: "broker_price", label: "Broker Price", icon: "🤝" },
                  { key: "farmgate_price", label: "Farmgate Price", icon: "👨‍🌾" },
                ].map(({ key, label, icon }) => (
                  <div key={key} className="space-y-2 card-hover p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <label className="text-sm font-medium">{label} (KES)</label>
                    </div>
                    <input
                      type="number"
                      className="w-full p-3 border rounded-lg text-lg font-medium transition-all duration-300 focus:ring-2 focus:ring-brand-green focus:border-transparent"
                      value={
                        typeof form[key as keyof MarketPrice] === "number"
                          ? (form[key as keyof MarketPrice] as number)
                          : ""
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [key]: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500">
                      {key === 'farmgate_price' ? 'Price paid directly to farmers' :
                       key === 'wholesale_price' ? 'Bulk price for retailers' :
                       key === 'retail_price' ? 'Consumer market price' :
                       'Broker commission price'}
                    </p>
                  </div>
                ))}
              </div>
            </TabContent>
          )}

          {/* Historical Tab */}
          {activeTab === "historical" && (
            <TabContent delay={100}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">📈 Price History for {form.product_name || 'Selected Product'}</h3>
                <div className="text-sm text-gray-500">
                  {historicalData.length} data points available
                </div>
              </div>
              
              {historicalData.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <BarChart3 className="text-gray-400" size={24} />
                  </div>
                  <p className="text-gray-500">
                    No historical data available for this product.
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add more price entries to build historical analysis.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-[300px] animate-fade-in">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="collected_at"
                          tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          stroke="#666"
                        />
                        <YAxis stroke="#666" />
                        <Tooltip
                          labelFormatter={(d) => new Date(d).toLocaleDateString()}
                          formatter={(value: number) => [formatCurrencyKES(value), 'Price']}
                          contentStyle={{ 
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="wholesale_price"
                          stroke="#4CAF50"
                          name="Wholesale"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          animationDuration={1000}
                        />
                        <Line
                          type="monotone"
                          dataKey="retail_price"
                          stroke="#2196F3"
                          name="Retail"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          animationDuration={1000}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Latest Retail</p>
                      <p className="font-bold text-lg">
                        {formatCurrencyKES(historicalData[historicalData.length - 1]?.retail_price)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Latest Wholesale</p>
                      <p className="font-bold text-lg">
                        {formatCurrencyKES(historicalData[historicalData.length - 1]?.wholesale_price)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Data Range</p>
                      <p className="font-bold text-sm">
                        {new Date(historicalData[0]?.collected_at || '').toLocaleDateString()} - {' '}
                        {new Date(historicalData[historicalData.length - 1]?.collected_at || '').toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Volatility</p>
                      <p className="font-bold text-lg">
                        {form.volatility?.toUpperCase() || 'STABLE'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabContent>
          )}

          {/* Intel Tab */}
          {activeTab === "intel" && (
            <TabContent delay={100}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <span className="text-2xl">🧠</span>
                      Farm Intelligence Engine
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      AI-powered market analysis for {form.product_name || 'selected product'}
                    </p>
                  </div>
                  <button 
                    onClick={fetchIntelligence}
                    className="bg-brand-green hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 card-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loadingIntelligence || !form.product_name}
                  >
                    {loadingIntelligence ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        Generate Insights
                      </>
                    )}
                  </button>
                </div>
                
                {intelligenceData ? (
                  <div className="space-y-6 animate-fade-in">
                    {/* Recommendation Card */}
                    <div className={`p-6 rounded-xl border-2 transition-all duration-500 ${
                      intelligenceData.insights.recommendation === 'BUY' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' :
                      intelligenceData.insights.recommendation === 'SELL' ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200' :
                      intelligenceData.insights.recommendation === 'HOLD' ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' :
                      'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
                    }`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${
                          intelligenceData.insights.recommendation === 'BUY' ? 'bg-green-100 text-green-600 animate-pulse-slow' :
                          intelligenceData.insights.recommendation === 'SELL' ? 'bg-red-100 text-red-600 animate-pulse-slow' :
                          intelligenceData.insights.recommendation === 'HOLD' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {intelligenceData.insights.recommendation === 'BUY' ? '📈' :
                           intelligenceData.insights.recommendation === 'SELL' ? '📉' :
                           intelligenceData.insights.recommendation === 'HOLD' ? '⏸️' : '💡'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-xl">
                              {intelligenceData.insights.recommendation} 
                            </h4>
                            <span className="px-3 py-1 bg-white rounded-full text-sm font-medium border">
                              {intelligenceData.insights.confidence}% confidence
                            </span>
                          </div>
                          <p className="text-gray-700">{intelligenceData.insights.reason}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-4 rounded-lg border card-hover">
                          <p className="text-sm text-gray-500 mb-1">Current Price</p>
                          <p className="font-bold text-lg">KES {intelligenceData.insights.currentPrice?.toLocaleString()}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border card-hover">
                          <p className="text-sm text-gray-500 mb-1">Expected (30d)</p>
                          <p className="font-bold text-lg text-green-600">
                            KES {intelligenceData.insights.predictedPrice30d?.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border card-hover">
                          <p className="text-sm text-gray-500 mb-1">Market Trend</p>
                          <div className="flex items-center gap-1">
                            {intelligenceData.insights.trend === 'UP' ? (
                              <TrendingUp className="text-green-500" size={16} />
                            ) : intelligenceData.insights.trend === 'DOWN' ? (
                              <TrendingDown className="text-red-500" size={16} />
                            ) : (
                              <div className="w-4 h-0.5 bg-gray-400" />
                            )}
                            <p className={`font-bold ${
                              intelligenceData.insights.trend === 'UP' ? 'text-green-600' :
                              intelligenceData.insights.trend === 'DOWN' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {intelligenceData.insights.trend}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border card-hover">
                          <p className="text-sm text-gray-500 mb-1">Risk Level</p>
                          <p className={`font-bold text-lg ${
                            intelligenceData.insights.riskLevel === 'LOW' ? 'text-green-600' :
                            intelligenceData.insights.riskLevel === 'HIGH' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {intelligenceData.insights.riskLevel}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Price Predictions */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border card-hover">
                      <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <span>🔮</span>
                        Price Forecast (Next 30 Days)
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={intelligenceData.predictions}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              stroke="#666"
                            />
                            <YAxis stroke="#666" />
                            <Tooltip 
                              labelFormatter={(date) => new Date(date).toLocaleDateString()}
                              formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Price']}
                              contentStyle={{ 
                                backgroundColor: 'white',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="price" 
                              stroke="#4CAF50" 
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              name="Predicted Price"
                              animationDuration={1500}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="upperBound" 
                              stroke="#82ca9d" 
                              strokeWidth={1}
                              strokeDasharray="3 3"
                              name="Upper Bound"
                              animationDuration={1500}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="lowerBound" 
                              stroke="#82ca9d" 
                              strokeWidth={1}
                              strokeDasharray="3 3"
                              name="Lower Bound"
                              animationDuration={1500}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Market Advice */}
                    {intelligenceData.marketAdvice && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700 card-hover">
                        <h4 className="font-bold text-lg mb-4 text-blue-800 dark:text-blue-300 flex items-center gap-2">
                          <Calendar size={20} />
                          Market Timing Advice
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Best Time to Plant/Buy</p>
                            <p className="font-bold text-xl">{intelligenceData.marketAdvice.bestTimeToBuy}</p>
                          </div>
                          <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                            <p className="text-sm text-green-600 dark:text-green-400 mb-1">Best Time to Harvest/Sell</p>
                            <p className="font-bold text-xl">{intelligenceData.marketAdvice.bestTimeToSell}</p>
                          </div>
                          <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Market</p>
                            <p className={`font-bold text-xl ${
                              intelligenceData.marketAdvice.currentMarketCondition === 'FAVORABLE' ? 'text-green-600' :
                              intelligenceData.marketAdvice.currentMarketCondition === 'UNFAVORABLE' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {intelligenceData.marketAdvice.currentMarketCondition}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            💡 Farmer's Tip:
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            {intelligenceData.marketAdvice.farmerTip}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 animate-fade-in">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <span className="text-4xl">🧠</span>
                    </div>
                    <h4 className="font-bold text-xl mb-2">Farm Intelligence Ready</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Click "Generate Insights" to analyze <span className="font-semibold">{form.product_name || 'this product'}</span> 
                      using our AI-powered farm intelligence engine. Get price predictions, market timing, and risk analysis.
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                      {[
                        { icon: '📈', title: 'Trend Analysis', desc: 'Identify price direction' },
                        { icon: '🔮', title: 'Price Predictions', desc: '30-day forecast with bounds' },
                        { icon: '⚠️', title: 'Risk Assessment', desc: 'Market volatility analysis' },
                        { icon: '⏰', title: 'Timing Advice', desc: 'Best buy/sell periods' },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center card-hover animate-fade-in" 
                             style={{ animationDelay: `${idx * 100 + 200}ms` }}>
                          <div className="text-2xl mb-1">{item.icon}</div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabContent>
          )}

          {/* Inventory Tab */}
          {activeTab === "inventory" && (
            <div className="animate-fade-in">
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by product..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter by region..."
                    value={filterRegion}
                    onChange={(e) => {
                      setFilterRegion(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-48 focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all duration-300"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🌍
                  </div>
                </div>
              </div>

              {loadingInventory ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                </div>
              ) : inventory ? (
                inventory.data.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No market prices found.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            {['Product', 'Unit', 'Region', 'Wholesale', 'Retail', 'Broker', 'Farmgate', ''].map((header, idx) => (
                              <th 
                                key={header} 
                                className="px-4 py-3 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {inventory.data.map((p, idx) => (
                            <tr 
                              key={p.id} 
                              className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300 table-row-enter"
                              style={{ animationDelay: `${idx * 50}ms` }}
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium">{p.product_name}</div>
                                {p.benchmark && (
                                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                    Benchmark
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">{p.unit}</td>
                              <td className="px-4 py-3">{p.region}</td>
                              <td className="px-4 py-3 font-medium">
                                {formatCurrencyKES(p.wholesale_price)}
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {formatCurrencyKES(p.retail_price)}
                              </td>
                              <td className="px-4 py-3">
                                {formatCurrencyKES(p.broker_price)}
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-bold text-green-600">
                                  {formatCurrencyKES(p.farmgate_price)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-300"
                                  onClick={() => handleEditFromInventory(p)}
                                  title="Edit Price"
                                >
                                  <Edit size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center mt-4 text-sm">
                      <span className="text-gray-500">
                        Showing {inventory.data.length} of {inventory.total} prices
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => p - 1)}
                          className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage((p) => p + 1)}
                          className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No market data available.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300"
          >
            Close
          </button>
          {activeTab !== "inventory" && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-brand-green text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : form.id ? (
                'Update Price'
              ) : (
                'Save Price'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
