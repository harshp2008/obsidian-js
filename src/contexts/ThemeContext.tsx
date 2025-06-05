'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Represents the possible theme states.
 */
export type Theme = 'light' | 'dark';

/**
 * Defines the shape of the ThemeContext.
 */
export type ThemeContextType = {
  /** The current active theme ('light' or 'dark'). */
  theme: Theme;
  /** Function to toggle the current theme. */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provides the theme state and toggle function to its children components.
 * It handles theme persistence in localStorage and synchronization with system preferences.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be wrapped by the provider.
 * @returns {JSX.Element | null} The ThemeProvider component or null if not mounted yet.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Check for window object to avoid SSR issues
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
      setTheme(initialTheme);
      setMounted(true);
      
      // Update the HTML class
      applyThemeToHTML(initialTheme);
    }
  }, []);

  useEffect(() => {
    // Update document class and localStorage when theme changes
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      
      // Update localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', newTheme);
      }
      
      // Apply theme to HTML
      applyThemeToHTML(newTheme);
      
      return newTheme;
    });
  };

  // Prevent rendering the app until we know the theme to avoid flash of incorrect theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to access the theme context (theme state and toggle function).
 * This hook must be used within a component wrapped by `ThemeProvider`.
 *
 * @throws {Error} If used outside of a `ThemeProvider`.
 * @returns {ThemeContextType} The theme context.
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Apply the HTML theme class to document
 */
function applyThemeToHTML(theme: Theme) {
  if (typeof document !== 'undefined') {
    // Add theme class to HTML element
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }
}
