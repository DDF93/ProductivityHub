import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { register, clearError } from '../store/slices/authSlice';

import { 
  validatePassword, 
  getPasswordRequirementsMessage 
} from '../utils/passwordValidation';

// ✅ FIXED - All on one line
type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

type RegisterScreenProps = {
  navigation: RegisterScreenNavigationProp;
};

function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  
  const dispatch = useAppDispatch();
  
  // ✅ FIXED - Added explicit type annotation
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const theme = useAppSelector((state) => state.theme.currentTheme);
  
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    
    if (value.length >= 3) {
      const result = validatePassword(value);
      setPasswordErrors(result.errors);
    } else {
      setPasswordErrors([]);
    }
  };
  
  const handleRegister = async () => {
    dispatch(clearError());
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert(
        'Password Requirements Not Met',
        getPasswordRequirementsMessage(),
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      await dispatch(register({ name, email, password })).unwrap();
      
      console.log('Registration successful');
      
      Alert.alert(
        'Check Your Email',
        'We sent you a verification email. Please click the link in the email to verify your account, then come back to log in.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Registration failed:', error);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            ProductivityHub
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Create your account
          </Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => dispatch(clearError())}>
                <Text style={[styles.errorDismiss, { color: theme.colors.accent }]}>
                  Dismiss
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }
              ]}
              placeholder="Enter your full name"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              editable={!isLoading}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Email
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }
              ]}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Password
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: passwordErrors.length > 0 
                    ? '#FF6B6B' 
                    : theme.colors.border,
                  color: theme.colors.text,
                }
              ]}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={true}
              autoComplete="password"
              editable={!isLoading}
            />
            
            <Text style={[styles.passwordHint, { color: theme.colors.textSecondary }]}>
              At least 8 characters with uppercase, lowercase, number, and special character
            </Text>
            
            {passwordErrors.length > 0 && password.length >= 3 && (
              <View style={styles.passwordErrorsContainer}>
                {passwordErrors.map((error, index) => (
                  <Text 
                    key={index} 
                    style={styles.passwordErrorText}
                  >
                    • {error}
                  </Text>
                ))}
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.registerButton,
              {
                backgroundColor: theme.colors.accent,
                opacity: isLoading ? 0.7 : 1,
              }
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>
              Already have an account?
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
            >
              <Text style={[styles.loginLink, { color: theme.colors.accent }]}>
                {' '}Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    flex: 1,
  },
  errorDismiss: {
    fontWeight: '600',
    marginLeft: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  passwordHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  passwordErrorsContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 6,
  },
  passwordErrorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 2,
  },
  registerButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;