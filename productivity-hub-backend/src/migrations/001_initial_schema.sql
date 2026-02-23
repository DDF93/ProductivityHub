-- ============================================================================
-- ProductivityHub Initial Database Schema
-- ============================================================================
-- Purpose: Core authentication, normalized themes/plugins, user preferences
-- Created: January 2026
-- Note: Plugin-specific tables added as plugins are built
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes for auth queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_id_verified ON users(id, email_verified) WHERE email_verified = true;
CREATE INDEX idx_users_unverified ON users(created_at) WHERE email_verified = false;

-- ============================================================================
-- THEME CATALOG (Normalized)
-- ============================================================================

CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color_scheme JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_themes_name ON themes(name);

-- Seed default themes
INSERT INTO themes (name, description, color_scheme, is_default) VALUES
(
  'light-default',
  'Bright and clean interface',
  '{
    "background": "#FFFFFF",
    "surface": "#F5F5F5",
    "text": "#000000",
    "textSecondary": "#666666",
    "primary": "#007AFF",
    "border": "#E0E0E0"
  }'::jsonb,
  true
),
(
  'dark-default',
  'Easy on the eyes',
  '{
    "background": "#000000",
    "surface": "#1C1C1E",
    "text": "#FFFFFF",
    "textSecondary": "#8E8E93",
    "primary": "#0A84FF",
    "border": "#38383A"
  }'::jsonb,
  true
),
(
  'colorblind-default',
  'Optimized for color vision deficiency',
  '{
    "background": "#FFFFFF",
    "surface": "#F0F0F0",
    "text": "#000000",
    "textSecondary": "#555555",
    "primary": "#0077BB",
    "border": "#CCCCCC"
  }'::jsonb,
  false
),
(
  'high-contrast',
  'Maximum readability',
  '{
    "background": "#FFFFFF",
    "surface": "#EEEEEE",
    "text": "#000000",
    "textSecondary": "#333333",
    "primary": "#0000FF",
    "border": "#000000"
  }'::jsonb,
  false
),
(
  'grayscale-default',
  'Distraction-free focus',
  '{
    "background": "#FFFFFF",
    "surface": "#F8F8F8",
    "text": "#000000",
    "textSecondary": "#707070",
    "primary": "#404040",
    "border": "#D0D0D0"
  }'::jsonb,
  false
);

-- ============================================================================
-- PLUGIN CATALOG (Normalized)
-- ============================================================================

CREATE TABLE plugins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_plugins_name ON plugins(name);

-- Seed placeholder plugins (actual tables added when plugins are built)
INSERT INTO plugins (name, description, is_default) VALUES
(
  'day-planner',
  'Plan your day with time-blocked schedules',
  true
),
(
  'habit-tracker',
  'Track daily habits and build streaks',
  false
),
(
  'focus-timer',
  'Pomodoro-style focus sessions',
  false
);

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================

CREATE TABLE user_preferences (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  current_theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================================================
-- USER ENABLED THEMES (Many-to-Many)
-- ============================================================================

CREATE TABLE user_enabled_themes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  enabled_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, theme_id)
);

CREATE INDEX idx_user_enabled_themes_user_id ON user_enabled_themes(user_id);
CREATE INDEX idx_user_enabled_themes_theme_id ON user_enabled_themes(theme_id);

-- ============================================================================
-- USER ENABLED PLUGINS (Many-to-Many)
-- ============================================================================

CREATE TABLE user_enabled_plugins (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plugin_id UUID REFERENCES plugins(id) ON DELETE CASCADE,
  enabled_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}',
  PRIMARY KEY (user_id, plugin_id)
);

CREATE INDEX idx_user_enabled_plugins_user_id ON user_enabled_plugins(user_id);
CREATE INDEX idx_user_enabled_plugins_plugin_id ON user_enabled_plugins(plugin_id);

-- ============================================================================
-- END OF INITIAL SCHEMA
-- ============================================================================