// src/server.ts
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

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';


// Middleware
app.use(cors());
app.use(express.json());

// Public routes
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

// Authentication routes (public)
app.use('/api/auth', authRoutes);

// Protected routes - require authentication
app.get('/api/user/profile', authenticateToken, (req, res) => {
  // req.user is available here because of authenticateToken middleware
  res.json({
    message: 'Profile retrieved successfully',
    user: req.user
  });
});

app.get('/api/user/enabled-plugins', authenticateToken, (req, res) => {
  // TODO: Get user's actual enabled plugins from database
  res.json({
    userId: req.user!.id,
    enabledPlugins: ['workout-tracker', 'nutrition-logger']
  });
});

app.get('/api/user/enabled-themes', authenticateToken, (req, res) => {
  // TODO: Get user's actual enabled themes from database
  res.json({
    userId: req.user!.id,
    enabledThemes: ['light-default', 'dark-default']
  });
});

app.get('/api/user/current-theme', authenticateToken, (req, res) => {
  // TODO: Get user's actual current theme from database
  res.json({
    userId: req.user!.id,
    currentTheme: 'light-default'
  });
});

// Example: Update user profile (protected POST route)
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Name is required'
      });
    }

    // TODO: Update user in database
    // For now, return success with updated user data
    res.json({
      message: 'Profile updated successfully',
      user: {
        ...req.user!,
        name: name.trim()
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

app.use('/api/user', userPreferencesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server


app.listen(PORT, HOST, () => {  // ADD HOST parameter
  console.log(`🚀 ProductivityHub API running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📱 Network: http://YOUR_COMPUTER_IP:${PORT}`);  // Replace with your IP
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Authentication endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/verify-email?token=...`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`🛡️  Protected endpoints (require Bearer token):`);
  console.log(`   GET  http://localhost:${PORT}/api/user/profile`);
  console.log(`   PUT  http://localhost:${PORT}/api/user/profile`);
  console.log(`   GET  http://localhost:${PORT}/api/user/preferences`);
});

export default app;