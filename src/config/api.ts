import { Platform } from 'react-native';

const getBaseURL = (): string => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // TODO: Replace with your computer's IP address
      // Find it: Windows (ipconfig), Mac/Linux (ifconfig)
      return 'http://192.168.1.109:3000';  // REPLACE XXX with your IP
      
      // For Android emulator (not physical device):
      // return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }
  
  return 'https://productivity-hub-production.up.railway.app';
};

export const API_BASE_URL = getBaseURL();

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    VERIFY_EMAIL: '/api/auth/verify-email',
  },
  USER: {
    PROFILE: '/api/user/profile',
    PREFERENCES: '/api/user/preferences',
    CURRENT_THEME: '/api/user/current-theme',
    ENABLED_THEMES: '/api/user/enabled-themes',
    ENABLED_PLUGINS: '/api/user/enabled-plugins',
  },
} as const;