// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  group_id?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getFarmerId: () => Promise<number | null>;
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
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const userData = response.data.user;
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
      
      if (user.role === 'farmer') {
        // Make sure this endpoint exists and returns the numeric ID
        const response = await api.get(`/farmers/by-user/${user.id}`);
        console.log("getFarmerId: Response:", response.data);
        
        if (response.data && response.data.farmer_id) {
          const numericId = response.data.farmer_id;
          console.log("getFarmerId: Got numeric ID:", numericId);
          return numericId;
        }
      }
      
      console.log("getFarmerId: No farmer_id in response");
      return null;
    } catch (error) {
      console.error('Error fetching farmer ID:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getFarmerId }}>
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