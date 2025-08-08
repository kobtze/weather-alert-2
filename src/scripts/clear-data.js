const { pool } = require('../config/database');

async function clearData() {
  try {
    console.log('🔄 Clearing all data from database...');
    
    const connection = await pool.getConnection();
    
    // Disable foreign key checks temporarily
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Truncate tables (this resets auto-increment counters too)
    console.log('🗑️  Clearing alert_status table...');
    await connection.execute('TRUNCATE TABLE alert_status');
    
    console.log('🗑️  Clearing alerts table...');
    await connection.execute('TRUNCATE TABLE alerts');
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    connection.release();
    console.log('✅ All data cleared successfully!');
    console.log('📊 Tables are now empty but structure is preserved.');
    
  } catch (error) {
    console.error('❌ Failed to clear data:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  clearData();
}

module.exports = clearData;
