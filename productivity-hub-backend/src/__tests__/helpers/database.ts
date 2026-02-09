import { pool } from '../../db/connection';

/**
 * Clear all data from database tables
 * Used before/after each test to ensure clean slate
 */
export async function clearDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete in reverse order of dependencies (foreign keys)
    // Based on actual schema from \dt command
    await client.query('DELETE FROM scheduled_items');
    await client.query('DELETE FROM actual_days');
    await client.query('DELETE FROM day_templates');
    await client.query('DELETE FROM planner_items');
    await client.query('DELETE FROM user_enabled_plugins');  // Correct name!
    await client.query('DELETE FROM user_preferences');
    await client.query('DELETE FROM users');
    // Note: schema_migrations is NOT cleared - we want to keep migration tracking
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database connection pool
 * Called after all tests complete
 */
export async function closeDatabase() {
  await pool.end();
}