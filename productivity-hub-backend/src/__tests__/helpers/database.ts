import { pool } from '../../db/connection';

export async function clearDatabase() {
  // Delete in correct order to respect foreign key constraints
  // Children first, then parents
  await pool.query('DELETE FROM user_enabled_plugins');
  await pool.query('DELETE FROM user_enabled_themes');
  await pool.query('DELETE FROM user_preferences');
  await pool.query('DELETE FROM users');
  // Don't delete themes and plugins - they're reference data
}

export async function closeDatabase() {
  await pool.end();
}