// farm-fuzion-frontend/src/pages/GroupAdminDashboard.tsx
import React, { useState, useEffect } from "react";
import { 
  Building2, Package, TrendingUp, Users, ShoppingCart, 
  Plus, Edit2, Trash2, Eye, CheckCircle, XCircle, Clock,
  Truck, Search, Filter, RefreshCw, Loader2, MapPin,
  DollarSign, Calendar, Globe, FileText, Send, Mail,
  LogOut, ChevronLeft, ChevronRight, LayoutDashboard, Shield,
  Menu, X, Home, BarChart3, Sparkles, Settings, AlertTriangle
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import ThemeToggle from "../components/ThemeToggle";
import { useCurrency } from "../contexts/CurrencyContext";
import { cooperativeApi, Cooperative, CooperativeProduct, BulkOrder, Tender } from "../services/cooperativeApi";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { formatKES } = useCurrency();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Get user info from auth context
  const adminName = user?.first_name || user?.email?.split('@')[0] || 'Group Admin';
  const groupName = cooperative?.name || 'Loading...';

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
      
      if (coopData) {
        console.log("✅ Group Admin Dashboard - Cooperative loaded:", {
          name: coopData.name,
          registration_number: coopData.registration_number,
          county: coopData.county,
          constituency: coopData.constituency
        });
      }
    } catch (error) {
      console.error('Error loading group admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-16 -mb-16"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Welcome, {adminName}!</h2>
          <p className="text-white/80 mt-1">Manage your cooperative's products and connect with global buyers</p>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={products.length.toString()} icon={<Package size={20} />} color="from-blue-500 to-blue-600" />
        <StatCard label="Total Orders" value={orders.length.toString()} icon={<ShoppingCart size={20} />} color="from-green-500 to-green-600" />
        <StatCard label="Active Tenders" value={tenders.filter(t => t.status === 'open').length.toString()} icon={<FileText size={20} />} color="from-purple-500 to-purple-600" />
        <StatCard label="Revenue" value={formatKES(orders.reduce((sum, o) => sum + o.total_amount, 0))} icon={<DollarSign size={20} />} color="from-orange-500 to-orange-600" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Recent Products</h3>
          <button onClick={() => { setEditingProduct(null); setProductForm({ product_name: '', category: '', quantity: 0, unit: 'kg', price_per_unit: 0, certification: '', description: '', currency: 'KES', available: true }); setIsProductModalOpen(true); }} className="text-sm text-brand-green hover:text-green-700 flex items-center gap-1"><Plus size={16} /> Add Product</button>
        </div>
        <div className="space-y-3">
          {products.slice(0, 5).map(product => (
            <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div><p className="font-medium">{product.product_name}</p><p className="text-sm text-gray-500">{product.quantity} {product.unit} available</p></div>
              <div className="text-right"><p className="font-bold text-brand-green">{formatKES(product.price_per_unit)}/{product.unit}</p><p className="text-xs text-gray-500">Bulk price</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Products Management View
  const ProductsView = () => {
    const [recallingProduct, setRecallingProduct] = useState<string | null>(null);
    const [showRecallModal, setShowRecallModal] = useState(false);
    const [selectedProductForRecall, setSelectedProductForRecall] = useState<CooperativeProduct | null>(null);
    const [recallQuantity, setRecallQuantity] = useState(0);
    const [recallReason, setRecallReason] = useState('');
    const [recallLoading, setRecallLoading] = useState(false);
    const [publishingToGlobal, setPublishingToGlobal] = useState<string | null>(null);
    const [showGlobalPublishModal, setShowGlobalPublishModal] = useState(false);
    const [selectedGlobalProduct, setSelectedGlobalProduct] = useState<CooperativeProduct | null>(null);
    const [globalPrice, setGlobalPrice] = useState(0);
    const [globalMinQuantity, setGlobalMinQuantity] = useState(100);

    const handleRecall = (product: CooperativeProduct) => {
      setSelectedProductForRecall(product);
      setRecallQuantity(product.quantity);
      setRecallReason('');
      setShowRecallModal(true);
    };

    const confirmRecall = async () => {
      if (!selectedProductForRecall) return;
      if (recallQuantity <= 0 || recallQuantity > selectedProductForRecall.quantity) { alert('Please enter a valid quantity'); return; }
      if (!recallReason.trim()) { alert('Please provide a reason for recall'); return; }
      setRecallLoading(true);
      try {
        await cooperativeApi.recallProduct(selectedProductForRecall.id, recallQuantity, recallReason);
        alert(`✅ Successfully recalled ${recallQuantity} ${selectedProductForRecall.unit} back to farmer inventory`);
        await loadData();
        setShowRecallModal(false);
      } catch (error) { console.error('Error recalling product:', error); alert('Failed to recall product. Please try again.'); }
      finally { setRecallLoading(false); setRecallingProduct(null); }
    };

    const handlePublishToGlobal = (product: CooperativeProduct) => {
      setSelectedGlobalProduct(product);
      setGlobalPrice(product.price_per_unit);
      setGlobalMinQuantity(Math.floor(product.quantity * 0.1));
      setShowGlobalPublishModal(true);
    };

    const confirmPublishToGlobal = async () => {
      if (!selectedGlobalProduct) return;
      setPublishingToGlobal(selectedGlobalProduct.id);
      try {
        await cooperativeApi.publishToGlobalMarketplace(selectedGlobalProduct.id, globalPrice, globalMinQuantity);
        alert(`✅ ${selectedGlobalProduct.product_name} published to Global Marketplace!`);
        await loadData();
        setShowGlobalPublishModal(false);
      } catch (error) { console.error('Error publishing to global:', error); alert('Failed to publish to global marketplace'); }
      finally { setPublishingToGlobal(null); }
    };

    return (
      <>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Cooperative Products</h2>
            <button onClick={() => { setEditingProduct(null); setProductForm({ product_name: '', category: '', quantity: 0, unit: 'kg', price_per_unit: 0, certification: '', description: '', currency: 'KES', available: true }); setIsProductModalOpen(true); }} className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700 flex items-center gap-2"><Plus size={18} /> Add Product</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg truncate">{product.product_name}</h3>
                    {product.available ? <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Available</span> : <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Out of Stock</span>}
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Quantity:</span><span className="font-medium">{product.quantity} {product.unit}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Price:</span><span className="font-bold text-brand-green">{formatKES(product.price_per_unit)}/{product.unit}</span></div>
                    {product.certification && <div className="flex justify-between text-sm"><span className="text-gray-500">Certification:</span><span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">{product.certification}</span></div>}
                  </div>
                  {(product as any).source_farmer_name && (
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><Users size={12} className="text-green-600 dark:text-green-400" /></div><span className="text-xs text-gray-500 dark:text-gray-400">Farmer:</span></div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{(product as any).source_farmer_name.split(' ')[0]}</span>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    {/* Edit Button */}
                    <button onClick={() => { setEditingProduct(product); setProductForm({ product_name: product.product_name, category: product.category, quantity: product.quantity, unit: product.unit, price_per_unit: product.price_per_unit, certification: product.certification || '', description: product.description || '', currency: product.currency || 'KES', available: product.available }); setIsProductModalOpen(true); }} className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1"><Edit2 size={14} /> Edit</button>
                    
                    {/* Recall Button */}
                    <button onClick={() => handleRecall(product)} disabled={product.quantity === 0 || recallingProduct === product.id} className={`flex-1 px-3 py-1.5 text-sm border rounded-lg flex items-center justify-center gap-1 transition-colors ${product.quantity === 0 ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-orange-300 text-orange-600 hover:bg-orange-50'}`} title="Recall unused stock back to farmer inventory">{recallingProduct === product.id ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />} Recall</button>
                    
                    {/* Publish to Global Button */}
                    {(product as any).published_to_global ? (
                      <span className="flex-1 px-3 py-1.5 text-sm bg-green-100 text-green-600 rounded-lg flex items-center justify-center gap-1"><Globe size={14} /> Published</span>
                    ) : (
                      <button onClick={() => handlePublishToGlobal(product)} disabled={publishingToGlobal === product.id || product.quantity === 0} className="flex-1 px-3 py-1.5 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed" title="Publish to Global Public Marketplace">{publishingToGlobal === product.id ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />} Publish Global</button>
                    )}
                    
                    {/* Delete Button */}
                    <button onClick={() => cooperativeApi.deleteProduct(product.id).then(loadData)} className="flex-1 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-1"><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recall Modal */}
        {showRecallModal && selectedProductForRecall && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold">Recall Product from Marketplace</h3><p className="text-sm text-gray-500 mt-1">This will return stock to the farmer's inventory</p></div>
              <div className="p-4 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="font-medium">{selectedProductForRecall.product_name}</p>
                  <div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Available:</span><span>{selectedProductForRecall.quantity} {selectedProductForRecall.unit}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Unit Price:</span><span className="text-brand-green font-medium">{formatKES(selectedProductForRecall.price_per_unit)}</span></div>
                  {(selectedProductForRecall as any).source_farmer_name && <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200 dark:border-gray-700"><span className="text-gray-500">Farmer:</span><span className="font-medium">{(selectedProductForRecall as any).source_farmer_name.split(' ')[0]}</span></div>}
                </div>
                <div><label className="block text-sm font-medium mb-1">Quantity to Recall *</label><input type="number" min="1" max={selectedProductForRecall.quantity} value={recallQuantity} onChange={(e) => setRecallQuantity(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg" required /><p className="text-xs text-gray-500 mt-1">Maximum: {selectedProductForRecall.quantity} {selectedProductForRecall.unit}</p></div>
                <div><label className="block text-sm font-medium mb-1">Reason for Recall *</label><textarea value={recallReason} onChange={(e) => setRecallReason(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg resize-none" placeholder="e.g., Quality issues, Overstock, Order cancellation, etc." required /></div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg"><p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2"><AlertTriangle size={16} className="mt-0.5 flex-shrink-0" /><span>This action will return the recalled quantity to the farmer's inventory. The cooperative listing will be updated accordingly.</span></p></div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button onClick={() => setShowRecallModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={confirmRecall} disabled={recallLoading || recallQuantity <= 0 || recallQuantity > selectedProductForRecall.quantity || !recallReason.trim()} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2">{recallLoading ? <><RefreshCw size={16} className="animate-spin" /> Processing...</> : <><RefreshCw size={16} /> Confirm Recall</>}</button>
              </div>
            </div>
          </div>
        )}

        {/* Global Publish Modal */}
        {showGlobalPublishModal && selectedGlobalProduct && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold">Publish to Global Marketplace</h3><p className="text-sm text-gray-500 mt-1">This will make the product available to international buyers</p></div>
              <div className="p-4 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"><p className="font-medium">{selectedGlobalProduct.product_name}</p><div className="flex justify-between text-sm mt-1"><span className="text-gray-500">Available:</span><span>{selectedGlobalProduct.quantity.toLocaleString()} {selectedGlobalProduct.unit}</span></div><div className="flex justify-between text-sm"><span className="text-gray-500">Cooperative:</span><span>{cooperative?.name}</span></div></div>
                <div><label className="block text-sm font-medium mb-1">Global Price (KES per {selectedGlobalProduct.unit}) *</label><input type="number" value={globalPrice} onChange={(e) => setGlobalPrice(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg" required /></div>
                <div><label className="block text-sm font-medium mb-1">Minimum Order Quantity ({selectedGlobalProduct.unit}) *</label><input type="number" value={globalMinQuantity} onChange={(e) => setGlobalMinQuantity(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg" required /><p className="text-xs text-gray-500 mt-1">Buyers must purchase at least this amount</p></div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg"><p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2"><Globe size={16} className="mt-0.5 flex-shrink-0" /><span>Once published, this product will appear on the public marketplace for global buyers.</span></p></div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button onClick={() => setShowGlobalPublishModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={confirmPublishToGlobal} disabled={publishingToGlobal !== null} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">{publishingToGlobal === selectedGlobalProduct?.id ? <><Loader2 size={16} className="animate-spin" /> Publishing...</> : <><Globe size={16} /> Publish to Global</>}</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Orders Management View
  const OrdersView = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Bulk Orders</h2>
      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
            <div className="flex justify-between items-start">
              <div><p className="font-mono text-sm text-gray-500">Order #{order.id.slice(0, 12)}</p><p className="font-medium mt-1">{order.product_name}</p><div className="flex gap-3 mt-2 text-sm"><span>{order.quantity} units</span><span className="text-brand-green font-bold">{formatKES(order.total_amount)}</span></div><div className="mt-1"><p className="text-sm text-gray-600">{order.buyer_name}</p><p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} /> {order.buyer_email}</p>{order.buyer_country && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Globe size={10} /> {order.buyer_country}</p>}</div></div>
              <div className="text-right">{getStatusBadge(order.status)}<p className="text-xs text-gray-500 mt-1">{new Date(order.created_at).toLocaleDateString()}</p></div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                {order.status === 'pending' && <button onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')} className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Confirm Order</button>}
                {order.status === 'confirmed' && <button onClick={() => { const tracking = prompt('Enter tracking number:'); if (tracking) handleUpdateOrderStatus(order.id, 'shipped', tracking); }} className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"><Truck size={14} /> Mark as Shipped</button>}
                {order.status === 'shipped' && <button onClick={() => handleUpdateOrderStatus(order.id, 'delivered')} className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Mark as Delivered</button>}
                {order.tracking_number && <span className="text-xs text-gray-500 ml-2">Tracking: {order.tracking_number}</span>}
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 && <div className="text-center py-12 text-gray-500"><Package size={48} className="mx-auto mb-3 opacity-50" /><p>No orders yet</p></div>}
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
              <div><h3 className="font-bold">{tender.title}</h3><p className="text-sm text-gray-600 mt-1">{tender.description}</p><div className="flex gap-3 mt-2 text-sm"><span>Need: {tender.quantity_needed} {tender.unit}</span><span className="text-orange-600">Deadline: {new Date(tender.deadline).toLocaleDateString()}</span></div><div className="mt-1"><p className="text-sm">Buyer: {tender.buyer_name}</p>{tender.buyer_company && <p className="text-xs text-gray-500">{tender.buyer_company}</p>}</div></div>
              {getStatusBadge(tender.status)}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => { const response = prompt('Enter your offer price per unit:'); if (response) { const price = parseFloat(response); if (!isNaN(price)) { cooperativeApi.respondToTender(tender.id, { offered_price: price, available_quantity: products.reduce((sum, p) => sum + p.quantity, 0), delivery_timeline: 7, message: `We can supply ${tender.quantity_needed} ${tender.unit} at ${formatKES(price)} per unit.` }).then(loadData); } } }} className="px-3 py-1 text-sm bg-brand-green text-white rounded-lg hover:bg-green-700">Submit Response</button>
            </div>
          </div>
        ))}
        {tenders.length === 0 && <div className="text-center py-12 text-gray-500"><FileText size={48} className="mx-auto mb-3 opacity-50" /><p>No open tenders at the moment</p></div>}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <ThemeToggle />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <aside className={`${isSidebarOpen ? "w-72" : "w-24"} transition-all duration-500 ease-in-out bg-brand-green/95 backdrop-blur-md dark:bg-gray-900/95 dark:backdrop-blur-md text-white flex flex-col justify-between py-8 px-4 shadow-2xl relative overflow-hidden border-r border-white/10`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(0,0,0,0.05)_0%,_transparent_50%)]"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="transition-all duration-500">
                {isSidebarOpen ? (
                  <div className="flex items-center gap-3"><div className="relative"><img src="/Logos/FF Logo only transparent background.png" alt="Farm Fuzion" className="h-12 w-12 object-contain relative z-10 opacity-90 hover:opacity-100 transition-opacity" /></div><span className="text-xl font-light text-white/90 tracking-wide">FarmFuzion</span></div>
                ) : (
                  <div className="relative flex justify-center"><img src="/Logos/FF Logo only transparent background.png" alt="FF" className="h-14 w-14 object-contain mx-auto transition-all duration-300 hover:scale-110 opacity-90 hover:opacity-100" /></div>
                )}
              </div>
              <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 backdrop-blur-sm text-white/70 hover:text-white" title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>{isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}</button>
            </div>
            <nav className="space-y-1">
              <NavItem icon={<LayoutDashboard size={isSidebarOpen ? 18 : 22} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={!isSidebarOpen} />
              <NavItem icon={<Package size={isSidebarOpen ? 18 : 22} />} label="Products" active={activeTab === 'products'} onClick={() => setActiveTab('products')} collapsed={!isSidebarOpen} />
              <NavItem icon={<ShoppingCart size={isSidebarOpen ? 18 : 22} />} label="Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} collapsed={!isSidebarOpen} />
              <NavItem icon={<FileText size={isSidebarOpen ? 18 : 22} />} label="Tenders" active={activeTab === 'tenders'} onClick={() => setActiveTab('tenders')} collapsed={!isSidebarOpen} />
            </nav>
          </div>
          <div className="relative z-10">
            {cooperative && isSidebarOpen && (<div className="mb-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm"><p className="text-xs text-white/70 mb-1">Your Group</p><p className="text-sm font-medium text-white truncate">{cooperative.name}</p><p className="text-xs text-white/50 mt-1">{cooperative.registration_number}</p></div>)}
            <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${!isSidebarOpen ? 'justify-center' : ''} bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl`} title="Logout"><LogOut size={isSidebarOpen ? 20 : 24} />{isSidebarOpen && <span className="text-sm font-medium">Logout</span>}</button>
          </div>
        </aside>

        <button onClick={toggleSidebar} className="fixed top-4 left-4 z-60 md:hidden text-white bg-brand-green rounded-lg p-2.5 shadow-lg hover:bg-green-700 transition-colors"><Menu size={20} /></button>
        {sidebarOpen && (<div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in" />)}

        <main className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative"><div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">{adminName.charAt(0)}</div><div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div></div>
                <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">{cooperative ? `${cooperative.name} Admin` : 'Group Admin Dashboard'}</h1><p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><span className="flex items-center gap-1"><Shield size={14} className="text-purple-600" /> Group Administrator</span><span className="w-1 h-1 bg-gray-400 rounded-full"></span><span>Welcome back, {adminName}</span></p></div>
              </div>
              <div className="flex items-center gap-3"><button onClick={handleRefresh} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative" disabled={refreshing}><RefreshCw size={20} className={refreshing ? 'animate-spin text-brand-green' : 'text-gray-600 dark:text-gray-400'} /></button><ThemeToggle /></div>
            </div>
          </div>

          <div className="p-6">
            {!cooperative && !loading && (<div className="mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20"></div><div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-16 -mb-16"></div><div className="relative z-10"><h2 className="text-3xl font-bold mb-2">Group Admin Dashboard</h2><p className="text-white/90 max-w-2xl">Manage your cooperative's products, track bulk orders, and respond to international tenders.</p><div className="flex gap-4 mt-4"><div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5"><Sparkles size={16} /><span className="text-sm">Cooperative Management</span></div><div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5"><BarChart3 size={16} /><span className="text-sm">Global Marketplace</span></div></div></div></div>)}

            {loading ? (<div className="flex justify-center items-center py-12"><div className="relative"><div className="w-16 h-16 border-4 border-purple-500/30 rounded-full"></div><div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div></div></div>) : (
              <>{activeTab === 'dashboard' && <DashboardView />}{activeTab === 'products' && <ProductsView />}{activeTab === 'orders' && <OrdersView />}{activeTab === 'tenders' && <TendersView />}</>
            )}
          </div>
        </main>
      </div>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900"><h3 className="text-lg font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3></div>
            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Product Name *</label><input type="text" placeholder="e.g., Organic Maize" value={productForm.product_name} onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" required /></div>
              <div><label className="block text-sm font-medium mb-1">Category</label><input type="text" placeholder="e.g., Cereals, Vegetables, Fruits" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Quantity *</label><input type="number" placeholder="Quantity" value={productForm.quantity || ''} onChange={(e) => setProductForm({ ...productForm, quantity: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded-lg" required /></div>
                <div><label className="block text-sm font-medium mb-1">Unit *</label><select value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} className="w-full p-2 border rounded-lg"><option value="kg">Kilograms (kg)</option><option value="tons">Tons</option><option value="bags">Bags</option><option value="pieces">Pieces</option></select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Price per unit (KES) *</label><input type="number" placeholder="Price per unit" value={productForm.price_per_unit || ''} onChange={(e) => setProductForm({ ...productForm, price_per_unit: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium mb-1">Certification</label><select value={productForm.certification} onChange={(e) => setProductForm({ ...productForm, certification: e.target.value })} className="w-full p-2 border rounded-lg"><option value="">No Certification</option><option value="organic">Organic</option><option value="fair-trade">Fair Trade</option><option value="rainforest-alliance">Rainforest Alliance</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><textarea placeholder="Describe your product, quality, harvest date, etc." value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={3} className="w-full p-2 border rounded-lg" /></div>
              <input type="hidden" value={productForm.currency} />
              {editingProduct && (<div className="flex items-center gap-2"><input type="checkbox" id="available" checked={productForm.available} onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })} className="w-4 h-4 text-brand-green rounded border-gray-300" /><label htmlFor="available" className="text-sm">Product is available for sale</label></div>)}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={formSubmitting} className="flex-1 bg-brand-green text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">{formSubmitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : (editingProduct ? 'Update Product' : 'Create Product')}</button>
                <button type="button" onClick={() => { setIsProductModalOpen(false); setEditingProduct(null); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

// ==================== Subcomponents ====================

function NavItem({ icon, label, active = false, onClick, collapsed }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${active ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'} ${collapsed ? 'justify-center' : ''}`}>
      <span className={active ? 'text-white' : 'text-white/70'}>{icon}</span>
      {!collapsed && <span className="text-sm font-light tracking-wide">{label}</span>}
    </button>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className={`bg-gradient-to-r ${color} rounded-xl p-4 text-white`}>
      <div className="flex items-center justify-between">
        <div><p className="text-sm opacity-90">{label}</p><p className="text-2xl font-bold">{value}</p></div>
        <div className="p-2 bg-white/20 rounded-lg">{icon}</div>
      </div>
    </div>
  );
}
