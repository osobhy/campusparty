import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define our theme colors
export const lightTheme = {
  background: '#f8f9fa',
  card: '#ffffff',
  text: '#111827',
  subtext: '#6b7280',
  primary: '#6366f1',
  secondary: '#a855f7',
  accent: '#3b82f6',
  border: '#e5e7eb',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  cardBackground: '#ffffff',
  inputBackground: '#ffffff',
  tabBarBackground: '#ffffff',
  tabBarActive: '#6366f1',
  tabBarInactive: '#9ca3af',
  headerBackground: '#6366f1',
  headerText: '#ffffff',
};

export const darkTheme = {
  background: '#111827',
  card: '#1f2937',
  text: '#f3f4f6',
  subtext: '#9ca3af',
  primary: '#818cf8',
  secondary: '#c084fc',
  accent: '#60a5fa',
  border: '#374151',
  error: '#f87171',
  success: '#34d399',
  warning: '#fbbf24',
  info: '#60a5fa',
  cardBackground: '#1f2937',
  inputBackground: '#374151',
  tabBarBackground: '#1f2937',
  tabBarActive: '#818cf8',
  tabBarInactive: '#6b7280',
  headerBackground: '#4f46e5',
  headerText: '#ffffff',
};

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceTheme === 'dark');
  const [theme, setTheme] = useState(isDarkMode ? darkTheme : lightTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('themePreference');
        if (storedTheme !== null) {
          const themePreference = JSON.parse(storedTheme);
          setIsDarkMode(themePreference.isDarkMode);
          setTheme(themePreference.isDarkMode ? darkTheme : lightTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Toggle theme function
  const toggleTheme = async () => {
    try {
      const newIsDarkMode = !isDarkMode;
      setIsDarkMode(newIsDarkMode);
      setTheme(newIsDarkMode ? darkTheme : lightTheme);
      
      // Save preference to storage
      await AsyncStorage.setItem(
        'themePreference',
        JSON.stringify({ isDarkMode: newIsDarkMode })
      );
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const value = {
    isDarkMode,
    theme,
    toggleTheme,
  };

  if (isLoading) {
    return null; // Or a loading component
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 