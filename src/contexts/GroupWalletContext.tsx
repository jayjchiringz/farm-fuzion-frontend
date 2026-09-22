// src/contexts/GroupWalletContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { groupWalletApi, GroupWalletInfo } from '../services/groupWalletApi';
import { useAuth } from './AuthContext';

interface GroupWalletContextType {
  // State
  groupWallet: GroupWalletInfo | null;
  balance: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadGroupWallet: (groupId: string) => Promise<void>;
  registerWallet: (groupId: string) => Promise<void>;
  refreshBalance: (groupId: string) => Promise<void>;
  refreshInfo: (groupId: string) => Promise<void>;
  
  // Computed
  isWalletActive: boolean;
  needsRegistration: boolean;
}

const GroupWalletContext = createContext<GroupWalletContextType | undefined>(undefined);

export const GroupWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isGroupAdmin } = useAuth();
  const [groupWallet, setGroupWallet] = useState<GroupWalletInfo | null>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load when a group admin logs in
  useEffect(() => {
    if (isGroupAdmin && user?.group_id) {
      loadGroupWallet(user.group_id);
    }
  }, [isGroupAdmin, user?.group_id]);

  const loadGroupWallet = async (groupId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Load info
      const infoRes = await groupWalletApi.getWalletInfo(groupId);
      setGroupWallet(infoRes.group);

      // Load balance if wallet is active
      if (infoRes.group.walletStatus === 'active') {
        const balanceRes = await groupWalletApi.getBalance(groupId);
        setBalance(balanceRes.balance);
      }
    } catch (err: any) {
      console.error('Failed to load group wallet:', err);
      setError(err.response?.data?.error || 'Failed to load group wallet');
    } finally {
      setLoading(false);
    }
  };

  const registerWallet = async (groupId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await groupWalletApi.registerWallet(groupId);
      if (result.success) {
        // Reload info after registration
        await loadGroupWallet(groupId);
      }
    } catch (err: any) {
      console.error('Failed to register wallet:', err);
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshBalance = async (groupId: string) => {
    try {
      const result = await groupWalletApi.getBalance(groupId);
      setBalance(result.balance);
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  };

  const refreshInfo = async (groupId: string) => {
    await loadGroupWallet(groupId);
  };

  const isWalletActive = groupWallet?.walletStatus === 'active';
  const needsRegistration = groupWallet?.walletStatus === 'inactive' && 
                             groupWallet?.groupStatus === 'active';

  return (
    <GroupWalletContext.Provider value={{
      groupWallet,
      balance,
      loading,
      error,
      loadGroupWallet,
      registerWallet,
      refreshBalance,
      refreshInfo,
      isWalletActive,
      needsRegistration,
    }}>
      {children}
    </GroupWalletContext.Provider>
  );
};

export const useGroupWallet = () => {
  const context = useContext(GroupWalletContext);
  if (context === undefined) {
    throw new Error('useGroupWallet must be used within a GroupWalletProvider');
  }
  return context;
};
