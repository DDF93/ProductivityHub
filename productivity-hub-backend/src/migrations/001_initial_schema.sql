-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (core authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User preferences (themes, settings) - SAFE CASCADE
CREATE TABLE user_preferences (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
  current_theme VARCHAR(50) DEFAULT 'light-default',
  enabled_themes JSONB DEFAULT '["light-default", "dark-default"]',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_enabled_plugins (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plugin_id VARCHAR(100) NOT NULL,
  enabled_at TIMESTAMP DEFAULT NOW(),
  settings JSONB DEFAULT '{}',
  PRIMARY KEY (user_id, plugin_id)
);

-- Planner items (reusable building blocks) - PRESERVE DATA
CREATE TABLE planner_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  default_duration INTEGER, -- minutes (NULL = no default duration)
  category VARCHAR(100),
  color VARCHAR(7), -- hex color code like #FF5733
  is_habit_trackable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- RESTRICT prevents accidental user deletion if they have items
  CONSTRAINT fk_planner_items_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Day templates (saved routines) - PRESERVE DATA
CREATE TABLE day_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_day_templates_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Actual days (specific dates planned) - PRESERVE DATA
CREATE TABLE actual_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  template_id UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_actual_days_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_actual_days_template 
    FOREIGN KEY (template_id) REFERENCES day_templates(id) ON DELETE SET NULL,
  
  -- One record per user per date
  UNIQUE(user_id, date)
);

-- Scheduled items (items with times on specific days) - CASCADE with day
CREATE TABLE scheduled_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID NOT NULL,
  item_id UUID NOT NULL,
  start_time TIME NOT NULL,
  duration INTEGER NOT NULL, -- minutes
  custom_name VARCHAR(255), -- override item name for this day
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  order_position INTEGER,
  
  -- CASCADE because scheduled items have no value without the day
  CONSTRAINT fk_scheduled_items_day 
    FOREIGN KEY (day_id) REFERENCES actual_days(id) ON DELETE CASCADE,
  -- SET NULL preserves schedule even if item is deleted
  CONSTRAINT fk_scheduled_items_item 
    FOREIGN KEY (item_id) REFERENCES planner_items(id) ON DELETE SET NULL
);

-- Indexes for better query performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_enabled_plugins_user_id ON user_enabled_plugins(user_id);
CREATE INDEX idx_planner_items_user_id ON planner_items(user_id);
CREATE INDEX idx_actual_days_user_date ON actual_days(user_id, date);
CREATE INDEX idx_scheduled_items_day_id ON scheduled_items(day_id);
CREATE INDEX idx_scheduled_items_start_time ON scheduled_items(start_time);