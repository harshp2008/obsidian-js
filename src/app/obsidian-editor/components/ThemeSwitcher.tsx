'use client';

import React, { useState, useEffect } from 'react';
import { EditorThemeName, getCurrentEditorTheme } from '../utils/theme';

/**
 * Props for the ThemeSwitcher component
 */
interface ThemeSwitcherProps {
  onThemeChange?: (themeName: EditorThemeName) => void;
}

/**
 * Component for switching between editor themes
 */
const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ onThemeChange }) => {
  const [themeName, setThemeName] = useState<EditorThemeName>('default');
  
  // Initialize with the current theme
  useEffect(() => {
    setThemeName(getCurrentEditorTheme());
  }, []);
  
  // Handle theme change
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value as EditorThemeName;
    setThemeName(newTheme);
    
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };
  
  return (
    <div className="theme-switcher">
      <select 
        value={themeName} 
        onChange={handleThemeChange}
        className="theme-select"
        aria-label="Select editor theme"
      >
        <option value="default">Default</option>
        <option value="vanilla">Vanilla</option>
      </select>
      
      <style>
        {`
        .theme-switcher {
          position: relative;
        }
        
        .theme-select {
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid var(--hr-color, #dcddde);
          background: var(--background-primary, #ffffff);
          color: var(--text-normal, #2e3338);
          cursor: pointer;
          font-size: 14px;
        }
        
        .dark .theme-select {
          background: var(--background-primary, #2b2b2b);
          color: var(--text-normal, #dcddde);
          border-color: var(--hr-color, #444444);
        }
        `}
      </style>
    </div>
  );
};

export default ThemeSwitcher; 