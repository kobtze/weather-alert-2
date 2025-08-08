const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection, initializeDatabase, getDatabaseStatus, pool } = require('./config/database');
const scheduler = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
    
    // Check current alert count (limit to 3 alerts)
    const [countRows] = await connection.execute('SELECT COUNT(*) as count FROM alerts');
    const currentCount = countRows[0].count;
    
    if (currentCount >= 3) {
      connection.release();
      return res.status(429).json({
        error: 'Maximum alert limit reached',
        message: 'You can only have up to 3 alerts. Please delete an existing alert first.',
        current_count: currentCount,
        max_allowed: 3
      });
    }
    
    // Insert new alert
    const [result] = await connection.execute(
      'INSERT INTO alerts (lat, lon, parameter, operator, threshold, description) VALUES (?, ?, ?, ?, ?, ?)',
      [lat, lon, parameter, operator, threshold, description || null]
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
        s.is_triggered,
        s.current_value,
        s.checked_at
      FROM alerts a
      LEFT JOIN alert_status s
        ON s.alert_id = a.id
      WHERE s.checked_at = (
        SELECT MAX(s2.checked_at)
        FROM alert_status s2
        WHERE s2.alert_id = a.id
      ) OR s.checked_at IS NULL
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

// DELETE /api/alerts/:id - Delete an alert
app.delete('/api/alerts/:id', async (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    
    // Validate alert ID
    if (isNaN(alertId) || alertId <= 0) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }
    
    const connection = await pool.getConnection();
    
    // Check if alert exists
    const [alertRows] = await connection.execute(
      'SELECT id, description FROM alerts WHERE id = ?',
      [alertId]
    );
    
    if (alertRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // Delete the alert (cascade will handle alert_status deletion)
    await connection.execute('DELETE FROM alerts WHERE id = ?', [alertId]);
    
    connection.release();
    
    res.json({
      message: 'Alert deleted successfully',
      alert_id: alertId,
      description: alertRows[0].description
    });
    
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      error: 'Failed to delete alert',
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

// PUT /api/alerts/:id/status - Update alert status
app.put('/api/alerts/:id/status', async (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    const { is_triggered, checked_at, current_value } = req.body;
    
    // Validate alert ID
    if (isNaN(alertId) || alertId <= 0) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }
    
    // Validate required fields
    if (typeof is_triggered !== 'boolean') {
      return res.status(400).json({ error: 'is_triggered must be a boolean' });
    }
    if (typeof current_value !== 'number') {
      return res.status(400).json({ error: 'current_value must be a number' });
    }
    
    const connection = await pool.getConnection();
    
    // Check if alert exists
    const [alertRows] = await connection.execute(
      'SELECT id FROM alerts WHERE id = ?',
      [alertId]
    );
    
    if (alertRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // Update or insert alert status
    const checkedAt = checked_at || new Date();
    
    // Convert to MySQL datetime format (YYYY-MM-DD HH:MM:SS) in local timezone
    const mysqlDateTime = checkedAt instanceof Date 
      ? new Date(checkedAt.getTime() - (checkedAt.getTimezoneOffset() * 60000)).toISOString().slice(0, 19).replace('T', ' ')
      : new Date(new Date(checkedAt).getTime() - (new Date(checkedAt).getTimezoneOffset() * 60000)).toISOString().slice(0, 19).replace('T', ' ');
    
    await connection.execute(`
      INSERT INTO alert_status (alert_id, is_triggered, checked_at, current_value) 
      VALUES (?, ?, ?, ?)
    `, [alertId, is_triggered, mysqlDateTime, current_value]);
    
    connection.release();
    
    res.json({
      message: 'Alert status updated successfully',
      alert_id: alertId,
      is_triggered,
      checked_at: checkedAt
    });
    
  } catch (error) {
    console.error('Error updating alert status:', error);
    res.status(500).json({
      error: 'Failed to update alert status',
      message: error.message
    });
  }
});

// POST /api/alerts/evaluate - Manually trigger alert evaluation
app.post('/api/alerts/evaluate', async (req, res) => {
  try {
    const alertEvaluator = require('./services/alertEvaluator');
    const results = await alertEvaluator.evaluateAllAlerts();
    
    res.json({
      message: 'Alert evaluation completed',
      results: results || []
    });
    
  } catch (error) {
    console.error('Error in manual alert evaluation:', error);
    res.status(500).json({
      error: 'Failed to evaluate alerts',
      message: error.message
    });
  }
});

// GET /api/weather - Fetch weather data for a location
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    // Validate required parameters
    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['lat', 'lon']
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    // Validate coordinates
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: 'Invalid latitude' });
    }
    
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid longitude' });
    }
    
    const weatherService = require('./services/weather');
    
    if (!weatherService.isConfigured()) {
      return res.status(503).json({
        error: 'Weather service not configured',
        message: 'Please set TOMORROW_API_KEY environment variable'
      });
    }
    
    const weatherData = await weatherService.getCurrentWeather(latitude, longitude);
    
    res.json({
      location: { lat: latitude, lon: longitude },
      weather: weatherData
    });
    
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({
      error: 'Failed to fetch weather data',
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
    
    // Start the alert evaluation scheduler
    console.log('⏰ Starting alert evaluation scheduler...');
    scheduler.startScheduler();
  } else {
    console.log('⚠️  Database connection failed. Some features may not work.');
  }
});

module.exports = app;
