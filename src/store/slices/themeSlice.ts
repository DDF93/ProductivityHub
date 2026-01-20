// src/store/slices/themeSlice.ts

import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
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
// Load user preferences
// -----------------------------------------------------------------------------

export const loadUserPreferences = createAsyncThunk<
  { currentThemeId: string; enabledThemes: string[] },
  void,
  { rejectValue: string }
>('theme/loadUserPreferences', async (_, { rejectWithValue }) => {
  try {
    const preferences = await themeService.getUserPreferences();
    const { current, enabled } = preferences.themes;

    return {
      currentThemeId: current ?? APP_DEFAULTS.DEFAULT_THEME_ID,
      enabledThemes: enabled ?? [...APP_DEFAULTS.CORE_ENABLED_THEMES],
    };
  } catch {
    try {
      const storedTheme = await StorageService.loadTheme();
      const storedEnabled = await StorageService.loadEnabledThemes();

      return {
        currentThemeId: storedTheme ?? APP_DEFAULTS.DEFAULT_THEME_ID,
        enabledThemes: storedEnabled ?? [...APP_DEFAULTS.CORE_ENABLED_THEMES],
      };
    } catch {
      return {
        currentThemeId: APP_DEFAULTS.DEFAULT_THEME_ID,
        enabledThemes: [...APP_DEFAULTS.CORE_ENABLED_THEMES],
      };
    }
  }
});

// -----------------------------------------------------------------------------
// Save current theme
// -----------------------------------------------------------------------------

export const saveCurrentThemeToAPI = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('theme/saveCurrentTheme', async (themeId, { rejectWithValue }) => {
  try {
    await themeService.setCurrentTheme(themeId);
    await StorageService.saveTheme(themeId);
    return themeId;
  } catch {
    return rejectWithValue('Failed to save theme');
  }
});

// -----------------------------------------------------------------------------
// Enable theme
// -----------------------------------------------------------------------------

export const enableThemeOnServer = createAsyncThunk<
  string[],
  string,
  { rejectValue: string }
>('theme/enableTheme', async (themeId, { rejectWithValue }) => {
  try {
    const response = await themeService.enableTheme(themeId);
    return response.enabledThemes ?? [...APP_DEFAULTS.CORE_ENABLED_THEMES];
  } catch {
    return rejectWithValue('Failed to enable theme');
  }
});

// -----------------------------------------------------------------------------
// Disable theme
// -----------------------------------------------------------------------------

export const disableThemeOnServer = createAsyncThunk<
  { currentThemeId: string; enabledThemes: string[] },
  string,
  { rejectValue: string }
>('theme/disableTheme', async (themeId, { rejectWithValue }) => {
  try {
    const response = await themeService.disableTheme(themeId);

    return {
      currentThemeId:
        response.currentTheme ?? APP_DEFAULTS.DEFAULT_THEME_ID,
      enabledThemes:
        response.enabledThemes ?? [...APP_DEFAULTS.CORE_ENABLED_THEMES],
    };
  } catch {
    return rejectWithValue('Failed to disable theme');
  }
});

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
      const nextId =
        state.currentThemeId === 'light-default'
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
        state.error = action.payload ?? 'Failed to load preferences';
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
