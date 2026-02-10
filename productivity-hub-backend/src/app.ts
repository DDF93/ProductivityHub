// src/app.ts
// Purpose: Configure Express app (routes, middleware, error handlers)
// Used by: server.ts (production), tests (testing)

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import route handlers
import authRoutes from './routes/auth';
import userPreferencesRoutes from './routes/userPreferences';

// Import middleware
import { authenticateToken } from './middleware/auth';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());

// ============================================
// PUBLIC ROUTES
// ============================================
app.get('/', (req, res) => {
  res.json({ 
    message: 'ProductivityHub API is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime()
  });
});

// ============================================
// API ROUTES
// ============================================

// Authentication routes (public)
app.use('/api/auth', authRoutes);

// User preferences routes (protected)
app.use('/api/user', userPreferencesRoutes);

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler (must come after all routes)
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Global error handler (must come last)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// ============================================
// EXPORT
// ============================================
// Export configured app (no server.listen here!)
// This allows:
// - Tests to import app without starting a server
// - server.ts to import and start the server
// - Other environments (serverless, workers) to use the app
export default app;