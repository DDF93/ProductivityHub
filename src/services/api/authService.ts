import apiClient, { tokenManager } from './apiClient';
import { API_ENDPOINTS } from '../../config/api';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface EmailVerificationResponse {
  message: string;
  user: User;
  token?: string;
}

export const authService = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );
    return response.data;
  },
  
  verifyEmail: async (token: string): Promise<EmailVerificationResponse> => {
    const response = await apiClient.get<EmailVerificationResponse>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      { params: { token } }
    );
    
    if (response.data.token) {
      await tokenManager.saveToken(response.data.token);
    }
    
    return response.data;
  },
  
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    
    await tokenManager.saveToken(response.data.token);
    
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    await tokenManager.removeToken();
  },
  
  isAuthenticated: async (): Promise<boolean> => {
    return await tokenManager.hasToken();
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<{ user: User }>(
      API_ENDPOINTS.USER.PROFILE
    );
    return response.data.user;
  },
};