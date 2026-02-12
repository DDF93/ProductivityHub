import { pool } from '../../db/connection';

export async function runTestMigrations() {
  // Drop existing tables first (CASCADE removes dependent data)
  await pool.query(`
    DROP TABLE IF EXISTS user_enabled_plugins CASCADE;
    DROP TABLE IF EXISTS user_enabled_themes CASCADE;
    DROP TABLE IF EXISTS user_preferences CASCADE;
    DROP TABLE IF EXISTS plugins CASCADE;
    DROP TABLE IF EXISTS themes CASCADE;
  `);

  // Now create all tables with correct schema
  await pool.query(`
    -- Themes table
    CREATE TABLE themes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      color_scheme JSONB NOT NULL,
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Plugins table
    CREATE TABLE plugins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- User preferences table (users table already exists from auth tests)
    CREATE TABLE user_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      current_theme_id UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- User enabled themes join table
    CREATE TABLE user_enabled_themes (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
      enabled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, theme_id)
    );

    -- User enabled plugins join table
    CREATE TABLE user_enabled_plugins (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plugin_id UUID NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
      enabled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, plugin_id)
    );
  `);
}