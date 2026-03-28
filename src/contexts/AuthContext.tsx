// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role_id: string;           // Role ID from database
  role_name: string;          // Role name (farmer, admin, group_admin, sacco)
  role_description?: string;  // Optional description
  group_id?: string;          // Group ID if user belongs to a cooperative
  created_at?: string;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("✅ AuthContext: Loaded user from storage:", {
          id: parsedUser.id,
          email: parsedUser.email,
          role_name: parsedUser.role_name,
          group_id: parsedUser.group_id
        });
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
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log("🔐 AuthContext: Logging out user:", user?.email);
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
        
        // FIX: Check for farmer_id (backend returns farmer_id)
        if (response.data && response.data.farmer_id) {
          const numericId = response.data.farmer_id;
          console.log("getFarmerId: Got numeric ID:", numericId);
          return numericId;
        }
        // Fallback to id field if farmer_id not present
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
    if (!user) {
      console.log("getCooperativeId: No user");
      return null;
    }
    
    try {
      console.log("getCooperativeId: Fetching for user:", user.id, "role:", user.role_name);
      
      // Normalize role name for comparison
      const normalizedRole = user.role_name?.toLowerCase();
      const isGroupAdminRole = normalizedRole === 'group admin' || normalizedRole === 'group_admin';
      
      // If user is a group admin and already has group_id, return it
      if (isGroupAdminRole && user.group_id) {
        console.log("getCooperativeId: Using user.group_id:", user.group_id);
        return user.group_id;
      }
      
      // Otherwise, fetch from API - this endpoint might need to be created
      // For now, if group_id exists in user object, use it
      if (user.group_id) {
        return user.group_id;
      }
      
      console.log("getCooperativeId: No cooperative ID found for user");
      return null;
    } catch (error) {
      console.error('Error fetching cooperative ID:', error);
      return null;
    }
  };

  const hasRole = (roleName: string): boolean => {
    if (!user || !user.role_name) return false;
    
    const userRoleLower = user.role_name.toLowerCase();
    const targetRoleLower = roleName.toLowerCase();
    
    // Special handling for group admin (could be "group admin" or "group_admin")
    if (targetRoleLower === 'group_admin') {
      return userRoleLower === 'group admin' || userRoleLower === 'group_admin';
    }
    
    // Special handling for admin (could be "admin" or "super_admin")
    if (targetRoleLower === 'admin') {
      return userRoleLower === 'admin' || userRoleLower === 'super_admin';
    }
    
    // Special handling for farmer
    if (targetRoleLower === 'farmer') {
      return userRoleLower === 'farmer';
    }
    
    return userRoleLower === targetRoleLower;
  };

  // Computed properties
  const isAdmin = hasRole('admin');
  const isFarmer = hasRole('farmer');
  const isGroupAdmin = hasRole('group_admin');  // Now handles both "group admin" and "group_admin"
  const isSacco = hasRole('sacco');
  const userRole = user?.role_name || null;

  // Debug logging
  console.log("🔐 AuthContext state:", {
    userRole,
    isAdmin,
    isFarmer,
    isGroupAdmin,
    isSacco
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
      userRole
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
