import { Theme } from './themeTypes';

export const highContrastTheme: Theme = {
  id: 'high-contrast',
  type: 'high-contrast',
  name: 'High Contrast',
  colors: {
    background: '#000000',     // Pure black
    cardBackground: '#FFFFFF', // Pure white cards
    text: '#FFFFFF',           // Pure white text
    textSecondary: '#CCCCCC',  // Light gray for secondary
    accent: '#FFFF00',         // Bright yellow accent
    border: '#FFFFFF',         // White borders
    tabBarBackground: '#000000',
    headerBackground: '#000000',
  },
};