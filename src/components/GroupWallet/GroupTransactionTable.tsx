// src/components/GroupWallet/GroupTransactionTable.tsx
import React, { useEffect, useState } from "react";
import { groupWalletApi, GroupTransactionRequest } from "../../services/groupWalletApi";
import { formatCurrencyKES } from "../../utils/format";
import { 
  Clock, CheckCircle, XCircle, RefreshCw, Eye, 
  ChevronDown, ChevronUp, User, Calendar, DollarSign
} from "lucide-react";

export default function GroupTransactionTable({ groupId }: { groupId: string }) {
  const [transactions, setTransactions] = useState<GroupTransactionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [groupId, statusFilter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await groupWalletApi.getGroupTransactions(groupId, {
        status: statusFilter || undefined,
        limit: 50,
      });
      setTransactions(res.transactions);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Clock size={12} /> },
      partially_approved: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <Clock size={12} /> },
      approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle size={12} /> },
      executed: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', icon: <CheckCircle size={12} /> },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle size={12} /> },
      failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle size={12} /> },
    };
    const cfg = config[status] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
        {cfg.icon}
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Transaction History</h3>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="partially_approved">Partially Approved</option>
            <option value="approved">Approved</option>
            <option value="executed">Executed</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={loadTransactions}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <DollarSign size={48} className="mx-auto mb-3 opacity-50" />
          <p>No transactions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <DollarSign size={18} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {tx.transaction_type.replace(/_/g, ' ')}
                        </span>
                        {getStatusBadge(tx.status)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {tx.description || 'No description'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right mr-4">
                    <p className="font-bold text-lg">{formatCurrencyKES(tx.amount)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.initiated_at).toLocaleDateString()}
                    </p>
                  </div>

                  {expandedId === tx.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === tx.id && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 bg-gray-50 dark:bg-gray-800/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Initiated By</p>
                      <p className="font-medium flex items-center gap-1">
                        <User size={12} />
                        {tx.initiated_by_email || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Initiated At</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(tx.initiated_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">Approvals</p>
                      <p className="font-medium">
                        {tx.current_approvals} / {tx.required_approvals}
                      </p>
                    </div>
                    {tx.unipesa_transaction_id && (
                      <div>
                        <p className="text-gray-500 mb-1">Unipesa ID</p>
                        <p className="font-mono text-xs">{tx.unipesa_transaction_id}</p>
                      </div>
                    )}
                    {tx.executed_at && (
                      <div>
                        <p className="text-gray-500 mb-1">Executed At</p>
                        <p className="font-medium">
                          {new Date(tx.executed_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
