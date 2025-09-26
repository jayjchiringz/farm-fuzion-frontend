// src/components/Products/ProductsModal.tsx
import React, { useState } from "react";
import { farmProductsApi, FarmProduct as ApiFarmProduct } from "../../services/farmProductsApi";

// ✅ Extend FarmProduct with spoilage_reason
export type FarmProduct = ApiFarmProduct & {
  spoilage_reason?: string;
};

interface ProductsModalProps {
  farmerId: string;
  onClose: () => void;
  onProductAdded: () => void;
}

export default function ProductsModal({
  farmerId,
  onClose,
  onProductAdded,
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

  const handleAddProduct = async () => {
    try {
      setLoading(true);
      await farmProductsApi.add({
        ...form,
        farmer_id: farmerId,
      } as FarmProduct);

      onProductAdded(); // refresh parent list
      onClose(); // close modal
    } catch (err) {
      console.error("Error adding product:", err);
      alert("⚠️ Failed to add product. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-brand-dark dark:text-brand-apple">
          Add New Product
        </h2>

        <div className="space-y-3">
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
            type="number"
            placeholder="Quantity"
            className="w-full p-2 border rounded"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: Number(e.target.value) })
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
            onChange={(e) => setForm({ ...form, category: e.target.value })}
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
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-400 text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleAddProduct}
            disabled={loading}
            className="px-4 py-2 rounded bg-brand-green text-white disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
