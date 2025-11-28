import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/types/election';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, role: 'voter' | 'admin') => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  verifyOTP: (otp: string) => Promise<boolean>;
}

interface RegisterData {
  name: string;
  email: string;
  nationalId: string;
  phone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const login = useCallback(async (email: string, password: string, role: 'voter' | 'admin'): Promise<boolean> => {
    // Mock authentication - in production, this would call an API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (role === 'admin') {
      if (email === 'admin@election.gov' && password === 'admin123') {
        const adminUser: User = {
          id: 'admin-1',
          name: 'System Administrator',
          email: 'admin@election.gov',
          nationalId: 'ADMIN-001',
          phone: '+1000000000',
          role: 'admin',
          isApproved: true,
          hasVoted: false,
          createdAt: new Date().toISOString(),
        };
        setUser(adminUser);
        return true;
      }
      return false;
    }

    // Voter login - require OTP verification
    const mockUser: User = {
      id: 'voter-' + Date.now(),
      name: 'Voter User',
      email,
      nationalId: 'NID-2024-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
      phone: '+1234567890',
      role: 'voter',
      isApproved: true,
      hasVoted: false,
      createdAt: new Date().toISOString(),
    };
    setPendingUser(mockUser);
    return true;
  }, []);

  const verifyOTP = useCallback(async (otp: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock OTP verification - accept any 6-digit code
    if (otp.length === 6 && pendingUser) {
      setUser(pendingUser);
      setPendingUser(null);
      return true;
    }
    return false;
  }, [pendingUser]);

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: 'voter-' + Date.now(),
      name: data.name,
      email: data.email,
      nationalId: data.nationalId,
      phone: data.phone,
      role: 'voter',
      isApproved: false, // Requires admin approval
      hasVoted: false,
      createdAt: new Date().toISOString(),
    };
    
    setPendingUser(newUser);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPendingUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, register, logout, verifyOTP }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
