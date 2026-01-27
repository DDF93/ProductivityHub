import { Platform } from 'react-native';

const getBaseURL = (): string => {
  // TEMPORARY: Force production URL for testing
  return 'https://api.productivityhub.app';
  
  // Later, you can uncomment this logic for local development:
  // if (__DEV__) {
  //   if (Platform.OS === 'android') {
  //     return 'http://192.168.1.109:3000';
  //   }
  //   return 'http://localhost:3000';
  // }
  // return 'https://api.productivityhub.app';
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