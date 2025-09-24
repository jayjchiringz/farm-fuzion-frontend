// farm-fuzion-frontend/src/pages/FarmProducts.tsx
import React, { useEffect, useState } from "react";
import { farmProductsApi, FarmProduct } from "../services/farmProductsApi"; // ✅ import FarmProduct from api service
import { Plus, Loader2 } from "lucide-react";

export default function FarmProducts() {
  const farmer = JSON.parse(localStorage.getItem("user") || "{}");
  const [products, setProducts] = useState<FarmProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [form, setForm] = useState<Partial<FarmProduct>>({
    product_name: "",
    quantity: 0,
    unit: "",
    category: "produce",
    price: 0,
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await farmProductsApi.getFarmerProducts(farmer?.id);
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddProduct = async () => {
    try {
      await farmProductsApi.add({
        ...form,
        farmer_id: farmer.id,
        status: "available",
      } as FarmProduct);
      setShowModal(false);
      loadProducts(); // refresh table
    } catch (err) {
      console.error("Error adding product:", err);
    }
  };

  return (
    <div className="p-6 text-brand-dark dark:text-brand-apple bg-slate-50 dark:bg-brand-dark min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products & Services</h1>
        <button
          onClick={() => setShowModal(true)}
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
              </tr>
            </thead>
            <tbody>
              {products.map((p, idx) => (
                <tr key={idx} className="border-t dark:border-slate-700">
                  <td className="px-4 py-2">{p.product_name}</td>
                  <td className="px-4 py-2">{p.quantity}</td>
                  <td className="px-4 py-2">{p.unit}</td>
                  <td className="px-4 py-2">{p.category}</td>
                  <td className="px-4 py-2">Ksh {p.price}</td>
                  <td className="px-4 py-2 capitalize">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for adding product */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-[#022d26] p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add New Product</h2>
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
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-400 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 rounded bg-brand-green text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
