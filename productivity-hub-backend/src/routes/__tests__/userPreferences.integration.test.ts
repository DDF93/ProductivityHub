import request from 'supertest';
import app from '../../app';
import { pool } from '../../db/connection';
import { clearDatabase, closeDatabase } from '../../__tests__/helpers/database';
import { mockEmailService, restoreMocks } from '../../__tests__/helpers/mocks';
import { runTestMigrations } from '../../__tests__/helpers/migrations';

// Store reference data created once for all tests
let testThemes: any[] = [];
let testPlugins: any[] = [];

// Helper: Create themes in database (reference data)
async function createTestThemes() {
  const themes = [
    {
      name: 'Light Theme',
      description: 'Default light theme',
      color_scheme: { primary: '#007AFF', background: '#FFFFFF', text: '#000000' },
      is_default: true
    },
    {
      name: 'Dark Theme',
      description: 'Dark mode theme',
      color_scheme: { primary: '#0A84FF', background: '#000000', text: '#FFFFFF' },
      is_default: false
    },
    {
      name: 'Ocean Theme',
      description: 'Ocean blue theme',
      color_scheme: { primary: '#00B4D8', background: '#F0F8FF', text: '#023E8A' },
      is_default: false
    }
  ];

  const created = [];
  for (const theme of themes) {
    const result = await pool.query(
      `INSERT INTO themes (name, description, color_scheme, is_default) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [theme.name, theme.description, theme.color_scheme, theme.is_default]
    );
    created.push(result.rows[0]);
  }
  return created;
}

// Helper: Create plugins in database (reference data)
async function createTestPlugins() {
  const plugins = [
    {
      name: 'Day Planner',
      description: 'Plan your daily tasks',
      is_default: true
    },
    {
      name: 'Habit Tracker',
      description: 'Track your habits',
      is_default: false
    },
    {
      name: 'Notes',
      description: 'Take quick notes',
      is_default: false
    }
  ];

  const created = [];
  for (const plugin of plugins) {
    const result = await pool.query(
      `INSERT INTO plugins (name, description, is_default) 
       VALUES ($1, $2, $3) RETURNING *`,
      [plugin.name, plugin.description, plugin.is_default]
    );
    created.push(result.rows[0]);
  }
  return created;
}

// Helper: Create and login a user, returns JWT token
async function createAndLoginUser(email: string = 'test@example.com') {
  const testUser = {
    name: 'Test User',
    email: email,
    password: 'Password123!'
  };

  // Register user
  await request(app)
    .post('/api/auth/register')
    .send(testUser);

  // Verify email
  await pool.query(
    'UPDATE users SET email_verified = true WHERE email = $1',
    [testUser.email]
  );

  // Get user ID
  const userResult = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [testUser.email]
  );
  const userId = userResult.rows[0].id;

  // Create user_preferences record (if it doesn't exist)
  // Use ON CONFLICT DO NOTHING to avoid duplicate key errors
  await pool.query(
    `INSERT INTO user_preferences (user_id) 
     VALUES ($1) 
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );

  // Login to get token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: testUser.email,
      password: testUser.password
    });

  return loginResponse.body.token;
}

// Helper: Get user ID from token
async function getUserIdFromEmail(email: string): Promise<string> {
  const result = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0].id;
}

describe('User Preferences API Integration Tests', () => {
  // Setup: Create reference data once before all tests
  beforeAll(async () => {
    await runTestMigrations();  // ← Create tables first
    mockEmailService();
    testThemes = await createTestThemes();
    testPlugins = await createTestPlugins();
  });

  // Cleanup: Remove user data after each test
  afterEach(async () => {
    // Only clear user-related data, keep themes and plugins
    await pool.query('DELETE FROM user_enabled_plugins');
    await pool.query('DELETE FROM user_enabled_themes');
    await pool.query('DELETE FROM user_preferences');
    await pool.query('DELETE FROM users');
  });

  // Cleanup: Close database connection after all tests
  afterAll(async () => {
    // Clean up themes and plugins
    await pool.query('DELETE FROM themes');
    await pool.query('DELETE FROM plugins');
    restoreMocks();
    await closeDatabase();
  });

  describe('GET /api/user/preferences', () => {
    it('should return user preferences for authenticated user', async () => {
      const token = await createAndLoginUser();

      const response = await request(app)
        .get('/api/user/preferences')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('preferences');
      expect(response.body.preferences).toHaveProperty('id');
      expect(response.body.preferences).toHaveProperty('user_id');
      expect(response.body.preferences).toHaveProperty('current_theme_id');
      expect(response.body).toHaveProperty('enabledThemes');
      expect(response.body).toHaveProperty('enabledPlugins');
      expect(Array.isArray(response.body.enabledThemes)).toBe(true);
      expect(Array.isArray(response.body.enabledPlugins)).toBe(true);
    });

    it('should return empty arrays for new user with no enabled themes or plugins', async () => {
      const token = await createAndLoginUser();

      const response = await request(app)
        .get('/api/user/preferences')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.enabledThemes).toEqual([]);
      expect(response.body.enabledPlugins).toEqual([]);
      expect(response.body.preferences.current_theme_id).toBeNull();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/user/preferences');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token is required');
    });
  });

  describe('PUT /api/user/current-theme', () => {
    it('should update current theme for authenticated user', async () => {
      const token = await createAndLoginUser();
      const themeId = testThemes[0].id;

      const response = await request(app)
        .put('/api/user/current-theme')
        .set('Authorization', `Bearer ${token}`)
        .send({ themeId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('preferences');
      expect(response.body.preferences.current_theme_id).toBe(themeId);

      // Verify in database
      const userId = await getUserIdFromEmail('test@example.com');
      const dbResult = await pool.query(
        'SELECT current_theme_id FROM user_preferences WHERE user_id = $1',
        [userId]
      );
      expect(dbResult.rows[0].current_theme_id).toBe(themeId);
    });

    it('should return 404 for non-existent theme', async () => {
      const token = await createAndLoginUser();
      const fakeThemeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .put('/api/user/current-theme')
        .set('Authorization', `Bearer ${token}`)
        .send({ themeId: fakeThemeId });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Theme not found');
    });

    it('should return 400 for missing themeId', async () => {
      const token = await createAndLoginUser();

      const response = await request(app)
        .put('/api/user/current-theme')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Theme ID is required');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/user/current-theme')
        .send({ themeId: testThemes[0].id });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/user/enabled-themes', () => {
    it('should enable a theme for authenticated user', async () => {
      const token = await createAndLoginUser();
      const themeId = testThemes[1].id;

      const response = await request(app)
        .post('/api/user/enabled-themes')
        .set('Authorization', `Bearer ${token}`)
        .send({ themeId });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('enabledTheme');
      expect(response.body.enabledTheme.theme_id).toBe(themeId);

      // Verify in database
      const userId = await getUserIdFromEmail('test@example.com');
      const dbResult = await pool.query(
        'SELECT * FROM user_enabled_themes WHERE user_id = $1 AND theme_id = $2',
        [userId, themeId]
      );
      expect(dbResult.rows.length).toBe(1);
    });

    it('should return 409 when enabling already enabled theme', async () => {
      const token = await createAndLoginUser();
      const themeId = testThemes[1].id;

      // Enable theme first time
      await request(app)
        .post('/api/user/enabled-themes')
        .set('Authorization', `Bearer ${token}`)
        .send({ themeId });

      // Try to enable again
      const response = await request(app)
        .post('/api/user/enabled-themes')
        .set('Authorization', `Bearer ${token}`)
        .send({ themeId });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Theme already enabled');
    });

    it('should return 404 for non-existent theme', async () => {
      const token = await createAndLoginUser();
      const fakeThemeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .post('/api/user/enabled-themes')
        .set('Authorization', `Bearer ${token}`)
        .send({ themeId: fakeThemeId });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Theme not found');
    });

    it('should return 400 for missing themeId', async () => {
      const token = await createAndLoginUser();

      const response = await request(app)
        .post('/api/user/enabled-themes')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Theme ID is required');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/user/enabled-themes')
        .send({ themeId: testThemes[0].id });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/user/enabled-themes/:themeId', () => {
    it('should disable an enabled theme', async () => {
      const token = await createAndLoginUser();
      const themeId = testThemes[1].id;

      // Enable theme first
      await request(app)
        .post('/api/user/enabled-themes')
        .set('Authorization', `Bearer ${token}`)
        .send({ themeId });

      // Disable theme
      const response = await request(app)
        .delete(`/api/user/enabled-themes/${themeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Theme disabled successfully');

      // Verify removed from database
      const userId = await getUserIdFromEmail('test@example.com');
      const dbResult = await pool.query(
        'SELECT * FROM user_enabled_themes WHERE user_id = $1 AND theme_id = $2',
        [userId, themeId]
      );
      expect(dbResult.rows.length).toBe(0);
    });

    it('should return 404 when disabling theme that is not enabled', async () => {
      const token = await createAndLoginUser();
      const themeId = testThemes[1].id;

      const response = await request(app)
        .delete(`/api/user/enabled-themes/${themeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Theme not enabled');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/user/enabled-themes/${testThemes[0].id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/user/enabled-plugins', () => {
    it('should enable a plugin for authenticated user', async () => {
      const token = await createAndLoginUser();
      const pluginId = testPlugins[1].id;

      const response = await request(app)
        .post('/api/user/enabled-plugins')
        .set('Authorization', `Bearer ${token}`)
        .send({ pluginId });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('enabledPlugin');
      expect(response.body.enabledPlugin.plugin_id).toBe(pluginId);

      // Verify in database
      const userId = await getUserIdFromEmail('test@example.com');
      const dbResult = await pool.query(
        'SELECT * FROM user_enabled_plugins WHERE user_id = $1 AND plugin_id = $2',
        [userId, pluginId]
      );
      expect(dbResult.rows.length).toBe(1);
    });

    it('should return 409 when enabling already enabled plugin', async () => {
      const token = await createAndLoginUser();
      const pluginId = testPlugins[1].id;

      // Enable plugin first time
      await request(app)
        .post('/api/user/enabled-plugins')
        .set('Authorization', `Bearer ${token}`)
        .send({ pluginId });

      // Try to enable again
      const response = await request(app)
        .post('/api/user/enabled-plugins')
        .set('Authorization', `Bearer ${token}`)
        .send({ pluginId });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Plugin already enabled');
    });

    it('should return 404 for non-existent plugin', async () => {
      const token = await createAndLoginUser();
      const fakePluginId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .post('/api/user/enabled-plugins')
        .set('Authorization', `Bearer ${token}`)
        .send({ pluginId: fakePluginId });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Plugin not found');
    });

    it('should return 400 for missing pluginId', async () => {
      const token = await createAndLoginUser();

      const response = await request(app)
        .post('/api/user/enabled-plugins')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Plugin ID is required');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/user/enabled-plugins')
        .send({ pluginId: testPlugins[0].id });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/user/enabled-plugins/:pluginId', () => {
    it('should disable an enabled plugin', async () => {
      const token = await createAndLoginUser();
      const pluginId = testPlugins[1].id;

      // Enable plugin first
      await request(app)
        .post('/api/user/enabled-plugins')
        .set('Authorization', `Bearer ${token}`)
        .send({ pluginId });

      // Disable plugin
      const response = await request(app)
        .delete(`/api/user/enabled-plugins/${pluginId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Plugin disabled successfully');

      // Verify removed from database
      const userId = await getUserIdFromEmail('test@example.com');
      const dbResult = await pool.query(
        'SELECT * FROM user_enabled_plugins WHERE user_id = $1 AND plugin_id = $2',
        [userId, pluginId]
      );
      expect(dbResult.rows.length).toBe(0);
    });

    it('should return 404 when disabling plugin that is not enabled', async () => {
      const token = await createAndLoginUser();
      const pluginId = testPlugins[1].id;

      const response = await request(app)
        .delete(`/api/user/enabled-plugins/${pluginId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Plugin not enabled');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/user/enabled-plugins/${testPlugins[0].id}`);

      expect(response.status).toBe(401);
    });
  });
});