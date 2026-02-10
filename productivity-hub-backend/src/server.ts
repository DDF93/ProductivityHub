// src/server.ts
// Purpose: Start the HTTP server (production entry point)
// Used by: npm start, PM2 in production

import app from './app';

// Server configuration
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

// Start server
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