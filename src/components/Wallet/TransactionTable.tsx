// farm-fuzion-frontend\src\components\Wallet\TransactionTable.tsx
import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { formatCurrencyKES } from "../../utils/format";

export default function TransactionTable({
  farmerId,
  refreshkey,
}: {
  farmerId: string;
  refreshkey: number;
}) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    type: "",
    start: "",
    end: "",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.start) params.append("start", filters.start);
      if (filters.end) params.append("end", filters.end);
      params.append("limit", pageSize.toString());
      params.append("offset", ((page - 1) * pageSize).toString());

      const res = await api.get(
        `/wallet/${farmerId}/transactions?${params.toString()}`
      );
      
      console.log("📊 Transaction response:", res.data);
      
      // Handle the response structure
      if (res.data && res.data.success) {
        setTransactions(res.data.transactions || []);
        setTotalPages(Math.ceil((res.data.pagination?.total || 0) / pageSize));
      } else {
        setTransactions([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Failed to fetch transactions", err);
      setTransactions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters, refreshkey, page, pageSize]);

  // Safe date formatting
  const formatDate = (timestamp: string) => {
    if (!timestamp) return '-';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  // Get direction icon and color
  const getDirectionDisplay = (direction: string, type: string) => {
    if (type === 'topup') {
      return { icon: '↓', color: 'text-green-600', text: 'Top-up' };
    }
    if (direction === 'in') {
      return { icon: '↓', color: 'text-green-600', text: 'Received' };
    } else if (direction === 'out') {
      return { icon: '↑', color: 'text-red-600', text: 'Sent' };
    }
    return { icon: '→', color: 'text-gray-600', text: direction };
  };

  // Get source/destination display
  const getSourceDestination = (tx: any) => {
    if (tx.type === 'topup') {
      return { from: 'External', to: 'Wallet' };
    } else if (tx.type === 'withdraw') {
      return { from: 'Wallet', to: tx.destination || 'External' };
    } else if (tx.type === 'transfer') {
      return { from: tx.source || 'You', to: tx.destination || 'Another farmer' };
    } else if (tx.type === 'paybill' || tx.type === 'deduction') {
      return { from: 'Wallet', to: tx.destination || 'Payment' };
    }
    return { from: tx.source || '-', to: tx.destination || '-' };
  };

  return (
    <div>
      <h4 className="font-bold mb-4 text-lg flex items-center gap-2">
        <span>📄 Wallet Ledger</span>
        <span className="text-sm font-normal text-gray-500">
          ({transactions.length} transactions)
        </span>
      </h4>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <select
          className="border p-2 rounded bg-white dark:bg-gray-700"
          value={filters.type}
          onChange={(e) => {
            setFilters({ ...filters, type: e.target.value });
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          <option value="topup">💰 Top-Up</option>
          <option value="withdraw">💸 Withdraw</option>
          <option value="transfer">🔄 Transfer</option>
          <option value="paybill">📱 PayBill</option>
          <option value="deduction">🛒 Marketplace</option>
        </select>

        <input
          type="date"
          className="border p-2 rounded bg-white dark:bg-gray-700"
          value={filters.start}
          onChange={(e) => {
            setFilters({ ...filters, start: e.target.value });
            setPage(1);
          }}
        />
        <span className="text-gray-500">→</span>
        <input
          type="date"
          className="border p-2 rounded bg-white dark:bg-gray-700"
          value={filters.end}
          onChange={(e) => {
            setFilters({ ...filters, end: e.target.value });
            setPage(1);
          }}
        />

        <button
          className="px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded text-sm hover:bg-gray-300"
          onClick={() => {
            setFilters({ type: "", start: "", end: "" });
            setPage(1);
          }}
        >
          Reset Filters
        </button>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border p-2 rounded bg-white dark:bg-gray-700"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
          <span className="ml-3 text-gray-600">Loading transactions...</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-left">From</th>
                  <th className="p-3 text-left">To</th>
                  <th className="p-3 text-left">Direction</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.length > 0 ? (
                  transactions.map((tx: any) => {
                    const direction = getDirectionDisplay(tx.direction, tx.type);
                    const { from, to } = getSourceDestination(tx);
                    
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-3">
                          <span className="font-medium">{tx.type}</span>
                        </td>
                        <td className="p-3 text-right font-mono">
                          <span className={direction.color}>
                            {direction.icon} {formatCurrencyKES(tx.amount)}
                          </span>
                        </td>
                        <td className="p-3 max-w-[150px] truncate" title={from}>
                          {from}
                        </td>
                        <td className="p-3 max-w-[150px] truncate" title={to}>
                          {to}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${direction.color} bg-opacity-10`}>
                            {direction.text}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            tx.status === 'completed' 
                              ? 'bg-green-100 text-green-700' 
                              : tx.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {formatDate(tx.created_at || tx.timestamp)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">📭</span>
                        <p>No transactions found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                ← Previous
              </button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
