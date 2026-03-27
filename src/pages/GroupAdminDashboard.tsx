// farm-fuzion-frontend/src/pages/GroupAdminDashboard.tsx
import React, { useState, useEffect } from "react";
import { 
  Building2, Package, TrendingUp, Users, ShoppingCart, 
  Plus, Edit2, Trash2, Eye, CheckCircle, XCircle, Clock,
  Truck, Search, Filter, RefreshCw, Loader2, MapPin,
  DollarSign, Calendar, Globe, FileText, Send, Mail
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import ThemeToggle from "../components/ThemeToggle";
import { useCurrency } from "../contexts/CurrencyContext";
import { cooperativeApi, Cooperative, CooperativeProduct, BulkOrder, Tender } from "../services/cooperativeApi";

type TabType = 'dashboard' | 'products' | 'orders' | 'tenders';

// Define the product form type with all required fields
interface ProductFormData {
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  certification: string;
  description: string;
  currency: string;
  available: boolean;
}

export default function GroupAdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [cooperative, setCooperative] = useState<Cooperative | null>(null);
  const [products, setProducts] = useState<CooperativeProduct[]>([]);
  const [orders, setOrders] = useState<BulkOrder[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CooperativeProduct | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>({
    product_name: '',
    category: '',
    quantity: 0,
    unit: 'kg',
    price_per_unit: 0,
    certification: '',
    description: '',
    currency: 'KES',
    available: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const { formatKES } = useCurrency();

  const admin = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = admin.first_name || admin.email?.split('@')[0] || 'Group Admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coopData, productsData, ordersData, tendersData] = await Promise.all([
        cooperativeApi.getMyCooperative(),
        cooperativeApi.getCooperativeProducts(),
        cooperativeApi.getOrders(),
        cooperativeApi.getOpenTenders(),
      ]);
      
      setCooperative(coopData);
      setProducts(productsData);
      setOrders(ordersData);
      setTenders(tendersData);
    } catch (error) {
      console.error('Error loading group admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await cooperativeApi.createProduct({
        product_name: productForm.product_name,
        category: productForm.category,
        quantity: productForm.quantity,
        unit: productForm.unit,
        price_per_unit: productForm.price_per_unit,
        certification: productForm.certification,
        description: productForm.description,
        currency: productForm.currency,
        available: productForm.available,
      });
      await loadData();
      setIsProductModalOpen(false);
      setProductForm({
        product_name: '',
        category: '',
        quantity: 0,
        unit: 'kg',
        price_per_unit: 0,
        certification: '',
        description: '',
        currency: 'KES',
        available: true,
      });
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setFormSubmitting(true);
    try {
      await cooperativeApi.updateProduct(editingProduct.id, {
        product_name: productForm.product_name,
        category: productForm.category,
        quantity: productForm.quantity,
        unit: productForm.unit,
        price_per_unit: productForm.price_per_unit,
        certification: productForm.certification,
        description: productForm.description,
        available: productForm.available,
      });
      await loadData();
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({
        product_name: '',
        category: '',
        quantity: 0,
        unit: 'kg',
        price_per_unit: 0,
        certification: '',
        description: '',
        currency: 'KES',
        available: true,
      });
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string, trackingNumber?: string) => {
    try {
      await cooperativeApi.updateOrderStatus(orderId, status, trackingNumber);
      await loadData();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={12} /> },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle size={12} /> },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: <Truck size={12} /> },
      delivered: { color: 'bg-green-100 text-green-800', icon: <CheckCircle size={12} /> },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <XCircle size={12} /> },
      open: { color: 'bg-green-100 text-green-800', icon: <CheckCircle size={12} /> },
      closed: { color: 'bg-gray-100 text-gray-800', icon: <Clock size={12} /> },
    };
    const cfg = config[status] || { color: 'bg-gray-100 text-gray-800', icon: null };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
        {cfg.icon}
        {status}
      </span>
    );
  };

  // Dashboard View
  const DashboardView = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Welcome, {adminName}!</h2>
        <p className="text-white/80 mt-1">
          Manage your cooperative's products and connect with global buyers
        </p>
        {cooperative && (
          <div className="mt-4 flex items-center gap-2 text-sm text-white/90">
            <Building2 size={16} />
            <span>{cooperative.name}</span>
            <span className="w-1 h-1 bg-white/50 rounded-full"></span>
            <MapPin size={14} />
            <span>{cooperative.county}, {cooperative.constituency}</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Products" 
          value={products.length.toString()}
          icon={<Package size={20} />}
          color="from-blue-500 to-blue-600"
        />
        <StatCard 
          label="Total Orders" 
          value={orders.length.toString()}
          icon={<ShoppingCart size={20} />}
          color="from-green-500 to-green-600"
        />
        <StatCard 
          label="Active Tenders" 
          value={tenders.filter(t => t.status === 'open').length.toString()}
          icon={<FileText size={20} />}
          color="from-purple-500 to-purple-600"
        />
        <StatCard 
          label="Revenue" 
          value={formatKES(orders.reduce((sum, o) => sum + o.total_amount, 0))}
          icon={<DollarSign size={20} />}
          color="from-orange-500 to-orange-600"
        />
      </div>

      {/* Recent Products */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Recent Products</h3>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setProductForm({
                product_name: '',
                category: '',
                quantity: 0,
                unit: 'kg',
                price_per_unit: 0,
                certification: '',
                description: '',
                currency: 'KES',
                available: true,
              });
              setIsProductModalOpen(true);
            }}
            className="text-sm text-brand-green hover:text-green-700 flex items-center gap-1"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
        <div className="space-y-3">
          {products.slice(0, 5).map(product => (
            <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium">{product.product_name}</p>
                <p className="text-sm text-gray-500">{product.quantity} {product.unit} available</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-green">{formatKES(product.price_per_unit)}/{product.unit}</p>
                <p className="text-xs text-gray-500">Bulk price</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Products Management View
  const ProductsView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Cooperative Products</h2>
        <button
          onClick={() => {
            setEditingProduct(null);
            setProductForm({
              product_name: '',
              category: '',
              quantity: 0,
              unit: 'kg',
              price_per_unit: 0,
              certification: '',
              description: '',
              currency: 'KES',
              available: true,
            });
            setIsProductModalOpen(true);
          }}
          className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg truncate">{product.product_name}</h3>
                {product.available ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Available</span>
                ) : (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Out of Stock</span>
                )}
              </div>
              
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Quantity:</span>
                  <span className="font-medium">{product.quantity} {product.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-bold text-brand-green">{formatKES(product.price_per_unit)}/{product.unit}</span>
                </div>
                {product.certification && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Certification:</span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{product.certification}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => {
                    setEditingProduct(product);
                    setProductForm({
                      product_name: product.product_name,
                      category: product.category,
                      quantity: product.quantity,
                      unit: product.unit,
                      price_per_unit: product.price_per_unit,
                      certification: product.certification || '',
                      description: product.description || '',
                      currency: product.currency || 'KES',
                      available: product.available,
                    });
                    setIsProductModalOpen(true);
                  }}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button 
                  onClick={() => cooperativeApi.deleteProduct(product.id).then(loadData)}
                  className="flex-1 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Orders Management View
  const OrdersView = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Bulk Orders</h2>
      
      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-sm text-gray-500">Order #{order.id.slice(0, 12)}</p>
                <p className="font-medium mt-1">{order.product_name}</p>
                <div className="flex gap-3 mt-2 text-sm">
                  <span>{order.quantity} units</span>
                  <span className="text-brand-green font-bold">{formatKES(order.total_amount)}</span>
                </div>
                <div className="mt-1">
                  <p className="text-sm text-gray-600">{order.buyer_name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail size={10} /> {order.buyer_email}
                  </p>
                  {order.buyer_country && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Globe size={10} /> {order.buyer_country}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {getStatusBadge(order.status)}
                <p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Confirm Order
                  </button>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => {
                      const tracking = prompt('Enter tracking number:');
                      if (tracking) handleUpdateOrderStatus(order.id, 'shipped', tracking);
                    }}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
                  >
                    <Truck size={14} /> Mark as Shipped
                  </button>
                )}
                {order.status === 'shipped' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Mark as Delivered
                  </button>
                )}
                {order.tracking_number && (
                  <span className="text-xs text-gray-500 ml-2">Tracking: {order.tracking_number}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package size={48} className="mx-auto mb-3 opacity-50" />
            <p>No orders yet</p>
          </div>
        )}
      </div>
    </div>
  );

  // Tenders View
  const TendersView = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Open Tenders</h2>
      
      <div className="space-y-3">
        {tenders.map(tender => (
          <div key={tender.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{tender.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{tender.description}</p>
                <div className="flex gap-3 mt-2 text-sm">
                  <span>Need: {tender.quantity_needed} {tender.unit}</span>
                  <span className="text-orange-600">Deadline: {new Date(tender.deadline).toLocaleDateString()}</span>
                </div>
                <div className="mt-1">
                  <p className="text-sm">Buyer: {tender.buyer_name}</p>
                  {tender.buyer_company && <p className="text-xs text-gray-500">{tender.buyer_company}</p>}
                </div>
              </div>
              {getStatusBadge(tender.status)}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  const response = prompt('Enter your offer price per unit:');
                  if (response) {
                    const price = parseFloat(response);
                    if (!isNaN(price)) {
                      cooperativeApi.respondToTender(tender.id, {
                        offered_price: price,
                        available_quantity: products.reduce((sum, p) => sum + p.quantity, 0),
                        delivery_timeline: 7,
                        message: `We can supply ${tender.quantity_needed} ${tender.unit} at ${formatKES(price)} per unit.`
                      }).then(loadData);
                    }
                  }
                }}
                className="px-3 py-1 text-sm bg-brand-green text-white rounded-lg hover:bg-green-700"
              >
                Submit Response
              </button>
            </div>
          </div>
        ))}
        
        {tenders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-3 opacity-50" />
            <p>No open tenders at the moment</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <ThemeToggle />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl">
                <Building2 size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cooperative Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">Manage your group's agricultural exports</p>
              </div>
            </div>
            <button onClick={loadData} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            {(['dashboard', 'products', 'orders', 'tenders'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-brand-green border-b-2 border-brand-green'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'dashboard' && <span className="flex items-center gap-2"><TrendingUp size={16} /> Dashboard</span>}
                {tab === 'products' && <span className="flex items-center gap-2"><Package size={16} /> Products</span>}
                {tab === 'orders' && <span className="flex items-center gap-2"><ShoppingCart size={16} /> Orders</span>}
                {tab === 'tenders' && <span className="flex items-center gap-2"><FileText size={16} /> Tenders</span>}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-brand-green" />
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardView />}
              {activeTab === 'products' && <ProductsView />}
              {activeTab === 'orders' && <OrdersView />}
              {activeTab === 'tenders' && <TendersView />}
            </>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
              <h3 className="text-lg font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
            </div>
            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Organic Maize"
                  value={productForm.product_name}
                  onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g., Cereals, Vegetables, Fruits"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={productForm.quantity || ''}
                    onChange={(e) => setProductForm({ ...productForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unit *
                  </label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="tons">Tons</option>
                    <option value="bags">Bags</option>
                    <option value="pieces">Pieces</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price per unit (KES) *
                </label>
                <input
                  type="number"
                  placeholder="Price per unit"
                  value={productForm.price_per_unit || ''}
                  onChange={(e) => setProductForm({ ...productForm, price_per_unit: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Certification
                </label>
                <select
                  value={productForm.certification}
                  onChange={(e) => setProductForm({ ...productForm, certification: e.target.value })}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="">No Certification</option>
                  <option value="organic">Organic</option>
                  <option value="fair-trade">Fair Trade</option>
                  <option value="rainforest-alliance">Rainforest Alliance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Describe your product, quality, harvest date, etc."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={3}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              {/* Currency field (hidden but included) */}
              <input type="hidden" value={productForm.currency} />

              {/* Available checkbox - visible for edit mode */}
              {editingProduct && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={productForm.available}
                    onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })}
                    className="w-4 h-4 text-brand-green rounded border-gray-300"
                  />
                  <label htmlFor="available" className="text-sm text-gray-700 dark:text-gray-300">
                    Product is available for sale
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 bg-brand-green text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingProduct ? 'Update Product' : 'Create Product'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className={`bg-gradient-to-r ${color} rounded-xl p-4 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
      </div>
    </div>
  );
}
