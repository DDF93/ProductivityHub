import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Theme } from '../themes/themeTypes';

export function createNavigationTheme(appTheme: Theme) {
  // Choose base React Navigation theme
  const baseTheme = appTheme.type === 'dark' ? DarkTheme : DefaultTheme;
  
  // Create custom theme by extending the base theme
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: appTheme.colors.accent,
      background: appTheme.colors.background,
      card: appTheme.colors.headerBackground,
      text: appTheme.colors.text,
      border: appTheme.colors.border,
      notification: appTheme.colors.accent,
    },
  };
}