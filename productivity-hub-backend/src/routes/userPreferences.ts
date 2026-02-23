// src/routes/userPreferences.ts
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/connection';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// THEME MANAGEMENT ENDPOINTS
// ============================================================================

// GET user preferences (themes and plugins)
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user's current theme with details
    const preferencesResult = await pool.query(`
      SELECT 
        up.current_theme_id,
        t.name as current_theme_name,
        t.description as current_theme_description,
        t.color_scheme as current_theme_colors,
        up.updated_at
      FROM user_preferences up
      LEFT JOIN themes t ON up.current_theme_id = t.id
      WHERE up.user_id = $1
    `, [userId]);

    if (preferencesResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User preferences not found'
      });
    }

    const prefs = preferencesResult.rows[0];

    // Get all enabled themes for this user
    const enabledThemesResult = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.description,
        t.color_scheme,
        t.is_default,
        uet.enabled_at
      FROM user_enabled_themes uet
      JOIN themes t ON uet.theme_id = t.id
      WHERE uet.user_id = $1
      ORDER BY t.is_default DESC, t.name ASC
    `, [userId]);

    // Get enabled plugins
    const pluginsResult = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        uep.enabled_at,
        uep.settings
      FROM user_enabled_plugins uep
      JOIN plugins p ON uep.plugin_id = p.id
      WHERE uep.user_id = $1
      ORDER BY uep.enabled_at
    `, [userId]);

    res.json({
      themes: {
        current: prefs.current_theme_name,  // Frontend expects name string
        enabled: enabledThemesResult.rows.map(row => row.name)  // Frontend expects name array
      },
      plugins: {
        enabled: pluginsResult.rows.map(row => ({
          id: row.name,  // Frontend uses name as ID
          enabledAt: row.enabled_at,
          settings: row.settings
        }))
      },
      lastUpdated: prefs.updated_at
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// PUT update current theme (accepts theme NAME, not UUID)
router.put('/current-theme',
  [
    body('themeId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Theme ID is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { themeId: themeName } = req.body;  // Frontend sends name
      const userId = req.user!.id;

      // Look up theme by name and check if user has it enabled
      const themeCheckResult = await pool.query(`
        SELECT t.id, t.name
        FROM themes t
        JOIN user_enabled_themes uet ON t.id = uet.theme_id
        WHERE t.name = $1 AND uet.user_id = $2
      `, [themeName, userId]);

      if (themeCheckResult.rows.length === 0) {
        return res.status(400).json({
          error: 'Theme not found or not enabled. Enable the theme first.'
        });
      }

      const themeUuid = themeCheckResult.rows[0].id;

      // Update current theme
      const updateResult = await pool.query(`
        UPDATE user_preferences
        SET current_theme_id = $1, updated_at = NOW()
        WHERE user_id = $2
        RETURNING updated_at
      `, [themeUuid, userId]);

      res.json({
        message: 'Current theme updated successfully',
        currentTheme: themeName,  // Return name to frontend
        updatedAt: updateResult.rows[0].updated_at
      });

    } catch (error) {
      console.error('Update current theme error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
);

// POST enable a theme (accepts theme NAME, not UUID)
router.post('/enabled-themes',
  [
    body('themeId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Theme ID is required')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { themeId: themeName } = req.body;  // Frontend sends name
      const userId = req.user!.id;

      // Look up theme by name
      const themeResult = await pool.query(`
        SELECT id, name FROM themes WHERE name = $1
      `, [themeName]);

      if (themeResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Theme not found'
        });
      }

      const themeUuid = themeResult.rows[0].id;

      // Try to insert (will fail if already enabled due to primary key)
      try {
        await pool.query(`
          INSERT INTO user_enabled_themes (user_id, theme_id, enabled_at)
          VALUES ($1, $2, NOW())
        `, [userId, themeUuid]);

        // Get updated enabled themes list
        const enabledResult = await pool.query(`
          SELECT t.name
          FROM user_enabled_themes uet
          JOIN themes t ON uet.theme_id = t.id
          WHERE uet.user_id = $1
          ORDER BY t.is_default DESC, t.name ASC
        `, [userId]);

        res.json({
          message: 'Theme enabled successfully',
          enabledThemes: enabledResult.rows.map(row => row.name),  // Return names
          updatedAt: new Date()
        });

      } catch (insertError: any) {
        // Check if error is due to duplicate (already enabled)
        if (insertError.code === '23505') { // PostgreSQL unique violation
          return res.status(400).json({
            error: 'Theme is already enabled'
          });
        }
        throw insertError;
      }

    } catch (error) {
      console.error('Enable theme error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
);

// DELETE disable a theme (accepts theme NAME, not UUID)
router.delete('/enabled-themes/:themeId', async (req: Request, res: Response) => {
  try {
    const { themeId: themeName } = req.params;  // Frontend sends name
    const userId = req.user!.id;

    // Look up theme by name
    const themeResult = await pool.query(`
      SELECT id, name, is_default FROM themes WHERE name = $1
    `, [themeName]);

    if (themeResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Theme not found'
      });
    }

    if (themeResult.rows[0].is_default) {
      return res.status(400).json({
        error: 'Default themes cannot be disabled'
      });
    }

    const themeUuid = themeResult.rows[0].id;

    // Get current preferences
    const prefsResult = await pool.query(`
      SELECT up.current_theme_id, t.name as current_theme_name
      FROM user_preferences up
      LEFT JOIN themes t ON up.current_theme_id = t.id
      WHERE up.user_id = $1
    `, [userId]);

    const currentThemeName = prefsResult.rows[0]?.current_theme_name;

    // If disabling current theme, switch to a default theme first
    if (currentThemeName === themeName) {
      const defaultThemeResult = await pool.query(`
        SELECT t.id
        FROM themes t
        JOIN user_enabled_themes uet ON t.id = uet.theme_id
        WHERE uet.user_id = $1 AND t.is_default = true
        LIMIT 1
      `, [userId]);

      if (defaultThemeResult.rows.length > 0) {
        await pool.query(`
          UPDATE user_preferences
          SET current_theme_id = $1, updated_at = NOW()
          WHERE user_id = $2
        `, [defaultThemeResult.rows[0].id, userId]);
      }
    }

    // Delete the enabled theme
    const deleteResult = await pool.query(`
      DELETE FROM user_enabled_themes
      WHERE user_id = $1 AND theme_id = $2
      RETURNING theme_id
    `, [userId, themeUuid]);

    if (deleteResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Theme is not enabled'
      });
    }

    // Get updated data
    const updatedPrefsResult = await pool.query(`
      SELECT t.name as current_theme_name
      FROM user_preferences up
      LEFT JOIN themes t ON up.current_theme_id = t.id
      WHERE up.user_id = $1
    `, [userId]);

    const enabledResult = await pool.query(`
      SELECT t.name
      FROM user_enabled_themes uet
      JOIN themes t ON uet.theme_id = t.id
      WHERE uet.user_id = $1
      ORDER BY t.is_default DESC, t.name ASC
    `, [userId]);

    res.json({
      message: 'Theme disabled successfully',
      currentTheme: updatedPrefsResult.rows[0].current_theme_name,
      enabledThemes: enabledResult.rows.map(row => row.name),
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Disable theme error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// ============================================================================
// PLUGIN MANAGEMENT ENDPOINTS  
// ============================================================================

// POST enable a plugin (accepts plugin NAME, not UUID)
router.post('/enabled-plugins',
  [
    body('pluginId')
      .isString()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Plugin ID is required'),
    body('settings')
      .optional()
      .isObject()
      .withMessage('Settings must be an object')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { pluginId: pluginName, settings = {} } = req.body;
      const userId = req.user!.id;

      // Look up plugin by name
      const pluginResult = await pool.query(`
        SELECT id, name FROM plugins WHERE name = $1
      `, [pluginName]);

      if (pluginResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Plugin not found'
        });
      }

      const pluginUuid = pluginResult.rows[0].id;

      // Insert or update (upsert)
      const result = await pool.query(`
        INSERT INTO user_enabled_plugins (user_id, plugin_id, enabled_at, settings)
        VALUES ($1, $2, NOW(), $3)
        ON CONFLICT (user_id, plugin_id)
        DO UPDATE SET settings = $3, enabled_at = NOW()
        RETURNING enabled_at, settings
      `, [userId, pluginUuid, JSON.stringify(settings)]);

      res.json({
        message: 'Plugin enabled successfully',
        plugin: {
          id: pluginName,  // Return name to frontend
          enabledAt: result.rows[0].enabled_at,
          settings: result.rows[0].settings
        }
      });

    } catch (error) {
      console.error('Enable plugin error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
);

// DELETE disable a plugin (accepts plugin NAME, not UUID)
router.delete('/enabled-plugins/:pluginId', async (req: Request, res: Response) => {
  try {
    const { pluginId: pluginName } = req.params;
    const userId = req.user!.id;

    // Look up plugin by name
    const pluginResult = await pool.query(`
      SELECT id FROM plugins WHERE name = $1
    `, [pluginName]);

    if (pluginResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Plugin not found'
      });
    }

    const pluginUuid = pluginResult.rows[0].id;

    // Delete the enabled plugin
    const deleteResult = await pool.query(`
      DELETE FROM user_enabled_plugins
      WHERE user_id = $1 AND plugin_id = $2
      RETURNING plugin_id
    `, [userId, pluginUuid]);

    if (deleteResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Plugin is not enabled'
      });
    }

    res.json({
      message: 'Plugin disabled successfully',
      pluginId: pluginName  // Return name to frontend
    });

  } catch (error) {
    console.error('Disable plugin error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;