const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'weather_alerts',
  charset: process.env.DB_CHARSET || 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Initialize database schema
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create alerts table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lat DECIMAL(10, 8) NOT NULL,
        lon DECIMAL(11, 8) NOT NULL,
        parameter VARCHAR(50) NOT NULL,
        operator ENUM('>', '<', '>=', '<=', '=') NOT NULL,
        threshold DECIMAL(10, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_location (lat, lon),
        INDEX idx_parameter (parameter)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create alert_status table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS alert_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        alert_id INT NOT NULL,
        is_triggered BOOLEAN DEFAULT FALSE,
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_checked_at (checked_at),
        FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
        UNIQUE KEY unique_alert_status (alert_id),
        INDEX idx_alert_id (alert_id),
        INDEX idx_triggered (is_triggered)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Database schema initialized successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database schema initialization failed:', error.message);
    return false;
  }
}

// Get database status
async function getDatabaseStatus() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT 1 as status');
    connection.release();
    return { status: 'connected', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'disconnected', error: error.message, timestamp: new Date().toISOString() };
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  getDatabaseStatus
};
