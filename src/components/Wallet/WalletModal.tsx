import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import OtpModal from "./OtpModal";
import TransactionTable from "./TransactionTable";
import { formatCurrencyKES } from "../../utils/format";

export default function WalletModal({
  farmerId,
  onClose,
}: {
  farmerId: string;
  onClose: () => void;
}) {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"mpesa" | "airtel">("mpesa");
  const [otpPhase, setOtpPhase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<
    "deposit" | "withdraw" | "transfer" | "pay"
  >("deposit");
  const [destination, setDestination] = useState(""); // for transfers or till numbers
  const [transferPreview, setTransferPreview] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Pay type states
  const [payType, setPayType] = useState<"till" | "paybill">("till");
  const [paybillNo, setPaybillNo] = useState("");
  const [accNo, setAccNo] = useState("");

  // Refresh key for ledger refresh
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const fetchBalance = async () => {
    try {
      const res = await api.get(`/wallet/${farmerId}/balance`);
      setBalance(res.data?.balance || res.data || 0);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(0);
    }
  };

  // Search farmers for transfer
  const searchFarmers = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/wallet/search-farmers?q=${q}`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error("Farmer search failed", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  type WalletAction = "deposit" | "withdraw" | "transfer" | "pay";

  const handleSubmit = () => {
    setLoading(true);
    
    if (action === "deposit") {
      api
        .post(`/wallet/topup/${method}`, {
          farmer_id: farmerId,
          amount: Number(amount),
        })
        .then(() => {
          alert("✅ Top-up successful!");
          fetchBalance();
          triggerRefresh();
          setAmount("");
        })
        .catch(() => alert("❌ Top-up failed"))
        .finally(() => setLoading(false));
    } else if (action === "withdraw") {
      api
        .post(`/wallet/withdraw/${method}`, {
          farmer_id: farmerId,
          amount: Number(amount),
          destination,
        })
        .then(() => {
          alert("✅ Withdrawal successful!");
          fetchBalance();
          triggerRefresh();
          setAmount("");
          setDestination("");
        })
        .catch(() => alert("❌ Withdrawal failed"))
        .finally(() => setLoading(false));
    } else if (action === "transfer") {
      if (!transferPreview) {
        api
          .post("/wallet/transfer", {
            farmer_id: farmerId,
            amount: Number(amount),
            destination,
          })
          .then((res) => {
            if (res.data.preview) {
              setTransferPreview(res.data);
            } else {
              alert("Unexpected response");
            }
          })
          .catch(() => alert("❌ Transfer preview failed"))
          .finally(() => setLoading(false));
      } else {
        api
          .post("/wallet/transfer", {
            farmer_id: farmerId,
            amount: Number(amount),
            destination,
            confirm: true,
          })
          .then(() => {
            alert("✅ Transfer successful!");
            fetchBalance();
            triggerRefresh();
            setTransferPreview(null);
            setAmount("");
            setDestination("");
            setSearchQuery("");
          })
          .catch(() => alert("❌ Transfer failed"))
          .finally(() => setLoading(false));
      }
    } else if (action === "pay") {
      let finalDestination = "";
      if (payType === "till") {
        finalDestination = `TILL:${destination}`;
      } else if (payType === "paybill") {
        finalDestination = `PAYBILL:${paybillNo}|ACC:${accNo}`;
      }

      api
        .post("/wallet/payment", {
          farmer_id: farmerId,
          amount: Number(amount),
          destination: finalDestination,
          merchant: finalDestination,
          mock: true,
        })
        .then(() => {
          alert("✅ Payment successful!");
          fetchBalance();
          triggerRefresh();
          setAmount("");
          setDestination("");
          setPaybillNo("");
          setAccNo("");
        })
        .catch(() => alert("❌ Payment failed"))
        .finally(() => setLoading(false));
    }
  };

  const renderActionForm = () => (
    <>
      <div className="flex gap-3 mb-4">
        <input
          type="number"
          placeholder={`Enter amount to ${action}`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 border p-3 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none"
          min="1"
          step="0.01"
        />

        {(action === "deposit" || action === "withdraw") && (
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as "mpesa" | "airtel")}
            className="border p-3 rounded-lg min-w-[120px] bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-green outline-none"
          >
            <option value="mpesa">📱 MPESA</option>
            <option value="airtel">📞 Airtel</option>
          </select>
        )}
      </div>

      {/* Transfer: searchable farmer select */}
      {action === "transfer" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Recipient Farmer</label>
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchFarmers(e.target.value);
            }}
            className="border p-3 rounded-lg w-full mb-2 focus:ring-2 focus:ring-brand-green outline-none"
          />

          {searching && (
            <div className="flex items-center gap-2 text-sm text-gray-500 p-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-green"></div>
              Searching...
            </div>
          )}

          {searchResults.length > 0 && (
            <ul className="border rounded-lg max-h-40 overflow-y-auto bg-white dark:bg-gray-800 shadow-lg">
              {searchResults.map((farmer) => (
                <li
                  key={farmer.id}
                  onClick={() => {
                    setDestination(farmer.id);
                    setSearchQuery(
                      `${farmer.first_name} ${farmer.last_name} (${farmer.mobile})`
                    );
                    setSearchResults([]);
                  }}
                  className="p-3 hover:bg-brand-green hover:text-white cursor-pointer text-sm border-b last:border-b-0 transition-colors"
                >
                  <div className="font-medium">{farmer.first_name} {farmer.last_name}</div>
                  <div className="text-xs opacity-75">{farmer.mobile}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Pay: Till vs PayBill */}
      {action === "pay" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Payment Method</label>
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="till"
                checked={payType === "till"}
                onChange={() => setPayType("till")}
                className="w-4 h-4 text-brand-green"
              />
              <span>Till Number</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="paybill"
                checked={payType === "paybill"}
                onChange={() => setPayType("paybill")}
                className="w-4 h-4 text-brand-green"
              />
              <span>PayBill</span>
            </label>
          </div>

          {payType === "till" && (
            <input
              type="text"
              placeholder="Enter Till Number"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-brand-green outline-none"
            />
          )}

          {payType === "paybill" && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="PayBill Number"
                value={paybillNo}
                onChange={(e) => setPaybillNo(e.target.value)}
                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-brand-green outline-none"
              />
              <input
                type="text"
                placeholder="Account Number"
                value={accNo}
                onChange={(e) => setAccNo(e.target.value)}
                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-brand-green outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Withdraw destination input */}
      {action === "withdraw" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Destination Phone Number</label>
          <input
            type="text"
            placeholder="e.g., 254712345678"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-brand-green outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">Enter phone number in international format</p>
        </div>
      )}
    </>
  );

  const isContinueDisabled =
    loading ||
    !amount ||
    Number(amount) <= 0 ||
    (action === "transfer" && !destination) ||
    (action === "pay" && payType === "till" && !destination) ||
    (action === "pay" && payType === "paybill" && (!paybillNo || !accNo)) ||
    (action === "withdraw" && !destination);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-brand-green dark:text-brand-apple flex items-center gap-2">
                <span>💰</span> My Wallet
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your funds, transfer to other farmers, and make payments
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Balance Card */}
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Balance</p>
            <p className="text-3xl font-bold text-brand-green dark:text-brand-apple">
              {formatCurrencyKES(balance)}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Action Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: "deposit", label: "Deposit", icon: "💰" },
              { id: "withdraw", label: "Withdraw", icon: "💸" },
              { id: "transfer", label: "Transfer", icon: "🔄" },
              { id: "pay", label: "Pay", icon: "📱" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setAction(tab.id as WalletAction);
                  setTransferPreview(null);
                  setDestination("");
                  setSearchQuery("");
                  setPaybillNo("");
                  setAccNo("");
                  setPayType("till");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  action === tab.id
                    ? "bg-brand-green text-white shadow-md scale-105"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {renderActionForm()}

          {/* Transfer confirmation */}
          {transferPreview && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
              <p className="text-yellow-800 dark:text-yellow-300 font-medium mb-3">
                {transferPreview.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTransferPreview(null)}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Confirm Transfer"}
                </button>
              </div>
            </div>
          )}

          <hr className="my-6 border-gray-200 dark:border-gray-700" />

          <TransactionTable farmerId={farmerId} refreshkey={refreshKey} />
        </div>

        {/* Footer */}
        {!transferPreview && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 rounded-lg bg-brand-green hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isContinueDisabled}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
