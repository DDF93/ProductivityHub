import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import pluginReducer from './slices/pluginSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    plugins: pluginReducer,
    // Future-proofed for additional slices:
    // plugins: pluginReducer,
    // user: userReducer,
    // workoutTracker: workoutTrackerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
