import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TabNavigationProp } from '../types/NavigationTypes';
import { useAppSelector } from '../hooks/redux';

const styles = StyleSheet.create({
    welcomeContainer: {
        padding: 20,
        alignItems: 'center',
        flex: 1, 
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    descriptionText: {
        fontSize: 16,
        marginTop: 10,
    }
});

type HomeScreenProps = {
    navigation: TabNavigationProp;
};

            function HomeScreen({ navigation }: HomeScreenProps) {
                const theme = useAppSelector(state => state.theme.currentTheme);
    return (
        <View style={[styles.welcomeContainer, {backgroundColor: theme.colors.background}]}>
            <Text style={[styles.welcomeText, {color: theme.colors.text}]}>Welcome to Productivity Hub</Text>
            <Text style={[styles.descriptionText, {color: theme.colors.textSecondary}]}>This HUB is essentially a collection of all tools I use in my daily life</Text>
        </View>
    );
}

export default HomeScreen;