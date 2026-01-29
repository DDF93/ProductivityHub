// src/routes/userPreferences.ts
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/connection';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes in this file
router.use(authenticateToken);

// ============================================================================
// THEME MANAGEMENT ENDPOINTS
// ============================================================================

// GET current user preferences (themes and plugins)
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user preferences from database
    const preferencesResult = await pool.query(`
      SELECT current_theme, enabled_themes, updated_at
      FROM user_preferences 
      WHERE user_id = $1
    `, [userId]);

    if (preferencesResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User preferences not found'
      });
    }

    const preferences = preferencesResult.rows[0];

    // Get enabled plugins
    const pluginsResult = await pool.query(`
      SELECT plugin_id, enabled_at, settings
      FROM user_enabled_plugins 
      WHERE user_id = $1
      ORDER BY enabled_at
    `, [userId]);

    res.json({
      themes: {
        current: preferences.current_theme,
        enabled: preferences.enabled_themes
      },
      plugins: {
        enabled: pluginsResult.rows.map(row => ({
          id: row.plugin_id,
          enabledAt: row.enabled_at,
          settings: row.settings
        }))
      },
      lastUpdated: preferences.updated_at
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// PUT update current theme
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

      const { themeId } = req.body;
      const userId = req.user!.id;

      // Check if theme is in user's enabled themes
      const preferencesResult = await pool.query(`
        SELECT enabled_themes 
        FROM user_preferences 
        WHERE user_id = $1
      `, [userId]);

      if (preferencesResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User preferences not found'
        });
      }

      const enabledThemes = preferencesResult.rows[0].enabled_themes;
      
      if (!enabledThemes.includes(themeId)) {
        return res.status(400).json({
          error: 'Cannot set theme that is not enabled. Enable the theme first.'
        });
      }

      // Update current theme
      const updateResult = await pool.query(`
        UPDATE user_preferences 
        SET current_theme = $1, updated_at = NOW()
        WHERE user_id = $2
        RETURNING current_theme, updated_at
      `, [themeId, userId]);

      res.json({
        message: 'Current theme updated successfully',
        currentTheme: updateResult.rows[0].current_theme,
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

// POST enable a theme
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

      const { themeId } = req.body;
      const userId = req.user!.id;

      // Get current enabled themes
      const preferencesResult = await pool.query(`
        SELECT enabled_themes 
        FROM user_preferences 
        WHERE user_id = $1
      `, [userId]);

      if (preferencesResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User preferences not found'
        });
      }

      const currentEnabledThemes = preferencesResult.rows[0].enabled_themes;

      // Check if theme is already enabled
      if (currentEnabledThemes.includes(themeId)) {
        return res.status(400).json({
          error: 'Theme is already enabled'
        });
      }

      // Add theme to enabled list
      const updatedEnabledThemes = [...currentEnabledThemes, themeId];

      const updateResult = await pool.query(`
        UPDATE user_preferences 
        SET enabled_themes = $1, updated_at = NOW()
        WHERE user_id = $2
        RETURNING enabled_themes, updated_at
      `, [JSON.stringify(updatedEnabledThemes), userId]);

      res.json({
        message: 'Theme enabled successfully',
        enabledThemes: updateResult.rows[0].enabled_themes,
        updatedAt: updateResult.rows[0].updated_at
      });

    } catch (error) {
      console.error('Enable theme error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
);

// DELETE disable a theme
router.delete('/enabled-themes/:themeId', async (req: Request, res: Response) => {
  try {
    const themeId = req.params.themeId as string;
    const userId = req.user!.id;

    if (!themeId) {
      return res.status(400).json({
        error: 'Theme ID is required'
      });
    }

    // Check if theme can be disabled (core themes cannot be disabled)
    const coreThemes = ['light-default', 'dark-default'];
    if (coreThemes.includes(themeId)) {
      return res.status(400).json({
        error: 'Core themes cannot be disabled'
      });
    }

    // Get current preferences
    const preferencesResult = await pool.query(`
      SELECT current_theme, enabled_themes 
      FROM user_preferences 
      WHERE user_id = $1
    `, [userId]);

    if (preferencesResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User preferences not found'
      });
    }

    const { current_theme, enabled_themes } = preferencesResult.rows[0];

    // Check if theme is enabled
    if (!enabled_themes.includes(themeId)) {
      return res.status(400).json({
        error: 'Theme is not enabled'
      });
    }

    // Remove theme from enabled list
    const updatedEnabledThemes = enabled_themes.filter((id: string) => id !== themeId);

    // If current theme is being disabled, switch to first enabled theme
    let newCurrentTheme = current_theme;
    if (current_theme === themeId) {
      newCurrentTheme = updatedEnabledThemes[0]; // Should always have at least core themes
    }

    const updateResult = await pool.query(`
      UPDATE user_preferences 
      SET current_theme = $1, enabled_themes = $2, updated_at = NOW()
      WHERE user_id = $3
      RETURNING current_theme, enabled_themes, updated_at
    `, [newCurrentTheme, JSON.stringify(updatedEnabledThemes), userId]);

    res.json({
      message: 'Theme disabled successfully',
      currentTheme: updateResult.rows[0].current_theme,
      enabledThemes: updateResult.rows[0].enabled_themes,
      updatedAt: updateResult.rows[0].updated_at
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

// POST enable a plugin
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

      const { pluginId, settings = {} } = req.body;
      const userId = req.user!.id;

      // Check if plugin is already enabled
      const existingPlugin = await pool.query(`
        SELECT plugin_id 
        FROM user_enabled_plugins 
        WHERE user_id = $1 AND plugin_id = $2
      `, [userId, pluginId]);

      if (existingPlugin.rows.length > 0) {
        return res.status(400).json({
          error: 'Plugin is already enabled'
        });
      }

      // Enable plugin
      const insertResult = await pool.query(`
        INSERT INTO user_enabled_plugins (user_id, plugin_id, settings, enabled_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING plugin_id, settings, enabled_at
      `, [userId, pluginId, JSON.stringify(settings)]);

      res.json({
        message: 'Plugin enabled successfully',
        plugin: {
          id: insertResult.rows[0].plugin_id,
          settings: insertResult.rows[0].settings,
          enabledAt: insertResult.rows[0].enabled_at
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

// DELETE disable a plugin
router.delete('/enabled-plugins/:pluginId', async (req: Request, res: Response) => {
  try {
    const { pluginId } = req.params;
    const userId = req.user!.id;

    if (!pluginId) {
      return res.status(400).json({
        error: 'Plugin ID is required'
      });
    }

    // Check if plugin is enabled
    const existingPlugin = await pool.query(`
      SELECT plugin_id 
      FROM user_enabled_plugins 
      WHERE user_id = $1 AND plugin_id = $2
    `, [userId, pluginId]);

    if (existingPlugin.rows.length === 0) {
      return res.status(400).json({
        error: 'Plugin is not enabled'
      });
    }

    // Disable plugin
    await pool.query(`
      DELETE FROM user_enabled_plugins 
      WHERE user_id = $1 AND plugin_id = $2
    `, [userId, pluginId]);

    res.json({
      message: 'Plugin disabled successfully',
      pluginId: pluginId
    });

  } catch (error) {
    console.error('Disable plugin error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// PUT update plugin settings
router.put('/enabled-plugins/:pluginId/settings',
  [
    body('settings')
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

      const { pluginId } = req.params;
      const { settings } = req.body;
      const userId = req.user!.id;

      // Update plugin settings
      const updateResult = await pool.query(`
        UPDATE user_enabled_plugins 
        SET settings = $1
        WHERE user_id = $2 AND plugin_id = $3
        RETURNING plugin_id, settings, enabled_at
      `, [JSON.stringify(settings), userId, pluginId]);

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Plugin not found or not enabled'
        });
      }

      res.json({
        message: 'Plugin settings updated successfully',
        plugin: {
          id: updateResult.rows[0].plugin_id,
          settings: updateResult.rows[0].settings,
          enabledAt: updateResult.rows[0].enabled_at
        }
      });

    } catch (error) {
      console.error('Update plugin settings error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
);

export default router;
