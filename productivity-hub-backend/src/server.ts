// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import route handlers
import authRoutes from './routes/auth';
import userPreferencesRoutes from './routes/userPreferences';  // ✅ Already imported

// Import middleware
import { authenticateToken } from './middleware/auth';

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

// ✅ REMOVE these placeholder routes - they're already in userPreferencesRoutes
// app.get('/api/user/profile', authenticateToken, ...);
// app.get('/api/user/enabled-plugins', authenticateToken, ...);
// app.get('/api/user/enabled-themes', authenticateToken, ...);
// app.get('/api/user/current-theme', authenticateToken, ...);

// ✅ USE the actual userPreferences routes instead
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

app.listen(PORT, HOST, () => {
  console.log(`🚀 ProductivityHub API running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📱 Network: http://192.168.1.109:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Authentication endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/verify-email?token=...`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`🛡️  Protected endpoints (require Bearer token):`);
  console.log(`   GET  http://localhost:${PORT}/api/user/preferences`);
  console.log(`   PUT  http://localhost:${PORT}/api/user/current-theme`);
  console.log(`   POST http://localhost:${PORT}/api/user/enabled-themes`);
  console.log(`   DELETE http://localhost:${PORT}/api/user/enabled-themes/:themeId`);
});

export default app;