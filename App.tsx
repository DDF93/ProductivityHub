import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { TabNavigator } from './src/navigation';
import { useAppSelector, useAppDispatch } from './src/hooks/redux';
import { checkAuth } from './src/store/slices/authSlice';

import { loadUserPreferences } from './src/store/slices/themeSlice';
import { loadEnabledPluginsFromAPI } from './src/store/slices/pluginSlice';

import LoginScreen from './src/screens/LoginScreen';

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

function AppContent() {
  const dispatch = useAppDispatch();
  
  const { isAuthenticated, isInitialized } = useAppSelector(state => state.auth);
  const theme = useAppSelector(state => state.theme.currentTheme);
  
  
  useEffect(() => {
    
    const initializeApp = async () => {
      await dispatch(checkAuth());
      
      dispatch(loadUserPreferences());
      
      dispatch(loadEnabledPluginsFromAPI());
    };
    
    initializeApp();
    
  }, [dispatch]);
  
  if (!isInitialized) {
    return (
      <View style={[
        styles.loadingContainer,
        { backgroundColor: theme.colors.background }
      ]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }
  
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  
  return <TabNavigator />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
