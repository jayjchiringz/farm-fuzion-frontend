// src/components/Products/ProductsModal.tsx
import React, { useState, useEffect } from "react";
import {
  farmProductsApi,
  FarmProduct as ApiFarmProduct,
  PaginatedResponse,
  ProductStatus,
} from "../../services/farmProductsApi";
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

  const [loading, setLoading] = useState(false); // save loader
  const [loadingInventory, setLoadingInventory] = useState(false); // inventory loader
  const [activeTab, setActiveTab] = useState<
    "details" | "pricing" | "status" | "inventory"
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

  // ✅ Pre-fill form if editing
  useEffect(() => {
    if (product) setForm(product);
  }, [product]);

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

  const handleEditFromInventory = (p: FarmProduct) => {
    setForm(p);
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

  // ✅ Determine modal title
  const modalTitle =
    activeTab === "inventory"
      ? "Inventory"
      : form.id || product?.id
      ? "Edit Product"
      : "Add New Product";

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
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>

        {/* ✅ Tabs */}
        {activeTab !== "inventory" && (
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
        )}

        {/* ✅ Content */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Product details / pricing / status unchanged ... */}

          {activeTab === "inventory" && (
            <div className="overflow-x-auto">
              {/* ✅ Filter Bar */}
              <div className="flex flex-wrap gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="p-2 border rounded flex-1 min-w-[180px]"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="p-2 border rounded min-w-[160px]"
                >
                  <option value="">All Categories</option>
                  {/* categories ideally should come from backend */}
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
                  className="p-2 border rounded min-w-[140px]"
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              {loadingInventory ? (
                <div className="flex justify-center items-center py-10 text-gray-500">
                  <svg
                    className="animate-spin h-6 w-6 mr-2 text-brand-green"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Refreshing inventory…
                </div>
              ) : !inventory || inventory.data.length === 0 ? (
                <p className="text-gray-500 text-sm">No products match the filters.</p>
              ) : (
                <>
                  <table className="w-full text-left border">
                    <thead className="bg-slate-100 dark:bg-[#0a3d32]">
                      <tr>
                        <th className="px-3 py-2">Product</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Unit</th>
                        <th className="px-3 py-2">Unit Price</th>
                        <th className="px-3 py-2">Price (Total)</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.data.map((p) => {
                        const unitPrice =
                          p.quantity && p.quantity > 0 ? (p.price ?? 0) / p.quantity : 0;
                        return (
                          <tr key={p.id} className="border-t">
                            <td className="px-3 py-2">{p.product_name}</td>
                            <td className="px-3 py-2">{p.quantity}</td>
                            <td className="px-3 py-2">{p.unit}</td>
                            <td className="px-3 py-2">Ksh {unitPrice.toFixed(2)}</td>
                            <td className="px-3 py-2">Ksh {p.price}</td>
                            <td className="px-3 py-2 capitalize">{p.status}</td>
                            <td className="px-3 py-2">
                              <button
                                className="text-blue-600 hover:text-blue-800"
                                onClick={() => handleEditFromInventory(p)}
                                title="Edit Product"
                                aria-label="Edit Product"
                              >
                                <Edit size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* ✅ Pagination Controls */}
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

        {/* ✅ Footer */}
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
