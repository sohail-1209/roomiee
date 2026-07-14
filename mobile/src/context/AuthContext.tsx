import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSecureItem, setSecureItem, deleteSecureItem } from '../utils/secureStore';
import { authAPI } from '../services/endpoints';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (credentials: any) => Promise<any>;
  register: (payload: any) => Promise<any>;
  logout: () => Promise<void>;
  updateUser: (updates: any) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await getSecureItem('accessToken');
        if (token) {
          const { data } = await authAPI.getMe();
          setUser(data.data);
        }
      } catch (e) {
        console.warn('Failed to load local auth credentials', e);
        await deleteSecureItem('accessToken');
        await deleteSecureItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (credentials: any) => {
    const { data } = await authAPI.login(credentials);
    await setSecureItem('accessToken', data.data.accessToken);
    await setSecureItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (payload: any) => {
    const { data } = await authAPI.register(payload);
    await setSecureItem('accessToken', data.data.accessToken);
    await setSecureItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    try {
      await authAPI.logout().catch(() => {});
    } finally {
      await deleteSecureItem('accessToken');
      await deleteSecureItem('refreshToken');
      setUser(null);
    }
  };

  const updateUser = (updates: any) => {
    setUser((prev: any) => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
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
