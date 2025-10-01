// src/pages/MarketPrices.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  marketPricesApi,
  MarketPrice,
  API_BASE,
} from "../services/marketPricesApi";
import MarketsModal from "../components/Markets/MarketsModal";
import axios from "axios";
import { formatCurrencyKES } from "../utils/format";

export default function MarketPricesPage() {
  const [summary, setSummary] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterRegion, setFilterRegion] = useState("");

  // ✅ Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<MarketPrice | undefined>(
    undefined
  );

  // ✅ Load summary (latest per product)
  const loadSummary = async () => {
    setLoading(true);
    try {
      let res = await marketPricesApi.getSummary();

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
    } catch (err) {
      console.error("Error loading summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [searchTerm, filterCategory, filterRegion]);

  // ✅ Dynamic filter values
  const categories = useMemo(
    () =>
      Array.from(new Set(summary.map((p) => p.category).filter(Boolean) ?? [])),
    [summary]
  );

  const regions = useMemo(
    () =>
      Array.from(new Set(summary.map((p) => p.region).filter(Boolean) ?? [])),
    [summary]
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-brand-dark dark:text-brand-apple">
          Market Prices (Latest per Product)
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedPrice(undefined);
              setShowModal(true);
            }}
            className="bg-brand-green text-white px-4 py-2 rounded"
          >
            + Add Price
          </button>
          <button
            onClick={async () => {
              await axios.get(`${API_BASE}/market-prices/sync`);
              loadSummary();
            }}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Sync Now
          </button>
        </div>
      </div>

      {/* ✅ Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded flex-1 min-w-[180px]"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="p-2 border rounded min-w-[160px]"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          className="p-2 border rounded min-w-[160px]"
        >
          <option value="">All Regions</option>
          {regions.map((r) => (
            <option key={r ?? "unknown"} value={r ?? ""}>
              {r ?? "Unknown"}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading market prices...</p>
      ) : summary.length === 0 ? (
        <p className="text-gray-500">No market prices found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-left">
            <thead className="bg-slate-100 dark:bg-[#0a3d32]">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Region</th>
                <th className="px-3 py-2">Wholesale</th>
                <th className="px-3 py-2">Retail</th>
                <th className="px-3 py-2">Collected At</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">{p.product_name}</td>
                  <td className="px-3 py-2">{p.category}</td>
                  <td className="px-3 py-2">{p.region}</td>
                  <td className="px-3 py-2">
                    {formatCurrencyKES(p.wholesale_price)}
                  </td>
                  <td className="px-3 py-2">
                    {formatCurrencyKES(p.retail_price)}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500">
                    {p.collected_at
                      ? new Date(p.collected_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {p.benchmark ? (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        Benchmark
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        setSelectedPrice(p);
                        setShowModal(true);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <MarketsModal
          price={selectedPrice}
          onClose={() => setShowModal(false)}
          onMarketAdded={loadSummary}
        />
      )}
    </div>
  );
}
