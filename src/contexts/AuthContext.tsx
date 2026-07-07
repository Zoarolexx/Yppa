import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../api/types';
import { authFunctions } from '../api/functions/authFunctions';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<{success: boolean; message?: string}>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const currentUser = await authFunctions.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (): Promise<{success: boolean; message?: string}> => {
    try {
      const res = await authFunctions.loginWithGoogle();
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    await authFunctions.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
