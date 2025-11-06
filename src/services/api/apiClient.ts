import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import storage from '../storage/platformStorage';
import { API_BASE_URL } from '../../config/api';

const TOKEN_KEY = 'jwt_token';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      if (__DEV__) {
        console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
      }
    } catch (error) {
      console.error('Failed to get token from storage:', error);
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      
      if (__DEV__) {
        console.log(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${status}`);
      }
      
      if (status === 401) {
        console.log('🔐 Token expired or invalid - logging out');
        
        try {
          await storage.removeItem(TOKEN_KEY);
        } catch (storageError) {
          console.error('Failed to clear token:', storageError);
        }
      }
    } else if (error.request) {
      console.log('📡 Network error - no response received');
    } else {
      console.log('⚠️ Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export const tokenManager = {
  saveToken: async (token: string): Promise<void> => {
    try {
      await storage.setItem(TOKEN_KEY, token);
      console.log('✅ Token saved to storage');
    } catch (error) {
      console.error('Failed to save token:', error);
      throw error;
    }
  },
  
  getToken: async (): Promise<string | null> => {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  },
  
  removeToken: async (): Promise<void> => {
    try {
      await storage.removeItem(TOKEN_KEY);
      console.log('✅ Token removed from storage');
    } catch (error) {
      console.error('Failed to remove token:', error);
      throw error;
    }
  },
  
  hasToken: async (): Promise<boolean> => {
    try {
      const token = await storage.getItem(TOKEN_KEY);
      return token !== null;
    } catch (error) {
      console.error('Failed to check token:', error);
      return false;
    }
  },
};

export default apiClient;