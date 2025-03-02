import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { LogBox, View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import MainNavigator from './src/navigation/MainNavigator';
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';
// Import Firebase configuration from the config file
import { auth, db } from './src/firebase/config';

// Ignore specific warnings
LogBox.ignoreLogs([
  'AsyncStorage has been extracted from react-native',
  'Setting a timer for a long period of time',
  'Possible Unhandled Promise Rejection',
  'Cannot read property',
  'Non-serializable values were found in the navigation state',
]);

// App content component that can access theme
const AppContent = () => {
  const { theme, isDarkMode } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        setIsLoading(true);
        // Wait a moment for everything to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    prepareApp();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.statusBar}
      />
      <NavigationContainer>
        <MainNavigator />
      </NavigationContainer>
    </View>
  );
};

// Main App component
export default function App() {
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  // Load fonts before rendering the app
  const loadFonts = async () => {
    try {
      // We're not using any custom fonts, so we just return true
      // This prevents the "Cannot read property 'regular' of undefined" error
      return true;
    } catch (error) {
      console.error('Error loading fonts:', error);
      return false;
    }
  };

  if (!isFontLoaded) {
    return (
      <AppLoading
        startAsync={loadFonts}
        onFinish={() => setIsFontLoaded(true)}
        onError={console.warn}
      />
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});