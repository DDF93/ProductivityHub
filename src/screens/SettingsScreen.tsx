import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, FlatList, Dimensions } from 'react-native';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
import { TabNavigationProp } from '../types/NavigationTypes';
import { useAppSelector, useAppDispatch } from '../hooks/redux';

import { 
  setTheme,                    // Still used for immediate UI update
  saveCurrentThemeToAPI,       // NEW: Replaces saveThemeToStorage
  clearThemeError 
} from '../store/slices/themeSlice';

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
            dispatch(setTheme(themeId));
            try {
                await dispatch(saveCurrentThemeToAPI(themeId)).unwrap();
                
                
                console.log(`✅ Theme ${themeId} saved to server successfully`);
                
            } catch (error) {
                console.error('❌ Failed to sync theme to server:', error);
                
            }
            
        }
    };

    const handleErrorDismiss = () => {
        dispatch(clearThemeError());
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
                
                {/* Error message display */}
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
                        {/* Loading indicator shows when saving to API */}
                        {isLoading && (
                            <ActivityIndicator 
                                size="small" 
                                color={theme.colors.accent} 
                                style={styles.loadingIndicator}
                            />
                        )}
                        
                        {/* Theme dropdown button */}
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

            {/* Theme selection modal */}
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