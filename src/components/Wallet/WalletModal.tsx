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
  const [destination, setDestination] = useState(""); // for transfers or till numbers
  const [transferPreview, setTransferPreview] = useState<any | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // 👇 NEW pay type states
  const [payType, setPayType] = useState<"till" | "paybill">("till");
  const [paybillNo, setPaybillNo] = useState("");
  const [accNo, setAccNo] = useState("");

  // 👇 refreshKey state for ledger refresh
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const fetchBalance = async () => {
    const res = await api.get(`/wallet/${farmerId}/balance`);
    setBalance(res.data.balance);
  };

  // 🔍 search farmers
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
          triggerRefresh();
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
          triggerRefresh();
        })
        .catch(() => alert("Withdrawal failed"));
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
          .catch(() => alert("Transfer preview failed"));
      } else {
        api
          .post("/wallet/transfer", {
            farmer_id: farmerId,
            amount: Number(amount),
            destination,
            confirm: true,
          })
          .then(() => {
            alert("Transfer successful");
            fetchBalance();
            triggerRefresh();
            setTransferPreview(null);
            setAmount("");
            setDestination("");
            setSearchQuery("");
          })
          .catch(() => alert("Transfer failed"));
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
          alert("Payment successful!");
          fetchBalance();
          triggerRefresh();
          setAmount("");
          setDestination("");
          setPaybillNo("");
          setAccNo("");
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

      {/* Transfer: searchable farmer select */}
      {action === "transfer" && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search farmer by name or phone"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchFarmers(e.target.value);
            }}
            className="border p-2 rounded w-full mb-2"
          />

          {searching && <p className="text-sm text-gray-500">Searching...</p>}

          {searchResults.length > 0 && (
            <ul className="border rounded max-h-40 overflow-y-auto bg-white">
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
                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {farmer.first_name} {farmer.last_name} — {farmer.mobile}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Pay: Till vs PayBill */}
      {action === "pay" && (
        <div className="mb-4">
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="till"
                checked={payType === "till"}
                onChange={() => setPayType("till")}
              />
              Till Number
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="paybill"
                checked={payType === "paybill"}
                onChange={() => setPayType("paybill")}
              />
              PayBill
            </label>
          </div>

          {payType === "till" && (
            <input
              type="text"
              placeholder="Till Number"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="border p-2 rounded w-full"
            />
          )}

          {payType === "paybill" && (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="PayBill Number"
                value={paybillNo}
                onChange={(e) => setPaybillNo(e.target.value)}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Account Number"
                value={accNo}
                onChange={(e) => setAccNo(e.target.value)}
                className="border p-2 rounded w-full"
                pattern="[A-Za-z0-9]+"
              />
            </div>
          )}
        </div>
      )}

      {/* Withdraw destination input */}
      {action === "withdraw" && (
        <input
          type="text"
          placeholder="Destination Phone/ID"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />
      )}
    </>
  );

  const isContinueDisabled =
    loading ||
    !amount ||
    Number(amount) <= 0 ||
    (action === "transfer" && !destination);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-brand-dark rounded-lg w-[95%] max-w-3xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-brand-green dark:text-brand-apple">
            💰 Wallet
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:underline">
            ✖
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-lg mb-2">
            Current Balance:{" "}
            <span className="font-bold">{balance.toFixed(2)} KES</span>
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {["deposit", "withdraw", "transfer", "pay"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setAction(tab as any);
                  setTransferPreview(null);
                  setDestination("");
                  setSearchQuery("");
                  setPaybillNo("");
                  setAccNo("");
                  setPayType("till");
                }}
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

          {/* Transfer confirmation */}
          {transferPreview && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
              <p className="text-yellow-800 font-medium mb-2">
                {transferPreview.message}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTransferPreview(null)}
                  className="px-3 py-1 rounded bg-gray-200 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-3 py-1 rounded bg-green-600 text-white"
                >
                  Confirm Transfer
                </button>
              </div>
            </div>
          )}

          <hr className="my-6" />

          <TransactionTable farmerId={farmerId} refreshkey={refreshKey} />
        </div>

        {/* Footer */}
        {!transferPreview && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
            <button onClick={onClose} className="text-gray-500 hover:underline">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-brand-green text-white px-4 py-2 rounded"
              disabled={isContinueDisabled}
            >
              {loading ? "Processing..." : "Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
