import apiClient from './apiClient';
import { API_ENDPOINTS } from '../../config/api';

export interface PluginUpdateResponse {
  message: string;
  plugin?: {
    id: string;
    settings: any;
    enabledAt: string;
  };
  pluginId?: string;
}

export const pluginService = {
  enablePlugin: async (
    pluginId: string,
    settings: any = {}
  ): Promise<PluginUpdateResponse> => {
    const response = await apiClient.post<PluginUpdateResponse>(
      API_ENDPOINTS.USER.ENABLED_PLUGINS,
      { pluginId, settings }
    );
    return response.data;
  },
  
  disablePlugin: async (pluginId: string): Promise<PluginUpdateResponse> => {
    const response = await apiClient.delete<PluginUpdateResponse>(
      `${API_ENDPOINTS.USER.ENABLED_PLUGINS}/${pluginId}`
    );
    return response.data;
  },
  
  updatePluginSettings: async (
    pluginId: string,
    settings: any
  ): Promise<PluginUpdateResponse> => {
    const response = await apiClient.put<PluginUpdateResponse>(
      `${API_ENDPOINTS.USER.ENABLED_PLUGINS}/${pluginId}/settings`,
      { settings }
    );
    return response.data;
  },
};