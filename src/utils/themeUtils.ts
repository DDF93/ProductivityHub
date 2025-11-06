import { Theme } from '../themes/themeTypes';

export const CORE_THEME_IDS = ['light-default', 'dark-default'] as const;

export function getEnabledThemes(
  availableThemes: Theme[],
  enabledThemes: string[]
): Theme[] {
  return availableThemes.filter(theme => enabledThemes.includes(theme.id));
}

export function isThemeEnabled(themeId: string, enabledThemes: string[]): boolean {
  return enabledThemes.includes(themeId);
}

export function canDisableTheme(themeId: string): boolean {
  return !CORE_THEME_IDS.includes(themeId as any);
}

export function getFirstEnabledTheme(
  availableThemes: Theme[],
  enabledThemes: string[]
): Theme | null {
  const enabledThemeObjects = getEnabledThemes(availableThemes, enabledThemes);
  return enabledThemeObjects.length > 0 ? enabledThemeObjects[0] : null;
}