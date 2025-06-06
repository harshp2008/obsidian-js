/**
 * Represents the possible theme modes.
 * Currently supports 'light' and 'dark', but can be extended in the future.
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Theme configuration interface for extending and customizing the theme system.
 */
export interface ThemeConfig {
  /** The mode of the theme */
  mode: ThemeMode;
  
  /** Theme CSS variables */
  variables: Record<string, string>;
  
  /** Theme class name for applying to components */
  className?: string;
}

/**
 * CSS variables used in themes
 */
export interface ThemeVariables {
  /** Primary background color */
  backgroundPrimary: string;
  
  /** Secondary background color */
  backgroundSecondary: string;
  
  /** Normal text color */
  textNormal: string;
  
  /** Muted text color */
  textMuted: string;
  
  /** Accent text color */
  textAccent: string;
  
  /** Normal interactive element color */
  interactiveNormal: string;
  
  /** Hover interactive element color */
  interactiveHover: string;
  
  /** Accent interactive element color */
  interactiveAccent: string;
}

/**
 * Available theme presets in the application
 */
export enum ThemePreset {
  Light = 'light',
  Dark = 'dark',
} 