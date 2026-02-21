import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { formatCurrencyKES } from "../../utils/format";
import { X, Calendar, CreditCard } from "lucide-react";

interface Repayment {
  id: string;
  amount: number;
  method: string;
  reference_no?: string;
  payment_date: string;
}

interface LoanDetails {
  id: string;
  amount: number;
  status: string;
  purpose?: string;
}

export default function LoanRepaymentModal({
  loanId,
  farmerId,
  onClose,
  onRepaymentMade
}: {
  loanId: string;
  farmerId: string;
  onClose: () => void;
  onRepaymentMade?: () => void;
}) {
  const [loan, setLoan] = useState<LoanDetails | null>(null);
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"mpesa" | "bank" | "cash">("mpesa");
  const [referenceNo, setReferenceNo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loanId && farmerId) {
      loadData();
    }
  }, [loanId, farmerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get loan details
      const loanRes = await api.get(`/loans/${loanId}`);
      setLoan(loanRes.data);

      // Get repayments
      const repaymentsRes = await api.get(`/loan-repayments/${loanId}`);
      setRepayments(repaymentsRes.data || []);
    } catch (err) {
      console.error("Error loading loan data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRepayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/loan-repayments", {
        loan_id: loanId,
        farmer_id: farmerId,
        amount: parseFloat(amount),
        method,
        reference_no: referenceNo || undefined
      });

      alert("✅ Repayment recorded successfully!");
      setAmount("");
      setReferenceNo("");
      loadData();
      if (onRepaymentMade) onRepaymentMade();
    } catch (err: any) {
      console.error("Error recording repayment:", err);
      alert(err.response?.data?.error || "Failed to record repayment");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPaid = repayments.reduce((sum, r) => sum + r.amount, 0);
  const remainingAmount = loan ? loan.amount - totalPaid : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-brand-green dark:text-brand-apple">
            Loan Repayment
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Loan Summary */}
              {loan && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <h3 className="font-bold mb-3">Loan Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-lg font-bold text-brand-green">
                        {formatCurrencyKES(loan.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Paid So Far</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrencyKES(totalPaid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Remaining</p>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrencyKES(remainingAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        remainingAmount <= 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {remainingAmount <= 0 ? 'Fully Paid' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Repayment Form */}
              {remainingAmount > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-bold mb-4">Make a Payment</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Amount (KES)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        max={remainingAmount}
                        className="w-full p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Payment Method</label>
                      <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as any)}
                        className="w-full p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                      >
                        <option value="mpesa">M-PESA</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Reference Number (Optional)</label>
                      <input
                        type="text"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder="e.g., M-PESA transaction ID"
                        className="w-full p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                      />
                    </div>

                    <button
                      onClick={handleSubmitRepayment}
                      disabled={submitting || !amount}
                      className="w-full bg-brand-green text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                    >
                      {submitting ? "Processing..." : "Record Payment"}
                    </button>
                  </div>
                </div>
              )}

              {/* Repayment History */}
              {repayments.length > 0 && (
                <div>
                  <h3 className="font-bold mb-3">Payment History</h3>
                  <div className="space-y-2">
                    {repayments.map((repayment) => (
                      <div
                        key={repayment.id}
                        className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{formatCurrencyKES(repayment.amount)}</p>
                          <p className="text-xs text-gray-500">
                            {repayment.method} • {new Date(repayment.payment_date).toLocaleDateString()}
                          </p>
                        </div>
                        {repayment.reference_no && (
                          <span className="text-xs text-gray-400">Ref: {repayment.reference_no}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
    </div>
  );
}
