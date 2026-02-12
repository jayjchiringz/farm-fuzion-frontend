// src/components/Products/ProductsModal.tsx
import React, { useState, useEffect } from "react";
import {
  farmProductsApi,
  FarmProduct as ApiFarmProduct,
  PaginatedResponse,
  ProductStatus,
} from "../../services/farmProductsApi";
import { farmActivitiesApi, FarmSeason } from "../../services/farmActivitiesApi";
import { FarmPlanner } from "../FarmActivities/FarmPlanner";
import { FarmDiary } from "../FarmActivities/FarmDiary";
import { SeasonOverview } from "../FarmActivities/SeasonOverview";
import { Edit, Plus, Info } from "lucide-react";

// ✅ Extend FarmProduct with spoilage_reason
export type FarmProduct = ApiFarmProduct & {
  id?: string | number;
  spoilage_reason?: string;
};

interface ProductsModalProps {
  farmerId: string;
  onClose: () => void;
  onProductAdded: () => void;
  product?: FarmProduct; // optional, for editing
  mode?: "add" | "edit" | "inventory"; // ✅ control modal mode
}

export default function ProductsModal({
  farmerId,
  onClose,
  onProductAdded,
  product,
  mode = "inventory", // ✅ default is inventory hub
}: ProductsModalProps) {
  const [form, setForm] = useState<Partial<FarmProduct>>({
    product_name: "",
    quantity: 0,
    unit: "",
    category: "produce",
    price: 0, // stored as total price
    status: "available",
    spoilage_reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [seasons, setSeasons] = useState<FarmSeason[]>([]);
  
  // ✅ Tab state - fixed the type definition
  const [activeTab, setActiveTab] = useState<
    "details" | "pricing" | "status" | "inventory" | "planner" | "seasons" | "diary"
  >(mode === "add" || mode === "edit" ? "details" : "inventory");

  // ✅ Inventory state (server-driven pagination)
  const [inventory, setInventory] = useState<PaginatedResponse<FarmProduct> | null>(
    null
  );

  // ✅ Pagination + Filters
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<ProductStatus | "">("");

  // ✅ Refresh key
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // ✅ Derived unit price
  const unitPrice =
    form.quantity && form.quantity > 0 ? (form.price ?? 0) / form.quantity : 0;

  // ✅ Load seasons for diary
  const loadSeasons = async () => {
    try {
      const response = await farmActivitiesApi.getFarmerSeasons(Number(farmerId));
      setSeasons(response.data);
    } catch (error) {
      console.error("Error loading seasons:", error);
    }
  };

  // ✅ Pre-fill form if editing
  useEffect(() => {
    if (product) {
      setForm({
        ...product,
        quantity: product.quantity ? Number(product.quantity) : 0,
        price: product.price ? Number(product.price) : 0,
      });
    }
  }, [product]);

  // ✅ Load seasons when farmerId changes
  useEffect(() => {
    if (farmerId && (activeTab === "diary" || activeTab === "seasons" || activeTab === "planner")) {
      loadSeasons();
    }
  }, [farmerId, activeTab]);

  // ✅ Load inventory (server-side pagination & filters)
  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const data = await farmProductsApi.getFarmerProducts(
        farmerId,
        currentPage,
        itemsPerPage,
        {
          search: searchTerm || undefined,
          category: filterCategory || undefined,
          status: filterStatus || undefined,
        }
      );
      setInventory(data);
    } catch (err) {
      console.error("Error loading inventory:", err);
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "inventory") {
      loadInventory();
    }
  }, [activeTab, refreshKey, currentPage, searchTerm, filterCategory, filterStatus]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        ...form,
        price: unitPrice * (form.quantity ?? 0), // ✅ always save total price
      } as FarmProduct;

      if (product?.id || form.id) {
        await farmProductsApi.update(String(product?.id || form.id), payload);
      } else {
        await farmProductsApi.add({ ...payload, farmer_id: farmerId } as FarmProduct);
      }

      onProductAdded();
      triggerRefresh(); // ✅ refresh inventory
      setActiveTab("inventory");
    } catch (err) {
      console.error("Error saving product:", err);
      alert("⚠️ Failed to save product. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ When editing from inventory
  const handleEditFromInventory = (p: FarmProduct) => {
    setForm({
      ...p,
      quantity: p.quantity ? Number(p.quantity) : 0,
      price: p.price ? Number(p.price) : 0,
    });
    setActiveTab("details");
  };

  const handleAddNew = () => {
    setForm({
      product_name: "",
      quantity: 0,
      unit: "",
      category: "produce",
      price: 0,
      status: "available",
      spoilage_reason: "",
    });
    setActiveTab("details");
  };

  const handlePlanCreated = (seasonId: number) => {
    loadSeasons();
    setActiveTab("seasons");
  };

  // ✅ Determine modal title
  const getModalTitle = () => {
    if (activeTab === "inventory") return "Farm Inventory";
    if (activeTab === "planner") return "🌱 Farm Planner";
    if (activeTab === "seasons") return "📅 Seasons & Activities";
    if (activeTab === "diary") return "📓 Farm Diary";
    return form.id || product?.id ? "Edit Product" : "Add New Product";
  };

  const totalPages = Math.ceil((inventory?.total ?? 0) / itemsPerPage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-lg max-w-6xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-brand-dark dark:text-brand-apple">
            {getModalTitle()}
          </h2>
          {activeTab === "inventory" && (
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 bg-brand-green text-white px-3 py-1 rounded hover:bg-green-700"
            >
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>

        {/* ✅ Main Navigation Tabs */}
        <div className="flex border-b mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeTab === "inventory"
                ? "border-b-2 border-brand-green text-brand-green"
                : "text-gray-500 hover:text-brand-green"
            }`}
          >
            📦 Inventory
          </button>
          <button
            onClick={() => setActiveTab("planner")}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeTab === "planner"
                ? "border-b-2 border-brand-green text-brand-green"
                : "text-gray-500 hover:text-brand-green"
            }`}
          >
            🌱 Farm Planner
          </button>
          <button
            onClick={() => setActiveTab("seasons")}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeTab === "seasons"
                ? "border-b-2 border-brand-green text-brand-green"
                : "text-gray-500 hover:text-brand-green"
            }`}
          >
            📅 Seasons
          </button>
          <button
            onClick={() => setActiveTab("diary")}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
              activeTab === "diary"
                ? "border-b-2 border-brand-green text-brand-green"
                : "text-gray-500 hover:text-brand-green"
            }`}
          >
            📓 Farm Diary
          </button>
        </div>

        {/* ✅ Product Form Sub-tabs (only shown when in product editing mode) */}
        {activeTab === "details" || activeTab === "pricing" || activeTab === "status" ? (
          <div className="flex border-b mb-4">
            {["details", "pricing", "status"].map((tab) => (
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
        ) : null}

        {/* ✅ Content */}
        <div className="space-y-3 max-h-[70vh] overflow-y-auto px-1">
          {/* PRODUCT DETAILS TAB */}
          {activeTab === "details" && (
            <>
              <label className="flex items-center gap-2 text-sm font-medium">
                Product Name
                <Info size={14} className="text-gray-400" />
              </label>
              <input
                type="text"
                placeholder="e.g. Maize, Tomatoes"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
              />

              <label className="flex items-center gap-2 text-sm font-medium">
                Unit
                <Info size={14} className="text-gray-400" />
              </label>
              <input
                type="text"
                placeholder="e.g. kg, bag, litre"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />

              <label className="flex items-center gap-2 text-sm font-medium">
                Category
                <Info size={14} className="text-gray-400" />
              </label>
              <select
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="produce">Produce</option>
                <option value="input">Input</option>
                <option value="service">Service</option>
              </select>
            </>
          )}

          {/* PRICING TAB */}
          {activeTab === "pricing" && (
            <>
              <label className="flex items-center gap-2 text-sm font-medium">
                Quantity
                <Info size={14} className="text-gray-400" />
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 50"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                value={form.quantity}
                onChange={(e) => {
                  const qty = Number(e.target.value);
                  setForm({
                    ...form,
                    quantity: qty,
                    price: unitPrice * qty,
                  });
                }}
              />

              <label className="flex items-center gap-2 text-sm font-medium">
                Unit Price (Ksh)
                <Info size={14} className="text-gray-400" />
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 100"
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                value={unitPrice}
                onChange={(e) => {
                  const uPrice = Number(e.target.value);
                  setForm({
                    ...form,
                    price: uPrice * (form.quantity ?? 0),
                  });
                }}
              />

              <label className="flex items-center gap-2 text-sm font-medium">
                Total Price (Ksh)
                <Info size={14} className="text-gray-400" />
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                value={form.price}
                readOnly
              />
            </>
          )}

          {/* STATUS TAB */}
          {activeTab === "status" && (
            <>
              <label className="flex items-center gap-2 text-sm font-medium">
                Product Status
                <Info size={14} className="text-gray-400" />
              </label>
              <select
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as FarmProduct["status"] })
                }
              >
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="hidden">Hidden</option>
              </select>

              {form.status === "hidden" && (
                <>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    Reason for spoilage
                    <Info size={14} className="text-gray-400" />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. spoiled, damaged, unavailable"
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                    value={form.spoilage_reason}
                    onChange={(e) =>
                      setForm({ ...form, spoilage_reason: e.target.value })
                    }
                  />
                </>
              )}
            </>
          )}

          {/* INVENTORY TAB */}
          {activeTab === "inventory" && (
            <div className="overflow-x-auto">
              <div className="flex flex-wrap gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="p-2 border rounded flex-1 min-w-[180px] dark:bg-gray-800 dark:border-gray-700"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="p-2 border rounded min-w-[160px] dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="">All Categories</option>
                  <option value="produce">Produce</option>
                  <option value="input">Input</option>
                  <option value="service">Service</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value as ProductStatus | "");
                    setCurrentPage(1);
                  }}
                  className="p-2 border rounded min-w-[140px] dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              {loadingInventory ? (
                <div className="flex justify-center items-center py-10 text-gray-500">
                  <svg className="animate-spin h-6 w-6 mr-2 text-brand-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Loading inventory...
                </div>
              ) : !inventory || inventory.data.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p className="text-4xl mb-2">📦</p>
                  <p>No products found</p>
                  <button
                    onClick={handleAddNew}
                    className="mt-3 text-brand-green hover:underline"
                  >
                    + Add your first product
                  </button>
                </div>
              ) : (
                <>
                  <table className="w-full text-left border dark:border-gray-700">
                    <thead className="bg-slate-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2">Product</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Unit</th>
                        <th className="px-3 py-2">Unit Price</th>
                        <th className="px-3 py-2">Total</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.data.map((p) => {
                        const unitPrice = p.quantity && p.quantity > 0 ? (p.price ?? 0) / p.quantity : 0;
                        return (
                          <tr key={p.id} className="border-t dark:border-gray-700">
                            <td className="px-3 py-2">{p.product_name}</td>
                            <td className="px-3 py-2">{p.quantity}</td>
                            <td className="px-3 py-2">{p.unit}</td>
                            <td className="px-3 py-2">Ksh {unitPrice.toFixed(2)}</td>
                            <td className="px-3 py-2">Ksh {p.price}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                p.status === 'available' ? 'bg-green-100 text-green-800' :
                                p.status === 'sold' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <button
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                onClick={() => handleEditFromInventory(p)}
                                title="Edit Product"
                              >
                                <Edit size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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
                        className="px-2 py-1 border rounded disabled:opacity-50 dark:border-gray-700"
                      >
                        Prev
                      </button>
                      <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="px-2 py-1 border rounded disabled:opacity-50 dark:border-gray-700"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* FARM PLANNER TAB */}
          {activeTab === "planner" && (
            <FarmPlanner
              farmerId={Number(farmerId)}
              onPlanCreated={handlePlanCreated}
              onClose={() => setActiveTab("seasons")}
            />
          )}

          {/* SEASONS TAB */}
          {activeTab === "seasons" && (
            <SeasonOverview farmerId={Number(farmerId)} />
          )}

          {/* FARM DIARY TAB */}
          {activeTab === "diary" && (
            <FarmDiary 
              farmerId={Number(farmerId)} 
              seasons={seasons} 
            />
          )}
        </div>

        {/* ✅ Footer */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
          {activeTab === "details" || activeTab === "pricing" || activeTab === "status" ? (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 rounded bg-brand-green text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : form.id || product?.id ? "Update Product" : "Save Product"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}