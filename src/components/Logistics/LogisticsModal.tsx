// farm-fuzion-frontend/src/components/Logistics/LogisticsModal.tsx
import React, { useState, useEffect } from "react";
import { 
  X, Truck, Package, MapPin, Clock, Search, 
  Plus, Eye, RefreshCw, CheckCircle, 
  Clock3, AlertCircle, TrendingUp, Calendar,
  Phone, Mail, User, Navigation, Loader2
} from "lucide-react";
import logisticsService, { Parcel, DashboardData } from "../../services/logistics";
import { useCurrency } from "../../contexts/CurrencyContext";

interface LogisticsModalProps {
  onClose: () => void;
  farmerId?: number;
}

type ViewType = 'dashboard' | 'parcels' | 'create' | 'track';

export default function LogisticsModal({ onClose, farmerId }: LogisticsModalProps) {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
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
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { formatKES: formatCurrency } = useCurrency();

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await logisticsService.getDashboard();
      setDashboardData(data);
      
      // Also load recent parcels
      const parcelsData = await logisticsService.getParcels();
      setParcels(parcelsData.slice(0, 10));
    } catch (error) {
      console.error('Error loading logistics data:', error);
    } finally {
      setLoading(false);
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
      
      // Reset form and go back to parcels view
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
      });
      
      // Refresh data
      await loadDashboard();
      setCurrentView('parcels');
    } catch (error: any) {
      setFormError(error.message || 'Failed to create parcel');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
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

  // Dashboard View
  const DashboardView = () => (
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
          {parcels.slice(0, 5).map((parcel) => (
            <div 
              key={parcel.tracking_number}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => {
                setTrackingNumber(parcel.tracking_number);
                handleTrackParcel();
                setCurrentView('track');
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
          onClick={() => setCurrentView('create')}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={18} />
          New Parcel
        </button>
        <button
          onClick={() => setCurrentView('track')}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Search size={18} />
          Track Parcel
        </button>
      </div>
    </div>
  );

  // Parcels List View
  const ParcelsView = () => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900 dark:text-white">All Parcels</h3>
        <button
          onClick={() => setCurrentView('create')}
          className="text-sm text-brand-green hover:text-green-700 flex items-center gap-1"
        >
          <Plus size={14} />
          New
        </button>
      </div>
      
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {parcels.map((parcel) => (
          <div 
            key={parcel.tracking_number}
            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            onClick={() => {
              setTrackingNumber(parcel.tracking_number);
              handleTrackParcel();
              setCurrentView('track');
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
            </div>
          </div>
        ))}
      </div>
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
      
      {/* Sender Info */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <User size={16} /> Sender Information
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Sender Name"
            value={formData.sender_name}
            onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            required
          />
          <input
            type="tel"
            placeholder="Phone (e.g., 254XXXXXXXXX)"
            value={formData.sender_phone}
            onChange={(e) => setFormData({ ...formData, sender_phone: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            required
          />
        </div>
      </div>

      {/* Receiver Info */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <User size={16} /> Receiver Information
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Receiver Name"
            value={formData.receiver_name}
            onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            required
          />
          <input
            type="tel"
            placeholder="Phone (e.g., 254XXXXXXXXX)"
            value={formData.receiver_phone}
            onChange={(e) => setFormData({ ...formData, receiver_phone: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            required
          />
        </div>
      </div>

      {/* Route Info */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <MapPin size={16} /> Route Information
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Origin Station ID"
            value={formData.origin_location}
            onChange={(e) => setFormData({ ...formData, origin_location: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            required
          />
          <input
            type="text"
            placeholder="Destination Station ID"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            required
          />
        </div>
        <input
          type="text"
          placeholder="Parcel Type ID"
          value={formData.parcel_type}
          onChange={(e) => setFormData({ ...formData, parcel_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          required
        />
      </div>

      {/* Description */}
      <div>
        <textarea
          placeholder="Parcel Description (e.g., Farm produce, equipment, etc.)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none"
          required
        />
      </div>

      {/* Delivery Options */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="delivery_to_address"
          checked={formData.delivery_to_address}
          onChange={(e) => setFormData({ ...formData, delivery_to_address: e.target.checked })}
          className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
        />
        <label htmlFor="delivery_to_address" className="text-sm text-gray-700 dark:text-gray-300">
          Deliver to specific address (+KES 250)
        </label>
      </div>

      {formData.delivery_to_address && (
        <textarea
          placeholder="Delivery Address"
          value={formData.receiver_address}
          onChange={(e) => setFormData({ ...formData, receiver_address: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none"
          required
        />
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={formSubmitting}
          className="flex-1 bg-brand-green text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {formSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
          {formSubmitting ? 'Creating...' : 'Create Parcel'}
        </button>
        <button
          type="button"
          onClick={() => setCurrentView('dashboard')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
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
              {/* Parcel Details */}
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
                
                {/* Location Map Placeholder */}
                {trackingResult.current_location?.latitude && (
                  <div className="mt-3 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-center text-sm">
                    📍 Current Location: {trackingResult.current_location.latitude}, {trackingResult.current_location.longitude}
                  </div>
                )}
              </div>

              {/* Events Timeline */}
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

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-brand-green to-green-600 text-white rounded-t-xl flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Truck size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Farm Logistics</h2>
                <p className="text-white/80 text-sm">Manage your parcels and deliveries</p>
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
          <div className="flex gap-2 mt-4">
            {(['dashboard', 'parcels', 'create', 'track'] as ViewType[]).map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === view
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {view === 'dashboard' && 'Dashboard'}
                {view === 'parcels' && 'My Parcels'}
                {view === 'create' && 'New Parcel'}
                {view === 'track' && 'Track'}
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
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'parcels' && <ParcelsView />}
              {currentView === 'create' && <CreateParcelView />}
              {currentView === 'track' && <TrackParcelView />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
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
}
