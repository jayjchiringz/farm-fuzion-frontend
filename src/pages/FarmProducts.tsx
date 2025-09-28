// src/pages/FarmProducts.tsx
import React, { useEffect, useState } from "react";
import { farmProductsApi, FarmProduct, PaginatedResponse } from "../services/farmProductsApi";
import ProductsModal from "../components/Products/ProductsModal";

export default function FarmProductsPage() {
  const farmerId = "demo-farmer-123"; // 🔧 replace with actual logged-in farmer ID

  const [products, setProducts] = useState<PaginatedResponse<FarmProduct> | null>(null);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 5;

  // ✅ Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FarmProduct | undefined>(undefined);

  // ✅ Load products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await farmProductsApi.getFarmerProducts(farmerId, page, limit);
      setProducts(res);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-brand-dark dark:text-brand-apple">
          Farm Products
        </h1>
        <button
          onClick={() => {
            setSelectedProduct(undefined);
            setShowModal(true);
          }}
          className="bg-brand-green text-white px-4 py-2 rounded"
        >
          + Add Product
        </button>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : !products || products.data.length === 0 ? (
        <p className="text-gray-500">No products found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-left">
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
              {products.data.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">{p.product_name}</td>
                  <td className="px-3 py-2">{p.quantity}</td>
                  <td className="px-3 py-2">{p.unit}</td>
                  <td className="px-3 py-2">Ksh {p.price}</td>
                  <td className="px-3 py-2 capitalize">{p.status}</td>
                  <td className="px-3 py-2">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        setSelectedProduct(p);
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
              Page {products.page} of {Math.ceil(products.total / products.limit)}
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
                disabled={page >= Math.ceil(products.total / limit)}
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
        <ProductsModal
          farmerId={farmerId}
          product={selectedProduct}
          onClose={() => setShowModal(false)}
          onProductAdded={loadProducts}
        />
      )}
    </div>
  );
}
