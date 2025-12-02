// Connection health check utility
import { pool } from '../config/database.js';

/**
 * Check database connection health
 * @returns {Promise<{healthy: boolean, message: string}>}
 */
export async function checkDatabaseHealth() {
  try {
    const [result] = await pool.execute('SELECT 1 as health_check');
    if (result && result[0] && result[0].health_check === 1) {
      return { healthy: true, message: 'Database connection is healthy' };
    }
    return { healthy: false, message: 'Database connection check failed' };
  } catch (error) {
    return { healthy: false, message: `Database connection error: ${error.message}` };
  }
}

/**
 * Verify all connections are working
 * @returns {Promise<{database: boolean, message: string}>}
 */
export async function verifyAllConnections() {
  const dbHealth = await checkDatabaseHealth();
  
  return {
    database: dbHealth.healthy,
    message: dbHealth.healthy 
      ? 'All connections are healthy' 
      : `Connection issues: ${dbHealth.message}`
  };
}

