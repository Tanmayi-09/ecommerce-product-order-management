import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../shared/types.ts';
import { api } from '../services/api.ts';
import { useToast } from './ToastContext.tsx';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  switchDemoUser: (target: 'admin' | 'john' | 'sarah' | 'raj') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const res = await api.auth.getProfile();
          if (res.success && res.user) {
            setUser(res.user);
            setToken(storedToken);
            setIsLoading(false);
            return;
          }
        } catch {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
        }
      }

      // If no valid session, auto-login as demo customer John Doe for seamless first-load demo!
      try {
        const demoRes = await api.auth.login({
          email: 'john@example.com',
          password: 'customer123',
        });
        if (demoRes.success) {
          localStorage.setItem('auth_token', demoRes.token);
          setToken(demoRes.token);
          setUser(demoRes.user);
        }
      } catch (err) {
        console.warn('Auto demo login skipped:', err);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password = 'customer123'): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.auth.login({ email, password });
      if (res.success) {
        localStorage.setItem('auth_token', res.token);
        setToken(res.token);
        setUser(res.user);
        success(`Welcome back, ${res.user.name}!`);
        return true;
      }
      return false;
    } catch (err: any) {
      toastError(err.message || 'Login failed. Please check your credentials.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.auth.register(userData);
      if (res.success) {
        localStorage.setItem('auth_token', res.token);
        setToken(res.token);
        setUser(res.user);
        success(`Account created! Welcome, ${res.user.name}.`);
        return true;
      }
      return false;
    } catch (err: any) {
      toastError(err.message || 'Registration failed.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    success('Logged out successfully.');
  };

  const switchDemoUser = async (target: 'admin' | 'john' | 'sarah' | 'raj') => {
    const creds: Record<string, { email: string; pass: string }> = {
      admin: { email: 'admin@ecommerce.com', pass: 'admin123' },
      john: { email: 'john@example.com', pass: 'customer123' },
      sarah: { email: 'sarah@example.com', pass: 'customer123' },
      raj: { email: 'raj@example.com', pass: 'customer123' },
    };

    const chosen = creds[target];
    if (chosen) {
      await login(chosen.email, chosen.pass);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        switchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
