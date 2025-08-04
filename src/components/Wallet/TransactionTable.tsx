import { useEffect, useState } from "react";
import { api } from "../../services/api";
import React from "react";

export default function TransactionTable({ farmerId }: { farmerId: string }) {
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    type: "",
    start: "",
    end: "",
  });

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.start) params.append("start", filters.start);
      if (filters.end) params.append("end", filters.end);

      const res = await api.get(`/wallet/${farmerId}/transactions?${params.toString()}`);
      setTransactions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  return (
    <div>
      <h4 className="font-bold mb-2 text-lg">📄 Wallet Ledger</h4>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          className="border p-1 rounded"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="topup">Top-Up</option>
          <option value="withdraw">Withdraw</option>
          <option value="transfer">Transfer</option>
          <option value="paybill">PayBill</option>
          <option value="buygoods">BuyGoods</option>
        </select>

        <input
          type="date"
          className="border p-1 rounded"
          value={filters.start}
          onChange={(e) => setFilters({ ...filters, start: e.target.value })}
        />
        <input
          type="date"
          className="border p-1 rounded"
          value={filters.end}
          onChange={(e) => setFilters({ ...filters, end: e.target.value })}
        />

        <button
          className="px-3 py-1 bg-gray-200 rounded text-sm"
          onClick={() => setFilters({ type: "", start: "", end: "" })}
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <table className="w-full text-sm border">
        <thead>
          <tr>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Amount</th>
            <th className="p-2 border">Source</th>
            <th className="p-2 border">Destination</th>
            <th className="p-2 border">Direction</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Time</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx: any) => (
            <tr key={tx.id}>
              <td className="p-2 border">{tx.type}</td>
              <td className="p-2 border">{tx.amount}</td>
              <td className="p-2 border">{tx.source || "-"}</td>
              <td className="p-2 border">{tx.destination || "-"}</td>
              <td className="p-2 border">{tx.direction}</td>
              <td className="p-2 border">{tx.status}</td>
              <td className="p-2 border">{new Date(tx.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
