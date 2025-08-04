import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import OtpModal from "./OtpModal";
import TransactionTable from "./TransactionTable";

export default function WalletModal({ farmerId, onClose }: {
  farmerId: string;
  onClose: () => void;
}) {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"mpesa" | "Visa">("mpesa");
  const [otpPhase, setOtpPhase] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    const res = await api.get(`/wallet/${farmerId}/balance`);
    setBalance(res.data.balance);
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const requestTopUp = async () => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    try {
      await api.post(`/otp/request`, { phone: user.mobile });
      setOtpPhase(true);
    } catch (err) {
      alert("OTP request failed");
    } finally {
      setLoading(false);
    }
  };

  const confirmTopUp = async (otp: string) => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    try {
      await api.post(`/otp/verify`, { phone: user.mobile, otp });

      await api.post(`/wallet/topup/${method}`, {
        farmer_id: farmerId,
        phone: user.mobile,
        amount: Number(amount),
      });

      alert("Top-up successful!");
      fetchBalance();
      setOtpPhase(false);
    } catch (err) {
      alert("Top-up failed or OTP invalid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-brand-dark rounded-lg p-6 w-[95%] max-w-xl shadow-xl">
        <h2 className="text-2xl font-bold text-brand-green dark:text-brand-apple mb-4">
          💰 Wallet
        </h2>

        <p className="text-lg mb-2">Current Balance: <span className="font-bold">{balance.toFixed(2)} KES</span></p>

        <div className="flex gap-3 mb-4">
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as "mpesa" | "Visa")}
            className="border p-2 rounded"
          >
            <option value="mpesa">MPESA</option>
            <option value="Visa">Visa</option>
          </select>
        </div>

        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="text-gray-500 hover:underline">Cancel</button>
          <button
            onClick={requestTopUp}
            className="bg-brand-green text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Processing..." : "Continue"}
          </button>
        </div>

        <hr className="my-6" />

        <TransactionTable farmerId={farmerId} />

        {otpPhase && <OtpModal onSubmit={confirmTopUp} onClose={() => setOtpPhase(false)} />}
      </div>
    </div>
  );
}
