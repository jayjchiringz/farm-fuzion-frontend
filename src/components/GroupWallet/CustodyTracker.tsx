// src/components/GroupWallet/CustodyTracker.tsx
import React, { useEffect, useState } from "react";
import { groupWalletApi, CustodyRecord } from "../../services/groupWalletApi";
import { formatCurrencyKES } from "../../utils/format";
import { 
  Package, Search, Filter, RefreshCw, Eye, User, 
  MapPin, Calendar, DollarSign, TrendingUp, CheckCircle,
  Clock, XCircle
} from "lucide-react";

export default function CustodyTracker({ groupId }: { groupId: string }) {
  const [records, setRecords] = useState<CustodyRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustody();
  }, [groupId, statusFilter]);

  const loadCustody = async () => {
    setLoading(true);
    try {
      const res = await groupWalletApi.getGroupCustody(groupId, statusFilter || undefined);
      setRecords(res.records || []);
      setSummary(res.summary);
    } catch (err) {
      console.error('Failed to load custody:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
    return (
      r.product_name.toLowerCase().includes(q) ||
      name.includes(q) ||
      (r.mobile || '').includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      in_custody: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <Clock size={12} /> },
      sold: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <TrendingUp size={12} /> },
      distributed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle size={12} /> },
      returned: { color: 'bg-gray-100 text-gray-800', icon: <XCircle size={12} /> },
      damaged: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle size={12} /> },
    };
    const cfg = config[status] || config.in_custody;
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
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">In Custody</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {summary.in_custody_count || 0}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">Sold</p>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {summary.sold_count || 0}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-300">Distributed</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {summary.distributed_count || 0}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-800 dark:text-purple-300">Total Value</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {formatCurrencyKES(Number(summary.total_expected_value) || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by product, farmer, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="in_custody">In Custody</option>
          <option value="sold">Sold</option>
          <option value="distributed">Distributed</option>
        </select>
        <button
          onClick={loadCustody}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Records Table */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-3 opacity-50" />
          <p>No custody records found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Farmer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Product</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Quantity</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Expected Value</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Farmer Share</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">
                        {record.first_name} {record.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{record.mobile}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{record.product_name}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {record.quantity} {record.unit}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {record.expected_total_value ? formatCurrencyKES(record.expected_total_value) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-600">
                    {record.farmer_share ? formatCurrencyKES(record.farmer_share) : '-'}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(record.received_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
