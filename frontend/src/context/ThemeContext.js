import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // 'light', 'dark', 'system'
    const [theme, setThemeState] = useState(() => {
        return localStorage.getItem('theme') || 'system';
    });

    // NEW: Track the actual resolved visual state
    const [isDarkMode, setIsDarkMode] = useState(false);

    const applyTheme = (selectedTheme) => {
        const root = document.documentElement;
        const isDark =
            selectedTheme === 'dark' ||
            (selectedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        setIsDarkMode(isDark); // Update state

        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };

    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Listen for system preference changes if theme is 'system'
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const setTheme = async (newTheme) => {
        setThemeState(newTheme);

        // Sync with backend if user is logged in (handled by AuthContext or component calling this)
        // We expose a sync function for AuthContext to use
    };

    const syncThemeWithBackend = async (backendTheme) => {
        if (backendTheme && ['light', 'dark', 'system'].includes(backendTheme)) {
            setThemeState(backendTheme);
        }
    };

    const updateBackendTheme = async (newTheme) => {
        const token = localStorage.getItem('token');
        if (!token) return; // Don't sync if not logged in

        try {
            await api.patch('/users/theme', { theme: newTheme });
        } catch (error) {
            console.error("Failed to sync theme with backend:", error);
        }
    }

    const handleSetTheme = (newTheme) => {
        setTheme(newTheme);
        updateBackendTheme(newTheme);
    }

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode, setTheme: handleSetTheme, syncThemeWithBackend }}>
            {children}
        </ThemeContext.Provider>
    );
};
