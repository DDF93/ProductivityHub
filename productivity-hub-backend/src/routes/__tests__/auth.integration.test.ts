import request from 'supertest';
import express from 'express';
import authRoutes from '../auth';
import { clearDatabase, closeDatabase } from '../../__tests__/helpers/database';
import { mockEmailService, restoreMocks } from '../../__tests__/helpers/mocks';
import { pool } from '../../db/connection';

// Create test Express app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Setup/teardown
let emailMocks: ReturnType<typeof mockEmailService>;

beforeAll(() => {
  // Mock email service before all tests
  emailMocks = mockEmailService();
});

beforeEach(async () => {
  // Clear database before each test
  await clearDatabase();
});

afterAll(async () => {
  // Restore mocks and close database after all tests
  restoreMocks();
  await closeDatabase();
});

describe('Authentication Integration Tests', () => {
  
  describe('POST /api/auth/register', () => {
    
    it('should create user in database and send verification email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User'
      };
      
      // Make registration request
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      // Check response
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Registration successful. Please check your email to verify your account.');
      
      // Verify user exists in database
      const userQuery = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      
      expect(userQuery.rows).toHaveLength(1);
      const user = userQuery.rows[0];
      
      // Check basic user data
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe(userData.password); // Password should be hashed!
      
      // Check email verification fields (stored in users table)
      expect(user.email_verified).toBe(false); // Should start unverified
      expect(user.email_verification_token).toBeDefined(); // Token should be generated
      expect(user.email_verification_token).not.toBeNull();
      expect(user.email_verification_expires).toBeDefined(); // Expiration should be set
      expect(user.email_verification_expires).not.toBeNull();
      
      // Verify expiration is in the future
      const expiresAt = new Date(user.email_verification_expires);
      const now = new Date();
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
      
      // Verify email was "sent" with correct parameters
      expect(emailMocks.sendVerificationEmail).toHaveBeenCalledWith(
        userData.email,
        userData.name,
        expect.stringContaining(user.email_verification_token)
      );
      
      // Verify it was called exactly once
      expect(emailMocks.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });
    
    it('should reject duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Test123!@#',
        name: 'First User'
      };
      
      // Register first time
      const firstResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      expect(firstResponse.status).toBe(201);
      
      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          name: 'Second User'  // Different name, same email
        });
      
      // Should reject with 409 Conflict (semantically correct for duplicates)
      expect(response.status).toBe(409);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.toLowerCase()).toContain('already');
      
      // Verify only one user exists
      const userQuery = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      expect(userQuery.rows).toHaveLength(1);
      
      // Verify it's the FIRST user that was kept
      expect(userQuery.rows[0].name).toBe('First User');
    });
    
  });
  
});