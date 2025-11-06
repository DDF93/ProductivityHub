import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  THEME_PREFERENCE: 'theme_preference',
  ENABLED_THEMES: 'enabled_themes',
  ENABLED_PLUGINS: 'enabled_plugins', // Key for enabled plugins
} as const;

export class StorageService {
  // Theme persistence methods
  static async saveTheme(themeId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, themeId);
      console.log(`Theme preference saved: ${themeId}`); // Helpful for debugging
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }

  static async loadTheme(): Promise<string | null> {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE);
      console.log(`Theme preference loaded: ${savedTheme || 'none'}`); // Helpful for debugging
      return savedTheme; // Returns null if no theme was previously saved
    } catch (error) {
      console.error('Failed to load theme preference:', error);
      return null; // Return null if loading fails - app will use default theme
    }
  }

  static async clearTheme(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.THEME_PREFERENCE);
      console.log('Theme preference cleared');
    } catch (error) {
      console.error('Failed to clear theme preference:', error);
    }
  }

  // Enabled themes persistence methods
  static async saveEnabledThemes(enabledThemes: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ENABLED_THEMES, JSON.stringify(enabledThemes));
      console.log(`Enabled themes saved: ${enabledThemes.join(', ')}`); // Helpful for debugging
    } catch (error) {
      console.error('Failed to save enabled themes:', error);
    }
  }

  static async loadEnabledThemes(): Promise<string[] | null> {
    try {
      const savedEnabledThemes = await AsyncStorage.getItem(STORAGE_KEYS.ENABLED_THEMES);
      const enabledThemes = savedEnabledThemes ? JSON.parse(savedEnabledThemes) : null;
      console.log(`Enabled themes loaded: ${enabledThemes ? enabledThemes.join(', ') : 'none'}`); // Helpful for debugging
      return enabledThemes; // Returns null if no enabled themes were previously saved
    } catch (error) {
      console.error('Failed to load enabled themes:', error);
      return null; // Return null if loading fails - app will use default enabled themes
    }
  }

  static async clearEnabledThemes(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ENABLED_THEMES);
      console.log('Enabled themes cleared');
    } catch (error) {
      console.error('Failed to clear enabled themes:', error);
    }
  }

  static async saveEnabledPlugins(enabledPlugins: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ENABLED_PLUGINS, JSON.stringify(enabledPlugins));
    console.log(`Enabled plugins saved: ${enabledPlugins.join(', ')}`);
  } catch (error) {
    console.error('Failed to save enabled plugins:', error);
  }
}

static async loadEnabledPlugins(): Promise<string[] | null> {
  try {
    const savedEnabledPlugins = await AsyncStorage.getItem(STORAGE_KEYS.ENABLED_PLUGINS);
    const enabledPlugins = savedEnabledPlugins ? JSON.parse(savedEnabledPlugins) : null;
    console.log(`Enabled plugins loaded: ${enabledPlugins ? enabledPlugins.join(', ') : 'none'}`);
    return enabledPlugins;
  } catch (error) {
    console.error('Failed to load enabled plugins:', error);
    return null;
  }
}

static async clearEnabledPlugins(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ENABLED_PLUGINS);
    console.log('Enabled plugins cleared');
  } catch (error) {
    console.error('Failed to clear enabled plugins:', error);
  }
}
}