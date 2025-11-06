// src/store/slices/pluginSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PluginItem } from '../../types/PluginTypes';
import { StorageService } from '../../services/storageService';

interface PluginState {
  availablePlugins: PluginItem[];      // All plugins that exist
  enabledPluginIds: string[];          // Plugin IDs that user has enabled
  isLoading: boolean;                  // Track storage operations
  error: string | null;                // Store error messages
}

// Sample plugins - you'll replace these with real plugins later
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
  availablePlugins: samplePlugins,     // Start with sample plugins
  enabledPluginIds: [],                // No plugins enabled initially
  isLoading: false,
  error: null,
};

// Load enabled plugins from storage on app startup
export const loadEnabledPluginsFromStorage = createAsyncThunk(
  'plugins/loadEnabledPlugins',
  async () => {
    const savedEnabledPlugins = await StorageService.loadEnabledPlugins();
    return savedEnabledPlugins || []; // Empty array if no saved plugins
  }
);

// Save enabled plugins to storage
export const saveEnabledPluginsToStorage = createAsyncThunk(
  'plugins/saveEnabledPlugins', 
  async (enabledPluginIds: string[]) => {
    await StorageService.saveEnabledPlugins(enabledPluginIds);
    return enabledPluginIds;
  }
);

const pluginSlice = createSlice({
  name: 'plugins',
  initialState,
  reducers: {
    // Enable a plugin (add to user's enabled collection)
    enablePlugin: (state, action: PayloadAction<string>) => {
      const pluginId = action.payload;
      
      // Check plugin exists and isn't already enabled
      const pluginExists = state.availablePlugins.some(plugin => plugin.id === pluginId);
      const alreadyEnabled = state.enabledPluginIds.includes(pluginId);
      
      if (pluginExists && !alreadyEnabled) {
        state.enabledPluginIds.push(pluginId);
        state.error = null;
      }
    },
    
    // Disable a plugin (remove from user's enabled collection)
    disablePlugin: (state, action: PayloadAction<string>) => {
      const pluginId = action.payload;
      
      // Remove from enabled list
      state.enabledPluginIds = state.enabledPluginIds.filter(id => id !== pluginId);
      state.error = null;
    },
    
    // Add a new plugin to available plugins (for future when you build new plugins)
    addPlugin: (state, action: PayloadAction<PluginItem>) => {
      state.availablePlugins.push(action.payload);
    },
    
    // Clear any error messages
    clearPluginError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Handle loading enabled plugins from storage
      .addCase(loadEnabledPluginsFromStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadEnabledPluginsFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enabledPluginIds = action.payload;
      })
      .addCase(loadEnabledPluginsFromStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load enabled plugins';
      })
      
      // Handle saving enabled plugins to storage
      .addCase(saveEnabledPluginsToStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveEnabledPluginsToStorage.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(saveEnabledPluginsToStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to save enabled plugins';
      });
  },
});

export const { 
  enablePlugin, 
  disablePlugin, 
  addPlugin, 
  clearPluginError 
} = pluginSlice.actions;

export default pluginSlice.reducer;