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
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTheme = e.target.value as EditorThemeName;
    console.log(`Theme changed to: ${selectedTheme}`);
    
    // Update local state
    setThemeName(selectedTheme);
    
    // Apply theme without causing a re-render of the entire application
    setEditorTheme(selectedTheme);
    
    // Direct styling approach as a fallback
    if (selectedTheme === 'vanilla') {
      // Find all editor instances and directly apply styling
      const editorElements = document.querySelectorAll('.cm-editor');
      const isDark = document.documentElement.classList.contains('dark');
      
      editorElements.forEach(editor => {
        if (isDark) {
          // Apply dark theme styles directly
          (editor as HTMLElement).style.backgroundColor = '#2a2536';
          (editor as HTMLElement).style.border = '4px solid #c4b3e0';
          
          // Find content area
          const content = editor.querySelector('.cm-content');
          if (content) {
            (content as HTMLElement).style.backgroundColor = '#2a2536';
          }
          
          // Find gutters
          const gutters = editor.querySelector('.cm-gutters');
          if (gutters) {
            (gutters as HTMLElement).style.backgroundColor = '#332d3e';
            (gutters as HTMLElement).style.borderRight = '1px solid #4a4252';
          }
        } else {
          // Apply light theme styles directly
          (editor as HTMLElement).style.backgroundColor = '#f5f0ff';
          (editor as HTMLElement).style.border = '4px solid #625772';
          
          // Find content area
          const content = editor.querySelector('.cm-content');
          if (content) {
            (content as HTMLElement).style.backgroundColor = '#f5f0ff';
          }
          
          // Find gutters
          const gutters = editor.querySelector('.cm-gutters');
          if (gutters) {
            (gutters as HTMLElement).style.backgroundColor = '#ede6f8';
            (gutters as HTMLElement).style.borderRight = '1px solid #d8c9f0';
          }
        }
      });
    }
    
    // Only notify parent if callback exists
    if (onThemeChange) {
      // Use setTimeout to prevent synchronous rendering issues
      setTimeout(() => {
        onThemeChange(selectedTheme);
      }, 0);
    }
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