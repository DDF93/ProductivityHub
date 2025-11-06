import { Theme } from './themeTypes';

export const colorblindTheme: Theme = {
  id: 'colorblind-default',
  type: 'colorblind',
  name: 'Colorblind Friendly',
  colors: {
    background: '#FFFFFF',
    cardBackground: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    accent: '#0066CC',        // Blue that works for most colorblind types
    border: '#CCCCCC',
    tabBarBackground: '#F5F5F5',
    headerBackground: '#FFFFFF',
  },
};