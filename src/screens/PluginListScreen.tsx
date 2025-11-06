import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { TabNavigationProp } from '../types/NavigationTypes';
import { useAppSelector, useAppDispatch } from '../hooks/redux';

// Theme management imports
import { enableTheme, disableTheme, saveEnabledThemesToStorage } from '../store/slices/themeSlice';
import { canDisableTheme, isThemeEnabled } from '../utils/themeUtils';

// Plugin management imports
import { 
  enablePlugin, 
  disablePlugin, 
  saveEnabledPluginsToStorage,
  loadEnabledPluginsFromStorage 
} from '../store/slices/pluginSlice';
import { PluginItem } from '../types/PluginTypes';

const styles = StyleSheet.create({
    // Main screen styles
    pluginContainer: {
        flex: 1,
        padding: 20,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 8,         // Reduced from 15
    },
    pluginTitle: {
        fontSize: 22,            // Reduced from 28
        fontWeight: 'bold',
        marginBottom: 4,         // Reduced from 8
    },
    pluginDescription: {
        fontSize: 14,            // Reduced from 16
        textAlign: 'center',
        marginBottom: 10,        // Reduced from 20
        opacity: 0.7,            // Make it more subtle
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        marginTop: 10,           // Reduced from 20
    },
    
    // Plugin launcher styles
    pluginGrid: {
        flex: 1,
    },
    pluginItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 2,
        marginVertical: 8,
    },
    pluginIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    pluginIconText: {
        fontSize: 24,
    },
    pluginInfo: {
        flex: 1,
    },
    pluginName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    pluginStatus: {
        fontSize: 14,
        opacity: 0.8,
    },
    
    // Management buttons
    managementSection: {
        marginTop: 15,           // Reduced from 20
        flexDirection: 'row',    // Side-by-side layout
        gap: 12,                 // Space between buttons
    },
    managementButton: {
        flex: 1,                 // Each button takes 50% width
        paddingVertical: 12,     // Reduced from 16
        paddingHorizontal: 16,   // Reduced from 24
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    managementButtonText: {
        fontSize: 16,            // Reduced from 18
        fontWeight: '600',
        marginLeft: 8,
        textAlign: 'center',     // Center text in smaller buttons
    },
    
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    
    // Theme/Plugin management styles
    themeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        marginVertical: 6,
    },
    themeItemInfo: {
        flex: 1,
        marginRight: 16,
    },
    themeItemName: {
        fontSize: 18,
        fontWeight: '500',
    },
    themeItemDescription: {
        fontSize: 14,
        marginTop: 4,
        opacity: 0.8,
    },
    enableButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    enableButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    protectedBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginRight: 12,
    },
    protectedText: {
        fontSize: 12,
        fontWeight: '500',
    },
});

type PluginListScreenProps = {
    navigation: TabNavigationProp;
};

function PluginListScreen({ navigation }: PluginListScreenProps) {
    // Theme state (existing)
    const theme = useAppSelector(state => state.theme.currentTheme);
    const availableThemes = useAppSelector(state => state.theme.availableThemes);
    const enabledThemes = useAppSelector(state => state.theme.enabledThemes);
    
    // Plugin state from Redux
    const availablePlugins = useAppSelector(state => state.plugins.availablePlugins);
    const enabledPluginIds = useAppSelector(state => state.plugins.enabledPluginIds);
    const pluginLoading = useAppSelector(state => state.plugins.isLoading);
    const pluginError = useAppSelector(state => state.plugins.error);
    
    const dispatch = useAppDispatch();

    // Modal state
    const [themeManagementVisible, setThemeManagementVisible] = useState(false);
    const [pluginManagementVisible, setPluginManagementVisible] = useState(false);

    // Load enabled plugins on component mount
    useEffect(() => {
        dispatch(loadEnabledPluginsFromStorage());
    }, [dispatch]);

    // Get enabled plugin objects (convert IDs to full objects)
    const enabledPlugins = availablePlugins.filter(plugin => 
        enabledPluginIds.includes(plugin.id)
    );

    // Plugin toggle handler
    const handlePluginToggle = (pluginId: string, currentlyEnabled: boolean) => {
        if (currentlyEnabled) {
            const pluginName = availablePlugins.find(p => p.id === pluginId)?.name;
            
            Alert.alert(
                `Disable ${pluginName}?`,
                "This will remove the plugin from your active plugins.\n\nYou can re-enable it anytime from this screen.",
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Disable", 
                        style: "destructive",
                        onPress: () => {
                            dispatch(disablePlugin(pluginId));
                            const updatedEnabledPlugins = enabledPluginIds.filter(id => id !== pluginId);
                            dispatch(saveEnabledPluginsToStorage(updatedEnabledPlugins));
                        }
                    }
                ]
            );
        } else {
            // Enable immediately
            dispatch(enablePlugin(pluginId));
            const updatedEnabledPlugins = [...enabledPluginIds, pluginId];
            dispatch(saveEnabledPluginsToStorage(updatedEnabledPlugins));
        }
    };

    // Theme toggle handler (existing)
    const handleThemeToggle = (themeId: string, currentlyEnabled: boolean) => {
        if (currentlyEnabled) {
            const themeName = availableThemes.find(t => t.id === themeId)?.name;
            
            Alert.alert(
                `Disable ${themeName}?`,
                "This will remove theme data to save storage space.\n\nYou can re-enable and redownload it anytime from this screen.",
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Disable", 
                        style: "destructive",
                        onPress: () => {
                            dispatch(disableTheme(themeId));
                            const updatedEnabledThemes = enabledThemes.filter(id => id !== themeId);
                            dispatch(saveEnabledThemesToStorage(updatedEnabledThemes));
                        }
                    }
                ]
            );
        } else {
            dispatch(enableTheme(themeId));
            const updatedEnabledThemes = [...enabledThemes, themeId];
            dispatch(saveEnabledThemesToStorage(updatedEnabledThemes));
        }
    };

    // Helper function to check if plugin is enabled
    const isPluginEnabled = (pluginId: string) => {
        return enabledPluginIds.includes(pluginId);
    };

    // Theme helper functions (existing)
    const getThemeIcon = (themeId: string) => {
        switch (themeId) {
            case 'light-default': return '☀️';
            case 'dark-default': return '🌙';
            case 'colorblind-default': return '🔵';
            case 'high-contrast': return '⚡';
            case 'grayscale-default': return '⚫';
            default: return '🎨';
        }
    };

    const getThemeDescription = (themeId: string) => {
        switch (themeId) {
            case 'light-default': return 'Bright and clean interface';
            case 'dark-default': return 'Easy on the eyes';
            case 'colorblind-default': return 'Optimized for color vision';
            case 'high-contrast': return 'Maximum readability';
            case 'grayscale-default': return 'Distraction-free focus';
            default: return 'Theme option';
        }
    };

    return (
        <View style={[styles.pluginContainer, {backgroundColor: theme.colors.background}]}>
            {/* Header Section - Reduced size */}
            <View style={styles.headerSection}>
                <Text style={[styles.pluginDescription, {color: theme.colors.textSecondary}]}>
                    Launch plugins and manage themes
                </Text>
            </View>

            <ScrollView style={styles.pluginGrid} showsVerticalScrollIndicator={false}>
                {/* Active Plugins Section */}
                <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
                    🚀 Active Plugins
                </Text>
                
                {enabledPlugins.length === 0 ? (
                    <View style={[
                        styles.pluginItem,
                        {
                            backgroundColor: theme.colors.cardBackground,
                            borderColor: theme.colors.border,
                            opacity: 0.6,
                        }
                    ]}>
                        <View style={[
                            styles.pluginIcon,
                            {backgroundColor: theme.colors.accent + '20'}
                        ]}>
                            <Text style={styles.pluginIconText}>🔧</Text>
                        </View>
                        <View style={styles.pluginInfo}>
                            <Text style={[styles.pluginName, {color: theme.colors.text}]}>
                                No Plugins Enabled
                            </Text>
                            <Text style={[styles.pluginStatus, {color: theme.colors.textSecondary}]}>
                                Enable plugins below to get started
                            </Text>
                        </View>
                    </View>
                ) : (
                    enabledPlugins.map((plugin) => (
                        <TouchableOpacity
                            key={plugin.id}
                            style={[
                                styles.pluginItem,
                                {
                                    backgroundColor: theme.colors.cardBackground,
                                    borderColor: theme.colors.accent,
                                }
                            ]}
                            onPress={() => {
                                // TODO: Launch plugin when you build actual plugins
                                console.log(`Launching plugin: ${plugin.name}`);
                            }}
                        >
                            <View style={[
                                styles.pluginIcon,
                                {backgroundColor: theme.colors.accent + '20'}
                            ]}>
                                <Text style={styles.pluginIconText}>{plugin.icon}</Text>
                            </View>
                            <View style={styles.pluginInfo}>
                                <Text style={[styles.pluginName, {color: theme.colors.text}]}>
                                    {plugin.name}
                                </Text>
                                <Text style={[styles.pluginStatus, {color: theme.colors.textSecondary}]}>
                                    {plugin.description}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Management Section */}
            <View style={styles.managementSection}>
                {/* Theme Management Button */}
                <TouchableOpacity
                    style={[
                        styles.managementButton,
                        {
                            backgroundColor: 'transparent',
                            borderColor: theme.colors.accent,
                        }
                    ]}
                    onPress={() => setThemeManagementVisible(true)}
                >
                    <Text style={styles.pluginIconText}>🎨</Text>
                    <Text style={[styles.managementButtonText, {color: theme.colors.accent}]}>
                        Themes ({enabledThemes.length}/{availableThemes.length})
                    </Text>
                </TouchableOpacity>

                {/* Plugin Management Button */}
                <TouchableOpacity
                    style={[
                        styles.managementButton,
                        {
                            backgroundColor: 'transparent',
                            borderColor: theme.colors.accent,
                        }
                    ]}
                    onPress={() => setPluginManagementVisible(true)}
                >
                    <Text style={styles.pluginIconText}>🔧</Text>
                    <Text style={[styles.managementButtonText, {color: theme.colors.accent}]}>
                        Plugins ({enabledPluginIds.length}/{availablePlugins.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Theme Management Modal */}
            <Modal
                visible={themeManagementVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setThemeManagementVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[
                        styles.modalContent,
                        {backgroundColor: theme.colors.background}
                    ]}>
                        <View style={[
                            styles.modalHeader,
                            {borderBottomColor: theme.colors.border}
                        ]}>
                            <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                                Manage Themes
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setThemeManagementVisible(false)}
                            >
                                <Text style={[styles.closeButtonText, {color: theme.colors.accent}]}>
                                    Done
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {availableThemes.map((themeItem) => {
                                const themeEnabled = isThemeEnabled(themeItem.id, enabledThemes);
                                const themeProtected = !canDisableTheme(themeItem.id);
                                
                                return (
                                    <View
                                        key={themeItem.id}
                                        style={[
                                            styles.themeItem,
                                            {
                                                backgroundColor: theme.colors.cardBackground,
                                                borderColor: theme.colors.border,
                                            }
                                        ]}
                                    >
                                        <View style={styles.themeItemInfo}>
                                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                <Text style={styles.pluginIconText}>
                                                    {getThemeIcon(themeItem.id)}
                                                </Text>
                                                <Text style={[
                                                    styles.themeItemName, 
                                                    {color: theme.colors.text, marginLeft: 12}
                                                ]}>
                                                    {themeItem.name}
                                                </Text>
                                                {themeProtected && (
                                                    <View style={[
                                                        styles.protectedBadge,
                                                        {backgroundColor: theme.colors.accent + '20'}
                                                    ]}>
                                                        <Text style={[
                                                            styles.protectedText,
                                                            {color: theme.colors.accent}
                                                        ]}>
                                                            Core
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[
                                                styles.themeItemDescription,
                                                {color: theme.colors.textSecondary}
                                            ]}>
                                                {getThemeDescription(themeItem.id)}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[
                                                styles.enableButton,
                                                {
                                                    backgroundColor: themeEnabled 
                                                        ? theme.colors.accent + '20' 
                                                        : 'transparent',
                                                    borderColor: themeEnabled 
                                                        ? theme.colors.accent 
                                                        : theme.colors.border,
                                                }
                                            ]}
                                            onPress={() => handleThemeToggle(themeItem.id, themeEnabled)}
                                            disabled={themeProtected && themeEnabled}
                                        >
                                            <Text style={[
                                                styles.enableButtonText,
                                                {
                                                    color: themeEnabled 
                                                        ? theme.colors.accent 
                                                        : theme.colors.textSecondary
                                                }
                                            ]}>
                                                {themeEnabled ? 'Enabled' : 'Enable'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Plugin Management Modal */}
            <Modal
                visible={pluginManagementVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setPluginManagementVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[
                        styles.modalContent,
                        {backgroundColor: theme.colors.background}
                    ]}>
                        <View style={[
                            styles.modalHeader,
                            {borderBottomColor: theme.colors.border}
                        ]}>
                            <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                                Manage Plugins
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setPluginManagementVisible(false)}
                            >
                                <Text style={[styles.closeButtonText, {color: theme.colors.accent}]}>
                                    Done
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {availablePlugins.map((plugin) => {
                                const pluginEnabled = isPluginEnabled(plugin.id);
                                
                                return (
                                    <View
                                        key={plugin.id}
                                        style={[
                                            styles.themeItem,
                                            {
                                                backgroundColor: theme.colors.cardBackground,
                                                borderColor: theme.colors.border,
                                            }
                                        ]}
                                    >
                                        <View style={styles.themeItemInfo}>
                                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                <Text style={styles.pluginIconText}>
                                                    {plugin.icon}
                                                </Text>
                                                <Text style={[
                                                    styles.themeItemName, 
                                                    {color: theme.colors.text, marginLeft: 12}
                                                ]}>
                                                    {plugin.name}
                                                </Text>
                                            </View>
                                            <Text style={[
                                                styles.themeItemDescription,
                                                {color: theme.colors.textSecondary}
                                            ]}>
                                                {plugin.description}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[
                                                styles.enableButton,
                                                {
                                                    backgroundColor: pluginEnabled 
                                                        ? theme.colors.accent + '20' 
                                                        : 'transparent',
                                                    borderColor: pluginEnabled 
                                                        ? theme.colors.accent 
                                                        : theme.colors.border,
                                                }
                                            ]}
                                            onPress={() => handlePluginToggle(plugin.id, pluginEnabled)}
                                        >
                                            <Text style={[
                                                styles.enableButtonText,
                                                {
                                                    color: pluginEnabled 
                                                        ? theme.colors.accent 
                                                        : theme.colors.textSecondary
                                                }
                                            ]}>
                                                {pluginEnabled ? 'Enabled' : 'Enable'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

export default PluginListScreen;