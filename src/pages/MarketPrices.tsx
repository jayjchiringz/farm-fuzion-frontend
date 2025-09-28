// src/pages/MarketPrices.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  marketPricesApi,
  MarketPrice,
  PaginatedResponse,
  API_BASE
} from "../services/marketPricesApi";
import MarketsModal from "../components/Markets/MarketsModal";
import axios from "axios";

export default function MarketPricesPage() {
  const [prices, setPrices] = useState<PaginatedResponse<MarketPrice> | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 5;

  // ✅ Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterRegion, setFilterRegion] = useState("");

  // ✅ Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<MarketPrice | undefined>(
    undefined
  );

  // ✅ Load prices
  const loadPrices = async () => {
    setLoading(true);
    try {
      const res = await marketPricesApi.getAll(page, limit, {
        search: searchTerm || undefined,
        category: filterCategory || undefined,
        region: filterRegion || undefined,
      });
      setPrices(res);
    } catch (err) {
      console.error("Error loading market prices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, [page, searchTerm, filterCategory, filterRegion]);

  // ✅ Dynamic filter values (from loaded prices)
  const categories = useMemo(
    () =>
      Array.from(
        new Set(prices?.data.map((p) => p.category).filter(Boolean) ?? [])
      ),
    [prices]
  );

  const regions = useMemo(
    () =>
      Array.from(
        new Set(prices?.data.map((p) => p.region).filter(Boolean) ?? [])
      ),
    [prices]
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-brand-dark dark:text-brand-apple">
          Market Prices
        </h1>
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
            loadPrices();
          }}
          className="bg-blue-600 text-white px-3 py-1 rounded ml-2"
        >
          Sync Now
        </button>
      </div>

      {/* ✅ Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by product..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="p-2 border rounded flex-1 min-w-[180px]"
        />
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(1);
          }}
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
          onChange={(e) => {
            setFilterRegion(e.target.value);
            setPage(1);
          }}
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
      ) : !prices || prices.data.length === 0 ? (
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
                <th className="px-3 py-2">Broker</th>
                <th className="px-3 py-2">Farmgate</th>
                <th className="px-3 py-2">Actions</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Last Synced</th>
              </tr>
            </thead>
            <tbody>
              {prices.data.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">{p.product_name}</td>
                  <td className="px-3 py-2">{p.category}</td>
                  <td className="px-3 py-2">{p.region}</td>
                  <td className="px-3 py-2">Ksh {p.wholesale_price}</td>
                  <td className="px-3 py-2">Ksh {p.retail_price}</td>
                  <td className="px-3 py-2">Ksh {p.broker_price}</td>
                  <td className="px-3 py-2">Ksh {p.farmgate_price}</td>
                  <td className="px-3 py-2">
                    {p.benchmark ? (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        Benchmark ({p.source})
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500">
                    {p.last_synced ? new Date(p.last_synced).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        setSelectedPrice(p);
                        setShowModal(true);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-3 text-sm">
            <span>
              Page {prices.page} of {Math.ceil(prices.total / prices.limit)}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= Math.ceil(prices.total / limit)}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <MarketsModal
          price={selectedPrice}
          onClose={() => setShowModal(false)}
          onMarketAdded={loadPrices}
        />
      )}
    </div>
  );
}
