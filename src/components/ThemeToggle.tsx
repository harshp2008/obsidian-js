'use client';

import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

/**
 * A button component that allows the user to toggle between light and dark themes.
 * It uses the `useTheme` hook to access the current theme and the toggle function.
 * This component is SSR-friendly and won't cause hydration mismatches.
 *
 * @returns {JSX.Element} The theme toggle button.
 */
export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  
  // Render a placeholder with the same dimensions during SSR to prevent layout shifts
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-full transition-colors"
        aria-label="Theme toggle"
        aria-hidden="true"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-300" />
      )}
    </button>
  );
}
