// src/components/Products/ProductsModal.tsx
import React, { useState, useEffect } from "react";
import { farmProductsApi, FarmProduct as ApiFarmProduct } from "../../services/farmProductsApi";

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
  const [activeTab, setActiveTab] = useState<"details" | "pricing" | "status">(
    "details"
  );

  // ✅ Pre-fill form if editing
  useEffect(() => {
    if (product) setForm(product);
  }, [product]);

  const handleSave = async () => {
    try {
      setLoading(true);
      if (product?.id) {
        await farmProductsApi.update(String(product.id), form as FarmProduct);
      } else {
        await farmProductsApi.add({ ...form, farmer_id: farmerId } as FarmProduct);
      }
      onProductAdded();
      onClose();
    } catch (err) {
      console.error("Error saving product:", err);
      alert("⚠️ Failed to save product. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4 text-brand-dark dark:text-brand-apple">
          {product ? "Edit Product" : "Add New Product"}
        </h2>

        {/* ✅ Tab Navigation */}
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

        {/* ✅ Tab Content */}
        <div className="space-y-3">
          {activeTab === "details" && (
            <>
              <input
                type="text"
                placeholder="Product Name"
                className="w-full p-2 border rounded"
                value={form.product_name}
                onChange={(e) =>
                  setForm({ ...form, product_name: e.target.value })
                }
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
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
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
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
              />
              <input
                type="number"
                placeholder="Price (Ksh)"
                className="w-full p-2 border rounded"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) })
                }
              />
            </>
          )}

          {activeTab === "status" && (
            <>
              <select
                className="w-full p-2 border rounded"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as FarmProduct["status"],
                  })
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
                  onChange={(e) =>
                    setForm({ ...form, spoilage_reason: e.target.value })
                  }
                />
              )}
            </>
          )}
        </div>

        {/* ✅ Footer Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-400 text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded bg-brand-green text-white disabled:opacity-50"
          >
            {loading ? "Saving..." : product ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
