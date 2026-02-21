import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { formatCurrencyKES } from "../../utils/format";
import { Building, Percent, Calendar, DollarSign, Check, X, Info } from "lucide-react";

interface CreditProduct {
  id: string;
  provider_name: string;
  provider_logo?: string;
  name: string;
  description: string;
  min_amount: number;
  max_amount: number;
  interest_rate: number;
  interest_rate_type: string;
  repayment_period_min: number;
  repayment_period_max: number;
  processing_fee?: number;
  collateral_required: boolean;
  requirements: string[];
}

export default function CreditModal({
  farmerId,
  onClose
}: {
  farmerId: string;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<CreditProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<CreditProduct | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"browse" | "applications">("browse");
  
  // Application form state
  const [amount, setAmount] = useState("");
  const [repaymentPeriod, setRepaymentPeriod] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
    loadApplications();
  }, [farmerId]);

  const loadProducts = async () => {
    try {
      const res = await api.get("/credit/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Error loading credit products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const res = await api.get(`/credit/applications/farmer/${farmerId}`);
      setApplications(res.data);
    } catch (error) {
      console.error("Error loading applications:", error);
    }
  };

  const handleApply = (product: CreditProduct) => {
    setSelectedProduct(product);
    setAmount("");
    setRepaymentPeriod("");
    setPurpose("");
  };

  const handleSubmitApplication = async () => {
    if (!selectedProduct || !amount || !repaymentPeriod) return;
    
    setSubmitting(true);
    try {
      await api.post("/credit/applications", {
        farmer_id: farmerId,
        product_id: selectedProduct.id,
        amount: Number(amount),
        repayment_period: Number(repaymentPeriod),
        purpose
      });
      
      alert("✅ Application submitted successfully!");
      setSelectedProduct(null);
      loadApplications();
      setActiveTab("applications");
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      disbursed: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800"
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-green/20 rounded-xl">
                <span className="text-2xl">🏦</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-brand-green dark:text-brand-apple">
                  Credit Center
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Explore and apply for credit from multiple providers
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 pt-4">
          <button
            onClick={() => setActiveTab("browse")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "browse"
                ? "border-brand-green text-brand-green"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📋 Browse Credit
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "applications"
                ? "border-brand-green text-brand-green"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📝 My Applications ({applications.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "browse" ? (
            <>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-brand-green/10 rounded-lg flex items-center justify-center text-xl">
                          {product.provider_logo ? (
                            <img src={product.provider_logo} alt={product.provider_name} className="w-6 h-6" />
                          ) : (
                            <Building size={20} className="text-brand-green" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500">{product.provider_name}</p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Amount:</span>
                          <span className="font-medium">
                            {formatCurrencyKES(product.min_amount)} - {formatCurrencyKES(product.max_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Interest:</span>
                          <span className="font-medium text-brand-green">
                            {product.interest_rate}% {product.interest_rate_type}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Period:</span>
                          <span className="font-medium">
                            {product.repayment_period_min}-{product.repayment_period_max} months
                          </span>
                        </div>
                        {product.collateral_required && (
                          <div className="flex items-center gap-1 text-xs text-orange-600">
                            <Info size={12} /> Collateral required
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleApply(product)}
                        className="w-full bg-brand-green text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Apply Now
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {applications.length > 0 ? (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold">{app.product_name}</h4>
                        <p className="text-sm text-gray-500">{app.provider_name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-medium">{formatCurrencyKES(app.amount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Period</p>
                        <p className="font-medium">{app.repayment_period} months</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Applied</p>
                        <p className="font-medium">{new Date(app.applied_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500">No credit applications yet</p>
                  <button
                    onClick={() => setActiveTab("browse")}
                    className="mt-4 text-brand-green hover:underline"
                  >
                    Browse credit options →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Application Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-brand-dark rounded-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Apply for {selectedProduct.name}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Loan Amount (KES)</label>
                  <input
                    type="number"
                    min={selectedProduct.min_amount}
                    max={selectedProduct.max_amount}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2 border rounded-lg dark:bg-gray-800"
                    placeholder={`${selectedProduct.min_amount} - ${selectedProduct.max_amount}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Repayment Period (months)</label>
                  <input
                    type="number"
                    min={selectedProduct.repayment_period_min}
                    max={selectedProduct.repayment_period_max}
                    value={repaymentPeriod}
                    onChange={(e) => setRepaymentPeriod(e.target.value)}
                    className="w-full p-2 border rounded-lg dark:bg-gray-800"
                    placeholder={`${selectedProduct.repayment_period_min} - ${selectedProduct.repayment_period_max} months`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Purpose (optional)</label>
                  <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full p-2 border rounded-lg dark:bg-gray-800"
                    rows={3}
                    placeholder="What will this loan be used for?"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <Info size={16} className="inline mr-1" />
                    Your application will be sent to {selectedProduct.provider_name} for review.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitApplication}
                    disabled={submitting || !amount || !repaymentPeriod}
                    className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}