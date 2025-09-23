import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import OtpModal from "./OtpModal";
import TransactionTable from "./TransactionTable";

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
  const [destination, setDestination] = useState("");

  const fetchBalance = async () => {
    const res = await api.get(`/wallet/${farmerId}/balance`);
    setBalance(res.data.balance);
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleSubmit = () => {
    if (action === "deposit") {
      api
        .post(`/wallet/topup/${method}`, {
          farmer_id: farmerId,
          amount: Number(amount),
        })
        .then(() => {
          alert("Top-up successful!");
          fetchBalance();
        })
        .catch(() => alert("Top-up failed"));
    } else if (action === "withdraw") {
      api
        .post(`/wallet/withdraw/${method}`, {
          farmer_id: farmerId,
          amount: Number(amount),
          destination,
        })
        .then(() => {
          alert("Withdrawal successful!");
          fetchBalance();
        })
        .catch(() => alert("Withdrawal failed"));
    } else if (action === "transfer") {
      api
        .post("/wallet/transfer", {
          farmer_id: farmerId,
          amount: Number(amount),
          destination,
        })
        .then(() => {
          alert("Transfer successful");
          fetchBalance();
        })
        .catch(() => alert("Transfer failed"));
    } else if (action === "pay") {
      api
        .post("/wallet/paybill", {
          farmer_id: farmerId,
          amount: Number(amount),
          destination,
        })
        .then(() => {
          alert("Payment sent");
          fetchBalance();
        })
        .catch(() => alert("Payment failed"));
    }
  };

  const renderActionForm = () => (
    <>
      <div className="flex gap-3 mb-4">
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 rounded w-full"
        />

        {(action === "deposit" || action === "withdraw") && (
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as "mpesa" | "airtel")}
            className="border p-2 rounded"
          >
            <option value="mpesa">MPESA</option>
            <option value="airtel">Airtel</option>
          </select>
        )}
      </div>

      {(action === "transfer" || action === "pay" || action === "withdraw") && (
        <input
          type="text"
          placeholder={
            action === "pay" ? "Merchant ID / Paybill No" : "Destination Phone/ID"
          }
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />
      )}
    </>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-brand-dark rounded-lg w-[95%] max-w-3xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header (fixed) */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-green dark:text-brand-apple">
            💰 Wallet
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:underline">
            ✖
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-lg mb-2">
            Current Balance:{" "}
            <span className="font-bold">{balance.toFixed(2)} KES</span>
          </p>

          {/* Tab Switch */}
          <div className="flex gap-2 mb-4">
            {["deposit", "withdraw", "transfer", "pay"].map((tab) => (
              <button
                key={tab}
                onClick={() => setAction(tab as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  action === tab
                    ? "bg-brand-green text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {renderActionForm()}

          <hr className="my-6" />

          <TransactionTable farmerId={farmerId} />
        </div>

        {/* Footer (fixed) */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
          <button onClick={onClose} className="text-gray-500 hover:underline">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-brand-green text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Processing..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
