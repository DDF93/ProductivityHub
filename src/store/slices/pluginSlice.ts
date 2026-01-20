import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PluginItem } from '../../types/PluginTypes';
import { StorageService } from '../../services/storageService';

import { pluginService } from '../../services/api/pluginService';

import { themeService } from '../../services/api/themeService';


interface PluginState {
  availablePlugins: PluginItem[];      // All plugins that exist
  enabledPluginIds: string[];          // Plugin IDs that user has enabled
  isLoading: boolean;                  // Track storage operations
  error: string | null;                // Store error messages
}

const samplePlugins: PluginItem[] = [
  {
    id: 'workout-tracker',
    name: 'Workout Tracker',
    icon: '🏋️',
    description: 'Track your fitness progress and body recomposition'
  },
  {
    id: 'nutrition-logger', 
    name: 'Nutrition Logger',
    icon: '🍎',
    description: 'Log meals and track your 2,200 calorie goal'
  },
  {
    id: 'progress-photos',
    name: 'Progress Photos', 
    icon: '📸',
    description: 'Take monthly body recomposition photos'
  }
];

const initialState: PluginState = {
  availablePlugins: samplePlugins,
  enabledPluginIds: [],
  isLoading: false,
  error: null,
};




const loadEnabledPluginsFromAPI = createAsyncThunk(
  'plugins/loadEnabledPlugins',
  async (_, { rejectWithValue }) => {
    
    try {
      const preferences = await themeService.getUserPreferences();
      
      const enabledPluginIds = preferences.plugins.enabled.map(p => p.id);
      
      return enabledPluginIds;  // e.g., ['workout-tracker', 'nutrition-logger']
      
    } catch (error: any) {
      console.error('Failed to load plugins from API:', error);
      
      try {
        console.log('Falling back to local plugin storage...');
        
        const savedPlugins = await StorageService.loadEnabledPlugins();
        return savedPlugins || [];
        
      } catch (storageError) {
        console.error('Storage fallback also failed:', storageError);
        return rejectWithValue('Failed to load enabled plugins');
      }
    }
  }
);


const enablePluginOnServer = createAsyncThunk(
  'plugins/enablePlugin',
  async ({ pluginId, settings = {} }: { pluginId: string; settings?: any }, { rejectWithValue }) => {
    
    try {
      await pluginService.enablePlugin(pluginId, settings);
      
      try {
        const currentEnabled = await StorageService.loadEnabledPlugins() || [];
        
        if (!currentEnabled.includes(pluginId)) {
          const updatedEnabled = [...currentEnabled, pluginId];
          await StorageService.saveEnabledPlugins(updatedEnabled);
        }
      } catch (storageError) {
        console.warn('Failed to cache plugin locally:', storageError);
      }
      
      return pluginId;
      
    } catch (error: any) {
      console.error('Failed to enable plugin on server:', error);
      return rejectWithValue('Failed to enable plugin');
    }
  }
);


const disablePluginOnServer = createAsyncThunk(
  'plugins/disablePlugin',
  async (pluginId: string, { rejectWithValue }) => {
    try {
      await pluginService.disablePlugin(pluginId);
      
      try {
        const currentEnabled = await StorageService.loadEnabledPlugins() || [];
        const updatedEnabled = currentEnabled.filter(id => id !== pluginId);
        await StorageService.saveEnabledPlugins(updatedEnabled);
      } catch (storageError) {
        console.warn('Failed to remove plugin from local storage:', storageError);
      }
      
      return pluginId;
      
    } catch (error: any) {
      console.error('Failed to disable plugin on server:', error);
      return rejectWithValue('Failed to disable plugin');
    }
  }
);


const updatePluginSettingsOnServer = createAsyncThunk(
  'plugins/updateSettings',
  async ({ pluginId, settings }: { pluginId: string; settings: any }, { rejectWithValue }) => {
    
    try {
      await pluginService.updatePluginSettings(pluginId, settings);
      
      return { pluginId, settings };
      
    } catch (error: any) {
      console.error('Failed to update plugin settings on server:', error);
      return rejectWithValue('Failed to update plugin settings');
    }
  }
);


const pluginSlice = createSlice({
  name: 'plugins',
  initialState,
  
  reducers: {
    enablePlugin: (state, action: PayloadAction<string>) => {
      const pluginId = action.payload;
      
      const pluginExists = state.availablePlugins.some(plugin => plugin.id === pluginId);
      const alreadyEnabled = state.enabledPluginIds.includes(pluginId);
      
      if (pluginExists && !alreadyEnabled) {
        state.enabledPluginIds.push(pluginId);
        state.error = null;
      }
    },
    
    disablePlugin: (state, action: PayloadAction<string>) => {
      const pluginId = action.payload;
      state.enabledPluginIds = state.enabledPluginIds.filter(id => id !== pluginId);
      state.error = null;
    },
    
    addPlugin: (state, action: PayloadAction<PluginItem>) => {
      state.availablePlugins.push(action.payload);
    },
    
    clearPluginError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(loadEnabledPluginsFromAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadEnabledPluginsFromAPI.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enabledPluginIds = action.payload;
      })
      .addCase(loadEnabledPluginsFromAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to load enabled plugins';
      })
      
      .addCase(enablePluginOnServer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(enablePluginOnServer.fulfilled, (state, action) => {
        state.isLoading = false;
        
        const pluginId = action.payload;
        
        if (!state.enabledPluginIds.includes(pluginId)) {
          state.enabledPluginIds.push(pluginId);
        }
      })
      .addCase(enablePluginOnServer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to enable plugin';
      })
      
      .addCase(disablePluginOnServer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(disablePluginOnServer.fulfilled, (state, action) => {
        state.isLoading = false;
        
        const pluginId = action.payload;
        
        state.enabledPluginIds = state.enabledPluginIds.filter(id => id !== pluginId);
      })
      .addCase(disablePluginOnServer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to disable plugin';
      })
      
      .addCase(updatePluginSettingsOnServer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePluginSettingsOnServer.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updatePluginSettingsOnServer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update plugin settings';
      });
  },
});

export const { 
  enablePlugin,       // Local-only enable (backup)
  disablePlugin,      // Local-only disable (backup)
  addPlugin,          // Add new plugin to available list
  clearPluginError    // Clear error messages
} = pluginSlice.actions;

export {
  loadEnabledPluginsFromAPI,
  enablePluginOnServer,
  disablePluginOnServer,
  updatePluginSettingsOnServer
};

export default pluginSlice.reducer;