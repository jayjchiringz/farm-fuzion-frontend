import React, { useEffect, useState } from "react";
import { api } from "../../services/api";

export default function TransactionTable({ farmerId, refreshkey }: { farmerId: string; refreshkey: number }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    type: "",
    start: "",
    end: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.start) params.append("start", filters.start);
      if (filters.end) params.append("end", filters.end);

      const res = await api.get(
        `/wallet/${farmerId}/transactions?${params.toString()}`
      );
      setTransactions(res.data || []);
      setPage(1);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const totalPages = Math.ceil(transactions.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const visibleTx = transactions.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <h4 className="font-bold mb-2 text-lg">📄 Wallet Ledger</h4>

      {/* Filters + Page size */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
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

        {/* Page size selector */}
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-gray-600">
            Rows per page:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border p-1 rounded"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Responsive Scrollable Table */}
      <div className="overflow-y-auto border rounded max-h-64 md:max-h-80 lg:max-h-96">
        <table className="w-full text-sm border">
          <thead className="sticky top-0 bg-gray-100">
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
            {visibleTx.map((tx: any) => (
              <tr key={tx.id}>
                <td className="p-2 border">{tx.type}</td>
                <td className="p-2 border">{tx.amount}</td>
                <td className="p-2 border">{tx.source || "-"}</td>
                <td className="p-2 border">{tx.destination || "-"}</td>
                <td className="p-2 border">{tx.direction}</td>
                <td className="p-2 border">{tx.status}</td>
                <td className="p-2 border">
                  {new Date(tx.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-3 text-sm">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          ⬅ Prev
        </button>
        <span>
          Page {page} of {totalPages || 1}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next ➡
        </button>
      </div>
    </div>
  );
}
