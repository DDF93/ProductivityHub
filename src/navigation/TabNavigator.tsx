import React from 'react';
// ❌ Remove: import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppSelector } from '../hooks/redux';
import { createNavigationTheme } from './navigationTheme';

import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PluginListScreen from '../screens/PluginListScreen';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  const theme = useAppSelector(state => state.theme.currentTheme);
  const navigationTheme = createNavigationTheme(theme);

  return (
    // ❌ Remove NavigationContainer wrapper
    // ✅ Return Tab.Navigator directly
    <Tab.Navigator 
      initialRouteName="Home"
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { 
          backgroundColor: theme.colors.headerBackground,
          height: 70,
          elevation: 2,
          shadowOpacity: 0.1,
        },
        headerTitleStyle: {
          fontSize: 18,
          marginTop: -8,
          marginBottom: -5,
          color: theme.colors.text,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { 
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.border,
          paddingBottom: 8,     
          paddingTop: 5, 
        },
        tabBarLabelStyle: { 
          fontSize: 14,
          marginBottom: 0,
          marginTop: 4,
        },
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Plugins" component={PluginListScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}