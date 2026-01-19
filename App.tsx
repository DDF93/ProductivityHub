import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { NavigationContainer } from '@react-navigation/native';
import { TabNavigator } from './src/navigation/TabNavigator';  // Main app
import { AuthNavigator } from './src/navigation/AuthNavigator';  // Auth flow
import { useAppSelector, useAppDispatch } from './src/hooks/redux';
import { checkAuth } from './src/store/slices/authSlice';
import { loadThemeFromStorage } from './src/store/slices/themeSlice';

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

// Main app content - handles auth state and navigation
function AppContent() {
  // Get dispatch function to send actions to Redux
  const dispatch = useAppDispatch();
  
  // Get auth state from Redux
  // isAuthenticated: true if user is logged in
  // isInitialized: true after we've checked if user has valid token
  const { isAuthenticated, isInitialized } = useAppSelector(state => state.auth);
  
  // Get current theme from Redux for styling loading screen
  const theme = useAppSelector(state => state.theme.currentTheme);
  
  // Run once when component mounts (app starts)
  useEffect(() => {
    // Check if user has valid JWT token in storage
    dispatch(checkAuth());
    
    // Load user's theme preference from storage
    dispatch(loadThemeFromStorage());
  }, []);  // Empty array = run only once on mount
  
  // Show loading screen while checking authentication
  // isInitialized is false until checkAuth completes
  if (!isInitialized) {
    return (
      <View style={[
        styles.loadingContainer,
        { backgroundColor: theme.colors.background }
      ]}>
        {/* Spinning loading indicator */}
        <ActivityIndicator 
          size="large" 
          color={theme.colors.accent} 
        />
      </View>
    );
  }
  
  // After initialization, show either Auth or Main app
  // NavigationContainer is required root for React Navigation
  return (
    <NavigationContainer>
      {/* 
        Conditional rendering based on authentication:
        - Not logged in (isAuthenticated = false) → Show Auth Stack
        - Logged in (isAuthenticated = true) → Show Main App (Tabs)
      */}
      {!isAuthenticated ? (
        // Show Login/Register flow
        <AuthNavigator />
      ) : (
        // Show main app with tabs (Home, Plugins, Settings)
        <TabNavigator />
      )}
    </NavigationContainer>
  );
}

// Styles for loading screen
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,  // Take full screen
    justifyContent: 'center',  // Center vertically
    alignItems: 'center',  // Center horizontally
  },
});

// Export so index.js can import and register
export default App;