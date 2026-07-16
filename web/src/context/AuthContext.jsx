// Auth Context — global auth state shared across the entire app
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/endpoints';
import { subscribeToPush } from '../utils/pushNotifications';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user on app mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return setLoading(false);

    authAPI.getMe()
      .then(({ data }) => {
        setUser(data.data);
        subscribeToPush().catch(() => {});
      })
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    subscribeToPush().catch(() => {});
    return data.data.user;
  };

  const register = async (payload) => {
    const { data } = await authAPI.register(payload);
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    subscribeToPush().then(() => {
      localStorage.setItem('welcomeNotifSent', data.data.user.id);
    }).catch(() => {});
    return data.data.user;
  };

  const googleAuth = async (idToken) => {
    const { data } = await authAPI.googleAuth(idToken);
    const { user: userData, accessToken, needsProfile } = data.data;

    if (needsProfile) {
      // Store token and return partial user — frontend will redirect to complete profile
      localStorage.setItem('accessToken', accessToken);
      setUser(userData);
      return { user: userData, needsProfile: true };
    }

    localStorage.setItem('accessToken', accessToken);
    setUser(userData);
    subscribeToPush().catch(() => {});
    return { user: userData, needsProfile: false };
  };

  const completeProfile = async (profileData) => {
    const { data } = await authAPI.completeProfile(profileData);
    const userData = data.data.user;
    setUser(userData);
    subscribeToPush().catch(() => {});
    return userData;
  };

  const sendVerificationEmail = async () => {
    const { data } = await authAPI.sendVerification();
    return data;
  };

  const verifyEmail = async (token) => {
    const { data } = await authAPI.verifyEmail(token);
    localStorage.setItem('accessToken', data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    await authAPI.logout().catch(() => {});
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const updateUser = (updates) => setUser((prev) => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateUser,
      googleAuth, completeProfile, sendVerificationEmail, verifyEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook — use this everywhere instead of useContext(AuthContext) directly
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
