// src/components/GroupWallet/MultiSigApprovalQueue.tsx
import React, { useEffect, useState } from "react";
import { groupWalletApi, GroupTransactionRequest } from "../../services/groupWalletApi";
import { formatCurrencyKES } from "../../utils/format";
import { 
  CheckCircle, XCircle, Clock, User, MessageSquare, 
  ChevronRight, RefreshCw, AlertCircle
} from "lucide-react";

export default function MultiSigApprovalQueue({
  groupId,
  userId,
  onRefresh,
}: {
  groupId: string;
  userId: string;
  onRefresh?: () => void;
}) {
  const [requests, setRequests] = useState<GroupTransactionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<GroupTransactionRequest | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    loadPendingApprovals();
  }, [groupId, userId]);

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      const res = await groupWalletApi.getPendingApprovals(groupId, userId);
      setRequests(res.requests);
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (
    requestId: string,
    decision: 'approved' | 'rejected'
  ) => {
    setProcessing(requestId);
    try {
      const result = await groupWalletApi.submitApproval(requestId, {
        user_id: userId,
        decision,
        comments: comment || undefined,
      });

      alert(
        `✅ Transaction ${decision}!\n` +
        `Approvals: ${result.approvals}/${result.requiredApprovals}\n` +
        (result.executed ? '🎉 Transaction executed!' : '')
      );

      setSelectedRequest(null);
      setComment("");
      await loadPendingApprovals();
      
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`❌ Failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Loading approvals...</span>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h3 className="text-lg font-bold mb-2">No Pending Approvals</h3>
        <p className="text-gray-500 dark:text-gray-400">
          All transactions are up to date. Great job! 🎉
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Clock size={20} className="text-yellow-600" />
          Pending Approvals
          <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
            {requests.length}
          </span>
        </h3>
        <button
          onClick={loadPendingApprovals}
          className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                    {request.transaction_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    ID: {request.id.slice(0, 8)}...
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrencyKES(request.amount)}
                </p>
                {request.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {request.description}
                  </p>
                )}
              </div>
              
              <div className="text-right">
                <p className="text-xs text-gray-500">Initiated by</p>
                <p className="text-sm font-medium flex items-center gap-1 justify-end">
                  <User size={12} />
                  {request.initiated_by_email?.split('@')[0] || 'Unknown'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(request.initiated_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Approval Progress</span>
                <span className="font-medium">
                  {request.current_approvals} / {request.required_approvals}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(request.current_approvals / request.required_approvals) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleDecision(request.id, 'approved')}
                disabled={processing === request.id}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
              >
                {processing === request.id ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Approve
              </button>
              
              <button
                onClick={() => {
                  setSelectedRequest(request);
                  setComment("");
                }}
                disabled={processing === request.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
              >
                <XCircle size={16} />
                Reject
              </button>

              <button
                onClick={() => setSelectedRequest(request)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Rejection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Reject Transaction</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to reject this {selectedRequest.transaction_type} 
              of {formatCurrencyKES(selectedRequest.amount)}?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Reason (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Provide a reason for rejection..."
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedRequest(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecision(selectedRequest.id, 'rejected')}
                disabled={processing === selectedRequest.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing === selectedRequest.id ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <XCircle size={16} />
                )}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
