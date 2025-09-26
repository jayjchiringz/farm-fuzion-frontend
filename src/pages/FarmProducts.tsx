// farm-fuzion-frontend/src/pages/FarmProducts.tsx
import React, { useEffect, useState } from "react";
import { farmProductsApi, FarmProduct as ApiFarmProduct } from "../services/farmProductsApi";
import { Plus, Loader2, Trash2, Edit, AlertTriangle } from "lucide-react";

// ✅ Extend FarmProduct to include spoilage_reason (until OpenAPI spec regenerates)
export type FarmProduct = ApiFarmProduct & {
  id: string; // Ensure id is present
  spoilage_reason?: string;
};

export default function FarmProducts() {
  const farmer = JSON.parse(localStorage.getItem("user") || "{}");
  const [products, setProducts] = useState<FarmProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FarmProduct | null>(null);

  // ✅ Form state
  const [form, setForm] = useState<Partial<FarmProduct>>({
    product_name: "",
    quantity: 0,
    unit: "",
    category: "produce",
    price: 0,
    status: "available",
    spoilage_reason: "",
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await farmProductsApi.getFarmerProducts(farmer?.id);
      setProducts(data as FarmProduct[]); // cast to extended type
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = async () => {
    try {
      if (editing) {
        await farmProductsApi.update(editing.id!, form as FarmProduct);
      } else {
        await farmProductsApi.add({
          ...form,
          farmer_id: farmer.id,
        } as FarmProduct);
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      loadProducts();
    } catch (err) {
      console.error("Error saving product:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await farmProductsApi.remove(id);
      loadProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleSpoil = async (product: FarmProduct) => {
    const reason = prompt("Enter spoilage reason:", "Pests/Disease");
    if (!reason) return;
    try {
      await farmProductsApi.update(product.id!, {
        status: "hidden",
        spoilage_reason: reason,
      } as Partial<FarmProduct>);
      loadProducts();
    } catch (err) {
      console.error("Error marking product spoiled:", err);
    }
  };

  const editProduct = (product: FarmProduct) => {
    setEditing(product);
    setForm(product);
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({
      product_name: "",
      quantity: 0,
      unit: "",
      category: "produce",
      price: 0,
      status: "available",
      spoilage_reason: "",
    });
  };

  return (
    <div className="p-6 text-brand-dark dark:text-brand-apple bg-slate-50 dark:bg-brand-dark min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products & Services</h1>
        <button
          onClick={() => {
            resetForm();
            setEditing(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin w-8 h-8 text-brand-green" />
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-[#0f4439] rounded-lg shadow border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left">
            <thead className="bg-slate-100 dark:bg-[#0a3d32]">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Unit</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t dark:border-slate-700">
                  <td className="px-4 py-2">{p.product_name}</td>
                  <td className="px-4 py-2">{p.quantity}</td>
                  <td className="px-4 py-2">{p.unit}</td>
                  <td className="px-4 py-2">{p.category}</td>
                  <td className="px-4 py-2">Ksh {p.price}</td>
                  <td className="px-4 py-2 capitalize">{p.status}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      className="p-1 text-blue-600 hover:text-blue-800"
                      onClick={() => editProduct(p)}
                      title="Edit Product"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="p-1 text-yellow-600 hover:text-yellow-800"
                      onClick={() => handleSpoil(p)}
                      title="Mark as Spoiled"
                    >
                      <AlertTriangle size={16} />
                    </button>
                    <button
                      className="p-1 text-red-600 hover:text-red-800"
                      onClick={() => handleDelete(p.id!)}
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for add/edit */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-[#022d26] p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {editing ? "Edit Product" : "Add New Product"}
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
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditing(null);
                  resetForm();
                }}
                className="px-4 py-2 rounded bg-gray-400 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded bg-brand-green text-white"
              >
                {editing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
