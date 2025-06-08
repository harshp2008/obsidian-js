'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

/**
 * Represents the possible theme states.
 */
export type Theme = 'light' | 'dark';

/**
 * Defines the shape of the ThemeContext.
 */
export interface ThemeContextType {
  /** The current active theme ('light' or 'dark'). */
  theme: Theme;
  /** Function to toggle the current theme. */
  toggleTheme: () => void;
  /** Whether the provider has mounted on the client */
  mounted: boolean;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  mounted: false,
  toggleTheme: () => {},
});

/**
 * Provides the theme state and toggle function to its children components.
 * It handles theme persistence in localStorage and synchronization with system preferences.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be wrapped by the provider.
 * @returns {JSX.Element} The ThemeProvider component (always renders children to avoid hydration issues).
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use state to track both theme and mounting status
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Effect for initializing theme
  useEffect(() => {
    // Get stored theme or detect from system preferences
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
    
    // Mark as mounted to prevent SSR hydration mismatch
    setMounted(true);
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply the theme to the document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, mounted, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to access the theme context (theme state and toggle function).
 * This hook must be used within a component wrapped by `ThemeProvider`.
 *
 * @throws {Error} If used outside of a `ThemeProvider`.
 * @returns {ThemeContextType} The theme context.
 */
export const useTheme = () => useContext(ThemeContext);

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
