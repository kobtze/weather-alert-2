const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabase() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: process.env.DB_CHARSET || 'utf8mb4'
  };

  try {
    console.log('🔄 Starting database reset...');
    
    // Connect without specifying database
    const connection = await mysql.createConnection(dbConfig);
    
    // Drop database if exists
    console.log('🗑️  Dropping database...');
    await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME || 'weather_alerts'}`);
    
    // Create fresh database
    console.log('📦 Creating fresh database...');
    await connection.query(`CREATE DATABASE ${process.env.DB_NAME || 'weather_alerts'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    // Use the database
    await connection.query(`USE ${process.env.DB_NAME || 'weather_alerts'}`);
    
    // Create alerts table
    console.log('📋 Creating alerts table...');
    await connection.execute(`
      CREATE TABLE alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lat DECIMAL(10, 6) NOT NULL,
        lon DECIMAL(11, 6) NOT NULL,
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
    console.log('📋 Creating alert_status table...');
    await connection.execute(`
      CREATE TABLE alert_status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        alert_id INT NOT NULL,
        is_triggered BOOLEAN DEFAULT FALSE,
        checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        current_value DECIMAL(10, 2) NOT NULL,
        INDEX idx_checked_at (checked_at),
        FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
        INDEX idx_alert_id (alert_id),
        INDEX idx_triggered (is_triggered)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await connection.end();
    console.log('✅ Database reset completed successfully!');
    console.log('📊 Database is now empty and ready for use.');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  resetDatabase();
}

module.exports = resetDatabase;
