// src/pages/FarmProducts.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  farmProductsApi,
  FarmProduct,
  PaginatedResponse,
  ProductStatus,
} from "../services/farmProductsApi";
import ProductsModal from "../components/Products/ProductsModal";

export default function FarmProductsPage() {
  const farmerId = "demo-farmer-123"; // 🔧 replace with actual logged-in farmer ID

  const [products, setProducts] = useState<PaginatedResponse<FarmProduct> | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 5;

  // ✅ Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<ProductStatus | "">("");

  // ✅ Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FarmProduct | undefined>(
    undefined
  );

  // ✅ Load products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await farmProductsApi.getFarmerProducts(
        farmerId,
        page,
        limit,
        {
          search: searchTerm || undefined,
          category: filterCategory || undefined,
          status: (filterStatus as ProductStatus) || undefined,
        }
      );
      setProducts(res);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, searchTerm, filterCategory, filterStatus]);

  // ✅ Dynamic filter values (from loaded products)
  const categories = useMemo(
    () =>
      Array.from(
        new Set(products?.data.map((p) => p.category).filter(Boolean) ?? [])
      ),
    [products]
  );
  const statuses = useMemo(
    () =>
      Array.from(
        new Set(products?.data.map((p) => p.status).filter(Boolean) ?? [])
      ),
    [products]
  );

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

      {/* ✅ Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="p-2 border rounded flex-1 min-w-[180px]"
        />
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(1);
          }}
          className="p-2 border rounded min-w-[160px]"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value as ProductStatus | "");
            setPage(1);
          }}
          className="p-2 border rounded min-w-[140px]"
        >
          <option value="">All Status</option>
          {statuses.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
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
                <th className="px-3 py-2">Unit Price</th>
                <th className="px-3 py-2">Price (Total)</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.data.map((p) => {
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
                        onClick={() => {
                          setSelectedProduct(p);
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
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
