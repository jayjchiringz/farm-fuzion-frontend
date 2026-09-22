// src/components/GroupWallet/InitiateTransactionModal.tsx
import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { groupWalletApi } from "../../services/groupWalletApi";
import { formatCurrencyKES } from "../../utils/format";
import { 
  X, Send, AlertCircle, Info, User, DollarSign, 
  ChevronRight, Building2, CreditCard, RefreshCw 
} from "lucide-react";

const TRANSACTION_TYPES = [
  { 
    value: 'distribution_to_farmer', 
    label: 'Distribute to Farmer', 
    icon: '👨‍🌾',
    description: 'Send funds to a specific farmer'
  },
  { 
    value: 'fee_collection', 
    label: 'Collect Fee', 
    icon: '💰',
    description: 'Collect fees from a farmer'
  },
  { 
    value: 'external_payment', 
    label: 'External Payment', 
    icon: '🏦',
    description: 'Pay an external provider'
  },
  { 
    value: 'withdrawal', 
    label: 'Withdrawal', 
    icon: '💸',
    description: 'Withdraw from group wallet'
  },
];

export default function InitiateTransactionModal({
  groupId,
  userId,
  onClose,
  onSuccess,
}: {
  groupId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [transactionType, setTransactionType] = useState('distribution_to_farmer');
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [providerId, setProviderId] = useState('MPESA');
  const [account, setAccount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load farmers when needed
  useEffect(() => {
    if (['distribution_to_farmer', 'fee_collection'].includes(transactionType)) {
      loadFarmers();
    }
  }, [transactionType]);

  const loadFarmers = async () => {
    setLoadingFarmers(true);
    try {
      const res = await api.get(`/farmers?group_id=${groupId}`);
      const data = Array.isArray(res.data) ? res.data : res.data.farmers || [];
      setFarmers(data);
    } catch (err) {
      console.error('Failed to load farmers:', err);
    } finally {
      setLoadingFarmers(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const amt = parseFloat(amount);

    if (['distribution_to_farmer', 'fee_collection'].includes(transactionType) && !selectedFarmerId) {
      setError('Please select a farmer');
      return;
    }

    if (['external_payment', 'withdrawal'].includes(transactionType) && !account) {
      setError('Please enter the destination account');
      return;
    }

    setSubmitting(true);
    try {
      const metadata: any = {};
      
      if (['distribution_to_farmer', 'fee_collection'].includes(transactionType)) {
        metadata.farmer_id = parseInt(selectedFarmerId);
      }
      
      if (['external_payment', 'withdrawal'].includes(transactionType)) {
        metadata.providerId = providerId;
        metadata.account = account;
      }

      await groupWalletApi.initiateTransaction(groupId, {
        transaction_type: transactionType,
        amount: amt,
        initiated_by: userId,
        metadata,
        description: description || undefined,
      });

      alert('✅ Transaction initiated! Awaiting approvals from other signatories.');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to initiate transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Send size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">New Transaction</h3>
                <p className="text-sm text-white/80">Requires {`multiple signatures`}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Transaction Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRANSACTION_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setTransactionType(type.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    transactionType === type.value
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{type.icon}</span>
                    <span className="font-medium text-sm">{type.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Amount (KES) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="1"
              step="0.01"
              className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none text-lg font-medium"
            />
          </div>

          {/* Farmer Selection (conditional) */}
          {['distribution_to_farmer', 'fee_collection'].includes(transactionType) && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Farmer *
              </label>
              {loadingFarmers ? (
                <div className="text-sm text-gray-500">Loading farmers...</div>
              ) : (
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">Select a farmer...</option>
                  {farmers.map((farmer) => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.first_name} {farmer.last_name} ({farmer.mobile})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* External Payment Fields (conditional) */}
          {['external_payment', 'withdrawal'].includes(transactionType) && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Provider
                </label>
                <select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="MPESA">M-Pesa</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Destination Account *
                </label>
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="Phone number or account"
                  className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="e.g., Q1 2026 bulk sale distribution"
              className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
            />
          </div>

          {/* Info */}
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-300 flex items-start gap-2">
              <Info size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                This transaction will require approval from other group signatories. 
                You cannot approve your own transaction.
              </span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-300 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {submitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Initiating...
              </>
            ) : (
              <>
                <Send size={16} />
                Initiate Transaction
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
