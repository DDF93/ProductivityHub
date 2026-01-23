// src/screens/SettingsScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, FlatList, Dimensions, Alert } from 'react-native';  // ✅ Add Alert

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
import { TabNavigationProp } from '../types/NavigationTypes';
import { useAppSelector, useAppDispatch } from '../hooks/redux';

import { 
  setTheme,
  saveCurrentThemeToAPI,
  clearThemeError 
} from '../store/slices/themeSlice';

import { logout } from '../store/slices/authSlice';

import { getEnabledThemes } from '../utils/themeUtils';

const styles = StyleSheet.create({
    settingsContainer: {
        flex: 1,
        padding: 20,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    settingsTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    settingsDescription: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    settingsSection: {
        marginVertical: 10,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        marginVertical: 8,
    },
    settingLabel: {
        fontSize: 18,
        fontWeight: '500',
    },
    settingDescription: {
        fontSize: 14,
        marginTop: 4,
        opacity: 0.8,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
    },
    errorText: {
        fontSize: 14,
        flex: 1,
        marginRight: 12,
    },
    errorDismiss: {
        fontSize: 14,
        fontWeight: '600',
    },
    settingLabelContainer: {
        flex: 1,
        marginRight: 16,
    },
    settingControlContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingIndicator: {
        marginRight: 8,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 120,
    },
    dropdownButtonText: {
        fontSize: 16,
        flex: 1,
    },
    dropdownArrow: {
        fontSize: 12,
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 12,
        padding: 20,
        width: screenWidth * 0.8,
        height: screenHeight * 0.67,
        maxHeight: 500,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalScrollContainer: {
        flex: 1,
        marginTop: 8,
    },
    themeOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginVertical: 4,
    },
    themeOptionText: {
        fontSize: 16,
        textAlign: 'center',
    },
    selectedThemeOption: {
        opacity: 0.7,
    },
    // ✅ NEW: Red logout button styles
    logoutButton: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)', // Light red background
        borderColor: '#FF3B30', // Red border
        borderWidth: 2, // Thicker border
    },
    logoutLabel: {
        color: '#FF3B30', // Red text
        fontWeight: '600', // Slightly bolder
    },
    logoutDescription: {
        color: '#FF3B30', // Red text for description too
        opacity: 0.7,
    },
    logoutIcon: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF3B30', // Red icon
    },
});

type SettingsScreenProps = {
    navigation: TabNavigationProp;
};

function SettingsScreen({ navigation }: SettingsScreenProps) {
    
    const theme = useAppSelector(state => state.theme.currentTheme);
    const currentThemeId = useAppSelector(state => state.theme.currentThemeId);
    const availableThemes = useAppSelector(state => state.theme.availableThemes);
    const enabledThemes = useAppSelector(state => state.theme.enabledThemes);
    const isLoading = useAppSelector(state => state.theme.isLoading);
    const error = useAppSelector(state => state.theme.error);
    const dispatch = useAppDispatch();

    const [dropdownVisible, setDropdownVisible] = useState(false);

    const enabledThemeObjects = getEnabledThemes(availableThemes, enabledThemes);
    const currentTheme = enabledThemeObjects.find(t => t.id === currentThemeId);

    const handleThemeSelect = async (themeId: string) => {
        setDropdownVisible(false);
        
        if (themeId !== currentThemeId) {
            console.log(`🎨 User selected theme: ${themeId}`);
            
            // Optimistic update - UI changes immediately
            dispatch(setTheme(themeId));
            
            try {
                // Attempt to sync with server
                await dispatch(saveCurrentThemeToAPI(themeId)).unwrap();
                console.log(`✅ Theme synced with server`);
                
            } catch (error) {
                console.log('⚠️ Server sync failed, but theme changed locally');
                // UI already updated, so this is graceful degradation
            }
        }
    };

    const handleErrorDismiss = () => {
        dispatch(clearThemeError());
    };

    // ✅ UPDATED: Show confirmation dialog before logging out
    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => console.log('Logout cancelled')
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        console.log('🚪 Logging out...');
                        try {
                            await dispatch(logout()).unwrap();
                            console.log('✅ Logout successful');
                        } catch (error) {
                            console.error('❌ Logout failed:', error);
                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    return (
        <View style={[styles.settingsContainer, {backgroundColor: theme.colors.background}]}>
            <View style={styles.headerSection}>
                <Text style={[styles.settingsTitle, {color: theme.colors.text}]}>
                    Settings
                </Text>
                <Text style={[styles.settingsDescription, {color: theme.colors.textSecondary}]}>
                    Customize your app experience
                </Text>
                
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={[styles.errorText, {color: 'red'}]}>
                            {error}
                        </Text>
                        <Text 
                            style={[styles.errorDismiss, {color: theme.colors.accent}]} 
                            onPress={handleErrorDismiss}
                        >
                            Dismiss
                        </Text>
                    </View>
                )}
            </View>

            {/* Theme Settings Section */}
            <View style={styles.settingsSection}>
                <View style={[
                    styles.settingItem, 
                    {
                        backgroundColor: theme.colors.cardBackground,
                        borderColor: theme.colors.border,
                    }
                ]}>
                    <View style={styles.settingLabelContainer}>
                        <Text style={[styles.settingLabel, {color: theme.colors.text}]}>
                            Theme
                        </Text>
                        <Text style={[styles.settingDescription, {color: theme.colors.textSecondary}]}>
                            Choose from your enabled themes
                        </Text>
                    </View>

                    <View style={styles.settingControlContainer}>
                        {isLoading && (
                            <ActivityIndicator 
                                size="small" 
                                color={theme.colors.accent} 
                                style={styles.loadingIndicator}
                            />
                        )}
                        
                        <TouchableOpacity
                            style={[
                                styles.dropdownButton,
                                {
                                    backgroundColor: theme.colors.background,
                                    borderColor: theme.colors.border,
                                }
                            ]}
                            onPress={() => setDropdownVisible(true)}
                            disabled={isLoading}
                        >
                            <Text style={[styles.dropdownButtonText, {color: theme.colors.text}]}>
                                {currentTheme?.name || 'Select Theme'}
                            </Text>
                            <Text style={[styles.dropdownArrow, {color: theme.colors.textSecondary}]}>
                                ▼
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* ✅ UPDATED: Red Logout Section with Confirmation */}
            <View style={styles.settingsSection}>
                <TouchableOpacity
                    style={[
                        styles.settingItem,
                        styles.logoutButton, // Red styling
                    ]}
                    onPress={handleLogout}
                >
                    <View style={styles.settingLabelContainer}>
                        <Text style={[styles.settingLabel, styles.logoutLabel]}>
                            Logout
                        </Text>
                        <Text style={[styles.settingDescription, styles.logoutDescription]}>
                            Sign out of your account
                        </Text>
                    </View>
                    <Text style={styles.logoutIcon}>
                        →
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Theme Selection Modal */}
            <Modal
                visible={dropdownVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDropdownVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setDropdownVisible(false)}
                >
                    <View style={[
                        styles.modalContent,
                        {
                            backgroundColor: theme.colors.cardBackground,
                            borderColor: theme.colors.border,
                            borderWidth: 1,
                        }
                    ]}>
                        <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                            Select Theme
                        </Text>
                        
                        <View style={styles.modalScrollContainer}>
                            <FlatList
                                data={enabledThemeObjects}
                                keyExtractor={(item) => item.id}
                                showsVerticalScrollIndicator={true}
                                bounces={true}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.themeOption,
                                            {
                                                backgroundColor: item.id === currentThemeId 
                                                    ? theme.colors.accent + '20' 
                                                    : 'transparent',
                                            },
                                            item.id === currentThemeId && styles.selectedThemeOption
                                        ]}
                                        onPress={() => handleThemeSelect(item.id)}
                                    >
                                        <Text style={[
                                            styles.themeOptionText,
                                            {
                                                color: item.id === currentThemeId 
                                                    ? theme.colors.accent 
                                                    : theme.colors.text,
                                                fontWeight: item.id === currentThemeId ? 'bold' : 'normal',
                                            }
                                        ]}>
                                            {item.name}
                                            {item.id === currentThemeId && ' ✓'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

export default SettingsScreen;