export type ThemeType = 'light' | 'dark' | 'colorblind' | 'grayscale' | 'high-contrast';

export interface ThemeColors {
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  accent: string;
  border: string;
  tabBarBackground: string;
  headerBackground: string;
}

export interface Theme {
  id: string;
  type: ThemeType;
  name: string;
  colors: ThemeColors;
}