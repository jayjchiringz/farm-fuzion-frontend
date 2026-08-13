// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role_id: string;
  role_name: string;
  role_description?: string;
  group_id?: string;
  created_at?: string;
}

interface WalletStatus {
  authenticated: boolean;
  hasWallet: boolean;
  needsSetup: boolean;
  needsPin: boolean;
  farmerId: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => void;
  getFarmerId: () => Promise<number | null>;
  getCooperativeId: () => Promise<string | null>;
  hasRole: (roleName: string) => boolean;
  isAdmin: boolean;
  isFarmer: boolean;
  isGroupAdmin: boolean;
  isSacco: boolean;
  userRole: string | null;
  // Wallet methods
  walletStatus: WalletStatus;
  authenticateWallet: (pin: string) => Promise<boolean>;
  setupWallet: (pin: string) => Promise<{ otpId: string }>;
  verifyWalletSetup: (otpId: string, code: string) => Promise<boolean>;
  refreshWalletStatus: () => Promise<void>;
  // OTP Authentication methods
  requestWalletOTP: (farmerId: string) => Promise<{ otpId: string; expiresIn: number }>;
  verifyWalletOTP: (farmerId: string, otpId: string, code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [walletStatus, setWalletStatus] = useState<WalletStatus>({
    authenticated: false,
    hasWallet: false,
    needsSetup: false,
    needsPin: false,
    farmerId: null,
    phone: null,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedWalletAuth = localStorage.getItem('wallet_authenticated');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        if (storedWalletAuth === 'true') {
          setWalletStatus(prev => ({ ...prev, authenticated: true }));
        }
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      const userData = response.data.user;

      if (!userData.role_id || !userData.role_name) {
        console.error('Login response missing role information:', userData);
        throw new Error('Invalid user data received');
      }

      console.log("🔐 AuthContext: User logged in:", {
        id: userData.id,
        email: userData.email,
        role_name: userData.role_name,
        group_id: userData.group_id
      });

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.data.token);

      // Auto-check wallet status for farmers
      if (userData.role_name?.toLowerCase() === 'farmer') {
        await refreshWalletStatus(userData.id);
      }

    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const refreshWalletStatus = async (userId?: string) => {
    const targetId = userId || user?.id;
    if (!targetId) {
      console.warn("No user ID available for wallet status check");
      return;
    }

    try {
      console.log("💰 Checking wallet status for user:", targetId);
      const response = await api.post('/wallet/auto-auth', { farmerId: targetId });

      if (response.data.success) {
        setWalletStatus({
          authenticated: response.data.authenticated || false,
          hasWallet: response.data.hasWallet || false,
          needsSetup: response.data.needsSetup || false,
          needsPin: response.data.needsPin || false,
          farmerId: response.data.farmerId || null,
          phone: response.data.phone || null,
        });

        if (response.data.authenticated) {
          localStorage.setItem('wallet_authenticated', 'true');
        }

        console.log("💰 Wallet status:", {
          hasWallet: response.data.hasWallet,
          needsSetup: response.data.needsSetup,
          needsPin: response.data.needsPin,
          authenticated: response.data.authenticated,
        });
      }
    } catch (error) {
      console.error("💰 Failed to check wallet status:", error);
    }
  };

  // ==================== OTP AUTHENTICATION METHODS ====================

  /**
   * Request OTP for wallet authentication
   */
  const requestWalletOTP = async (farmerId: string): Promise<{ otpId: string; expiresIn: number }> => {
    try {
      const response = await api.post('/wallet/auth/otp/request', { farmerId });
      if (response.data.success) {
        return {
          otpId: response.data.otpId,
          expiresIn: response.data.expiresIn,
        };
      }
      throw new Error('Failed to request OTP');
    } catch (error) {
      console.error('💰 Request wallet OTP error:', error);
      throw error;
    }
  };

  /**
   * Verify OTP and authenticate wallet
   */
  const verifyWalletOTP = async (farmerId: string, otpId: string, code: string): Promise<boolean> => {
    try {
      const response = await api.post('/wallet/auth/otp/verify', {
        farmerId,
        otpId,
        code,
      });
      
      if (response.data.success) {
        setWalletStatus(prev => ({
          ...prev,
          authenticated: true,
          needsPin: false,
          needsSetup: false,
        }));
        localStorage.setItem('wallet_authenticated', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('💰 Verify wallet OTP error:', error);
      return false;
    }
  };

  // ==================== LEGACY PIN AUTHENTICATION (kept for compatibility) ====================

  /**
   * Authenticate wallet with PIN (legacy - may not work in sandbox)
   */
  const authenticateWallet = async (pin: string): Promise<boolean> => {
    try {
      const targetId = walletStatus.farmerId || user?.id;
      if (!targetId) {
        throw new Error('Farmer ID not available');
      }

      const response = await api.post('/wallet/auth/pin', {
        farmerId: targetId,
        pin,
      });

      if (response.data.success) {
        setWalletStatus(prev => ({
          ...prev,
          authenticated: true,
          needsPin: false,
        }));
        localStorage.setItem('wallet_authenticated', 'true');
        return true;
      }
      return false;
    } catch (error: any) {
      // If PIN fails with "requiresOTP", we should use OTP flow instead
      if (error.response?.data?.requiresOTP) {
        console.log('💰 PIN not available, please use OTP flow');
        // The UI will handle showing OTP prompt
        return false;
      }
      console.error("💰 PIN authentication failed:", error);
      return false;
    }
  };

  // ==================== WALLET SETUP METHODS ====================

  const setupWallet = async (pin: string): Promise<{ otpId: string }> => {
    try {
      const targetId = walletStatus.farmerId || user?.id;
      if (!targetId) {
        throw new Error('Farmer ID not available');
      }

      const response = await api.post('/wallet/register', {
        farmerId: targetId,
        pin,
      });

      if (response.data.success) {
        setWalletStatus(prev => ({
          ...prev,
          needsSetup: false,
        }));
        return { otpId: response.data.otpId };
      }
      throw new Error('Wallet setup failed');
    } catch (error) {
      console.error("💰 Wallet setup failed:", error);
      throw error;
    }
  };

  const verifyWalletSetup = async (otpId: string, code: string): Promise<boolean> => {
    try {
      const response = await api.post('/wallet/auth/otp/verify-and-set-pin', {
        otpId,
        code,
        newPin: '', // PIN already set during registration
      });

      if (response.data.success) {
        // Refresh status to get authenticated state
        await refreshWalletStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error("💰 Wallet verification failed:", error);
      return false;
    }
  };

  const logout = () => {
    console.log("🔐 AuthContext: Logging out user:", user?.email);
    setUser(null);
    setWalletStatus({
      authenticated: false,
      hasWallet: false,
      needsSetup: false,
      needsPin: false,
      farmerId: null,
      phone: null,
    });
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('wallet_authenticated');
    sessionStorage.clear();
  };

  const getFarmerId = async (): Promise<number | null> => {
    if (!user) {
      console.log("getFarmerId: No user");
      return null;
    }

    try {
      console.log("getFarmerId: Fetching for user:", user.id, "role:", user.role_name);

      if (user.role_name?.toLowerCase() === 'farmer') {
        const response = await api.get(`/farmers/by-user/${user.id}`);
        console.log("getFarmerId: Response:", response.data);

        if (response.data && response.data.farmer_id) {
          const numericId = response.data.farmer_id;
          console.log("getFarmerId: Got numeric ID:", numericId);
          return numericId;
        }
        if (response.data && response.data.id) {
          return response.data.id;
        }
      } else {
        console.log("getFarmerId: User is not a farmer, role:", user.role_name);
      }

      return null;
    } catch (error) {
      console.error('Error fetching farmer ID:', error);
      return null;
    }
  };

  const getCooperativeId = async (): Promise<string | null> => {
    if (!user) return null;
    if (user.group_id) return user.group_id;
    return null;
  };

  const hasRole = (roleName: string): boolean => {
    if (!user || !user.role_name) return false;

    const userRoleLower = user.role_name.toLowerCase();
    const targetRoleLower = roleName.toLowerCase();

    if (targetRoleLower === 'group_admin') {
      return userRoleLower === 'group admin' || userRoleLower === 'group_admin';
    }
    if (targetRoleLower === 'admin') {
      return userRoleLower === 'admin' || userRoleLower === 'super_admin';
    }
    if (targetRoleLower === 'farmer') {
      return userRoleLower === 'farmer';
    }
    return userRoleLower === targetRoleLower;
  };

  const isAdmin = hasRole('admin');
  const isFarmer = hasRole('farmer');
  const isGroupAdmin = hasRole('group_admin');
  const isSacco = hasRole('sacco');
  const userRole = user?.role_name || null;

  console.log("🔐 AuthContext state:", {
    userRole,
    isAdmin,
    isFarmer,
    isGroupAdmin,
    isSacco,
    walletStatus,
  });

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      setUser,
      logout,
      getFarmerId,
      getCooperativeId,
      hasRole,
      isAdmin,
      isFarmer,
      isGroupAdmin,
      isSacco,
      userRole,
      // Wallet methods
      walletStatus,
      authenticateWallet,
      setupWallet,
      verifyWalletSetup,
      refreshWalletStatus,
      // OTP Authentication methods
      requestWalletOTP,
      verifyWalletOTP,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
