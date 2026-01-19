import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.100:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,     // All requests start with this URL
  timeout: 10000,             // Cancel request if it takes > 10 seconds
  headers: {
    'Content-Type': 'application/json',  // We send/receive JSON
  },
});


// =============================================================================
// REQUEST INTERCEPTOR - RUNS BEFORE EVERY REQUEST
// =============================================================================

// What is an interceptor?
// Think of it like TSA at an airport - it checks/modifies every request 
// before it leaves your app

apiClient.interceptors.request.use(
  // This function runs BEFORE every HTTP request
  async (config) => {
    // config is the request configuration object
    // It contains: URL, method (GET/POST), headers, body, etc.
    
    console.log(`📤 Making request to: ${config.url}`);
    
    // Try to get JWT token from AsyncStorage
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      
      // If we have a token, attach it to the request
      if (token) {
        // Add Authorization header with Bearer token
        config.headers.Authorization = `Bearer ${token}`;
        
        console.log('🔐 Token attached to request');
      } else {
        console.log('⚠️ No token found - request will be unauthenticated');
      }
      
    } catch (error) {
      // If AsyncStorage fails, log error but continue with request
      console.error('Failed to retrieve token from storage:', error);
    }
    
    // IMPORTANT: We must return the config object
    // This modified config is what actually gets sent to the server
    return config;
  },
  
  // This function runs if there's an error setting up the request
  // (rare - usually network is down before request even starts)
  (error) => {
    console.error('❌ Request setup failed:', error);
    // Reject the promise so the calling code can handle it
    return Promise.reject(error);
  }
);

// =============================================================================
// RESPONSE INTERCEPTOR - RUNS AFTER EVERY RESPONSE
// =============================================================================

// What is a response interceptor?
// Think of it like customs when you return from a trip - it checks everything
// coming back before you can use it

apiClient.interceptors.response.use(
  // This function runs when the request SUCCEEDS (status 200-299)
  (response) => {
    // response object contains:
    // - response.data: The actual data from the server
    // - response.status: HTTP status code (200, 201, etc.)
    // - response.headers: Response headers
    // - response.config: The original request config
    
    console.log(`✅ Response received from: ${response.config.url}`);
    console.log(`📊 Status: ${response.status}`);
    
    // Simply return the response so calling code can use it
    // We're not modifying anything here, just logging
    return response;
  },
  
  // This function runs when the request FAILS (status 400+, or network error)
  async (error) => {
    // error.response exists if server responded with error status (400, 401, 500, etc.)
    // error.response is undefined if network failed (no internet, server down)
    
    console.error('❌ Request failed');
    
    // Check if we got a response from the server
    if (error.response) {
      // Server responded with an error status code
      const status = error.response.status;
      const errorMessage = error.response.data?.error || 'Unknown error';
      
      console.error(`Status: ${status}`);
      console.error(`Message: ${errorMessage}`);
      
      // Handle specific error codes
      switch (status) {
        case 401:
          // 401 = Unauthorized (invalid or expired token)
          console.error('🔒 Authentication failed - token may be expired');
          
          // Clear the invalid token from storage
          try {
            await AsyncStorage.removeItem('jwt_token');
            console.log('🗑️ Cleared invalid token from storage');
          } catch (storageError) {
            console.error('Failed to clear token:', storageError);
          }
          
          // TODO: In the future, we'll dispatch a Redux action here to:
          // - Update auth state to logged out
          // - Navigate to login screen
          // For now, we just log it
          
          break;
          
        case 403:
          // 403 = Forbidden (authenticated but not allowed)
          console.error('🚫 Access forbidden - you do not have permission');
          break;
          
        case 404:
          // 404 = Not Found (endpoint doesn't exist)
          console.error('🔍 Resource not found');
          break;
          
        case 500:
          // 500 = Internal Server Error (backend crashed)
          console.error('💥 Server error - backend may be down');
          break;
          
        default:
          console.error(`⚠️ Error ${status}: ${errorMessage}`);
      }
      
    } else if (error.request) {
      // Request was made but no response received
      // This usually means network is down or backend is not running
      console.error('📡 No response from server - check your connection');
      console.error('Is your backend running? Can you ping the server?');
      
    } else {
      // Something happened in setting up the request
      console.error('⚙️ Request setup error:', error.message);
    }
    
    // IMPORTANT: Reject the promise so calling code knows it failed
    // This allows the calling code to use try/catch
    return Promise.reject(error);
  }
);

