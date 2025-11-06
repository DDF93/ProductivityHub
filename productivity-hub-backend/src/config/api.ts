import { Platform } from 'react-native';

/**
 * Determines the correct API base URL based on environment
 * 
 * Why this function exists:
 * - Development: Backend runs on localhost
 * - Production: Backend runs on Railway
 * - Android emulator can't use 'localhost' directly
 */
const getBaseURL = (): string => {
  // __DEV__ is React Native's built-in flag
  // It's true when running 'npm start', false when building for production
  if (__DEV__) {
    // Platform.OS checks if running on iOS or Android
    // This comes from react-native package
    if (Platform.OS === 'android') {
      // Android emulator special IP that maps to host machine's localhost
      // 10.0.2.2:3000 on Android = localhost:3000 on your computer
      return 'http://10.0.2.2:3000';
    }
    // iOS simulator can use localhost directly
    return 'http://localhost:3000';
  }
  
  // Production environment - use Railway URL
  // TODO: Replace with your actual Railway deployment URL
  return 'https://productivity-hub-production.up.railway.app';
};

// Export the base URL as a constant
// This will be imported by the API client
export const API_BASE_URL = getBaseURL();

// Export API endpoint paths as constants
// Why: Centralized endpoint management, no typos in multiple files
export const API_ENDPOINTS = {
  // Authentication endpoints (public - no token required)
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    VERIFY_EMAIL: '/api/auth/verify-email',
  },
  
  // User endpoints (protected - require JWT token)
  USER: {
    PROFILE: '/api/user/profile',
    PREFERENCES: '/api/user/preferences',
    CURRENT_THEME: '/api/user/current-theme',
    ENABLED_THEMES: '/api/user/enabled-themes',
    ENABLED_PLUGINS: '/api/user/enabled-plugins',
  },
} as const;  // 'as const' makes TypeScript treat this as readonly