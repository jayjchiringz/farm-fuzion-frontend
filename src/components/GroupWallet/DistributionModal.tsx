// src/components/GroupWallet/DistributionModal.tsx
import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { groupWalletApi } from "../../services/groupWalletApi";
import { formatCurrencyKES } from "../../utils/format";
import { 
  X, Send, Users, DollarSign, AlertCircle, Info, 
  CheckCircle, RefreshCw, Calculator 
} from "lucide-react";

interface DistributionItem {
  farmerId: number;
  farmerName: string;
  phone: string;
  percentage: number;
  amount: number;
  selected: boolean;
}

export default function DistributionModal({
  groupId,
  userId,
  balance,
  onClose,
  onSuccess,
}: {
  groupId: string;
  userId: string;
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [totalAmount, setTotalAmount] = useState("");
  const [distributionMode, setDistributionMode] = useState<'equal' | 'percentage' | 'custom'>('equal');
  const [items, setItems] = useState<DistributionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  // Load farmers and contracts
  useEffect(() => {
    loadFarmers();
  }, [groupId]);

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const [farmersRes, contractsRes] = await Promise.all([
        api.get(`/farmers?group_id=${groupId}`),
        groupWalletApi.getContracts(groupId),
      ]);

      const farmers = Array.isArray(farmersRes.data) ? farmersRes.data : farmersRes.data.farmers || [];
      const contracts = contractsRes.contracts || [];

      const distributionItems: DistributionItem[] = farmers.map((farmer: any) => {
        const contract = contracts.find((c: any) => c.farmer_id === farmer.id);
        return {
          farmerId: farmer.id,
          farmerName: `${farmer.first_name || ''} ${farmer.last_name || ''}`.trim(),
          phone: farmer.mobile,
          percentage: contract?.distribution_percentage || 100,
          amount: 0,
          selected: true,
        };
      });

      setItems(distributionItems);
    } catch (err) {
      console.error('Failed to load farmers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recalculate on amount or mode change
  useEffect(() => {
    if (!totalAmount) {
      setItems(prev => prev.map(i => ({ ...i, amount: 0 })));
      return;
    }

    const total = parseFloat(totalAmount);
    const selected = items.filter(i => i.selected);

    if (selected.length === 0) return;

    if (distributionMode === 'equal') {
      const perFarmer = total / selected.length;
      setItems(prev => prev.map(i => ({
        ...i,
        amount: i.selected ? perFarmer : 0,
      })));
    } else if (distributionMode === 'percentage') {
      // Use each contract's percentage
      setItems(prev => prev.map(i => {
        if (!i.selected) return { ...i, amount: 0 };
        return {
          ...i,
          amount: (total * i.percentage) / 100,
        };
      }));
    }
  }, [totalAmount, distributionMode, items.length]);

  const updateItemAmount = (farmerId: number, newAmount: number) => {
    setItems(prev => prev.map(i =>
      i.farmerId === farmerId ? { ...i, amount: newAmount } : i
    ));
  };

  const updateItemPercentage = (farmerId: number, newPercentage: number) => {
    setItems(prev => prev.map(i =>
      i.farmerId === farmerId ? { ...i, percentage: newPercentage } : i
    ));
  };

  const toggleSelection = (farmerId: number) => {
    setItems(prev => prev.map(i =>
      i.farmerId === farmerId ? { ...i, selected: !i.selected } : i
    ));
  };

  const totalToDistribute = items
    .filter(i => i.selected)
    .reduce((sum, i) => sum + i.amount, 0);

  const handleSubmit = async () => {
    setError(null);

    const amt = parseFloat(totalAmount);
    if (!amt || amt <= 0) {
      setError('Please enter a valid total amount');
      return;
    }

    if (amt > balance) {
      setError(`Insufficient balance. Available: ${formatCurrencyKES(balance)}`);
      return;
    }

    const selectedItems = items.filter(i => i.selected && i.amount > 0);
    if (selectedItems.length === 0) {
      setError('Please select at least one farmer to distribute to');
      return;
    }

    if (Math.abs(totalToDistribute - amt) > 0.01) {
      setError(
        `Distribution total (${formatCurrencyKES(totalToDistribute)}) must equal ` +
        `the amount (${formatCurrencyKES(amt)})`
      );
      return;
    }

    setSubmitting(true);
    try {
      // Create a distribution transaction for each farmer
      // We'll create one bulk_distribution transaction with all recipients
      const distributions = selectedItems.map(item => ({
        farmer_id: item.farmerId,
        amount: item.amount,
      }));

      await groupWalletApi.initiateTransaction(groupId, {
        transaction_type: 'bulk_distribution',
        amount: amt,
        initiated_by: userId,
        metadata: {
          distributions,
          total_recipients: selectedItems.length,
        },
        description: description || `Bulk distribution to ${selectedItems.length} farmers`,
      });

      alert(
        `✅ Distribution initiated!\n` +
        `This will distribute ${formatCurrencyKES(amt)} to ${selectedItems.length} farmers.\n` +
        `Awaiting approval from signatories.`
      );
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to initiate distribution');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Send size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Distribute Funds</h3>
                <p className="text-sm text-white/80">
                  Distribute {formatCurrencyKES(balance)} to group members
                </p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Amount & Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Total Amount to Distribute (KES) *
              </label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                max={balance}
                step="0.01"
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none text-lg font-medium"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: {formatCurrencyKES(balance)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Distribution Mode
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'equal', label: 'Equal', icon: '⚖️' },
                  { value: 'percentage', label: 'By Contract', icon: '📊' },
                  { value: 'custom', label: 'Custom', icon: '✏️' },
                ].map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => setDistributionMode(mode.value as any)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      distributionMode === mode.value
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-green-500'
                    }`}
                  >
                    <span className="mr-1">{mode.icon}</span>
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Q1 2026 bulk sale distribution"
              className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Summary */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-green-800 dark:text-green-300">Recipients</p>
                <p className="text-xl font-bold text-green-900 dark:text-green-100">
                  {items.filter(i => i.selected).length}
                </p>
              </div>
              <div>
                <p className="text-xs text-green-800 dark:text-green-300">Total to Distribute</p>
                <p className="text-xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrencyKES(totalToDistribute)}
                </p>
              </div>
              <div>
                <p className="text-xs text-green-800 dark:text-green-300">Remaining</p>
                <p className={`text-xl font-bold ${
                  parseFloat(totalAmount) - totalToDistribute > 0.01
                    ? 'text-yellow-600'
                    : 'text-green-900 dark:text-green-100'
                }`}>
                  {formatCurrencyKES(Math.max(0, (parseFloat(totalAmount) || 0) - totalToDistribute))}
                </p>
              </div>
            </div>
          </div>

          {/* Farmers List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm">
                Group Members ({items.length})
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setItems(prev => prev.map(i => ({ ...i, selected: true })))}
                  className="text-xs text-green-600 hover:text-green-700"
                >
                  Select All
                </button>
                <button
                  onClick={() => setItems(prev => prev.map(i => ({ ...i, selected: false })))}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                Loading members...
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p>No farmers in this group</p>
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left w-8"></th>
                      <th className="px-3 py-2 text-left">Farmer</th>
                      {distributionMode === 'percentage' && (
                        <th className="px-3 py-2 text-right">Contract %</th>
                      )}
                      <th className="px-3 py-2 text-right">Amount (KES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item) => (
                      <tr key={item.farmerId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleSelection(item.farmerId)}
                            className="w-4 h-4 rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-medium">{item.farmerName}</p>
                          <p className="text-xs text-gray-500">{item.phone}</p>
                        </td>
                        {distributionMode === 'percentage' && (
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              value={item.percentage}
                              onChange={(e) => updateItemPercentage(item.farmerId, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border rounded text-right text-xs"
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </td>
                        )}
                        <td className="px-3 py-2 text-right">
                          {distributionMode === 'custom' ? (
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => updateItemAmount(item.farmerId, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border rounded text-right font-medium"
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            <span className="font-medium">
                              {formatCurrencyKES(item.amount)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

          {/* Info */}
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-300 flex items-start gap-2">
              <Info size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                This distribution will be submitted as a transaction requiring signatory approval.
                Once approved by the required number of signatories, funds will be automatically 
                transferred to each farmer's individual wallet.
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !totalAmount || totalToDistribute === 0}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {submitting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Initiating...
              </>
            ) : (
              <>
                <Send size={18} />
                Initiate Distribution
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
