// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/connection';

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
      };
    }
  }
}

// JWT payload structure
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;  // issued at timestamp
  exp: number;  // expiration timestamp
}

// Main authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    // 2. Verify JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;

    // 3. Get current user data from database
    const userResult = await pool.query(`
      SELECT id, email, name, email_verified 
      FROM users 
      WHERE id = $1 AND email_verified = true
    `, [decoded.userId]);

    // 4. Check if user still exists and is verified
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid token - user not found or not verified'
      });
    }

    const user = userResult.rows[0];

    // 5. Attach user data to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.email_verified
    };

    // 6. Continue to next middleware/route handler
    next();

  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token has expired'
      });
    }

    // Handle other errors
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error during authentication'
    });
  }
};

// Optional authentication middleware (doesn't require token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    // If no token, continue without setting req.user
    if (!token) {
      return next();
    }

    // If token exists, try to authenticate
    if (!process.env.JWT_SECRET) {
      return next(); // Skip auth if JWT_SECRET not configured
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    
    const userResult = await pool.query(`
      SELECT id, email, name, email_verified 
      FROM users 
      WHERE id = $1 AND email_verified = true
    `, [decoded.userId]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.email_verified
      };
    }

    next();

  } catch (error) {
    // For optional auth, ignore errors and continue without setting req.user
    next();
  }
};