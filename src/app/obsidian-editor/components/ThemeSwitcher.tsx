import React, { useState, useEffect } from 'react';
import { getCurrentEditorTheme, setEditorTheme, EditorThemeName } from '../utils/theme';

interface ThemeSwitcherProps {
  onThemeChange?: (themeName: EditorThemeName) => void;
}

/**
 * A component that allows switching between different editor themes
 */
const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ onThemeChange }) => {
  const [themeName, setThemeName] = useState<EditorThemeName>('obsidian');
  
  // Initialize theme on mount
  useEffect(() => {
    const currentTheme = getCurrentEditorTheme();
    setThemeName(currentTheme);
  }, []);
  
  // Handle theme change
  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value as EditorThemeName;
    setThemeName(newTheme);
    setEditorTheme(newTheme);
    
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
    
    // Force page reload to apply theme
    window.location.reload();
  };
  
  return (
    <div className="obsidian-theme-switcher">
      <label htmlFor="theme-select">Theme:</label>
      <select 
        id="theme-select" 
        value={themeName} 
        onChange={handleThemeChange}
        className="theme-select"
      >
        <option value="obsidian">Obsidian</option>
        <option value="vanilla">Vanilla</option>
      </select>
      
      <style jsx>{`
        .obsidian-theme-switcher {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        
        .theme-select {
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid var(--hr-color, #dcddde);
          background-color: var(--background-primary, #ffffff);
          color: var(--text-normal, #2e3338);
          cursor: pointer;
        }
        
        .dark .theme-select {
          background-color: var(--background-primary, #2b2b2b);
          color: var(--text-normal, #dcddde);
          border-color: var(--hr-color, #444444);
        }
      `}</style>
    </div>
  );
};

export default ThemeSwitcher; 