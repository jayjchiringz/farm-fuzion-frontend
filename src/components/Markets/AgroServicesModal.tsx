import React, { useState, useEffect } from "react";
import { 
  X, Search, Star, MapPin, Phone, Clock, Calendar, 
  ChevronRight, Filter, ThumbsUp, MessageCircle, Award,
  User, Briefcase, DollarSign, CheckCircle, AlertCircle
} from "lucide-react";
import { api } from "../../services/api";
import { formatCurrencyKES } from "../../utils/format";

interface ServiceProvider {
  id: string;
  business_name: string;
  service_category: string;
  description: string;
  phone: string;
  email?: string;
  county: string;
  location?: string;
  years_of_experience?: number;
  is_verified: boolean;
  avg_rating: number;
  review_count: number;
  service_count: number;
  profile_image_url?: string;
}

interface Service {
  id: string;
  provider_id: string;
  service_name: string;
  description: string;
  category: string;
  price?: number;
  price_unit: string;
  is_negotiable: boolean;
  estimated_duration?: string;
}

interface AgroServicesModalProps {
  farmerId: string;
  onClose: () => void;
}

type TabType = "browse" | "providers" | "bookings" | "register";

export default function AgroServicesModal({ farmerId, onClose }: AgroServicesModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("browse");
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Registration form state
  const [regForm, setRegForm] = useState({
    business_name: "",
    service_category: "",
    description: "",
    phone: "",
    email: "",
    county: "",
    constituency: "",
    ward: "",
    location: "",
    years_of_experience: "",
  });

  useEffect(() => {
    if (activeTab === "browse") {
      loadServices();
    } else if (activeTab === "providers") {
      loadProviders();
    } else if (activeTab === "bookings") {
      loadBookings();
    }
  }, [activeTab, searchTerm, selectedCategory, selectedCounty]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      
      const res = await api.get(`/services/search?${params.toString()}`);
      setServices(res.data.data || []);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedCounty) params.append("county", selectedCounty);
      
      const res = await api.get(`/services/providers?${params.toString()}`);
      setProviders(res.data.data || []);
    } catch (error) {
      console.error("Error loading providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/services/bookings/farmer/${farmerId}`);
      setBookings(res.data.data || []);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterProvider = async () => {
    setSubmitting(true);
    try {
      await api.post("/services/providers/register", {
        ...regForm,
        user_id: farmerId,
        years_of_experience: parseInt(regForm.years_of_experience) || 0,
      });
      alert("✅ Registration submitted successfully! You'll be notified once approved.");
      setActiveTab("browse");
      setRegForm({
        business_name: "",
        service_category: "",
        description: "",
        phone: "",
        email: "",
        county: "",
        constituency: "",
        ward: "",
        location: "",
        years_of_experience: "",
      });
    } catch (error) {
      console.error("Error registering provider:", error);
      alert("❌ Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookService = async () => {
    if (!selectedService || !selectedProvider || !bookingDate) return;
    
    setSubmitting(true);
    try {
      await api.post("/services/bookings", {
        farmer_id: farmerId,
        provider_id: selectedProvider.id,
        service_id: selectedService.id,
        booking_date: bookingDate,
        booking_time: bookingTime || undefined,
        notes: bookingNotes,
      });
      alert("✅ Booking request sent successfully!");
      setShowBookingForm(false);
      setSelectedService(null);
      setSelectedProvider(null);
      loadBookings();
      setActiveTab("bookings");
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("❌ Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    "all", "veterinary", "extension", "mechanic", "consultant", 
    "training", "supplies", "transport", "labor", "other"
  ];

  const counties = [
    "Nairobi", "Kiambu", "Nakuru", "Uasin Gishu", "Kisumu", "Mombasa",
    "Trans Nzoia", "Meru", "Machakos", "Kitui", "Garissa", "Kakamega",
    "Kisii", "Kericho", "Bungoma", "Busia", "Siaya", "Homa Bay",
    "Migori", "Kajiado", "Narok", "Baringo", "Laikipia", "Nyeri",
    "Kirinyaga", "Muranga", "Embu", "Tharaka Nithi", "Makueni",
    "Taita Taveta", "Kwale", "Kilifi", "Lamu", "Tana River", "Mandera",
    "Wajir", "Marsabit", "Isiolo", "Samburu", "Turkana", "West Pokot",
    "Elgeyo Marakwet", "Nandi", "Bomet", "Nyamira", "Vihiga"
  ];

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}
        />
      );
    }
    return stars;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Briefcase size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Agro Services</h2>
                <p className="text-white/80 text-sm">Connect with verified agricultural service providers</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 pt-4">
          <TabButton
            active={activeTab === "browse"}
            onClick={() => setActiveTab("browse")}
            icon={<Briefcase size={18} />}
            label="Browse Services"
          />
          <TabButton
            active={activeTab === "providers"}
            onClick={() => setActiveTab("providers")}
            icon={<User size={18} />}
            label="Service Providers"
          />
          <TabButton
            active={activeTab === "bookings"}
            onClick={() => setActiveTab("bookings")}
            icon={<Calendar size={18} />}
            label="My Bookings"
          />
          <TabButton
            active={activeTab === "register"}
            onClick={() => setActiveTab("register")}
            icon={<Award size={18} />}
            label="Register as Provider"
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "browse" && (
            <>
              {/* Search and Filters */}
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Services Grid */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => {
                        setSelectedService(service);
                        // Find provider details
                        const provider = providers.find(p => p.id === service.provider_id);
                        if (provider) setSelectedProvider(provider);
                        setShowBookingForm(true);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-lg">{service.service_name}</h3>
                        {service.price && (
                          <span className="text-green-600 font-bold">
                            {formatCurrencyKES(service.price)}
                            {service.price_unit && <span className="text-xs text-gray-500">/{service.price_unit}</span>}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <Clock size={14} />
                        <span>{service.estimated_duration || "Duration varies"}</span>
                        {service.is_negotiable && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">Negotiable</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin size={14} />
                        <span>{service.service_area || "County wide"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "providers" && (
            <>
              {/* Provider Filters */}
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search providers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="">All Counties</option>
                  {counties.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Providers Grid */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all"
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-lg flex items-center gap-2">
                                {provider.business_name}
                                {provider.is_verified && (
                                  <CheckCircle size={16} className="text-blue-500" title="Verified Provider" />
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {provider.service_category} • {provider.county}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {getRatingStars(Math.round(provider.avg_rating))}
                              <span className="text-sm text-gray-500 ml-1">
                                ({provider.review_count})
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            {provider.description}
                          </p>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Briefcase size={14} />
                              <span>{provider.service_count} services</span>
                            </div>
                            {provider.years_of_experience && (
                              <div className="flex items-center gap-1">
                                <Award size={14} />
                                <span>{provider.years_of_experience} years exp</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Phone size={14} />
                              <span>{provider.phone}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex md:flex-col justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedProvider(provider);
                              // Load provider's services
                              api.get(`/services/search?provider_id=${provider.id}`).then(res => {
                                setServices(res.data.data || []);
                                setActiveTab("browse");
                              });
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            View Services
                          </button>
                          <button
                            onClick={() => window.location.href = `tel:${provider.phone}`}
                            className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm"
                          >
                            Call Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "bookings" && (
            <div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No bookings yet</p>
                  <button
                    onClick={() => setActiveTab("browse")}
                    className="mt-4 text-green-600 hover:underline"
                  >
                    Browse Services →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold">{booking.service_name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {booking.business_name}
                          </p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                              {booking.booking_time && <span>at {booking.booking_time}</span>}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={14} />
                              <span>{formatCurrencyKES(booking.total_price)}</span>
                            </div>
                          </div>
                          {booking.notes && (
                            <p className="text-xs text-gray-500 mt-2">Note: {booking.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                          {booking.status === 'completed' && !booking.reviewed && (
                            <button
                              onClick={() => {
                                // Open review modal
                                alert("Review feature coming soon!");
                              }}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200"
                            >
                              Leave Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "register" && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-bold mb-4">Register as a Service Provider</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Join our network of verified agricultural service providers and connect with farmers across Kenya.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Business Name *</label>
                    <input
                      type="text"
                      value={regForm.business_name}
                      onChange={(e) => setRegForm({...regForm, business_name: e.target.value})}
                      className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="e.g., Molo Vet Services"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Service Category *</label>
                    <select
                      value={regForm.service_category}
                      onChange={(e) => setRegForm({...regForm, service_category: e.target.value})}
                      className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="">Select category</option>
                      <option value="veterinary">Veterinary</option>
                      <option value="extension">Extension Officer</option>
                      <option value="mechanic">Farm Mechanic</option>
                      <option value="consultant">Agricultural Consultant</option>
                      <option value="training">Training & Education</option>
                      <option value="supplies">Farm Supplies</option>
                      <option value="transport">Transport</option>
                      <option value="labor">Farm Labor</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={regForm.description}
                    onChange={(e) => setRegForm({...regForm, description: e.target.value})}
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    rows={3}
                    placeholder="Tell farmers about your services and experience..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({...regForm, phone: e.target.value})}
                      className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="e.g., 0712345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={regForm.email}
                      onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                      className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">County *</label>
                    <select
                      value={regForm.county}
                      onChange={(e) => setRegForm({...regForm, county: e.target.value})}
                      className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="">Select County</option>
                      {counties.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Constituency</label>
                    <input
                      type="text"
                      value={regForm.constituency}
                      onChange={(e) => setRegForm({...regForm, constituency: e.target.value})}
                      className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="e.g., Kabete"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ward</label>
                    <input
                      type="text"
                      value={regForm.ward}
                      onChange={(e) => setRegForm({...regForm, ward: e.target.value})}
                      className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="e.g., Kabete"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Years of Experience</label>
                    <input
                      type="number"
                      value={regForm.years_of_experience}
                      onChange={(e) => setRegForm({...regForm, years_of_experience: e.target.value})}
                      className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                      placeholder="e.g., 5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Physical Location</label>
                  <input
                    type="text"
                    value={regForm.location}
                    onChange={(e) => setRegForm({...regForm, location: e.target.value})}
                    className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    placeholder="e.g., Near Kabete Market"
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                    <span>
                      Your registration will be reviewed by our team. Once approved, you'll be able to 
                      list your services and receive bookings from farmers in your area.
                    </span>
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setActiveTab("browse")}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegisterProvider}
                    disabled={submitting || !regForm.business_name || !regForm.service_category || !regForm.phone || !regForm.county}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Registration"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingForm && selectedService && selectedProvider && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-dark rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Book Service</h3>
            
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">{selectedService.service_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Provider: {selectedProvider.business_name}</p>
              {selectedService.price && (
                <p className="text-sm font-bold text-green-600 mt-1">
                  {formatCurrencyKES(selectedService.price)}/{selectedService.price_unit || 'service'}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Booking Date *</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Preferred Time (Optional)</label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={3}
                  placeholder="Any specific requirements or details..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowBookingForm(false);
                    setSelectedService(null);
                    setSelectedProvider(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookService}
                  disabled={submitting || !bookingDate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-green-600 text-green-600"
          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}