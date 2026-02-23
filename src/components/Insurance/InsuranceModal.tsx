// farm-fuzion-frontend/src/components/Insurance/InsuranceModal.tsx
import React, { useState, useEffect } from "react";
import { 
  X, Shield, Cross, Droplets, Leaf, Tractor, Heart, 
  CheckCircle, XCircle, Clock, FileText, Upload, 
  Plus, RefreshCw, ChevronRight, AlertTriangle,
  Sun, CloudRain, Wind
} from "lucide-react";
import { formatCurrencyKES } from "../../utils/format";

interface InsuranceModalProps {
  onClose: () => void;
}

interface InsuranceProduct {
  id: string;
  name: string;
  provider: string;
  provider_logo?: string;
  type: 'crop' | 'livestock' | 'equipment' | 'health' | 'weather';
  description: string;
  coverage: string;
  premium_min: number;
  premium_max: number;
  coverage_period: string;
  eligibility: string[];
  features: string[];
  popular: boolean;
}

interface InsuranceApplication {
  id: string;
  product_id: string;
  product_name: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'active' | 'expired';
  coverage_amount: number;
  premium: number;
  start_date: string;
  end_date: string;
  applied_at: string;
}

export default function InsuranceModal({ onClose }: InsuranceModalProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'applications' | 'claims'>('browse');
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [applications, setApplications] = useState<InsuranceApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<InsuranceProduct | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setProducts(mockProducts);
      setApplications(mockApplications);
      setLoading(false);
    }, 1000);
  }, []);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'crop': return <Leaf className="text-green-600" />;
      case 'livestock': return <Heart className="text-red-600" />;
      case 'equipment': return <Tractor className="text-blue-600" />;
      case 'health': return <Heart className="text-purple-600" />;
      case 'weather': return <Sun className="text-yellow-600" />;
      default: return <Shield className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
      case 'active':
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: <CheckCircle size={14} /> };
      case 'under_review':
        return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: <Clock size={14} /> };
      case 'rejected':
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: <XCircle size={14} /> };
      case 'expired':
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', icon: <Clock size={14} /> };
      default:
        return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: <FileText size={14} /> };
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Cross size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Farm Insurance Center</h2>
                <p className="text-white/80 text-sm">Protect your farm, crops, and livestock</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 pt-4">
          <button
            onClick={() => setActiveTab("browse")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "browse"
                ? "border-rose-500 text-rose-600 dark:text-rose-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Shield size={16} />
            Browse Insurance
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "applications"
                ? "border-rose-500 text-rose-600 dark:text-rose-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText size={16} />
            My Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab("claims")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "claims"
                ? "border-rose-500 text-rose-600 dark:text-rose-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <AlertTriangle size={16} />
            Claims
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-rose-500/30 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
            </div>
          ) : (
            <>
              {/* Browse Tab */}
              {activeTab === "browse" && (
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2">
                      {['all', 'crop', 'livestock', 'equipment', 'health', 'weather'].map(type => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                            filterType === type
                              ? 'bg-rose-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {type === 'all' ? 'All' : type}
                        </button>
                      ))}
                    </div>
                    
                    <div className="relative w-full md:w-64">
                      <input
                        type="text"
                        placeholder="Search insurance..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg bg-opacity-20 flex items-center justify-center ${
                                product.type === 'crop' ? 'bg-green-500' :
                                product.type === 'livestock' ? 'bg-red-500' :
                                product.type === 'equipment' ? 'bg-blue-500' :
                                product.type === 'health' ? 'bg-purple-500' : 'bg-yellow-500'
                              }`}>
                                {getTypeIcon(product.type)}
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{product.name}</h3>
                                <p className="text-xs text-gray-500">{product.provider}</p>
                              </div>
                            </div>
                            {product.popular && (
                              <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs rounded-full">
                                Popular
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                            {product.description}
                          </p>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Coverage:</span>
                              <span className="font-medium">{product.coverage}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Premium:</span>
                              <span className="font-medium text-rose-600">
                                {formatCurrencyKES(product.premium_min)} - {formatCurrencyKES(product.premium_max)}/yr
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Period:</span>
                              <span className="font-medium">{product.coverage_period}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            Learn More
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Applications Tab */}
              {activeTab === "applications" && (
                <div className="space-y-4">
                  {applications.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <FileText size={32} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                        No applications yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Browse insurance products and apply to get covered
                      </p>
                      <button
                        onClick={() => setActiveTab("browse")}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                      >
                        Browse Insurance
                      </button>
                    </div>
                  ) : (
                    applications.map((app) => {
                      const badge = getStatusBadge(app.status);
                      return (
                        <div
                          key={app.id}
                          className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-5"
                        >
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                <Shield size={20} className="text-rose-600" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{app.product_name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                                    {badge.icon}
                                    {app.status.replace('_', ' ')}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Applied {new Date(app.applied_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Coverage Amount</p>
                              <p className="text-xl font-bold text-rose-600">{formatCurrencyKES(app.coverage_amount)}</p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Premium</p>
                              <p className="text-sm font-medium">{formatCurrencyKES(app.premium)}/yr</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Start Date</p>
                              <p className="text-sm font-medium">{new Date(app.start_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">End Date</p>
                              <p className="text-sm font-medium">{new Date(app.end_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Policy Status</p>
                              <p className="text-sm font-medium capitalize">{app.status}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Claims Tab */}
              {activeTab === "claims" && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <AlertTriangle size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Claims Center Coming Soon
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    You'll be able to file and track insurance claims here
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-dark rounded-xl max-w-2xl w-full shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 hover:bg-white/20 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">{selectedProduct.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500">Provider</p>
                    <p className="font-bold">{selectedProduct.provider}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500">Coverage</p>
                    <p className="font-bold">{selectedProduct.coverage}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500">Premium Range</p>
                    <p className="font-bold text-rose-600">
                      {formatCurrencyKES(selectedProduct.premium_min)} - {formatCurrencyKES(selectedProduct.premium_max)}/yr
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-500">Coverage Period</p>
                    <p className="font-bold">{selectedProduct.coverage_period}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-3">Key Features</h4>
                  <ul className="space-y-2">
                    {selectedProduct.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold mb-3">Eligibility Requirements</h4>
                  <ul className="space-y-2">
                    {selectedProduct.eligibility.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Shield size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data
const mockProducts: InsuranceProduct[] = [
  {
    id: '1',
    name: 'Comprehensive Crop Insurance',
    provider: 'PULA Insurance',
    type: 'crop',
    description: 'Protect your crops against drought, floods, pests, and diseases.',
    coverage: 'Up to 85% of expected yield',
    premium_min: 5000,
    premium_max: 50000,
    coverage_period: '1 growing season',
    eligibility: ['Minimum 1 acre of land', 'Registered farmer', 'Crops must be healthy at time of application'],
    features: [
      'Covers drought, excessive rainfall, and hail',
      'Pest and disease outbreak coverage',
      'Free agronomic advice included',
      'Quick claims processing within 7 days'
    ],
    popular: true
  },
  {
    id: '2',
    name: 'Livestock Insurance',
    provider: 'APA Insurance',
    type: 'livestock',
    description: 'Comprehensive coverage for cattle, goats, sheep, and poultry.',
    coverage: 'Up to 100% of animal value',
    premium_min: 2000,
    premium_max: 30000,
    coverage_period: '1 year',
    eligibility: ['Minimum 5 livestock units', 'Vaccination records required', 'Regular veterinary check-ups'],
    features: [
      'Covers death due to disease or accident',
      'Theft protection',
      'Veterinary consultation included',
      'Emergency slaughter coverage'
    ],
    popular: true
  },
  {
    id: '3',
    name: 'Farm Equipment Insurance',
    provider: 'Jubilee Insurance',
    type: 'equipment',
    description: 'Protect your tractors, harvesters, and other farm machinery.',
    coverage: 'Replacement value minus depreciation',
    premium_min: 10000,
    premium_max: 100000,
    coverage_period: '1 year',
    eligibility: ['Equipment must be less than 10 years old', 'Regular maintenance records'],
    features: [
      'Covers accidental damage',
      'Theft protection',
      'Breakdown coverage',
      'Replacement parts included'
    ],
    popular: false
  },
  {
    id: '4',
    name: 'Weather Index Insurance',
    provider: 'ACRE Africa',
    type: 'weather',
    description: 'Payouts based on weather data, no need for field inspections.',
    coverage: 'Based on weather triggers',
    premium_min: 3000,
    premium_max: 25000,
    coverage_period: '1 season',
    eligibility: ['Farm location must have weather station', 'Minimum 2 acres'],
    features: [
      'Automatic payouts when weather triggers are met',
      'No field inspections required',
      'Covers drought and excess rainfall',
      'Fast claims processing'
    ],
    popular: true
  },
  {
    id: '5',
    name: 'Farmer Health Insurance',
    provider: 'NHIF',
    type: 'health',
    description: 'Affordable health coverage for farmers and their families.',
    coverage: 'Up to KES 500,000 per year',
    premium_min: 1500,
    premium_max: 6000,
    coverage_period: '1 year',
    eligibility: ['All registered farmers', 'Family members can be included'],
    features: [
      'Outpatient and inpatient coverage',
      'Maternity benefits',
      'Emergency ambulance services',
      'Network of partner hospitals'
    ],
    popular: false
  }
];

const mockApplications: InsuranceApplication[] = [
  {
    id: 'app1',
    product_id: '1',
    product_name: 'Comprehensive Crop Insurance',
    status: 'active',
    coverage_amount: 450000,
    premium: 25000,
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    applied_at: '2024-12-15'
  },
  {
    id: 'app2',
    product_id: '2',
    product_name: 'Livestock Insurance',
    status: 'under_review',
    coverage_amount: 200000,
    premium: 15000,
    start_date: '2025-02-01',
    end_date: '2026-01-31',
    applied_at: '2025-01-20'
  }
];
