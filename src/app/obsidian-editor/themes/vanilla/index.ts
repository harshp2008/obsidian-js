import { createVanillaLightTheme, createVanillaDarkTheme, createVanillaHighlightStyle } from './themeConnector';

// Pre-create instances of themes for export
export const vanillaLightTheme = createVanillaLightTheme();
export const vanillaDarkTheme = createVanillaDarkTheme();
export const vanillaHighlightStyle = createVanillaHighlightStyle();

// Theme object for easy import
export const vanillaTheme = {
  light: vanillaLightTheme,
  dark: vanillaDarkTheme,
  highlight: vanillaHighlightStyle
}; 