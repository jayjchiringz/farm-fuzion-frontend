// src/components/Products/ProductsModal.tsx
import React, { useState, useEffect } from "react";
import { farmProductsApi } from "../services/farmProductsApi";
import { components } from "../../types/api";

type FarmProduct = components["schemas"]["FarmProduct"];

interface ProductsModalProps {
  farmerId: string;
  onClose: () => void;
  onProductAdded: () => void;
  product?: FarmProduct & { id?: string }; // ✅ optional product for editing
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
  });

  const [loading, setLoading] = useState(false);

  // ✅ Pre-fill when editing
  useEffect(() => {
    if (product) {
      setForm(product);
    }
  }, [product]);

  const handleSave = async () => {
    try {
      setLoading(true);

      if (product?.id) {
        // ✅ Update existing
        await farmProductsApi.update(product.id, form as FarmProduct);
      } else {
        // ✅ Add new
        await farmProductsApi.add({
          ...form,
          farmer_id: farmerId,
          status: "available",
        } as FarmProduct);
      }

      onProductAdded(); // refresh parent list
      onClose(); // close modal
    } catch (err) {
      console.error("Error saving product:", err);
      alert("⚠️ Failed to save product. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-brand-dark dark:text-brand-apple">
          {product ? "Edit Product" : "Add New Product"}
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
