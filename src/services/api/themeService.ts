import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../config/api';

export interface UserPreferences {
  themes: {
    current: string;
    enabled: string[];
  };
  plugins: {
    enabled: Array<{
      id: string;
      enabledAt: string;
      settings: any;
    }>;
  };
  lastUpdated: string;
}

export interface ThemeUpdateResponse {
  message: string;
  currentTheme?: string;
  enabledThemes?: string[];
  updatedAt: string;
}

export const themeService = {
  getUserPreferences: async (): Promise<UserPreferences> => {
    const response = await apiClient.get<UserPreferences>(
      API_ENDPOINTS.USER.PREFERENCES
    );
    return response.data;
  },
  
  setCurrentTheme: async (themeId: string): Promise<ThemeUpdateResponse> => {
    const response = await apiClient.put<ThemeUpdateResponse>(
      API_ENDPOINTS.USER.CURRENT_THEME,
      { themeId }
    );
    return response.data;
  },
  
  enableTheme: async (themeId: string): Promise<ThemeUpdateResponse> => {
    const response = await apiClient.post<ThemeUpdateResponse>(
      API_ENDPOINTS.USER.ENABLED_THEMES,
      { themeId }
    );
    return response.data;
  },
  
  disableTheme: async (themeId: string): Promise<ThemeUpdateResponse> => {
    const response = await apiClient.delete<ThemeUpdateResponse>(
      `${API_ENDPOINTS.USER.ENABLED_THEMES}/${themeId}`
    );
    return response.data;
  },
};