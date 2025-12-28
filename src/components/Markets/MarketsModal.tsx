// src/components/Markets/MarketsModal.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  marketPricesApi,
  MarketPrice as ApiMarketPrice,
  PaginatedResponse,
} from "../../services/marketPricesApi";
import { Edit, Plus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrencyKES } from "../../utils/format";
import IntelligenceDashboard from './IntelligenceDashboard';
import { CartesianGrid } from "recharts";

// ✅ Extend MarketPrice for frontend
export type MarketPrice = ApiMarketPrice & { id?: string | number };

interface MarketsModalProps {
  onClose: () => void;
  onMarketAdded: () => void;
  price?: MarketPrice; // optional for editing
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

  const [activeTab, setActiveTab] = useState<
    "details" | "pricing" | "inventory" | "historical" | "intel"
  >(mode === "add" || mode === "edit" ? "details" : "inventory");

  // ✅ Inventory state
  const [inventory, setInventory] =
    useState<PaginatedResponse<MarketPrice> | null>(null);

  // ✅ Historical data (full history for product)
  const [history, setHistory] = useState<MarketPrice[]>([]);

  // ✅ Pagination + filters
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState("");

  // ✅ Refresh key
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // 🧠 Debounced search term (prevents rapid re-fetching)
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500); // delay 500ms after user stops typing

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
      
      // Auto-load historical data for this product
      loadHistory(price.product_name);
      setActiveTab("historical");
    }
  }, [price]);

  // ✅ Load paginated inventory (for browsing all)
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

  // ✅ Load full history for a product
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

  useEffect(() => {
    if (activeTab !== "inventory") return;
    loadInventory();
  }, [activeTab, refreshKey, currentPage, debouncedSearch, filterRegion]);

  useEffect(() => {
    if (activeTab === "historical" && form.product_name) {
      loadHistory(form.product_name);
    }
  }, [activeTab, form.product_name]);

  // ✅ Historical data sorted by collected_at (from full history)
  const historicalData = useMemo(() => {
    if (!history.length) return [];
    return [...history].sort(
      (a, b) =>
        new Date(a.collected_at ?? "").getTime() -
        new Date(b.collected_at ?? "").getTime()
    );
  }, [history]);

  // ✅ Save
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

  // ✅ Title
  const modalTitle =
    activeTab === "inventory"
      ? "Market Prices"
      : form.id || price?.id
      ? "Edit Market Price"
      : "Add Market Price";

  const totalPages = Math.ceil((inventory?.total ?? 0) / itemsPerPage);

  // Add this state
  const [intelligenceData, setIntelligenceData] = useState<any>(null);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);

  // Add this function
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-lg max-w-5xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-brand-dark dark:text-brand-apple">
            {modalTitle}
          </h2>
          {activeTab === "inventory" && (
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 bg-brand-green text-white px-3 py-1 rounded hover:bg-green-700"
            >
              <Plus size={16} /> Add Price
            </button>
          )}
        </div>

        {/* ✅ Tabs */}
        {activeTab !== "inventory" && (
          <div className="flex border-b mb-4">
            {["details", "pricing", "historical", "intel"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 px-3 py-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? "border-b-2 border-brand-green text-brand-green"
                    : "text-gray-500 hover:text-brand-green"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* ✅ Content */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Details */}
          {activeTab === "details" && (
            <>
              <label className="text-sm font-medium">Product Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={form.product_name ?? ""}
                onChange={(e) =>
                  setForm({ ...form, product_name: e.target.value })
                }
              />

              <label className="text-sm font-medium">Category</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={form.category ?? ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />

              <label className="text-sm font-medium">Unit</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={form.unit ?? ""}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />

              <label className="text-sm font-medium">Region</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={form.region ?? ""}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              />

              <label className="text-sm font-medium">Source</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={form.source ?? ""}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />

              <label className="text-sm font-medium">Benchmark price?</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.benchmark}
                  onChange={(e) =>
                    setForm({ ...form, benchmark: e.target.checked })
                  }
                />
              </div>
            </>
          )}

          {/* Pricing */}
          {activeTab === "pricing" && (
            <>
              <p className="text-xs text-gray-500 mb-2">
                All prices are entered in Kenyan Shillings (KES).
              </p>
              {[
                "wholesale_price",
                "retail_price",
                "broker_price",
                "farmgate_price",
              ].map((field) => (
                <div key={field}>
                  <label className="text-sm font-medium capitalize">
                    {field.replace("_", " ")} (KES)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded"
                    value={
                      typeof form[field as keyof MarketPrice] === "number"
                        ? (form[field as keyof MarketPrice] as number)
                        : ""
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field]: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
              ))}
            </>
          )}

          {/* Historical */}
          {activeTab === "historical" && (
            <div className="h-[300px]">
              {historicalData.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No historical data available for this product.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <XAxis
                      dataKey="collected_at"
                      tickFormatter={(d) => new Date(d).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(d) => new Date(d).toLocaleString()}
                      formatter={(value: number) => formatCurrencyKES(value)}
                    />
                    <Line
                      type="monotone"
                      dataKey="wholesale_price"
                      stroke="#4CAF50"
                      name="Wholesale"
                    />
                    <Line
                      type="monotone"
                      dataKey="retail_price"
                      stroke="#2196F3"
                      name="Retail"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Intel */}
          {activeTab === "intel" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">🧠 Farm Intelligence</h3>
                <button 
                  onClick={fetchIntelligence}
                  className="bg-brand-green text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                  disabled={loadingIntelligence || !form.product_name}
                >
                  {loadingIntelligence ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    'Generate Insights'
                  )}
                </button>
              </div>
              
              {intelligenceData ? (
                <div className="space-y-6">
                  {/* Recommendation Card */}
                  <div className={`p-4 rounded-lg border ${
                    intelligenceData.insights.recommendation === 'BUY' ? 'bg-green-50 border-green-200' :
                    intelligenceData.insights.recommendation === 'SELL' ? 'bg-red-50 border-red-200' :
                    intelligenceData.insights.recommendation === 'HOLD' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        intelligenceData.insights.recommendation === 'BUY' ? 'bg-green-100 text-green-600' :
                        intelligenceData.insights.recommendation === 'SELL' ? 'bg-red-100 text-red-600' :
                        intelligenceData.insights.recommendation === 'HOLD' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {intelligenceData.insights.recommendation === 'BUY' ? '📈' :
                        intelligenceData.insights.recommendation === 'SELL' ? '📉' :
                        intelligenceData.insights.recommendation === 'HOLD' ? '⏸️' : '💡'}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">
                          {intelligenceData.insights.recommendation} 
                          <span className="ml-2 text-sm font-normal bg-white px-2 py-1 rounded">
                            {intelligenceData.insights.confidence}% confidence
                          </span>
                        </h4>
                        <p className="text-gray-600">{intelligenceData.insights.reason}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-500">Current Price</p>
                        <p className="font-bold text-lg">KES {intelligenceData.insights.currentPrice?.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-500">Expected (30d)</p>
                        <p className="font-bold text-lg">KES {intelligenceData.insights.predictedPrice30d?.toLocaleString()}</p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-500">Trend</p>
                        <p className={`font-bold text-lg ${
                          intelligenceData.insights.trend === 'UP' ? 'text-green-600' :
                          intelligenceData.insights.trend === 'DOWN' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {intelligenceData.insights.trend}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <p className="text-sm text-gray-500">Risk Level</p>
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
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-bold mb-3">📊 Price Forecast (Next 30 Days)</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={intelligenceData.predictions}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                            formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Price']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#4CAF50" 
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            name="Predicted Price"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="upperBound" 
                            stroke="#82ca9d" 
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            name="Upper Bound"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="lowerBound" 
                            stroke="#82ca9d" 
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            name="Lower Bound"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Market Advice */}
                  {intelligenceData.marketAdvice && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-bold mb-3 text-blue-800">⏰ Market Timing Advice</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-blue-600">Best Time to Plant/Buy</p>
                          <p className="font-bold text-lg">{intelligenceData.marketAdvice.bestTimeToBuy}</p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-600">Best Time to Harvest/Sell</p>
                          <p className="font-bold text-lg">{intelligenceData.marketAdvice.bestTimeToSell}</p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-600">Current Market</p>
                          <p className={`font-bold text-lg ${
                            intelligenceData.marketAdvice.currentMarketCondition === 'FAVORABLE' ? 'text-green-600' :
                            intelligenceData.marketAdvice.currentMarketCondition === 'UNFAVORABLE' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {intelligenceData.marketAdvice.currentMarketCondition}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-white rounded border">
                        <p className="text-sm font-semibold text-gray-700">💡 Farmer Tip:</p>
                        <p className="text-gray-600">{intelligenceData.marketAdvice.farmerTip}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Optimal Action Date */}
                  {intelligenceData.insights.optimalActionDate && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                          📅
                        </div>
                        <div>
                          <h4 className="font-bold text-purple-800">Optimal Action Date</h4>
                          <p className="text-purple-600">
                            Consider taking action around{' '}
                            <span className="font-bold">
                              {new Date(intelligenceData.insights.optimalActionDate).toLocaleDateString()}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-2xl">🧠</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">Farm Intelligence Ready</h4>
                  <p className="text-gray-600 mb-4">
                    Click "Generate Insights" to analyze {form.product_name || 'this product'} 
                     using our AI-powered farm intelligence engine.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-semibold">📈 Trend Analysis</span>
                      <p className="text-gray-500">Identify price direction</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-semibold">🔮 Price Predictions</span>
                      <p className="text-gray-500">30-day forecast with bounds</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-semibold">⚠️ Risk Assessment</span>
                      <p className="text-gray-500">Market volatility analysis</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-semibold">⏰ Timing Advice</span>
                      <p className="text-gray-500">Best buy/sell periods</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inventory */}
          {activeTab === "inventory" && (
            <div className="overflow-x-auto">
              <div className="flex flex-wrap gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Search by product..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="p-2 border rounded flex-1 min-w-[180px]"
                />
                <input
                  type="text"
                  placeholder="Filter by region..."
                  value={filterRegion}
                  onChange={(e) => {
                    setFilterRegion(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="p-2 border rounded min-w-[160px]"
                />
              </div>

              {loadingInventory ? (
                <p className="text-gray-500">Refreshing prices…</p>
              ) : inventory ? (
                inventory.data.length === 0 ? (
                  <p className="text-gray-500 text-sm">No prices found.</p>
                ) : (
                  <>
                    <table className="w-full text-left border">
                      <thead className="bg-slate-100 dark:bg-[#0a3d32]">
                        <tr>
                          <th className="px-3 py-2">Product</th>
                          <th className="px-3 py-2">Unit</th>
                          <th className="px-3 py-2">Region</th>
                          <th className="px-3 py-2">Wholesale</th>
                          <th className="px-3 py-2">Retail</th>
                          <th className="px-3 py-2">Broker</th>
                          <th className="px-3 py-2">Farmgate</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.data.map((p) => (
                          <tr key={p.id} className="border-t">
                            <td className="px-3 py-2">{p.product_name}</td>
                            <td className="px-3 py-2">{p.unit}</td>
                            <td className="px-3 py-2">{p.region}</td>
                            <td className="px-3 py-2">
                              {formatCurrencyKES(p.wholesale_price)}
                            </td>
                            <td className="px-3 py-2">
                              {formatCurrencyKES(p.retail_price)}
                            </td>
                            <td className="px-3 py-2">
                              {formatCurrencyKES(p.broker_price)}
                            </td>
                            <td className="px-3 py-2">
                              {formatCurrencyKES(p.farmgate_price)}
                            </td>
                            <td className="px-3 py-2">
                              <button
                                className="text-blue-600 hover:text-blue-800"
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

                    <div className="flex justify-between items-center mt-3 text-sm">
                      <span>
                        Page {inventory.page} of {totalPages || 1}
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => p - 1)}
                          className="px-2 py-1 border rounded disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <button
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage((p) => p + 1)}
                          className="px-2 py-1 border rounded disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )
              ) : (
                <p className="text-gray-500 text-sm">No prices found.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-400 text-white"
          >
            Close
          </button>
          {activeTab !== "inventory" && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 rounded bg-brand-green text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : form.id ? "Update" : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
