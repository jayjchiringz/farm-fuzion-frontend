// src/components/Markets/MarketsModal.tsx
import React, { useState, useEffect } from "react";
import {
  marketPricesApi,
  MarketPrice as ApiMarketPrice,
  PaginatedResponse,
} from "../../services/marketPricesApi";
import { Edit, Plus } from "lucide-react";

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
    wholesale_price: 0,
    retail_price: 0,
    broker_price: 0,
    farmgate_price: 0,
    region: "",
    source: "",
    collected_at: new Date().toISOString(),
    benchmark: false,
  });

  const [loading, setLoading] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "details" | "pricing" | "inventory"
  >(mode === "add" || mode === "edit" ? "details" : "inventory");

  // ✅ Inventory state
  const [inventory, setInventory] =
    useState<PaginatedResponse<MarketPrice> | null>(null);

  // ✅ Pagination + filters
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState("");

  // ✅ Refresh key
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // ✅ Pre-fill form if editing
  useEffect(() => {
    if (price) {
      setForm({
        ...price,
        wholesale_price: price.wholesale_price ?? 0,
        retail_price: price.retail_price ?? 0,
        broker_price: price.broker_price ?? 0,
        farmgate_price: price.farmgate_price ?? 0,
        benchmark: price.benchmark ?? false,
      });
    }
  }, [price]);

  // ✅ Load inventory
  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const data = await marketPricesApi.getAll(currentPage, itemsPerPage, {
        product: searchTerm || undefined, // 🔹 match backend param
        region: filterRegion || undefined,
      });
      setInventory(data);
    } catch (err) {
      console.error("Error loading market prices:", err);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "inventory") loadInventory();
  }, [activeTab, refreshKey, currentPage, searchTerm, filterRegion]);

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
      wholesale_price: 0,
      retail_price: 0,
      broker_price: 0,
      farmgate_price: 0,
      region: "",
      source: "",
      collected_at: new Date().toISOString(),
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
            {["details", "pricing"].map((tab) => (
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
          {activeTab === "details" && (
            <>
              {/* Product */}
              <label className="text-sm font-medium">Product Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={form.product_name}
                onChange={(e) =>
                  setForm({ ...form, product_name: e.target.value })
                }
              />

              {/* Category */}
              <label className="text-sm font-medium">Category</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />

              {/* Unit */}
              <label className="text-sm font-medium">Unit</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />

              {/* Region */}
              <label className="text-sm font-medium">Region</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={form.region ?? ""}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              />

              {/* Source */}
              <label className="text-sm font-medium">Source</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={form.source ?? ""}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />

              {/* Benchmark */}
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

          {activeTab === "pricing" && (
            <>
              {[
                "wholesale_price",
                "retail_price",
                "broker_price",
                "farmgate_price",
              ].map((field) => (
                <div key={field}>
                  <label className="text-sm font-medium capitalize">
                    {field.replace("_", " ")} (Ksh)
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
                        [field]: Number(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
            </>
          )}

          {activeTab === "inventory" && (
            <div className="overflow-x-auto">
              {/* Filters */}
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
              ) : !inventory || inventory.data.length === 0 ? (
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
                          <td className="px-3 py-2">Ksh {p.wholesale_price}</td>
                          <td className="px-3 py-2">Ksh {p.retail_price}</td>
                          <td className="px-3 py-2">Ksh {p.broker_price}</td>
                          <td className="px-3 py-2">Ksh {p.farmgate_price}</td>
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

                  {/* Pagination */}
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
