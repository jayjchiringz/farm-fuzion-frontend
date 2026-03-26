// farm-fuzion-frontend/src/components/Logistics/LogisticsModal.tsx
import React, { useState, useEffect } from "react";
import { 
  X, Truck, Package, MapPin, Clock, Search, 
  Plus, Eye, RefreshCw, CheckCircle, 
  Clock3, AlertCircle, TrendingUp, Calendar,
  Phone, Mail, User, Navigation, Loader2,
  ShoppingCart, Store, ClipboardList, Send,
  Warehouse, Box, Scale, DollarSign, Receipt
} from "lucide-react";
import logisticsService, { Parcel, DashboardData } from "../../services/logistics";
import { farmProductsApi, FarmProduct } from "../../services/farmProductsApi";
import { marketplaceApi, MarketplaceProduct, ShoppingCart as MarketplaceCartType, MarketplaceOrder } from "../../services/marketplaceApi";
import { useCurrency } from "../../contexts/CurrencyContext";

interface LogisticsModalProps {
  onClose: () => void;
  farmerId?: number;
  farmerName?: string;
}

type ViewType = 'dashboard' | 'inventory' | 'marketplace' | 'orders' | 'create' | 'track' | 'shipping' | 'reports';

interface CartItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit: string;
  item_total: number;
  marketplace_product_id: string;
}

interface SellerCart {
  id: string;
  seller_id: string;
  seller_name: string;
  items: CartItem[];
  total: number;
}

// ============================================
// Helper Components (Moved OUTSIDE main component)
// ============================================

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    'pending': { color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={12} /> },
    'confirmed': { color: 'bg-blue-100 text-blue-700', icon: <CheckCircle size={12} /> },
    'shipping': { color: 'bg-purple-100 text-purple-700', icon: <Truck size={12} /> },
    'delivered': { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
    'cancelled': { color: 'bg-red-100 text-red-700', icon: <AlertCircle size={12} /> },
    'Registered': { color: 'bg-gray-100 text-gray-700', icon: <Clock3 size={12} /> },
    'Ready for dispatch': { color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={12} /> },
    'Dispatched': { color: 'bg-blue-100 text-blue-700', icon: <Truck size={12} /> },
    'In Transit': { color: 'bg-purple-100 text-purple-700', icon: <Navigation size={12} /> },
    'Delivered': { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
    'Received': { color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={12} /> },
    'Under incidence': { color: 'bg-red-100 text-red-700', icon: <AlertCircle size={12} /> },
  };
  
  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-700', icon: <Package size={12} /> };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {status}
    </span>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) => {
  return (
    <div className={`p-3 rounded-lg ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs opacity-80">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
};

// ============================================
// Dashboard View Component (Defined BEFORE use)
// ============================================

const DashboardView = ({ dashboardData, parcels, onNavigate }: any) => {
  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {dashboardData && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            label="Total Parcels" 
            value={dashboardData.stats.total_parcels.toString()}
            icon={<Package size={20} />}
            color="bg-blue-50 text-blue-600 dark:bg-blue-900/20"
          />
          <StatCard 
            label="In Transit" 
            value={dashboardData.stats.in_transit.toString()}
            icon={<Truck size={20} />}
            color="bg-purple-50 text-purple-600 dark:bg-purple-900/20"
          />
          <StatCard 
            label="Delivered" 
            value={dashboardData.stats.delivered.toString()}
            icon={<CheckCircle size={20} />}
            color="bg-green-50 text-green-600 dark:bg-green-900/20"
          />
          <StatCard 
            label="Pending Pickup" 
            value={dashboardData.stats.pending_pickup.toString()}
            icon={<Clock size={20} />}
            color="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20"
          />
        </div>
      )}

      {/* Recent Parcels */}
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Recent Parcels</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {parcels?.slice(0, 5).map((parcel: any) => (
            <div 
              key={parcel.tracking_number}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => {
                onNavigate('track', parcel.tracking_number);
              }}
            >
              <div className="flex justify-between items-start mb-1">
                <div>
                  <p className="font-mono text-sm font-medium">{parcel.tracking_number}</p>
                  <p className="text-xs text-gray-500">{parcel.sender_name} → {parcel.receiver_name}</p>
                </div>
                <StatusBadge status={parcel.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <Calendar size={12} />
                <span>{new Date(parcel.created_at).toLocaleDateString()}</span>
                {parcel.description && (
                  <>
                    <span>•</span>
                    <span>{parcel.description}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => onNavigate('create')}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={18} />
          New Parcel
        </button>
        <button
          onClick={() => onNavigate('track')}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Search size={18} />
          Track Parcel
        </button>
      </div>
    </div>
  );
};

// ============================================
// Main LogisticsModal Component
// ============================================

export default function LogisticsModal({ onClose, farmerId, farmerName }: LogisticsModalProps) {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [parcels, setParcels] = useState<Parcel[]>([]);  // ← Added this!
  const [inventory, setInventory] = useState<FarmProduct[]>([]);
  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [carts, setCarts] = useState<SellerCart[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [publishingProduct, setPublishingProduct] = useState<string | null>(null);
  const [orderStatusUpdating, setOrderStatusUpdating] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [formData, setFormData] = useState({
    sender_name: '',
    sender_phone: '',
    receiver_name: '',
    receiver_phone: '',
    origin_location: '',
    destination: '',
    parcel_type: '',
    description: '',
    delivery_to_address: false,
    receiver_address: '',
    shipping_cart_id: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const { formatKES: formatCurrency } = useCurrency();

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboard();
    loadInventory();
    loadMarketplaceProducts();
    loadOrders();
    loadCarts();
  }, [farmerId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await logisticsService.getDashboard();
      setDashboardData(data);
      // Also load parcels separately if needed
      const parcelsData = await logisticsService.getParcels();
      setParcels(parcelsData);
    } catch (error) {
      console.error('Error loading logistics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    if (!farmerId) return;
    setInventoryLoading(true);
    try {
      const response = await farmProductsApi.getFarmerProducts(farmerId.toString(), 1, 50);
      setInventory(response.data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const loadMarketplaceProducts = async () => {
    if (!farmerId) return;
    setMarketplaceLoading(true);
    try {
      const response = await marketplaceApi.getProducts({ farmer_id: farmerId.toString() });
      setMarketplaceProducts(response.data);
    } catch (error) {
      console.error('Error loading marketplace products:', error);
    } finally {
      setMarketplaceLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!farmerId) return;
    try {
      const response = await marketplaceApi.getSellerOrders(farmerId.toString());
      setOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadCarts = async () => {
    if (!farmerId) return;
    try {
      const response = await marketplaceApi.getCart(farmerId.toString());
      setCarts(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error loading carts:', error);
    }
  };

  const handlePublishToMarketplace = async (productId: string) => {
    if (!farmerId) return;
    setPublishingProduct(productId);
    try {
      const product = inventory.find(p => p.id === productId);
      if (!product) return;

      await marketplaceApi.publishProduct({
        farm_product_id: productId,
        price: product.price || 0,
        farmer_id: farmerId.toString(),
      });

      await loadInventory();
      await loadMarketplaceProducts();
      alert('Product published to marketplace successfully!');
    } catch (error) {
      console.error('Error publishing product:', error);
      alert('Failed to publish product');
    } finally {
      setPublishingProduct(null);
    }
  };

  const handleCreateShippingOrder = async (cart: SellerCart) => {
    setCheckoutLoading(true);
    try {
      const checkoutResult = await marketplaceApi.checkout({
        cart_id: cart.id,
        shipping_address: formData.receiver_address || 'Farm collection point',
        payment_method: 'wallet',
        buyer_id: farmerId!.toString(),
      });

      if (checkoutResult.success) {
        const parcelData = {
          sender_name: farmerName || 'Farmer',
          sender_phone: formData.sender_phone || farmerId?.toString() || '',
          receiver_name: cart.seller_name,
          receiver_phone: '',
          origin_location: 1,
          destination: 1,
          parcel_type: 1,
          description: `Order ${checkoutResult.order_number} - ${cart.items.length} items`,
          delivery_to_address: true,
          receiver_address: 'Customer address',
        };

        await logisticsService.createParcel(parcelData);
        
        await loadOrders();
        await loadCarts();
        alert(`Order ${checkoutResult.order_number} created and shipping arranged!`);
        setCurrentView('orders');
      }
    } catch (error) {
      console.error('Error creating shipping order:', error);
      alert('Failed to create shipping order');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    if (!farmerId) return;
    setOrderStatusUpdating(orderId);
    try {
      await marketplaceApi.updateOrderStatus(orderId, {
        status,
        farmer_id: farmerId.toString(),
      });
      await loadOrders();
      alert(`Order status updated to ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setOrderStatusUpdating(null);
    }
  };

  const handleTrackParcel = async () => {
    if (!trackingNumber.trim()) return;
    
    setTrackingLoading(true);
    try {
      const result = await logisticsService.trackParcel(trackingNumber);
      setTrackingResult(result);
    } catch (error) {
      console.error('Error tracking parcel:', error);
      setTrackingResult({ error: 'Parcel not found or access denied' });
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCreateParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    
    try {
      const result = await logisticsService.createParcel({
        ...formData,
        origin_location: parseInt(formData.origin_location),
        destination: parseInt(formData.destination),
        parcel_type: parseInt(formData.parcel_type),
      });
      
      setFormData({
        sender_name: '',
        sender_phone: '',
        receiver_name: '',
        receiver_phone: '',
        origin_location: '',
        destination: '',
        parcel_type: '',
        description: '',
        delivery_to_address: false,
        receiver_address: '',
        shipping_cart_id: '',
      });
      
      await loadDashboard();
      setCurrentView('dashboard');
      alert(`Parcel created! Tracking number: ${result.tracking_number}`);
    } catch (error: any) {
      setFormError(error.message || 'Failed to create parcel');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleNavigate = (view: ViewType, trackingNumber?: string) => {
    if (trackingNumber) {
      setTrackingNumber(trackingNumber);
    }
    setCurrentView(view);
    if (view === 'track' && trackingNumber) {
      // Auto-track if tracking number is provided
      setTimeout(() => handleTrackParcel(), 100);
    }
  };

  // Helper function for product emojis
  const getProductEmoji = (productName: string): string => {
    const name = productName.toLowerCase();
    if (name.includes('maize') || name.includes('corn')) return '🌽';
    if (name.includes('tomato')) return '🍅';
    if (name.includes('potato')) return '🥔';
    if (name.includes('onion')) return '🧅';
    if (name.includes('carrot')) return '🥕';
    if (name.includes('cabbage')) return '🥬';
    if (name.includes('bean')) return '🫘';
    if (name.includes('wheat')) return '🌾';
    if (name.includes('milk')) return '🥛';
    if (name.includes('egg')) return '🥚';
    if (name.includes('chicken')) return '🐔';
    if (name.includes('coffee')) return '☕';
    if (name.includes('tea')) return '🫖';
    return '🌱';
  };

  // Inventory View
  const InventoryView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900 dark:text-white">Farm Inventory</h3>
        <button
          onClick={() => setCurrentView('create')}
          className="text-sm text-brand-green hover:text-green-700 flex items-center gap-1"
        >
          <Plus size={14} />
          New Product
        </button>
      </div>
      
      {inventoryLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-brand-green" />
        </div>
      ) : inventory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p>No farm products yet</p>
          <button
            onClick={() => setCurrentView('create')}
            className="mt-2 text-brand-green text-sm"
          >
            Add your first product →
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {inventory.map((product) => (
            <div key={product.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getProductEmoji(product.product_name)}</span>
                    <p className="font-medium">{product.product_name}</p>
                    <StatusBadge status={product.status || 'available'} />
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Package size={12} /> {product.quantity} {product.unit}</span>
                    <span className="flex items-center gap-1"><DollarSign size={12} /> {formatCurrency(product.price || 0)}</span>
                    {product.category && <span className="flex items-center gap-1"><Box size={12} /> {product.category}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  {product.status === 'available' && (
                    <button
                      onClick={() => handlePublishToMarketplace(product.id!.toString())}
                      disabled={publishingProduct === product.id}
                      className="px-2 py-1 text-xs bg-brand-green text-white rounded hover:bg-green-700"
                    >
                      {publishingProduct === product.id ? <Loader2 size={12} className="animate-spin" /> : 'Publish'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Marketplace View
  const MarketplaceView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900 dark:text-white">Active Marketplace Listings</h3>
        <button
          onClick={() => setCurrentView('inventory')}
          className="text-sm text-brand-green hover:text-green-700"
        >
          Add from Inventory →
        </button>
      </div>
      
      {marketplaceLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="animate-spin text-brand-green" />
        </div>
      ) : marketplaceProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Store size={48} className="mx-auto mb-3 opacity-50" />
          <p>No active marketplace listings</p>
          <p className="text-xs mt-1">Publish products from your inventory</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {marketplaceProducts.map((product) => (
            <div key={product.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getProductEmoji(product.product_name)}</span>
                    <p className="font-medium">{product.product_name}</p>
                    <StatusBadge status={product.status} />
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Package size={12} /> {product.quantity} {product.unit}</span>
                    <span className="flex items-center gap-1"><DollarSign size={12} /> {formatCurrency(product.price)}/{product.unit}</span>
                    <span className="flex items-center gap-1"><TrendingUp size={12} /> {product.total_sales || 0} sold</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Orders View
  const OrdersView = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 dark:text-white">Incoming Orders</h3>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {orders.map((order) => (
          <div key={order.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-sm font-medium">{order.order_number}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={order.status} />
                  <span className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm mt-1">
                  {order.items?.length || 0} items • {formatCurrency(order.total_amount)}
                </p>
              </div>
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                    disabled={orderStatusUpdating === order.id}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Confirm
                  </button>
                )}
                {order.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'shipping')}
                    disabled={orderStatusUpdating === order.id}
                    className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Ship
                  </button>
                )}
                {order.status === 'shipping' && (
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setCurrentView('track');
                    }}
                    className="px-2 py-1 text-xs bg-brand-green text-white rounded hover:bg-green-700"
                  >
                    Track
                  </button>
                )}
              </div>
            </div>
            
            {order.items && order.items.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                {order.items.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-gray-600 py-1">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <p className="text-xs text-gray-400">+{order.items.length - 2} more items</p>
                )}
              </div>
            )}
          </div>
        ))}
        
        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Receipt size={48} className="mx-auto mb-3 opacity-50" />
            <p>No orders yet</p>
          </div>
        )}
      </div>
    </div>
  );

  // Shopping Carts View
  const ShippingView = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 dark:text-white">Pending Shipments</h3>
      
      {carts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
          <p>No pending shipments</p>
          <p className="text-xs mt-1">Customer orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {carts.map((cart) => (
            <div key={cart.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Order from {cart.seller_name || 'Customer'}</p>
                  <p className="text-sm mt-1">{cart.items.length} items • {formatCurrency(cart.total)}</p>
                </div>
                <button
                  onClick={() => handleCreateShippingOrder(cart)}
                  disabled={checkoutLoading}
                  className="px-3 py-1 bg-brand-green text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {checkoutLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Process & Ship
                </button>
              </div>
              <div className="mt-2 space-y-1">
                {cart.items.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>{formatCurrency(item.item_total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Track Parcel View
  const TrackParcelView = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter tracking number"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        />
        <button
          onClick={handleTrackParcel}
          disabled={trackingLoading}
          className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {trackingLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          Track
        </button>
      </div>

      {trackingResult && (
        <div className="space-y-3">
          {trackingResult.error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-center">
              {trackingResult.error}
            </div>
          ) : (
            <>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-mono font-bold">{trackingResult.tracking_number}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {trackingResult.sender_name} → {trackingResult.receiver_name}
                    </p>
                  </div>
                  <StatusBadge status={trackingResult.status} />
                </div>
                
                {trackingResult.current_location?.latitude && (
                  <div className="mt-3 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-center text-sm">
                    📍 Current Location: {trackingResult.current_location.latitude}, {trackingResult.current_location.longitude}
                  </div>
                )}
              </div>

              {trackingResult.events && trackingResult.events.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Tracking History</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {trackingResult.events.map((event: any, idx: number) => (
                      <div key={idx} className="flex gap-3 p-2 border-l-2 border-brand-green ml-2">
                        <div className="w-2 h-2 rounded-full bg-brand-green mt-1.5 -ml-[5px]"></div>
                        <div>
                          <p className="font-medium text-sm">{event.event_type}</p>
                          <p className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  // Reports View
  const ReportsView = () => (
    <div className="space-y-4">
      <h3 className="font-medium">Logistics Reports</h3>
      
      {dashboardData && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600">Total Parcels</p>
            <p className="text-2xl font-bold">{dashboardData.stats.total_parcels}</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-gray-600">In Transit</p>
            <p className="text-2xl font-bold">{dashboardData.stats.in_transit}</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-600">Delivered</p>
            <p className="text-2xl font-bold">{dashboardData.stats.delivered}</p>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-gray-600">Pending Pickup</p>
            <p className="text-2xl font-bold">{dashboardData.stats.pending_pickup}</p>
          </div>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-medium mb-2">Recent Activity</h4>
        {dashboardData?.recent_parcels.slice(0, 5).map((parcel) => (
          <div key={parcel.tracking_number} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-mono text-sm">{parcel.tracking_number}</span>
            <StatusBadge status={parcel.status} />
            <span className="text-xs text-gray-500">{new Date(parcel.created_at).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Create Parcel View (simplified for brevity - add this if needed)
  const CreateParcelView = () => (
    <form onSubmit={handleCreateParcel} className="space-y-4">
      {formError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
          {formError}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Sender Name"
          value={formData.sender_name}
          onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
          className="px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="tel"
          placeholder="Sender Phone"
          value={formData.sender_phone}
          onChange={(e) => setFormData({ ...formData, sender_phone: e.target.value })}
          className="px-3 py-2 border rounded-lg"
          required
        />
      </div>
      {/* Add more form fields as needed */}
      <div className="flex gap-3">
        <button type="submit" disabled={formSubmitting} className="flex-1 bg-brand-green text-white py-2 rounded-lg">
          {formSubmitting ? 'Creating...' : 'Create Parcel'}
        </button>
        <button type="button" onClick={() => setCurrentView('dashboard')} className="px-4 py-2 border rounded-lg">
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-brand-green to-green-600 text-white rounded-t-xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Truck size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Farm Logistics Hub</h2>
                <p className="text-white/80 text-sm">Manage farm deliveries & marketplace orders</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-1 mt-4">
            {(['dashboard', 'inventory', 'marketplace', 'orders', 'shipping', 'track', 'reports'] as ViewType[]).map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === view
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {view === 'dashboard' && <span className="flex items-center gap-1"><Truck size={14} /> Dashboard</span>}
                {view === 'inventory' && <span className="flex items-center gap-1"><Package size={14} /> Inventory</span>}
                {view === 'marketplace' && <span className="flex items-center gap-1"><Store size={14} /> Marketplace</span>}
                {view === 'orders' && <span className="flex items-center gap-1"><ClipboardList size={14} /> Orders</span>}
                {view === 'shipping' && <span className="flex items-center gap-1"><Send size={14} /> Ship</span>}
                {view === 'track' && <span className="flex items-center gap-1"><Search size={14} /> Track</span>}
                {view === 'reports' && <span className="flex items-center gap-1"><TrendingUp size={14} /> Reports</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && currentView === 'dashboard' ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-brand-green" />
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && (
                <DashboardView 
                  dashboardData={dashboardData} 
                  parcels={parcels} 
                  onNavigate={handleNavigate} 
                />
              )}
              {currentView === 'inventory' && <InventoryView />}
              {currentView === 'marketplace' && <MarketplaceView />}
              {currentView === 'orders' && <OrdersView />}
              {currentView === 'shipping' && <ShippingView />}
              {currentView === 'track' && <TrackParcelView />}
              {currentView === 'reports' && <ReportsView />}
              {currentView === 'create' && <CreateParcelView />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
