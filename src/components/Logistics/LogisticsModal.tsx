// farm-fuzion-frontend/src/components/Logistics/LogisticsModal.tsx
import React, { useState, useEffect } from "react";
import { 
  X, Truck, Package, MapPin, Clock, Search, 
  Plus, RefreshCw, CheckCircle, 
  Clock3, AlertCircle, TrendingUp, Calendar,
  Phone, Navigation, Loader2,
  ShoppingCart, Send, Receipt, 
  XCircle, TruckIcon
} from "lucide-react";
import logisticsService, { Parcel, DashboardData } from "../../services/logistics";
import { marketplaceApi, MarketplaceOrder } from "../../services/marketplaceApi";
import { useCurrency } from "../../contexts/CurrencyContext";

interface LogisticsModalProps {
  onClose: () => void;
  farmerId?: number;
  farmerName?: string;
  farmerPhone?: string;
  farmerEmail?: string;
}

type ViewType = 'dashboard' | 'orders' | 'create' | 'track' | 'reports';

interface OrderWithShipping extends MarketplaceOrder {
  shippingDetails?: {
    sender_name: string;
    sender_phone: string;
    receiver_name: string;
    receiver_phone: string;
    receiver_address: string;
    tracking_number?: string;
    parcel_status?: string;
  };
}

// ============================================
// Helper Components
// ============================================

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    'pending': { color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={12} /> },
    'confirmed': { color: 'bg-blue-100 text-blue-700', icon: <CheckCircle size={12} /> },
    'shipping': { color: 'bg-purple-100 text-purple-700', icon: <Truck size={12} /> },
    'delivered': { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
    'cancelled': { color: 'bg-red-100 text-red-700', icon: <XCircle size={12} /> },
    'paid': { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
    'Registered': { color: 'bg-gray-100 text-gray-700', icon: <Clock3 size={12} /> },
    'Ready for dispatch': { color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={12} /> },
    'Dispatched': { color: 'bg-blue-100 text-blue-700', icon: <Truck size={12} /> },
    'In Transit': { color: 'bg-purple-100 text-purple-700', icon: <Navigation size={12} /> },
    'Delivered': { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
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
// Dashboard View
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
              onClick={() => onNavigate('track', parcel.tracking_number)}
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
                    <span className="truncate max-w-[200px]">{parcel.description}</span>
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

export default function LogisticsModal({ onClose, farmerId, farmerName, farmerPhone, farmerEmail }: LogisticsModalProps) {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [orders, setOrders] = useState<OrderWithShipping[]>([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [dispatchLoading, setDispatchLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sender_name: farmerName || '',
    sender_phone: farmerPhone || '',
    sender_email: farmerEmail || '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    origin_location: '',
    destination: '',
    parcel_type: '',
    description: '',
    delivery_to_address: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { formatKES: formatCurrency } = useCurrency();

  // Load data on mount
  useEffect(() => {
    loadDashboard();
    loadOrders();
  }, [farmerId]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await logisticsService.getDashboard();
      setDashboardData(data);
      const parcelsData = await logisticsService.getParcels();
      setParcels(parcelsData);
    } catch (error) {
      console.error('Error loading logistics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!farmerId) return;
    try {
      const response = await marketplaceApi.getSellerOrders(farmerId.toString());
      // Filter orders that need shipping (paid but not yet shipped)
      const ordersToShip = response.data.filter(
        (order: MarketplaceOrder) => 
          order.payment_status === 'paid' && 
          order.status !== 'shipping' && 
          order.status !== 'delivered'
      );
      setOrders(ordersToShip);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleDispatchOrder = async (order: OrderWithShipping) => {
    setDispatchLoading(order.id);
    try {
      // Auto-populate sender details from farmer profile
      const parcelData = {
        sender_name: farmerName || order.buyer_first_name || 'Farmer',
        sender_phone: farmerPhone || '',
        receiver_name: order.buyer_first_name || 'Customer',
        receiver_phone: order.buyer_mobile || '',
        receiver_address: order.shipping_address || 'Customer address',
        origin_location: 1, // Default station ID - could be set from farmer's location
        destination: 1, // Default station ID - could be set from customer's location
        parcel_type: 1, // Default parcel type
        description: `Order ${order.order_number} - ${order.items?.length || 0} items`,
        delivery_to_address: true,
      };

      const result = await logisticsService.createParcel(parcelData);
      
      // Update order status to shipping with tracking number
      await marketplaceApi.updateOrderStatus(order.id, {
        status: 'shipping',
        tracking_number: result.tracking_number,
        farmer_id: farmerId!.toString(),
      });
      
      // Refresh data
      await loadOrders();
      await loadDashboard();
      
      alert(`Order ${order.order_number} dispatched! Tracking: ${result.tracking_number}`);
      setCurrentView('track');
      setTrackingNumber(result.tracking_number);
      setTimeout(() => handleTrackParcel(), 100);
    } catch (error) {
      console.error('Error dispatching order:', error);
      alert('Failed to dispatch order. Please try again.');
    } finally {
      setDispatchLoading(null);
    }
  };

  const handleCreateParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    
    try {
      const result = await logisticsService.createParcel({
        ...formData,
        origin_location: parseInt(formData.origin_location) || 1,
        destination: parseInt(formData.destination) || 1,
        parcel_type: parseInt(formData.parcel_type) || 1,
      });
      
      // Reset form
      setFormData({
        sender_name: farmerName || '',
        sender_phone: farmerPhone || '',
        sender_email: farmerEmail || '',
        receiver_name: '',
        receiver_phone: '',
        receiver_address: '',
        origin_location: '',
        destination: '',
        parcel_type: '',
        description: '',
        delivery_to_address: true,
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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleNavigate = (view: ViewType, trackingNumber?: string) => {
    if (trackingNumber) {
      setTrackingNumber(trackingNumber);
    }
    setCurrentView(view);
    if (view === 'track' && trackingNumber) {
      setTimeout(() => handleTrackParcel(), 100);
    }
  };

  // Orders View - Ready to Dispatch
  const OrdersView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900 dark:text-white">Ready to Dispatch</h3>
        <button
          onClick={loadOrders}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle size={48} className="mx-auto mb-3 opacity-50" />
            <p>No orders to dispatch</p>
            <p className="text-xs mt-1">Orders will appear here after payment is confirmed</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-mono text-sm font-medium text-brand-green">#{order.order_number}</p>
                  <p className="text-sm mt-1">
                    <span className="font-medium">Customer:</span> {order.buyer_first_name} {order.buyer_last_name}
                  </p>
                  {order.buyer_mobile && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Phone size={12} /> {order.buyer_mobile}
                    </p>
                  )}
                </div>
                <StatusBadge status="paid" />
              </div>
              
              {/* Order Items */}
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Items:</p>
                <div className="space-y-1">
                  {order.items?.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span>{item.product_name} x{item.quantity}</span>
                      <span>{formatCurrency(item.total_price)}</span>
                    </div>
                  ))}
                  {order.items && order.items.length > 3 && (
                    <p className="text-xs text-gray-400">+{order.items.length - 3} more items</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm font-bold">{formatCurrency(order.total_amount)}</p>
                  {order.shipping_address && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={10} /> {order.shipping_address}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDispatchOrder(order)}
                  disabled={dispatchLoading === order.id}
                  className="px-4 py-2 bg-brand-green text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {dispatchLoading === order.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <TruckIcon size={16} />
                  )}
                  Dispatch
                </button>
              </div>
            </div>
          ))
        )}
      </div>
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
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono"
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
                    <p className="font-mono font-bold text-lg">{trackingResult.tracking_number}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      📦 {trackingResult.sender_name} → {trackingResult.receiver_name}
                    </p>
                  </div>
                  <StatusBadge status={trackingResult.status} />
                </div>
                
                {trackingResult.current_location?.latitude && (
                  <div className="mt-3 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-center text-sm">
                    📍 Current Location: {trackingResult.current_location.latitude.toFixed(4)}, {trackingResult.current_location.longitude.toFixed(4)}
                  </div>
                )}
              </div>

              {trackingResult.events && trackingResult.events.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Tracking History</h4>
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

  // Create Parcel View
  const CreateParcelView = () => (
    <form onSubmit={handleCreateParcel} className="space-y-4">
      {formError && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm">
          {formError}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Sender Name</label>
          <input
            type="text"
            value={formData.sender_name}
            onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Sender Phone</label>
          <input
            type="tel"
            value={formData.sender_phone}
            onChange={(e) => setFormData({ ...formData, sender_phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Receiver Name</label>
          <input
            type="text"
            value={formData.receiver_name}
            onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Receiver Phone</label>
          <input
            type="tel"
            value={formData.receiver_phone}
            onChange={(e) => setFormData({ ...formData, receiver_phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Receiver Address</label>
        <textarea
          value={formData.receiver_address}
          onChange={(e) => setFormData({ ...formData, receiver_address: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none"
          placeholder="Full delivery address"
          required
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Description</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          placeholder="What are you sending?"
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={formSubmitting} className="flex-1 bg-brand-green text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {formSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {formSubmitting ? 'Creating...' : 'Create Parcel'}
        </button>
        <button type="button" onClick={() => setCurrentView('dashboard')} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );

  // Reports View
  const ReportsView = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 dark:text-white">Logistics Reports</h3>
      
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
        <div className="space-y-2">
          {dashboardData?.recent_parcels.slice(0, 5).map((parcel) => (
            <div key={parcel.tracking_number} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-mono text-sm">{parcel.tracking_number}</span>
              <StatusBadge status={parcel.status} />
              <span className="text-xs text-gray-500">{new Date(parcel.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
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
                <p className="text-white/80 text-sm">Dispatch orders & track deliveries</p>
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
            {(['dashboard', 'orders', 'create', 'track', 'reports'] as ViewType[]).map((view) => (
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
                {view === 'orders' && <span className="flex items-center gap-1"><ShoppingCart size={14} /> Dispatch</span>}
                {view === 'create' && <span className="flex items-center gap-1"><Plus size={14} /> New Parcel</span>}
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
              {currentView === 'orders' && <OrdersView />}
              {currentView === 'create' && <CreateParcelView />}
              {currentView === 'track' && <TrackParcelView />}
              {currentView === 'reports' && <ReportsView />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}