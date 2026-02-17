// src/pages/FarmProducts.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  farmProductsApi,
  FarmProduct,
  PaginatedResponse,
  ProductStatus,
} from "../services/farmProductsApi";
import ProductsModal from "../components/Products/ProductsModal";
import { useAuth } from "../contexts/AuthContext";

export default function FarmProductsPage() {
  const { getFarmerId, user, loading: authLoading } = useAuth();
  const [numericFarmerId, setNumericFarmerId] = useState<number | null>(null);
  const [fetchingFarmerId, setFetchingFarmerId] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<PaginatedResponse<FarmProduct> | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 5;

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<ProductStatus | "">("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FarmProduct | undefined>(
    undefined
  );

  // Get numeric farmer ID from auth context when user is available
  useEffect(() => {
    const fetchNumericFarmerId = async () => {
      console.log("Auth user:", user);
      
      if (!user) {
        console.log("No user found");
        setNumericFarmerId(null);
        return;
      }

      setFetchingFarmerId(true);
      setError(null);
      
      try {
        console.log("Calling getFarmerId() for user:", user.id);
        const id = await getFarmerId();
        console.log("getFarmerId() returned:", id, "type:", typeof id);
        
        if (id === null) {
          setError("No farmer profile found for this user");
          setNumericFarmerId(null);
        } else {
          // Ensure it's a number
          const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
          if (!isNaN(numericId) && numericId > 0) {
            console.log("✅ Valid numeric farmer ID:", numericId);
            setNumericFarmerId(numericId);
          } else {
            setError("Invalid farmer ID format");
            setNumericFarmerId(null);
          }
        }
      } catch (error) {
        console.error("Error fetching numeric farmer ID:", error);
        setError("Failed to load farmer profile");
        setNumericFarmerId(null);
      } finally {
        setFetchingFarmerId(false);
      }
    };

    fetchNumericFarmerId();
  }, [user, getFarmerId]);

  // Load products
  const loadProducts = async () => {
    if (!numericFarmerId) {
      console.warn("No numeric farmer ID available yet");
      return;
    }

    console.log("Loading products for numeric ID:", numericFarmerId);
    setLoading(true);
    try {
      const res = await farmProductsApi.getFarmerProducts(
        String(numericFarmerId),
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
    if (numericFarmerId) {
      loadProducts();
    }
  }, [numericFarmerId, page, searchTerm, filterCategory, filterStatus]);

  // Dynamic filter values
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

  const handleAddProduct = () => {
    if (!numericFarmerId) {
      alert("Please log in to add products");
      return;
    }
    console.log("Opening add product modal with numeric ID:", numericFarmerId);
    setSelectedProduct(undefined);
    setShowModal(true);
  };

  const handleEditProduct = (product: FarmProduct) => {
    if (!numericFarmerId) {
      alert("Please log in to edit products");
      return;
    }
    console.log("Opening edit product modal with numeric ID:", numericFarmerId);
    setSelectedProduct(product);
    setShowModal(true);
  };

  if (authLoading || fetchingFarmerId) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-brand-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-brand-green text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!numericFarmerId) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Please log in to access farm products</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Debug info - remove in production */}
      <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded text-sm">
        <p>🔧 Debug Info:</p>
        <p>Numeric Farmer ID: <strong>{numericFarmerId}</strong> (type: {typeof numericFarmerId})</p>
        <p>User UUID: <strong>{user?.id}</strong></p>
        <p>Modal will open with: <strong>{numericFarmerId}</strong></p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-brand-dark dark:text-brand-apple">
          Farm Products
        </h1>
        <button
          onClick={handleAddProduct}
          className="bg-brand-green text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          + Add Product
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="p-2 border rounded flex-1 min-w-[180px] dark:bg-gray-800 dark:border-gray-700"
        />
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(1);
          }}
          className="p-2 border rounded min-w-[160px] dark:bg-gray-800 dark:border-gray-700"
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
          className="p-2 border rounded min-w-[140px] dark:bg-gray-800 dark:border-gray-700"
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
        <div className="flex justify-center items-center py-10">
          <svg className="animate-spin h-6 w-6 text-brand-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span className="ml-2">Loading products...</span>
        </div>
      ) : !products || products.data.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p className="text-4xl mb-2">📦</p>
          <p>No products found.</p>
          <button
            onClick={handleAddProduct}
            className="mt-3 text-brand-green hover:underline"
          >
            + Add your first product
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-left dark:border-gray-700">
            <thead className="bg-slate-100 dark:bg-gray-800">
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
                        onClick={() => handleEditProduct(p)}
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
                className="px-2 py-1 border rounded disabled:opacity-50 dark:border-gray-700"
              >
                Prev
              </button>
              <button
                disabled={page >= Math.ceil(products.total / limit)}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 border rounded disabled:opacity-50 dark:border-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Now passing the numeric ID */}
      {showModal && numericFarmerId && (
        <ProductsModal
          farmerId={numericFarmerId} // This is now a number!
          product={selectedProduct}
          onClose={() => setShowModal(false)}
          onProductAdded={loadProducts}
        />
      )}
    </div>
  );
}
