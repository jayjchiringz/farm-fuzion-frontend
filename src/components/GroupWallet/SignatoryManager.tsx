// src/components/GroupWallet/SignatoryManager.tsx
import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { groupWalletApi, GroupSignatory } from "../../services/groupWalletApi";
import { 
  Users, UserCheck, UserX, Shield, Mail, Phone, 
  Building2, RefreshCw, Plus, X, Info 
} from "lucide-react";

export default function SignatoryManager({ groupId }: { groupId: string }) {
  const [signatories, setSignatories] = useState<GroupSignatory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    loadSignatories();
  }, [groupId]);

  const loadSignatories = async () => {
    setLoading(true);
    try {
      const res = await groupWalletApi.getSignatories(groupId);
      setSignatories(res.signatories);
    } catch (err) {
      console.error('Failed to load signatories:', err);
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Shield size={20} className="text-purple-600" />
            Group Signatories
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {signatories.length} active signator{signatories.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={16} />
          Add Signatory
        </button>
      </div>

      {signatories.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users size={48} className="mx-auto mb-3 opacity-50" />
          <p>No signatories yet</p>
          <p className="text-sm">Add group admins to manage transactions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signatories.map((sig) => (
            <div
              key={sig.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                  {sig.first_name?.[0]?.toUpperCase()}{sig.last_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate">
                    {sig.first_name} {sig.middle_name} {sig.last_name}
                  </h4>
                  {sig.role_name && (
                    <span className="inline-block text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full mt-1">
                      {sig.role_name}
                    </span>
                  )}
                  <div className="space-y-1 mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <p className="flex items-center gap-1 truncate">
                      <Mail size={12} />
                      {sig.email}
                    </p>
                    <p className="flex items-center gap-1">
                      <Phone size={12} />
                      {sig.mobile}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  sig.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {sig.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
          <Info size={16} className="mt-0.5 flex-shrink-0" />
          <span>
            Signatories are group admins who can approve transactions. 
            Different signatories can be added via the Register Group Admin option in the admin dashboard.
          </span>
        </p>
      </div>
    </div>
  );
}
