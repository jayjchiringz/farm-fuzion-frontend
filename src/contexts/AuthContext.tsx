// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role_id: string;           // Changed from role string to role_id
  role_name: string;          // New field for the role name
  role_description?: string;  // Optional description
  group_id?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  setUser: (user: User | null) => void; // Add this
  logout: () => void;
  getFarmerId: () => Promise<number | null>;
  hasRole: (roleName: string) => boolean;           // Helper to check roles
  isAdmin: boolean;                                  // Computed property
  isFarmer: boolean;                                 // Computed property
  isSacco: boolean;                                  // Computed property
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
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.data.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const getFarmerId = async (): Promise<number | null> => {
    if (!user) {
      console.log("getFarmerId: No user");
      return null;
    }
    
    try {
      console.log("getFarmerId: Fetching for user:", user.id);
      
      if (user.role_name?.toLowerCase() === 'farmer') {
        const response = await api.get(`/farmers/by-user/${user.id}`);
        console.log("getFarmerId: Response:", response.data);
        
        if (response.data && response.data.farmer_id) {
          const numericId = response.data.farmer_id;
          console.log("getFarmerId: Got numeric ID:", numericId);
          return numericId;
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

  const hasRole = (roleName: string): boolean => {
    if (!user || !user.role_name) return false;
    return user.role_name.toLowerCase() === roleName.toLowerCase();
  };

  const isAdmin = hasRole('admin');
  const isFarmer = hasRole('farmer');
  const isSacco = hasRole('sacco');

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      setUser, // Add this
      logout, 
      getFarmerId,
      hasRole,
      isAdmin,
      isFarmer,
      isSacco
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
