/**
 * @fileoverview Theme selector component for the Obsidian editor
 * @module obsidian-editor/components/ThemeSelector
 */

import React, { useState, useEffect } from 'react';
import { themeManager } from '../themes/theme-manager.js';
import { THEME_PREFERENCES } from '../themes/theme-manager';

/**
 * ThemeSelector component that allows users to select and apply themes
 * @returns {JSX.Element} The rendered component
 */
const ThemeSelector = () => {
    const [currentTheme, setCurrentTheme] = useState(themeManager.getCurrentTheme());
    const [themePreference, setThemePreference] = useState(themeManager.getThemePreference());
    const [themes, setThemes] = useState([]);

    useEffect(() => {
        // Initialize themes
        setThemes(themeManager.getAllThemes());

        // Set initial theme if not already set
        if (!currentTheme) {
            const initialTheme = themeManager.initialize();
            setCurrentTheme(initialTheme);
            setThemePreference(themeManager.getThemePreference());
        }

        // Listen for theme changes
        const removeListener = themeManager.addThemeChangeListener((themeId) => {
            setCurrentTheme(themeId);
        });

        // Cleanup listener on unmount
        return () => removeListener();
    }, []);

    /**
     * Handle theme change from select dropdown
     * @param {React.ChangeEvent<HTMLSelectElement>} event - The change event
     */
    const handleThemeChange = (event) => {
        const newThemeId = event.target.value;
        themeManager.applyTheme(newThemeId);

        // Update preference based on selection
        if (newThemeId === themes.find(t => t.isDark)?.id) {
            themeManager.setThemePreference(THEME_PREFERENCES.DARK);
            setThemePreference(THEME_PREFERENCES.DARK);
        } else {
            themeManager.setThemePreference(THEME_PREFERENCES.LIGHT);
            setThemePreference(THEME_PREFERENCES.LIGHT);
        }
    };

    /**
     * Handle preference change (light, dark, system)
     * @param {React.ChangeEvent<HTMLSelectElement>} event - The change event
     */
    const handlePreferenceChange = (event) => {
        const preference = event.target.value;
        themeManager.setThemePreference(preference);
        setThemePreference(preference);
    };

    return (
        <div className="theme-selector">
            <div className="theme-preference">
                <label htmlFor="theme-preference" className="theme-select-label">
                    Theme Mode:
                </label>
                <select
                    id="theme-preference"
                    value={themePreference}
                    onChange={handlePreferenceChange}
                    className="theme-select"
                >
                    <option value={THEME_PREFERENCES.LIGHT}>Light</option>
                    <option value={THEME_PREFERENCES.DARK}>Dark</option>
                    <option value={THEME_PREFERENCES.SYSTEM}>System</option>
                </select>
            </div>

            {themePreference !== THEME_PREFERENCES.SYSTEM && (
                <div className="theme-choice">
                    <label htmlFor="theme-select" className="theme-select-label">
                        Theme:
                    </label>
                    <select
                        id="theme-select"
                        value={currentTheme || ""}
                        onChange={handleThemeChange}
                        className="theme-select"
                        disabled={themePreference === THEME_PREFERENCES.SYSTEM}
                    >
                        {themes
                            .filter(theme =>
                                (themePreference === THEME_PREFERENCES.DARK ? theme.isDark : !theme.isDark)
                            )
                            .map((theme) => (
                                <option key={theme.id} value={theme.id}>
                                    {theme.name}
                                </option>
                            ))
                        }
                    </select>
                </div>
            )}
        </div>
    );
};

export default ThemeSelector; 