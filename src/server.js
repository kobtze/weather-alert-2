const express = require('express');
require('dotenv').config();

const { testConnection, initializeDatabase, getDatabaseStatus, pool } = require('./config/database');

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

// POST /api/alerts - Create new alert
app.post('/api/alerts', async (req, res) => {
  try {
    const { lat, lon, parameter, operator, threshold, description } = req.body;
    
    // Validate required fields
    if (!lat || !lon || !parameter || !operator || threshold === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['lat', 'lon', 'parameter', 'operator', 'threshold'],
        received: Object.keys(req.body)
      });
    }
    
    // Validate data types and ranges
    if (typeof lat !== 'number' || lat < -90 || lat > 90) {
      return res.status(400).json({ error: 'Latitude must be a number between -90 and 90' });
    }
    
    if (typeof lon !== 'number' || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Longitude must be a number between -180 and 180' });
    }
    
    if (typeof threshold !== 'number') {
      return res.status(400).json({ error: 'Threshold must be a number' });
    }
    
    const validOperators = ['>', '<', '>=', '<=', '='];
    if (!validOperators.includes(operator)) {
      return res.status(400).json({ 
        error: 'Invalid operator', 
        valid: validOperators 
      });
    }
    
    const connection = await pool.getConnection();
    
    // Insert new alert
    const [result] = await connection.execute(
      'INSERT INTO alerts (lat, lon, parameter, operator, threshold, description) VALUES (?, ?, ?, ?, ?, ?)',
      [lat, lon, parameter, operator, threshold, description || null]
    );
    
    // Create initial alert status entry
    await connection.execute(
      'INSERT INTO alert_status (alert_id, is_triggered) VALUES (?, ?)',
      [result.insertId, false]
    );
    
    connection.release();
    
    // Return the created alert
    const newAlert = {
      id: result.insertId,
      lat,
      lon,
      parameter,
      operator,
      threshold,
      description,
      created_at: new Date().toISOString()
    };
    
    res.status(201).json({
      message: 'Alert created successfully',
      alert: newAlert
    });
    
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      error: 'Failed to create alert',
      message: error.message
    });
  }
});

// GET /api/alerts - Retrieve list of alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Get all alerts with their current status
    const [rows] = await connection.execute(`
      SELECT 
        a.id,
        a.lat,
        a.lon,
        a.parameter,
        a.operator,
        a.threshold,
        a.description,
        a.created_at,
        COALESCE(ast.is_triggered, false) as is_triggered,
        ast.checked_at
      FROM alerts a
      LEFT JOIN alert_status ast ON a.id = ast.alert_id
      ORDER BY a.created_at DESC
    `);
    
    connection.release();
    
    res.json({
      count: rows.length,
      alerts: rows
    });
    
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

// GET /api/alerts/status - Retrieve triggered alerts only
app.get('/api/alerts/status', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Get only triggered alerts with their details
    const [rows] = await connection.execute(`
      SELECT 
        a.id,
        a.lat,
        a.lon,
        a.parameter,
        a.operator,
        a.threshold,
        a.description,
        a.created_at,
        ast.is_triggered,
        ast.checked_at
      FROM alerts a
      INNER JOIN alert_status ast ON a.id = ast.alert_id
      WHERE ast.is_triggered = true
      ORDER BY ast.checked_at DESC
    `);
    
    connection.release();
    
    res.json({
      count: rows.length,
      triggered_alerts: rows,
      message: rows.length === 0 ? 'No alerts are currently triggered' : `${rows.length} alert(s) are currently triggered`
    });
    
  } catch (error) {
    console.error('Error fetching triggered alerts:', error);
    res.status(500).json({
      error: 'Failed to fetch triggered alerts',
      message: error.message
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
