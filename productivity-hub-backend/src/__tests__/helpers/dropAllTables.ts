import { pool } from '../../db/connection';

async function dropAllTables() {
  await pool.query(`
    DROP TABLE IF EXISTS user_enabled_plugins CASCADE;
    DROP TABLE IF EXISTS user_enabled_themes CASCADE;
    DROP TABLE IF EXISTS user_preferences CASCADE;
    DROP TABLE IF EXISTS plugins CASCADE;
    DROP TABLE IF EXISTS themes CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS schema_migrations CASCADE;
  `);
  await pool.end();
  console.log('✅ All test tables dropped');
}

dropAllTables();