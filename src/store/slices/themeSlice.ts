import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Theme, allThemes, lightTheme } from '../../themes';
import { StorageService } from '../../services/storageService';
import { canDisableTheme, getFirstEnabledTheme } from '../../utils/themeUtils';

const APP_DEFAULTS = {
  DEFAULT_THEME_ID: 'light-default' as const,
  DEFAULT_THEME: lightTheme,
  CORE_ENABLED_THEMES: ['light-default', 'dark-default'] as const,
} as const;

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

// Enhanced to load both current theme and enabled themes
export const loadThemeFromStorage = createAsyncThunk(
  'theme/loadFromStorage',
  async () => {
    const savedThemeId = await StorageService.loadTheme();
    const savedEnabledThemes = await StorageService.loadEnabledThemes();
    return {
      themeId: savedThemeId || 'light-default',
      enabledThemes: savedEnabledThemes || ['light-default', 'dark-default']
    };
  }
);

// Your existing saveThemeToStorage - unchanged
export const saveThemeToStorage = createAsyncThunk(
  'theme/saveToStorage',
  async (themeId: string) => {
    await StorageService.saveTheme(themeId);
    return themeId;
  }
);

// NEW: Save enabled themes to storage
export const saveEnabledThemesToStorage = createAsyncThunk(
  'theme/saveEnabledThemes',
  async (enabledThemes: string[]) => {
    await StorageService.saveEnabledThemes(enabledThemes);
    return enabledThemes;
  }
);

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      const newTheme = state.availableThemes.find(theme => theme.id === action.payload);
      if (newTheme && state.enabledThemes.includes(action.payload)) {
        state.currentThemeId = action.payload;
        state.currentTheme = newTheme;
        state.error = null;
      }
    },
    
    toggleTheme: (state) => {
      const newThemeId = state.currentThemeId === 'light-default' ? 'dark-default' : 'light-default';
      const newTheme = state.availableThemes.find(theme => theme.id === newThemeId);
      if (newTheme && state.enabledThemes.includes(newThemeId)) {
        state.currentThemeId = newThemeId;
        state.currentTheme = newTheme;
        state.error = null;
      }
    },
    
    addTheme: (state, action: PayloadAction<Theme>) => {
      state.availableThemes.push(action.payload);
    },
    
    clearThemeError: (state) => {
      state.error = null;
    },
    
    enableTheme: (state, action: PayloadAction<string>) => {
      const themeId = action.payload;
      if (!state.enabledThemes.includes(themeId)) {
        state.enabledThemes.push(themeId);
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
        const fallbackTheme = getFirstEnabledTheme(state.availableThemes, state.enabledThemes);
        if (fallbackTheme) {
          state.currentThemeId = fallbackTheme.id;
          state.currentTheme = fallbackTheme;
        }
      }
      
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(loadThemeFromStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadThemeFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        const { themeId, enabledThemes } = action.payload;
        
        state.enabledThemes = enabledThemes;
        
        const theme = state.availableThemes.find(t => t.id === themeId);
        if (theme && enabledThemes.includes(themeId)) {
          state.currentThemeId = themeId;
          state.currentTheme = theme;
        }
      })
      .addCase(loadThemeFromStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load theme preference';
      })
      
      .addCase(saveThemeToStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveThemeToStorage.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(saveThemeToStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to save theme preference';
      })
      
      .addCase(saveEnabledThemesToStorage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveEnabledThemesToStorage.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(saveEnabledThemesToStorage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to save enabled themes';
      });
  },
});

export const { 
  setTheme, 
  toggleTheme, 
  addTheme, 
  clearThemeError,
  enableTheme,    // NEW
  disableTheme    // NEW
} = themeSlice.actions;

export default themeSlice.reducer;