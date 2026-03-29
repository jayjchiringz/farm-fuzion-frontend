// farm-fuzion-frontend/src/pages/PublicMarketplace.tsx
import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, Filter, Package, MapPin, DollarSign, TrendingUp, 
  Globe, Leaf, Award, Shield, Truck, CreditCard, Users,
  ChevronLeft, ChevronRight, X, Loader2, AlertCircle,
  Star, Calendar, ArrowUpRight, ShoppingCart, Building2
} from "lucide-react";
import { useCurrency } from "../contexts/CurrencyContext";

// Public API URL - uses the same environment variable
const PUBLIC_API_URL = import.meta.env.VITE_PUBLIC_API_URL || "https://farmfuzion-public-api.onrender.com";

interface PublicProduct {
  id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  currency: string;
  total_price: number;
  available: boolean;
  certification?: string;
  description?: string;
  created_at: string;
  cooperative_name?: string;
  source_farmer_name?: string;
}

interface MarketplaceStats {
  total_products: number;
  total_cooperatives: number;
  total_orders: number;
  categories: Array<{ name: string; count: number }>;
}

export default function PublicMarketplace() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Order form
  const [orderForm, setOrderForm] = useState({
    buyer_name: "",
    buyer_company: "",
    buyer_email: "",
    buyer_phone: "",
    buyer_country: "Kenya",
    quantity: 1,
    shipping_address: "",
    notes: ""
  });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  
  const { formatKES } = useCurrency();
  const itemsPerPage = 12;

  // Fetch products with filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (search) params.append("search", search);
      if (priceRange.min > 0) params.append("min_price", priceRange.min.toString());
      if (priceRange.max < 1000000) params.append("max_price", priceRange.max.toString());
      params.append("sort", sortBy);
      params.append("limit", itemsPerPage.toString());
      params.append("offset", ((currentPage - 1) * itemsPerPage).toString());

      const response = await fetch(`${PUBLIC_API_URL}/api/v1/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      
      const data = await response.json();
      setProducts(data.data || []);
      setTotalProducts(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Unable to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search, priceRange, sortBy, currentPage]);

  // Fetch stats and categories
  const fetchStatsAndCategories = async () => {
    try {
      const [statsRes, categoriesRes] = await Promise.all([
        fetch(`${PUBLIC_API_URL}/api/v1/stats`),
        fetch(`${PUBLIC_API_URL}/api/v1/categories`)
      ]);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchStatsAndCategories();
  }, []);

  // Handle order submission
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setOrderSubmitting(true);
    try {
      const response = await fetch(`${PUBLIC_API_URL}/api/v1/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          buyer_name: orderForm.buyer_name,
          buyer_company: orderForm.buyer_company || undefined,
          buyer_email: orderForm.buyer_email,
          buyer_phone: orderForm.buyer_phone || undefined,
          buyer_country: orderForm.buyer_country,
          quantity: orderForm.quantity,
          shipping_address: orderForm.shipping_address || undefined,
          notes: orderForm.notes || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Order failed");
      }
      
      const result = await response.json();
      setOrderSuccess(`Order #${result.id.slice(0, 12)} created! Total: ${formatKES(result.total_amount)}`);
      setOrderForm({
        buyer_name: "",
        buyer_company: "",
        buyer_email: "",
        buyer_phone: "",
        buyer_country: "Kenya",
        quantity: 1,
        shipping_address: "",
        notes: ""
      });
      setTimeout(() => setOrderSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to place order. Please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setPriceRange({ min: 0, max: 1000000 });
    setSortBy("newest");
    setCurrentPage(1);
  };

  const getCertificationBadge = (certification?: string) => {
    if (!certification) return null;
    const badges: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      organic: { color: "bg-green-100 text-green-800", icon: <Leaf size={12} />, label: "Organic" },
      "fair-trade": { color: "bg-blue-100 text-blue-800", icon: <Award size={12} />, label: "Fair Trade" },
      "rainforest-alliance": { color: "bg-emerald-100 text-emerald-800", icon: <Shield size={12} />, label: "Rainforest Alliance" },
    };
    const badge = badges[certification.toLowerCase()];
    if (!badge) return null;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  // Product Detail Modal
  const ProductDetailModal = () => {
    if (!selectedProduct) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{selectedProduct.product_name}</h2>
              {selectedProduct.cooperative_name && (
                <p className="text-sm text-gray-500">by {selectedProduct.cooperative_name}</p>
              )}
            </div>
            <button onClick={() => { setShowDetailModal(false); setSelectedProduct(null); }} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Info */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Product Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Available:</span>
                      <span className="font-medium">{selectedProduct.quantity} {selectedProduct.unit}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Price:</span>
                      <span className="font-bold text-brand-green">{formatKES(selectedProduct.price_per_unit)}/{selectedProduct.unit}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Total Value:</span>
                      <span>{formatKES(selectedProduct.total_price)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Category:</span>
                      <span>{selectedProduct.category || "General"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Listed:</span>
                      <span>{formatDate(selectedProduct.created_at)}</span></div>
                  </div>
                </div>
                {selectedProduct.description && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProduct.description}</p>
                  </div>
                )}
              </div>
              
              {/* Order Form */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><ShoppingCart size={18} /> Place Bulk Order</h3>
                {orderSuccess && <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 text-green-800 rounded-lg text-sm">✅ {orderSuccess}</div>}
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium mb-1">Full Name *</label>
                      <input type="text" required value={orderForm.buyer_name} onChange={(e) => setOrderForm({ ...orderForm, buyer_name: e.target.value })}
                        className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="John Doe" /></div>
                    <div><label className="block text-sm font-medium mb-1">Company</label>
                      <input type="text" value={orderForm.buyer_company} onChange={(e) => setOrderForm({ ...orderForm, buyer_company: e.target.value })}
                        className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="Company Name" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium mb-1">Email *</label>
                      <input type="email" required value={orderForm.buyer_email} onChange={(e) => setOrderForm({ ...orderForm, buyer_email: e.target.value })}
                        className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="buyer@example.com" /></div>
                    <div><label className="block text-sm font-medium mb-1">Phone</label>
                      <input type="tel" value={orderForm.buyer_phone} onChange={(e) => setOrderForm({ ...orderForm, buyer_phone: e.target.value })}
                        className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="+254..." /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium mb-1">Country *</label>
                      <input type="text" required value={orderForm.buyer_country} onChange={(e) => setOrderForm({ ...orderForm, buyer_country: e.target.value })}
                        className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="Kenya" /></div>
                    <div><label className="block text-sm font-medium mb-1">Quantity ({selectedProduct.unit}) *</label>
                      <input type="number" min="1" max={selectedProduct.quantity} required value={orderForm.quantity}
                        onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })}
                        className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700" />
                      <p className="text-xs text-gray-500 mt-1">Max: {selectedProduct.quantity} {selectedProduct.unit}</p></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Shipping Address</label>
                    <textarea value={orderForm.shipping_address} onChange={(e) => setOrderForm({ ...orderForm, shipping_address: e.target.value })}
                      rows={2} className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="Full delivery address" /></div>
                  <div><label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                      rows={2} className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700" placeholder="Special instructions..." /></div>
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-lg">
                    <div className="flex justify-between text-sm mb-1"><span>Subtotal:</span><span>{formatKES(selectedProduct.price_per_unit * orderForm.quantity)}</span></div>
                    <div className="flex justify-between text-sm mb-2"><span>Shipping:</span><span>To be calculated</span></div>
                    <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span>Estimated Total:</span><span className="text-brand-green">{formatKES(selectedProduct.price_per_unit * orderForm.quantity)}</span></div>
                  </div>
                  <button type="submit" disabled={orderSubmitting}
                    className="w-full bg-brand-green text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {orderSubmitting ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <><ShoppingCart size={18} /> Place Order</>}
                  </button>
                  <p className="text-xs text-center text-gray-500">Payment options will be sent via email. Our team will contact you within 24 hours.</p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-brand-green to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">FarmFuzion Global Agro-Marketplace</h1>
          <p className="text-xl text-white/90 max-w-2xl mb-6">
            Connect directly with cooperatives and farmers for bulk agricultural produce
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2"><Leaf size={16} /><span className="text-sm">Certified Organic</span></div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2"><Truck size={16} /><span className="text-sm">Bulk Shipping</span></div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2"><Shield size={16} /><span className="text-sm">Verified Suppliers</span></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"><div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><Package className="text-green-600" size={20} /></div>
              <div><p className="text-2xl font-bold">{stats.total_products}</p><p className="text-xs text-gray-500">Products</p></div>
            </div></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"><div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><Building2 className="text-purple-600" size={20} /></div>
              <div><p className="text-2xl font-bold">{stats.total_cooperatives}</p><p className="text-xs text-gray-500">Cooperatives</p></div>
            </div></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"><div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"><Truck className="text-orange-600" size={20} /></div>
              <div><p className="text-2xl font-bold">{stats.total_orders}</p><p className="text-xs text-gray-500">Orders</p></div>
            </div></div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"><div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Globe className="text-blue-600" size={20} /></div>
              <div><p className="text-2xl font-bold">Global</p><p className="text-xs text-gray-500">Market Access</p></div>
            </div></div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" />
            </div>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <button onClick={resetFilters} className="px-4 py-2 text-gray-600 hover:text-gray-900">Clear Filters</button>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-brand-green" /></div>
        ) : error ? (
          <div className="text-center py-12"><AlertCircle size={48} className="mx-auto text-red-500 mb-4" /><p className="text-red-600">{error}</p>
            <button onClick={fetchProducts} className="mt-4 px-4 py-2 bg-brand-green text-white rounded-lg">Try Again</button></div>
        ) : products.length === 0 ? (
          <div className="text-center py-12"><Package size={48} className="mx-auto text-gray-400 mb-4" /><h3 className="text-xl font-medium">No products found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(product => (
              <div key={product.id} onClick={() => { setSelectedProduct(product); setShowDetailModal(true); }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer group">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg group-hover:text-brand-green transition-colors">{product.product_name}</h3>
                    {getCertificationBadge(product.certification)}
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Quantity:</span><span>{product.quantity} {product.unit}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Price:</span><span className="font-bold text-brand-green">{formatKES(product.price_per_unit)}/{product.unit}</span></div>
                    {product.cooperative_name && <div className="flex justify-between text-xs text-gray-500"><span>Cooperative:</span><span className="truncate max-w-[150px]">{product.cooperative_name}</span></div>}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12} />{formatDate(product.created_at)}</div>
                    <button className="text-brand-green text-sm font-medium flex items-center gap-1">View Details<ArrowUpRight size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100"><ChevronLeft size={18} /></button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100"><ChevronRight size={18} /></button>
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-2 text-gray-500"><Shield size={20} /><span className="text-sm">Secure Transactions</span></div>
            <div className="flex items-center gap-2 text-gray-500"><CreditCard size={20} /><span className="text-sm">Multiple Payment Options</span></div>
            <div className="flex items-center gap-2 text-gray-500"><Truck size={20} /><span className="text-sm">Global Shipping</span></div>
            <div className="flex items-center gap-2 text-gray-500"><Users size={20} /><span className="text-sm">Direct from Cooperatives</span></div>
          </div>
        </div>
      </div>

      {showDetailModal && <ProductDetailModal />}
    </div>
  );
}
