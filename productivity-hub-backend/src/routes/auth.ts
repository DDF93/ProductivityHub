import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/connection';
import emailService from '../services/emailService';

const router = express.Router();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET: string = process.env.JWT_SECRET;

// Helper function to create JWT tokens
function createJWTToken(userId: string, email: string): string {
  const payload = { userId, email };
  
  // 7 days in seconds (7 * 24 * 60 * 60 = 604,800 seconds)
  const expiresInSeconds = 7 * 24 * 60 * 60;
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresInSeconds });
}

// User Registration Endpoint
router.post('/register', 
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[@$!%*?&#]/)
      .withMessage('Password must contain at least one special character (@$!%*?&#)'),
    body('name')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Name is required'),
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

      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1', 
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ 
          error: 'User already exists with this email' 
        });
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Generate verification token and expiration
      const verificationToken = emailService.generateVerificationToken();
      const tokenExpiration = emailService.getTokenExpiration();

      // Create user
      const createUserQuery = `
        INSERT INTO users (
          email, password_hash, name, email_verification_token,
          email_verification_expires, created_at, updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
        RETURNING id, email, name, created_at
      `;
      
      const newUser = await pool.query(createUserQuery, [
        email, hashedPassword, name, verificationToken, tokenExpiration
      ]);

      const user = newUser.rows[0];

      // Create default preferences
      await pool.query(`
        INSERT INTO user_preferences (user_id, current_theme, enabled_themes, updated_at)
        VALUES ($1, $2, $3, NOW())
      `, [
        user.id, 
        'light-default',
        JSON.stringify(['light-default', 'dark-default'])
      ]);

      // Send verification email
      await emailService.sendVerificationEmail(email, name, verificationToken);

      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: false,
          createdAt: user.created_at
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'Internal server error during registration' 
      });
    }
  }
);

// Email Verification Endpoint
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        error: 'Verification token is required'
      });
    }

    // Find user with verification token
    const userResult = await pool.query(`
      SELECT id, email, name, email_verified, email_verification_expires 
      FROM users WHERE email_verification_token = $1
    `, [token]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid verification token'
      });
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(200).json({
        message: 'Email already verified',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: true
        }
      });
    }

    // Check if token expired
    const now = new Date();
    const expirationDate = new Date(user.email_verification_expires);
    
    if (now > expirationDate) {
      return res.status(400).json({
        error: 'Verification token has expired. Please request a new verification email.'
      });
    }

    // Mark as verified
    const verifiedUserResult = await pool.query(`
      UPDATE users 
      SET email_verified = true, email_verification_token = NULL,
          email_verification_expires = NULL, updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, name, email_verified
    `, [user.id]);

    const verifiedUser = verifiedUserResult.rows[0];

    // Generate JWT for immediate login
    const jwtToken = createJWTToken(verifiedUser.id, verifiedUser.email);

    res.status(200).json({
      message: 'Email verified successfully! You are now logged in.',
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
        emailVerified: true
      },
      token: jwtToken
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'Internal server error during email verification'
    });
  }
});

// User Login Endpoint
router.post('/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required'),
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

      const { email, password } = req.body;

      // Find user
      const userResult = await pool.query(`
        SELECT id, email, name, password_hash, email_verified 
        FROM users WHERE email = $1
      `, [email]);

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      const user = userResult.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Check email verification
      if (!user.email_verified) {
        return res.status(403).json({
          error: 'Please verify your email address before logging in. Check your inbox for a verification email.'
        });
      }

      // Generate JWT
      const token = createJWTToken(user.id, user.email);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: true
        },
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        error: 'Internal server error during login' 
      });
    }
  }
);

export default router;