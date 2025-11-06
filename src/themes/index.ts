import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';
import { colorblindTheme } from './colorblindTheme';
import { grayscaleTheme } from './grayscaleTheme';
import { highContrastTheme } from './highContrastTheme';


export { lightTheme } from './lightTheme';
export { darkTheme } from './darkTheme';
export { colorblindTheme } from './colorblindTheme';
export { highContrastTheme } from './highContrastTheme';
export { grayscaleTheme } from './grayscaleTheme';

export type { Theme, ThemeColors, ThemeType } from './themeTypes';

// Optional: Create a themes array for easy iteration
export const allThemes = [
  lightTheme,
  darkTheme,
  colorblindTheme,
  highContrastTheme,
  grayscaleTheme,
];

// Optional: Create themes object for dynamic access
export const themesByID = {
  'light-default': lightTheme,
  'dark-default': darkTheme,
  'colorblind-default': colorblindTheme,
  'high-contrast': highContrastTheme,
  'grayscale-default': grayscaleTheme,
} as const;