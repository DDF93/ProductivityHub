// src/store/slices/themeSlice.ts

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Appearance } from 'react-native';
import { Theme, allThemes, lightTheme } from '../../themes';
import { StorageService } from '../../services/storageService';
import { canDisableTheme, getFirstEnabledTheme } from '../../utils/themeUtils';
import { themeService } from '../../services/api/themeService';

// =============================================================================
// APP DEFAULTS
// =============================================================================

const APP_DEFAULTS = {
  DEFAULT_THEME_ID: 'light-default',
  DEFAULT_THEME: lightTheme,
  CORE_ENABLED_THEMES: ['light-default', 'dark-default'],
} as const;

// =============================================================================
// STATE
// =============================================================================

interface ThemeState {
  currentThemeId: string;
  currentTheme: Theme;
  availableThemes: Theme[];
  enabledThemes: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ThemeState = {
  currentThemeId: APP_DEFAULTS.DEFAULT_THEME_ID,
  currentTheme: APP_DEFAULTS.DEFAULT_THEME,
  availableThemes: allThemes,
  enabledThemes: [...APP_DEFAULTS.CORE_ENABLED_THEMES],
  isLoading: false,
  error: null,
};

// =============================================================================
// ASYNC THUNKS
// =============================================================================

// -----------------------------------------------------------------------------
// Load theme from local storage (no network call)
// -----------------------------------------------------------------------------
export const loadLocalThemePreferences = createAsyncThunk(
  'theme/loadLocalThemePreferences',
  async (_: void, { rejectWithValue }) => {
    try {
      console.log('🎨 Loading local theme preferences...');
      
      const storedTheme = await StorageService.loadTheme();
      const storedEnabled = await StorageService.loadEnabledThemes();

      if (storedTheme && storedEnabled) {
        console.log(`✅ Loaded local theme: ${storedTheme}`);
        return {
          currentThemeId: storedTheme,
          enabledThemes: storedEnabled,
        };
      }

      const systemColorScheme = Appearance.getColorScheme();
      const systemThemeId = systemColorScheme === 'dark' 
        ? 'dark-default' 
        : 'light-default';
      
      console.log(`📱 Using system theme: ${systemThemeId}`);
      
      return {
        currentThemeId: systemThemeId,
        enabledThemes: [...APP_DEFAULTS.CORE_ENABLED_THEMES],
      };
      
    } catch (error) {
      console.log('⚠️ Failed to load local theme, using default');
      return {
        currentThemeId: APP_DEFAULTS.DEFAULT_THEME_ID,
        enabledThemes: [...APP_DEFAULTS.CORE_ENABLED_THEMES],
      };
    }
  }
);

// -----------------------------------------------------------------------------
// Load user preferences from server (requires auth)
// -----------------------------------------------------------------------------
export const loadUserPreferences = createAsyncThunk(
  'theme/loadUserPreferences',
  async (_: void, { rejectWithValue }) => {
    try {
      console.log('🌐 Loading preferences from server...');
      const preferences = await themeService.getUserPreferences();
      const { current, enabled } = preferences.themes;

      await StorageService.saveTheme(current);
      await StorageService.saveEnabledThemes(enabled);

      return {
        currentThemeId: current ?? APP_DEFAULTS.DEFAULT_THEME_ID,
        enabledThemes: enabled ?? [...APP_DEFAULTS.CORE_ENABLED_THEMES],
      };
    } catch (error) {
      console.log('⚠️ Server load failed, keeping current theme');
      return rejectWithValue('Failed to load from server');
    }
  }
);

// -----------------------------------------------------------------------------
// Save current theme to server
// ✅ UPDATED: Now saves to local storage even if API fails (offline support)
// -----------------------------------------------------------------------------
export const saveCurrentThemeToAPI = createAsyncThunk(
  'theme/saveCurrentTheme',
  async (themeId: string, { rejectWithValue }) => {
    try {
      await themeService.setCurrentTheme(themeId);
      await StorageService.saveTheme(themeId);
      console.log(`✅ Theme ${themeId} saved to server successfully`);
      return themeId;
    } catch (error) {
      // ✅ NEW: Save to local storage even if API fails (offline support)
      console.log(`❌ Failed to save to server, saving locally instead`);
      try {
        await StorageService.saveTheme(themeId);
        console.log(`💾 Saved to local storage despite API failure`);
      } catch (storageError) {
        console.log(`⚠️ Local storage also failed:`, storageError);
      }
      return rejectWithValue('Failed to save theme to server');
    }
  }
);

// -----------------------------------------------------------------------------
// Enable theme on server
// -----------------------------------------------------------------------------
export const enableThemeOnServer = createAsyncThunk(
  'theme/enableTheme',
  async (themeId: string, { rejectWithValue }) => {
    try {
      const response = await themeService.enableTheme(themeId);
      return response.enabledThemes ?? [...APP_DEFAULTS.CORE_ENABLED_THEMES];
    } catch (error) {
      return rejectWithValue('Failed to enable theme');
    }
  }
);

// -----------------------------------------------------------------------------
// Disable theme on server
// -----------------------------------------------------------------------------
export const disableThemeOnServer = createAsyncThunk(
  'theme/disableTheme',
  async (themeId: string, { rejectWithValue }) => {
    try {
      const response = await themeService.disableTheme(themeId);
      return {
        currentThemeId: response.currentTheme ?? APP_DEFAULTS.DEFAULT_THEME_ID,
        enabledThemes: response.enabledThemes ?? [...APP_DEFAULTS.CORE_ENABLED_THEMES],
      };
    } catch (error) {
      return rejectWithValue('Failed to disable theme');
    }
  }
);

// =============================================================================
// SLICE
// =============================================================================

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      const theme = state.availableThemes.find(t => t.id === action.payload);
      if (theme && state.enabledThemes.includes(action.payload)) {
        state.currentThemeId = action.payload;
        state.currentTheme = theme;
        state.error = null;
      }
    },

    toggleTheme: (state) => {
      const nextId = state.currentThemeId === 'light-default'
        ? 'dark-default'
        : 'light-default';

      const theme = state.availableThemes.find(t => t.id === nextId);
      if (theme && state.enabledThemes.includes(nextId)) {
        state.currentThemeId = nextId;
        state.currentTheme = theme;
      }
    },

    addTheme: (state, action: PayloadAction<Theme>) => {
      state.availableThemes.push(action.payload);
    },

    clearThemeError: (state) => {
      state.error = null;
    },

    enableTheme: (state, action: PayloadAction<string>) => {
      if (!state.enabledThemes.includes(action.payload)) {
        state.enabledThemes.push(action.payload);
      }
    },

    disableTheme: (state, action: PayloadAction<string>) => {
      const themeId = action.payload;

      if (!canDisableTheme(themeId)) {
        state.error = 'Cannot disable core themes';
        return;
      }

      state.enabledThemes = state.enabledThemes.filter(id => id !== themeId);

      if (state.currentThemeId === themeId) {
        const fallback = getFirstEnabledTheme(
          state.availableThemes,
          state.enabledThemes
        );
        if (fallback) {
          state.currentThemeId = fallback.id;
          state.currentTheme = fallback;
        }
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // Handle local theme loading
      .addCase(loadLocalThemePreferences.fulfilled, (state, action) => {
        state.enabledThemes = action.payload.enabledThemes;

        const theme = state.availableThemes.find(
          t => t.id === action.payload.currentThemeId
        );

        if (theme) {
          state.currentThemeId = theme.id;
          state.currentTheme = theme;
        }
      })
      
      // Handle server theme loading
      .addCase(loadUserPreferences.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUserPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enabledThemes = action.payload.enabledThemes;

        const theme = state.availableThemes.find(
          t => t.id === action.payload.currentThemeId
        );

        if (theme) {
          state.currentThemeId = theme.id;
          state.currentTheme = theme;
        }
      })
      .addCase(loadUserPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string ?? 'Failed to load preferences';
      })

      .addCase(enableThemeOnServer.fulfilled, (state, action) => {
        state.enabledThemes = action.payload;
      })

      .addCase(disableThemeOnServer.fulfilled, (state, action) => {
        state.enabledThemes = action.payload.enabledThemes;

        const theme = state.availableThemes.find(
          t => t.id === action.payload.currentThemeId
        );

        if (theme) {
          state.currentThemeId = theme.id;
          state.currentTheme = theme;
        }
      });
  },
});

// =============================================================================
// EXPORTS
// =============================================================================

export const {
  setTheme,
  toggleTheme,
  addTheme,
  clearThemeError,
  enableTheme,
  disableTheme,
} = themeSlice.actions;

export default themeSlice.reducer;