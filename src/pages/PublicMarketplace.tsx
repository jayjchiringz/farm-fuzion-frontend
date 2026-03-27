// farm-fuzion-frontend/src/pages/PublicMarketplace.tsx
import React, { useState, useEffect } from "react";
import { Search, Filter, Package, MapPin, DollarSign, TrendingUp } from "lucide-react";
import { cooperativeApi, CooperativeProduct } from "../services/cooperativeApi";
import { useCurrency } from "../contexts/CurrencyContext";

export default function PublicMarketplace() {
  const [products, setProducts] = useState<CooperativeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const { formatKES } = useCurrency();

  useEffect(() => {
    loadData();
  }, [search, selectedCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData, statsData] = await Promise.all([
        cooperativeApi.getAllProducts({
          search: search || undefined,
          category: selectedCategory || undefined,
          limit: 50,
        }),
        cooperativeApi.getCategories(),
        cooperativeApi.getMarketplaceStats(),
      ]);
      
      setProducts(productsData.data);
      setCategories(categoriesData.categories);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading marketplace:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">Kenyan Agricultural Marketplace</h1>
          <p className="text-xl text-white/90 mb-8">
            Connect directly with cooperatives and farmers for bulk agricultural produce
          </p>
          
          {/* Search Bar */}
          <div className="flex gap-4 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Package size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="text-2xl font-bold">{stats.total_products}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Cooperatives</p>
                  <p className="text-2xl font-bold">{stats.total_cooperatives}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <DollarSign size={24} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.total_orders}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-600">No products found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg">{product.product_name}</h3>
                    {product.certification && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {product.certification}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{product.description || "Premium quality produce from Kenyan farmers"}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Quantity:</span>
                      <span className="font-medium">{product.quantity.toLocaleString()} {product.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-bold text-green-600">{formatKES(product.price_per_unit)}/{product.unit}</span>
                    </div>
                    {product.category && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Category:</span>
                        <span>{product.category}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => window.location.href = `/product/${product.id}`}
                    className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
