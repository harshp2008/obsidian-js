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
  /** Whether the provider has mounted on the client */
  mounted: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provides the theme state and toggle function to its children components.
 * It handles theme persistence in localStorage and synchronization with system preferences.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be wrapped by the provider.
 * @returns {JSX.Element} The ThemeProvider component (always renders children to avoid hydration issues).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with a default theme that won't change during SSR
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference ONLY on client-side
  useEffect(() => {
    // This only runs on client, after hydration
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    setMounted(true);
    
    // Apply theme to HTML only after mounting
    applyThemeToHTML(initialTheme, true);
  }, []);

  const toggleTheme = () => {
    // Only allow toggling after mounted
    if (!mounted) return;
    
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      
      // Update localStorage
      localStorage.setItem('theme', newTheme);
      
      // Apply theme to HTML
      applyThemeToHTML(newTheme, true);
      
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
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
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Apply the HTML theme class to document
 */
function applyThemeToHTML(theme: Theme, isMounted: boolean = false) {
  if (typeof document !== 'undefined') {
    // Add theme class to HTML element
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      
      // Only set CSS variables on client-side after mounting to avoid hydration mismatches
      if (isMounted) {
        // Set CSS variables for dark mode
        document.documentElement.style.setProperty('--background-primary', '#1e1e1e');
        document.documentElement.style.setProperty('--background-secondary', '#252525');
        document.documentElement.style.setProperty('--text-normal', '#dcddde');
      }
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      
      document.body.classList.add('light');
      document.body.classList.remove('dark');
      
      // Only set CSS variables on client-side after mounting to avoid hydration mismatches
      if (isMounted) {
        // Set CSS variables for light mode
        document.documentElement.style.setProperty('--background-primary', '#ffffff');
        document.documentElement.style.setProperty('--background-secondary', '#f5f5f5');
        document.documentElement.style.setProperty('--text-normal', '#1e1e1e');
      }
    }
  }
}
