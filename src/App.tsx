import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { TabNavigator } from './navigation';
import { useAppSelector, useAppDispatch } from './hooks/redux';
import { checkAuth } from './store/slices/authSlice';
import { loadThemeFromStorage } from './store/slices/themeSlice';
import LoginScreen from './screens/LoginScreen';

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
    dispatch(checkAuth());
    dispatch(loadThemeFromStorage());
  }, []);
  
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