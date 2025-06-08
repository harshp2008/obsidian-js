'use client';

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * A simple toggle button for switching between light and dark themes
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-button"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
      
      <style>
        {`
        .theme-toggle-button {
          padding: 8px 12px;
          border-radius: 4px;
          background: var(--background-secondary, #f5f5f5);
          border: 1px solid var(--border-color, #e2e2e2);
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          transition: background-color 0.2s ease;
        }
        
        .theme-toggle-button:hover {
          background: var(--background-modifier-hover, #e9e9e9);
        }
        
        .dark .theme-toggle-button {
          background: var(--background-secondary, #2d333b);
          border-color: var(--border-color, #444c56);
        }
        
        .dark .theme-toggle-button:hover {
          background: var(--background-modifier-hover, #444c56);
        }
        `}
      </style>
    </button>
  );
}
