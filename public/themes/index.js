/**
 * @fileoverview Theme index file that exports available themes
 * @module themes
 */

/**
 * Available themes in the application
 * @type {Object}
 */
const THEMES = {
  VANILLA_LIGHT: "vanilla-light",
  VANILLA_DARK: "vanilla-dark",
};

/**
 * Theme metadata with display names and file paths
 * @type {Array<Object>}
 */
const THEME_METADATA = [
  {
    id: THEMES.VANILLA_LIGHT,
    name: "Vanilla Light",
    path: "/themes/vanilla/vanilla-light.css",
    isDark: false,
  },
  {
    id: THEMES.VANILLA_DARK,
    name: "Vanilla Dark",
    path: "/themes/vanilla/vanilla-dark.css",
    isDark: true,
  },
];

/**
 * Get all available themes
 * @returns {Array<Object>} Array of theme metadata objects
 */
export function getAllThemes() {
  return THEME_METADATA;
}

/**
 * Get a theme by its ID
 * @param {string} themeId - The ID of the theme to retrieve
 * @returns {Object|undefined} The theme metadata or undefined if not found
 */
export function getThemeById(themeId) {
  return THEME_METADATA.find((theme) => theme.id === themeId);
}

export { THEMES };
export default THEME_METADATA;
