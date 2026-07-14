import axios from 'axios';
import { Platform } from 'react-native';
import { getSecureItem, setSecureItem, deleteSecureItem } from '../utils/secureStore';

// On android emulators, localhost points to the emulator itself.
// 10.0.2.2 points to the developer machine's localhost.
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  // For iOS emulator or web, localhost is fine.
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await getSecureItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token', error);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await getSecureItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${getBaseUrl()}/auth/refresh`, { refreshToken });
          const newToken = data.data.accessToken;
          const newRefreshToken = data.data.refreshToken;
          
          await setSecureItem('accessToken', newToken);
          await setSecureItem('refreshToken', newRefreshToken);
          
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch (err) {
        await deleteSecureItem('accessToken');
        await deleteSecureItem('refreshToken');
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
