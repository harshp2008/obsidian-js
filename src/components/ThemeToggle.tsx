'use client';

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * A simple toggle button for switching between light and dark themes
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const buttonStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    color: 'var(--foreground)',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    transition: 'background-color 0.2s',
    opacity: 0.8,
  };
  
  return (
    <button 
      onClick={toggleTheme} 
      className="theme-toggle"
      style={buttonStyle}
      onMouseOver={(e) => {
        (e.target as HTMLElement).style.backgroundColor = 'var(--background-modifier-hover)';
        (e.target as HTMLElement).style.opacity = '1';
      }}
      onMouseOut={(e) => {
        (e.target as HTMLElement).style.backgroundColor = 'transparent';
        (e.target as HTMLElement).style.opacity = '0.8';
      }}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
    </button>
  );
}
