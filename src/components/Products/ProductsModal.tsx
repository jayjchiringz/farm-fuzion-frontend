// src/components/Products/ProductsModal.tsx
import React, { useState, useEffect } from "react";
import { farmProductsApi, FarmProduct as ApiFarmProduct } from "../../services/farmProductsApi";
import { Edit } from "lucide-react";

// ✅ Extend FarmProduct with spoilage_reason
export type FarmProduct = ApiFarmProduct & {
  id?: string | number;
  spoilage_reason?: string;
};

interface ProductsModalProps {
  farmerId: string;
  onClose: () => void;
  onProductAdded: () => void;
  product?: FarmProduct; // ✅ optional, for editing
}

export default function ProductsModal({
  farmerId,
  onClose,
  onProductAdded,
  product,
}: ProductsModalProps) {
  const [form, setForm] = useState<Partial<FarmProduct>>({
    product_name: "",
    quantity: 0,
    unit: "",
    category: "produce",
    price: 0,
    status: "available",
    spoilage_reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "pricing" | "status" | "inventory">("details");
  const [inventory, setInventory] = useState<FarmProduct[]>([]);

  // ✅ Pre-fill form if editing
  useEffect(() => {
    if (product) setForm(product);
  }, [product]);

  // ✅ Load inventory records
  const loadInventory = async () => {
    try {
      const data = await farmProductsApi.getFarmerProducts(farmerId);
      setInventory(data as FarmProduct[]);
    } catch (err) {
      console.error("Error loading inventory:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "inventory") {
      loadInventory();
    }
  }, [activeTab]);

  const handleSave = async () => {
    try {
      setLoading(true);
      if (product?.id || form.id) {
        await farmProductsApi.update(String(product?.id || form.id), form as FarmProduct);
      } else {
        await farmProductsApi.add({ ...form, farmer_id: farmerId } as FarmProduct);
      }
      onProductAdded();
      loadInventory(); // refresh inventory after save
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
    setActiveTab("details"); // jump to editing form
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-lg max-w-3xl w-full">
        <h2 className="text-xl font-bold mb-4 text-brand-dark dark:text-brand-apple">
          {product ? "Edit Product" : "Manage Products"}
        </h2>

        {/* ✅ Tab Navigation */}
        <div className="flex border-b mb-4">
          {["details", "pricing", "status", "inventory"].map((tab) => (
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

        {/* ✅ Tab Content */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {activeTab === "details" && (
            <>
              <input
                type="text"
                placeholder="Product Name"
                className="w-full p-2 border rounded"
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Unit (e.g. kg, bag, litre)"
                className="w-full p-2 border rounded"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
              <input
                type="text"
                placeholder="Category (produce/input/service)"
                className="w-full p-2 border rounded"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </>
          )}

          {activeTab === "pricing" && (
            <>
              <input
                type="number"
                placeholder="Quantity"
                className="w-full p-2 border rounded"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              />
              <input
                type="number"
                placeholder="Price (Ksh)"
                className="w-full p-2 border rounded"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </>
          )}

          {activeTab === "status" && (
            <>
              <select
                className="w-full p-2 border rounded"
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
                <input
                  type="text"
                  placeholder="Reason for spoilage"
                  className="w-full p-2 border rounded"
                  value={form.spoilage_reason}
                  onChange={(e) => setForm({ ...form, spoilage_reason: e.target.value })}
                />
              )}
            </>
          )}

          {/* ✅ Inventory Tab */}
          {activeTab === "inventory" && (
            <div className="overflow-x-auto">
              {inventory.length === 0 ? (
                <p className="text-gray-500 text-sm">No products in inventory yet.</p>
              ) : (
                <table className="w-full text-left border">
                  <thead className="bg-slate-100 dark:bg-[#0a3d32]">
                    <tr>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-3 py-2">{p.product_name}</td>
                        <td className="px-3 py-2">{p.quantity}</td>
                        <td className="px-3 py-2">{p.unit}</td>
                        <td className="px-3 py-2">Ksh {p.price}</td>
                        <td className="px-3 py-2 capitalize">{p.status}</td>
                        <td className="px-3 py-2">
                          <button
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => handleEditFromInventory(p)}
                            title="Edit product"
                            aria-label="Edit product"
                          >
                            <Edit size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* ✅ Footer Actions */}
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
