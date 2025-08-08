const express = require('express');
require('dotenv').config();

const { testConnection, initializeDatabase, getDatabaseStatus } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello World!',
    timestamp: new Date().toISOString(),
    service: 'Weather Alert System API'
  });
});

// Health check endpoint (includes database status)
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await getDatabaseStatus();
    res.json({ 
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  
  // Initialize database connection and schema
  console.log('🔌 Connecting to database...');
  const dbConnected = await testConnection();
  
  if (dbConnected) {
    console.log('📋 Initializing database schema...');
    await initializeDatabase();
  } else {
    console.log('⚠️  Database connection failed. Some features may not work.');
  }
});

module.exports = app;
