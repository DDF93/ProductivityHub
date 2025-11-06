import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear?: () => Promise<void>;
}

const webStorage: StorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('localStorage.getItem error:', error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('localStorage.setItem error:', error);
      throw error;
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage.removeItem error:', error);
      throw error;
    }
  },
  
  clear: async (): Promise<void> => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('localStorage.clear error:', error);
      throw error;
    }
  },
};

const mobileStorage: StorageAdapter = {
  getItem: AsyncStorage.getItem,
  setItem: AsyncStorage.setItem,
  removeItem: AsyncStorage.removeItem,
  clear: AsyncStorage.clear,
};

const platformStorage: StorageAdapter = Platform.OS === 'web' 
  ? webStorage 
  : mobileStorage;

export default platformStorage;