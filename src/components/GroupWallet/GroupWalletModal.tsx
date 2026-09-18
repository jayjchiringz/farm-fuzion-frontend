// src/components/GroupWallet/GroupWalletModal.tsx
import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useGroupWallet } from "../../contexts/GroupWalletContext";
import { groupWalletApi } from "../../services/groupWalletApi";
import { formatCurrencyKES } from "../../utils/format";
import { 
  X, Wallet, TrendingUp, Users, Clock, CheckCircle, 
  XCircle, AlertCircle, RefreshCw, Plus, Send, 
  FileText, Shield, ArrowRight, Building2, DollarSign,
  ChevronRight, Info, Package, UserCheck, AlertTriangle
} from "lucide-react";
import GroupTransactionTable from "./GroupTransactionTable";
import MultiSigApprovalQueue from "./MultiSigApprovalQueue";
import InitiateTransactionModal from "./InitiateTransactionModal";
import DistributionModal from "./DistributionModal";
import CustodyTracker from "./CustodyTracker";
import SignatoryManager from "./SignatoryManager";

type TabType = 'overview' | 'approvals' | 'transactions' | 'signatories' | 'custody';

export default function GroupWalletModal({
  groupId,
  onClose,
}: {
  groupId: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const {
    groupWallet,
    balance,
    loading: walletLoading,
    error: walletError,
    loadGroupWallet,
    registerWallet,
    refreshBalance,
    refreshInfo,
    isWalletActive,
    needsRegistration,
  } = useGroupWallet();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [signatoriesCount, setSignatoriesCount] = useState(0);

  useEffect(() => {
    if (groupId) {
      loadGroupWallet(groupId);
    }
  }, [groupId]);

  // Load pending approvals count
  useEffect(() => {
    const loadPendingCount = async () => {
      if (isWalletActive && user?.id) {
        try {
          const res = await groupWalletApi.getPendingApprovals(groupId, user.id);
          setPendingApprovalsCount(res.count);
        } catch (err) {
          console.error('Failed to load pending approvals:', err);
        }
      }
    };
    loadPendingCount();
  }, [isWalletActive, groupId, user?.id, activeTab]);

  // Load signatories count
  useEffect(() => {
    const loadSignatoriesCount = async () => {
      try {
        const res = await groupWalletApi.getSignatories(groupId);
        setSignatoriesCount(res.count);
      } catch (err) {
        console.error('Failed to load signatories:', err);
      }
    };
    loadSignatoriesCount();
  }, [groupId]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await registerWallet(groupId);
      alert('✅ Group wallet created successfully!');
    } catch (err) {
      alert('❌ Failed to create group wallet. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleRefresh = async () => {
    await refreshInfo(groupId);
    if (isWalletActive) {
      await refreshBalance(groupId);
    }
  };

  // ==================== RENDER: LOADING ====================

  if (walletLoading && !groupWallet) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-md p-6 shadow-2xl">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
            <span className="ml-3 text-gray-600">Loading group wallet...</span>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER: REGISTRATION SCREEN ====================

  if (needsRegistration) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-md p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Building2 size={32} className="text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold">Set Up Group Wallet</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Your cooperative doesn't have a wallet yet. Click below to create one.
            </p>
          </div>

          {walletError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
              {walletError}
            </div>
          )}

          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg mb-4">
            <p className="text-sm text-purple-800 dark:text-purple-300 flex items-start gap-2">
              <Info size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                This will create a Unipesa wallet for your cooperative. 
                Group admins will need to approve transactions.
              </span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRegister}
              disabled={registering}
              className="flex-1 px-4 py-3 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {registering ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Creating...
                </span>
              ) : (
                'Create Group Wallet'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER: MAIN ====================

  if (!groupWallet) return null;

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { id: 'approvals' as TabType, label: 'Approvals', icon: '✍️', badge: pendingApprovalsCount },
    { id: 'transactions' as TabType, label: 'Transactions', icon: '📄' },
    { id: 'signatories' as TabType, label: 'Signatories', icon: '👥', badge: signatoriesCount },
    { id: 'custody' as TabType, label: 'Custody', icon: '📦' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {groupWallet.name}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isWalletActive 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {isWalletActive ? '✓ Active' : 'Inactive'}
                  </span>
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Group Wallet • Requires {groupWallet.approvalThreshold} signatures
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Balance Card */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm col-span-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Group Balance</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrencyKES(balance)}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Signatories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {signatoriesCount}
              </p>
              <p className="text-xs text-gray-500">
                Required: {groupWallet.approvalThreshold}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {groupWallet.farmerCount}
              </p>
              <p className="text-xs text-gray-500">Farmers</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
          <button
            onClick={() => setShowInitiateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={16} />
            New Transaction
          </button>
          
          <button
            onClick={() => setShowDistributionModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Send size={16} />
            Distribute Funds
          </button>

          <div className="ml-auto flex items-center gap-2">
            {pendingApprovalsCount > 0 && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-medium flex items-center gap-1">
                <Clock size={12} />
                {pendingApprovalsCount} pending approval{pendingApprovalsCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-purple-600 text-purple-600 dark:text-purple-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-purple-600 text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              groupId={groupId}
              balance={balance}
              signatoriesCount={signatoriesCount}
              pendingApprovalsCount={pendingApprovalsCount}
              farmerCount={groupWallet.farmerCount}
              onNavigate={setActiveTab}
            />
          )}
          
          {activeTab === 'approvals' && (
            <MultiSigApprovalQueue
              groupId={groupId}
              userId={user?.id || ''}
              onRefresh={() => {
                refreshBalance(groupId);
                loadGroupWallet(groupId);
              }}
            />
          )}
          
          {activeTab === 'transactions' && (
            <GroupTransactionTable groupId={groupId} />
          )}
          
          {activeTab === 'signatories' && (
            <SignatoryManager groupId={groupId} />
          )}
          
          {activeTab === 'custody' && (
            <CustodyTracker groupId={groupId} />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Modals */}
      {showInitiateModal && (
        <InitiateTransactionModal
          groupId={groupId}
          userId={user?.id || ''}
          onClose={() => setShowInitiateModal(false)}
          onSuccess={() => {
            setShowInitiateModal(false);
            refreshInfo(groupId);
            loadGroupWallet(groupId);
          }}
        />
      )}

      {showDistributionModal && (
        <DistributionModal
          groupId={groupId}
          userId={user?.id || ''}
          balance={balance}
          onClose={() => setShowDistributionModal(false)}
          onSuccess={() => {
            setShowDistributionModal(false);
            refreshBalance(groupId);
            loadGroupWallet(groupId);
          }}
        />
      )}
    </div>
  );
}

// ==================== OVERVIEW TAB ====================

function OverviewTab({
  groupId,
  balance,
  signatoriesCount,
  pendingApprovalsCount,
  farmerCount,
  onNavigate,
}: {
  groupId: string;
  balance: number;
  signatoriesCount: number;
  pendingApprovalsCount: number;
  farmerCount: number;
  onNavigate: (tab: any) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Available Balance"
          value={formatCurrencyKES(balance)}
          icon={<Wallet className="text-purple-600" size={24} />}
          color="from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20"
        />
        <StatCard
          label="Active Signatories"
          value={String(signatoriesCount)}
          icon={<UserCheck className="text-blue-600" size={24} />}
          color="from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
        />
        <StatCard
          label="Pending Approvals"
          value={String(pendingApprovalsCount)}
          icon={<Clock className="text-yellow-600" size={24} />}
          color="from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20"
          onClick={() => onNavigate('approvals')}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Shield size={20} className="text-purple-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction
            icon="📝"
            label="New Transaction"
            onClick={() => onNavigate('approvals')}
          />
          <QuickAction
            icon="💸"
            label="Distribute Funds"
            onClick={() => onNavigate('approvals')}
          />
          <QuickAction
            icon="👥"
            label="Manage Signatories"
            onClick={() => onNavigate('signatories')}
          />
          <QuickAction
            icon="📦"
            label="Track Custody"
            onClick={() => onNavigate('custody')}
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <h3 className="font-bold text-lg mb-2">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <Step number="1" text="Initiate a transaction" />
          <Step number="2" text="Signatories approve" />
          <Step number="3" text="Auto-execution on threshold" />
          <Step number="4" text="Funds transferred" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${color} rounded-xl p-4 border border-gray-200 dark:border-gray-700 ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-center"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
    </button>
  );
}

function Step({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 font-bold">
        {number}
      </div>
      <p className="text-sm text-white/90 mt-1.5">{text}</p>
    </div>
  );
}
