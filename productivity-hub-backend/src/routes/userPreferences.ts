// src/routes/userPreferences.ts
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/connection';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// GET /api/user/preferences
// Fetch user preferences with enabled themes and plugins
// ============================================================================
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user preferences record
    const preferencesResult = await pool.query(`
      SELECT id, user_id, current_theme_id, created_at, updated_at
      FROM user_preferences 
      WHERE user_id = $1
    `, [userId]);

    if (preferencesResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User preferences not found'
      });
    }

    // Get enabled themes with full theme details
    const enabledThemesResult = await pool.query(`
      SELECT t.id, t.name, t.description, t.color_scheme, t.is_default, uet.enabled_at
      FROM user_enabled_themes uet
      JOIN themes t ON uet.theme_id = t.id
      WHERE uet.user_id = $1
      ORDER BY uet.enabled_at
    `, [userId]);

    // Get enabled plugins with full plugin details
    const enabledPluginsResult = await pool.query(`
      SELECT p.id, p.name, p.description, p.is_default, uep.enabled_at
      FROM user_enabled_plugins uep
      JOIN plugins p ON uep.plugin_id = p.id
      WHERE uep.user_id = $1
      ORDER BY uep.enabled_at
    `, [userId]);

    res.json({
      preferences: preferencesResult.rows[0],
      enabledThemes: enabledThemesResult.rows,
      enabledPlugins: enabledPluginsResult.rows
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// ============================================================================
// PUT /api/user/current-theme
// Update the current active theme
// ============================================================================
router.put('/current-theme',
  [
    body('themeId')
      .notEmpty()
      .withMessage('Theme ID is required')
      .isString()
      .withMessage('Theme ID must be a string')
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: errors.array()[0].msg
        });
      }

      const { themeId } = req.body;
      const userId = req.user!.id;

      // Check if theme exists
      const themeExists = await pool.query(
        'SELECT id FROM themes WHERE id = $1',
        [themeId]
      );

      if (themeExists.rows.length === 0) {
        return res.status(404).json({
          error: 'Theme not found'
        });
      }

      // Update current theme in user preferences
      const updateResult = await pool.query(`
        UPDATE user_preferences 
        SET current_theme_id = $1, updated_at = NOW()
        WHERE user_id = $2
        RETURNING id, user_id, current_theme_id, created_at, updated_at
      `, [themeId, userId]);

      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User preferences not found'
        });
      }

      res.json({
        message: 'Current theme updated successfully',
        preferences: updateResult.rows[0]
      });

    } catch (error) {
      console.error('Update current theme error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
);

// ============================================================================
// POST /api/user/enabled-themes
// Enable a theme for the user (add to enabled list)
// ============================================================================
router.post('/enabled-themes',
  [
    body('themeId')
      .notEmpty()
      .withMessage('Theme ID is required')
      .isString()
      .withMessage('Theme ID must be a string')
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: errors.array()[0].msg
        });
      }

      const { themeId } = req.body;
      const userId = req.user!.id;

      // Check if theme exists
      const themeExists = await pool.query(
        'SELECT id FROM themes WHERE id = $1',
        [themeId]
      );

      if (themeExists.rows.length === 0) {
        return res.status(404).json({
          error: 'Theme not found'
        });
      }

      // Check if already enabled
      const alreadyEnabled = await pool.query(
        'SELECT * FROM user_enabled_themes WHERE user_id = $1 AND theme_id = $2',
        [userId, themeId]
      );

      if (alreadyEnabled.rows.length > 0) {
        return res.status(409).json({
          error: 'Theme already enabled'
        });
      }

      // Enable theme (insert into join table)
      const insertResult = await pool.query(`
        INSERT INTO user_enabled_themes (user_id, theme_id, enabled_at)
        VALUES ($1, $2, NOW())
        RETURNING user_id, theme_id, enabled_at
      `, [userId, themeId]);

      res.status(201).json({
        message: 'Theme enabled successfully',
        enabledTheme: insertResult.rows[0]
      });

    } catch (error) {
      console.error('Enable theme error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
);

// ============================================================================
// DELETE /api/user/enabled-themes/:themeId
// Disable a theme (remove from enabled list)
// ============================================================================
router.delete('/enabled-themes/:themeId', async (req: Request, res: Response) => {
  try {
    const { themeId } = req.params;
    const userId = req.user!.id;

    if (!themeId) {
      return res.status(400).json({
        error: 'Theme ID is required'
      });
    }

    // Check if theme is enabled
    const isEnabled = await pool.query(
      'SELECT * FROM user_enabled_themes WHERE user_id = $1 AND theme_id = $2',
      [userId, themeId]
    );

    if (isEnabled.rows.length === 0) {
      return res.status(404).json({
        error: 'Theme not enabled'
      });
    }

    // Disable theme (delete from join table)
    await pool.query(
      'DELETE FROM user_enabled_themes WHERE user_id = $1 AND theme_id = $2',
      [userId, themeId]
    );

    res.json({
      message: 'Theme disabled successfully'
    });

  } catch (error) {
    console.error('Disable theme error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// ============================================================================
// POST /api/user/enabled-plugins
// Enable a plugin for the user
// ============================================================================
router.post('/enabled-plugins',
  [
    body('pluginId')
      .notEmpty()
      .withMessage('Plugin ID is required')
      .isString()
      .withMessage('Plugin ID must be a string')
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: errors.array()[0].msg
        });
      }

      const { pluginId } = req.body;
      const userId = req.user!.id;

      // Check if plugin exists
      const pluginExists = await pool.query(
        'SELECT id FROM plugins WHERE id = $1',
        [pluginId]
      );

      if (pluginExists.rows.length === 0) {
        return res.status(404).json({
          error: 'Plugin not found'
        });
      }

      // Check if already enabled
      const alreadyEnabled = await pool.query(
        'SELECT * FROM user_enabled_plugins WHERE user_id = $1 AND plugin_id = $2',
        [userId, pluginId]
      );

      if (alreadyEnabled.rows.length > 0) {
        return res.status(409).json({
          error: 'Plugin already enabled'
        });
      }

      // Enable plugin (insert into join table)
      const insertResult = await pool.query(`
        INSERT INTO user_enabled_plugins (user_id, plugin_id, enabled_at)
        VALUES ($1, $2, NOW())
        RETURNING user_id, plugin_id, enabled_at
      `, [userId, pluginId]);

      res.status(201).json({
        message: 'Plugin enabled successfully',
        enabledPlugin: insertResult.rows[0]
      });

    } catch (error) {
      console.error('Enable plugin error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
);

// ============================================================================
// DELETE /api/user/enabled-plugins/:pluginId
// Disable a plugin
// ============================================================================
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
    const isEnabled = await pool.query(
      'SELECT * FROM user_enabled_plugins WHERE user_id = $1 AND plugin_id = $2',
      [userId, pluginId]
    );

    if (isEnabled.rows.length === 0) {
      return res.status(404).json({
        error: 'Plugin not enabled'
      });
    }

    // Disable plugin (delete from join table)
    await pool.query(
      'DELETE FROM user_enabled_plugins WHERE user_id = $1 AND plugin_id = $2',
      [userId, pluginId]
    );

    res.json({
      message: 'Plugin disabled successfully'
    });

  } catch (error) {
    console.error('Disable plugin error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;