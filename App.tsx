// App.tsx
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet, AppState } from 'react-native';  // ✅ Remove useColorScheme
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { TabNavigator } from './src/navigation';
import { AuthNavigator } from './src/navigation';
import { useAppSelector, useAppDispatch } from './src/hooks/redux';
import { checkAuth } from './src/store/slices/authSlice';
import { loadUserPreferences, loadLocalThemePreferences } from './src/store/slices/themeSlice';
import { loadEnabledPluginsFromAPI } from './src/store/slices/pluginSlice';

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

function AppContent() {
  const dispatch = useAppDispatch();
  const [isAppReady, setIsAppReady] = useState(false);
  const appState = useRef(AppState.currentState);
  
  const { isAuthenticated, isInitialized } = useAppSelector(state => state.auth);
  const theme = useAppSelector(state => state.theme.currentTheme);
  
  // ✅ Two-stage initialization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // STAGE 1: Load local preferences FIRST (for login screen UX)
        // This loads theme from AsyncStorage OR falls back to system theme
        console.log('🎨 Loading local theme preferences...');
        await dispatch(loadLocalThemePreferences()).unwrap();  // ✅ No parameter needed
        
        // STAGE 2: Check authentication
        console.log('🔐 Checking authentication...');
        const authResult = await dispatch(checkAuth()).unwrap();
        
        // STAGE 3: If authenticated, load server preferences (overrides local)
        if (authResult.user) {
          console.log('✅ User authenticated - syncing with server...');
          await dispatch(loadUserPreferences()).unwrap();
          await dispatch(loadEnabledPluginsFromAPI()).unwrap();
        } else {
          console.log('ℹ️ Not authenticated - using local theme preferences');
        }
        
      } catch (error) {
        console.log('⚠️ Initialization completed with errors (this is OK if not logged in)');
      } finally {
        setIsAppReady(true);
      }
    };
    
    initializeApp();
  }, [dispatch]);  // ✅ Remove systemColorScheme dependency
  
  // ✅ App state listener (background → foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) && 
        nextAppState === 'active'
      ) {
        console.log('📱 App came to foreground');
        
        // Only sync with server if authenticated
        if (isAuthenticated) {
          console.log('🔄 Refreshing preferences from server...');
          dispatch(loadUserPreferences());
          dispatch(loadEnabledPluginsFromAPI());
        } else {
          console.log('ℹ️ Not authenticated - keeping local preferences');
        }
      }
      
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch, isAuthenticated]);
  
  if (!isAppReady || !isInitialized) {
    return (
      <View style={[
        styles.loadingContainer,
        { backgroundColor: theme.colors.background }
      ]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      {!isAuthenticated ? <AuthNavigator /> : <TabNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;