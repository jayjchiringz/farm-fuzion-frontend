// farm-fuzion-frontend/src/pages/MarketPrices.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  marketPricesApi,
  MarketPrice,
  API_BASE,
} from "../services/marketPricesApi";
import MarketPricesModal from "../components/Markets/MarketsModal"; // ✅ Updated import
import { formatCurrencyKES } from "../utils/format";
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
} from "lucide-react";

// Custom hook for loading animations
const useLoadingAnimation = (isLoading: boolean) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setPulse(p => !p);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  return pulse;
};

export default function MarketPricesPage() {
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [loading, setLoading] = useState(false);
  const previousDataRef = useRef<MarketPrice[]>([]);
  const pulse = useLoadingAnimation(loading);

  const [summary, setSummary] = useState<MarketPrice[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // ✅ Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterRegion, setFilterRegion] = useState("");

  // ✅ Modal state - Updated for new modal
  const [showModal, setShowModal] = useState(false);

  // Add state for currency
  const [selectedCurrency, setSelectedCurrency] = useState<'KES' | 'USD' | 'UGX' | 'TZS'>('KES');  

  // ✅ Load summary + dashboard data
  const loadSummary = async () => {
    setLoading(true);
    try {
      // Load basic summary
      let res = await marketPricesApi.getSummary(selectedCurrency);

      // 🔍 Apply filters client-side
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

      // Load dashboard insights
      const dashboardRes = await fetch(`${API_BASE}/market-prices/dashboard?limit=8`);
      if (dashboardRes.ok) {
        const dashboardJson = await dashboardRes.json();
        setDashboardData(dashboardJson);
      }
      
      previousDataRef.current = [...res];
    } catch (err) {
      console.error("Error loading summary:", err);
    } finally {
      setLoading(false);
      if (isFirstLoad) {
        setTimeout(() => setIsFirstLoad(false), 300);
      }
    }
  };

  useEffect(() => {
    loadSummary();
  }, [searchTerm, filterCategory, filterRegion]);

  // ✅ Dynamic filter values - Updated with proper filtering
  const categories = useMemo(
    () =>
      Array.from(new Set(
        summary
          .map((p) => p.category)
          .filter((category): category is string => Boolean(category))
      )),
    [summary]
  );

  const regions = useMemo(
    () =>
      Array.from(new Set(
        summary
          .map((p) => p.region)
          .filter((region): region is string => Boolean(region))
      )),
    [summary]
  );

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

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      {/* Header with Market Overview */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-dark dark:text-brand-apple">
              Market Intelligence Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Real-time agricultural market insights & price analytics
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowModal(true)} // ✅ Open the modal directly
              className="flex items-center gap-2 bg-brand-green hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors card-hover"
            >
              <Sparkles size={18} />
              Open Market Dashboard
            </button>
            <button
              onClick={loadSummary}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors card-hover"
              disabled={loading}
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Loading skeleton for first load */}
        {loading && isFirstLoad ? (
          <div className="space-y-4 animate-fade-in">
            {/* Skeleton cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div 
                  key={i} 
                  className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl shimmer"
                  style={{ animationDelay: `${i * 100}ms` }}
                ></div>
              ))}
            </div>
          </div>
        ) : marketMetrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Metric Card 1 */}
            <div 
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 card-hover animate-fade-in stagger-delay-1"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BarChart3 className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg Price</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {formatCurrencyKES(marketMetrics.avgPrice)}
                  </p>
                </div>
              </div>
            </div>

            {/* Metric Card 2 */}
            <div 
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 card-hover animate-fade-in stagger-delay-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Highest Price</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {formatCurrencyKES(marketMetrics.maxPrice)}
                  </p>
                </div>
              </div>
            </div>

            {/* Metric Card 3 */}
            <div 
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 card-hover animate-fade-in stagger-delay-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Lowest Price</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {formatCurrencyKES(marketMetrics.minPrice)}
                  </p>
                </div>
              </div>
            </div>

            {/* Metric Card 4 */}
            <div 
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 card-hover animate-fade-in stagger-delay-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Volatile Markets</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {marketMetrics.volatileProducts}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Insights Section */}
        {dashboardData && !loading && (
          <div className="mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-brand-dark dark:text-white flex items-center gap-2">
                <BarChart3 size={24} />
                Quick Market Insights
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                dashboardData.market_overview?.overall_trend === 'BULLISH' ? 'bg-green-100 text-green-800' :
                dashboardData.market_overview?.overall_trend === 'BEARISH' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {dashboardData.market_overview?.overall_trend || 'NEUTRAL'} Market
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Best Opportunities */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-green-100 dark:border-gray-700 card-hover animate-fade-in stagger-delay-1">
                <h3 className="font-bold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                  <TrendingUp size={18} />
                  Best Selling Opportunities
                </h3>
                <div className="space-y-2">
                  {dashboardData.summary
                    ?.filter((item: any) => item.action_recommendation?.includes('sell'))
                    .slice(0, 3)
                    .map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded animate-fade-in" 
                           style={{ animationDelay: `${idx * 100 + 300}ms` }}>
                        <span className="font-medium">{item.product}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 dark:text-green-400 font-bold">
                            {formatCurrencyKES(item.retail_price)}
                          </span>
                          <ChevronRight size={16} className="text-gray-400" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Price Alerts */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-yellow-100 dark:border-gray-700 card-hover animate-fade-in stagger-delay-2">
                <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
                  <AlertTriangle size={18} />
                  Price Alerts
                </h3>
                <div className="space-y-2">
                  {dashboardData.summary
                    ?.filter((item: any) => item.trend === 'UP' && Math.abs(item.weekly_change) > 5)
                    .slice(0, 3)
                    .map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded animate-fade-in"
                           style={{ animationDelay: `${idx * 100 + 400}ms` }}>
                        <span className="font-medium">{item.product}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            item.trend === 'UP' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.trend === 'UP' ? '+' : ''}{item.weekly_change}%
                          </span>
                          <TrendingUp size={16} className={item.trend === 'UP' ? 'text-green-500' : 'text-red-500'} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Market Timing */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl border border-blue-100 dark:border-gray-700 card-hover animate-fade-in stagger-delay-3">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <Calendar size={18} />
                  Market Timing
                </h3>
                <div className="space-y-3">
                  <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded animate-fade-in" style={{ animationDelay: '500ms' }}>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Best Time to Buy</p>
                    <p className="font-bold text-lg text-blue-700 dark:text-blue-300">
                      {dashboardData.market_overview?.best_buy_product || 'N/A'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded animate-fade-in" style={{ animationDelay: '600ms' }}>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Best Time to Sell</p>
                    <p className="font-bold text-lg text-green-700 dark:text-green-300">
                      {dashboardData.market_overview?.best_sell_product || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar - Modern Design - Fixed with proper filtering */}
      <div className="mb-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 card-hover">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Search size={20} />
            <span className="font-medium">Market Filters</span>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent w-full md:w-64 focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all duration-300"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all duration-300"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all duration-300"
            >
              <option value="">All Regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      {loading && !isFirstLoad ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
        </div>
      ) : summary.length === 0 ? (
        <div className="text-center py-12 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <BarChart3 className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No market data found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or add new market prices</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Product Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Prices (KES)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {summary.map((p, index) => {
                  const priceChange = dashboardData?.summary?.find(
                    (item: any) => item.product === p.product_name
                  )?.weekly_change || 0;
                  
                  return (
                    <tr 
                      key={p.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors duration-250 table-row-enter"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {p.product_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {p.category} • {p.region} • {p.unit}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Retail:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {p.retail_price !== undefined ? formatCurrencyKES(p.retail_price) : '$'}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Farmgate:</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {p.farmgate_price !== undefined ? formatCurrencyKES(p.farmgate_price) : '$'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {priceChange > 0 ? (
                            <div className={`flex items-center gap-1 ${Math.abs(priceChange) > 5 ? 'price-up' : ''}`}>
                              <TrendingUp className="text-green-500" size={16} />
                              <span className="text-green-600 font-medium">+{priceChange.toFixed(1)}%</span>
                            </div>
                          ) : priceChange < 0 ? (
                            <div className={`flex items-center gap-1 ${Math.abs(priceChange) > 5 ? 'price-down' : ''}`}>
                              <TrendingDown className="text-red-500" size={16} />
                              <span className="text-red-600 font-medium">{priceChange.toFixed(1)}%</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-0.5 bg-gray-400" />
                              <span className="text-gray-500 font-medium">Stable</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {p.benchmark ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            ✓ Benchmark
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            User Data
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-300"
                            onClick={() => setShowModal(true)} // ✅ Open modal directly
                          >
                            View Details
                          </button>
                          <button
                            className="text-brand-green hover:text-green-700 font-medium transition-colors duration-300"
                            onClick={() => setShowModal(true)} // ✅ Open modal directly
                          >
                            AI Insights →
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

      {/* Footer Stats */}
      {summary.length > 0 && !loading && (
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 animate-fade-in">
          <p>
            Showing {summary.length} products • Last updated: {new Date().toLocaleDateString()} • 
            Data source: WorldBank (1963-2024) + Live Market Feed
          </p>
        </div>
      )}

      {/* Modal - Updated with new component */}
      {showModal && (
        <MarketPricesModal
          farmerId={undefined} // or pass actual farmerId if available
          onClose={() => setShowModal(false)}
          onMarketAdded={loadSummary}
        />
      )}
    </div>
  );
}
