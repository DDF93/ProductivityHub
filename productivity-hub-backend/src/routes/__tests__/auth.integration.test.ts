import request from 'supertest';
import app from '../../app';
import { pool } from '../../db/connection';
import { clearDatabase, closeDatabase } from '../../__tests__/helpers/database';
import { mockEmailService, restoreMocks } from '../../__tests__/helpers/mocks';

// Setup and teardown
beforeEach(async () => {
  await clearDatabase();
  mockEmailService();
});

afterEach(() => {
  restoreMocks();
});

afterAll(async () => {
  await closeDatabase();
});

describe('Authentication Integration Tests', () => {
  
  // ========================================
  // REGISTRATION TESTS (Session 1)
  // ========================================
  describe('POST /api/auth/register', () => {
    
    // Test 1: Successful registration
    it('should create user in database and send verification email', async () => {
      const newUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('verification email');

      // Verify user exists in database
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [newUser.email]
      );

      expect(result.rows.length).toBe(1);
      const user = result.rows[0];
      expect(user.name).toBe(newUser.name);
      expect(user.email).toBe(newUser.email);
      expect(user.email_verified).toBe(false);
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe(newUser.password);
    });

    // Test 2: Duplicate email rejection
    it('should reject duplicate email registration', async () => {
      const newUser = {
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'SecurePass123!'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(newUser);

      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });
  });

  // ========================================
  // LOGIN TESTS (Session 2)
  // ========================================
  describe('POST /api/auth/login', () => {
    
    // Test 1: Successful login with valid credentials
    it('should login successfully with valid credentials', async () => {
      // SETUP: First register and verify a user
      const testUser = {
        name: 'Login User',
        email: 'login@test.com',
        password: 'SecurePass123!'
      };

      // Step 1: Register the user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(registerResponse.status).toBe(201);

      // Step 2: Manually verify the user's email in database
      await pool.query(
        'UPDATE users SET email_verified = true WHERE email = $1',
        [testUser.email]
      );

      // ACTUAL TEST: Now try to login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      // ASSERTIONS: Check what we got back
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('user');
      expect(loginResponse.body.user.email).toBe(testUser.email);
      expect(loginResponse.body.user).not.toHaveProperty('password');
      expect(loginResponse.body.user).not.toHaveProperty('password_hash');

      // Optional: Verify the token is valid JWT
      expect(typeof loginResponse.body.token).toBe('string');
      expect(loginResponse.body.token.split('.').length).toBe(3);
    });

    // Test 2: Login fails with incorrect password
    it('should reject login with incorrect password', async () => {
      // SETUP: Register and verify a user
      const testUser = {
        name: 'Password Test User',
        email: 'password-test@test.com',
        password: 'CorrectPassword123!'
      };

      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Verify the user
      await pool.query(
        'UPDATE users SET email_verified = true WHERE email = $1',
        [testUser.email]
      );

      // ACTUAL TEST: Try to login with WRONG password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        });

      // ASSERTIONS: Should be rejected
      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body).toHaveProperty('error');
      
      // Security check: Error should be ambiguous (not specific)
      // GOOD: "Invalid credentials" or "Invalid email or password"
      // BAD: "Password is incorrect" or "Email not found"
      const errorMsg = loginResponse.body.error.toLowerCase();
      expect(errorMsg).toMatch(/invalid|incorrect|failed/);
      
      // Optional: Check it's not TOO specific
      expect(errorMsg).not.toContain('password is incorrect');
      expect(errorMsg).not.toContain('password is wrong');
      expect(errorMsg).not.toContain('email not found');
      expect(errorMsg).not.toContain('email does not exist');
    });

    // Test 3: Login fails with email that doesn't exist
    it('should reject login with non-existent email', async () => {
      // ACTUAL TEST: Try to login with email that was never registered
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'doesnotexist@test.com',
          password: 'SomePassword123!'
        });

      // ASSERTIONS: Should be rejected same way as wrong password
      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body).toHaveProperty('error');
      
      // Should return same ambiguous message as wrong password
      const errorMsg = loginResponse.body.error.toLowerCase();
      expect(errorMsg).toMatch(/invalid|incorrect|failed/);
      
      // Should not be specific
      expect(errorMsg).not.toContain('email not found');
      expect(errorMsg).not.toContain('email does not exist');
      expect(errorMsg).not.toContain('no account');
    });

    // Test 4: Login fails if email not verified
    it('should reject login if email not verified', async () => {
      // SETUP: Register a user but DON'T verify email
      const testUser = {
        name: 'Unverified User',
        email: 'unverified@test.com',
        password: 'Password123!'
      };

      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // NOTE: We're NOT running the UPDATE query to verify email!
      // User remains with email_verified = false

      // ACTUAL TEST: Try to login without verifying email
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      // ASSERTIONS: Should be rejected with 403 Forbidden
      expect(loginResponse.status).toBe(403);
      expect(loginResponse.body).toHaveProperty('error');
      expect(loginResponse.body.error).toContain('verify');
      expect(loginResponse.body.error).toContain('email');
      
      // This error CAN be specific because:
      // 1. Password was correct (they know this account exists)
      // 2. They need to take action (check email)
    });
  });
});

// ========================================
// EMAIL VERIFICATION TESTS (Session 2)
// ========================================
describe('GET /api/auth/verify-email', () => {
  
  // Test 1: Successful email verification with valid token
  it('should verify email with valid token', async () => {
    // SETUP: Register a user (gets verification token)
    const testUser = {
      name: 'Verify User',
      email: 'verify@test.com',
      password: 'Password123!'
    };

    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    // Get the verification token from database
    // (In production, this would be in the email link)
    const userResult = await pool.query(
      'SELECT email_verification_token, email_verified FROM users WHERE email = $1',
      [testUser.email]
    );
    
    const token = userResult.rows[0].email_verification_token;
    expect(userResult.rows[0].email_verified).toBe(false); // Not verified yet

    // ACTUAL TEST: Verify email with token
    const verifyResponse = await request(app)
      .get(`/api/auth/verify-email?token=${token}`);

    // ASSERTIONS: Check verification succeeded
    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body).toHaveProperty('message');
    expect(verifyResponse.body.message).toContain('verified');

    // Verify in database that email_verified is now true
    const updatedUserResult = await pool.query(
      'SELECT email_verified FROM users WHERE email = $1',
      [testUser.email]
    );
    
    expect(updatedUserResult.rows[0].email_verified).toBe(true);
  });

  // Test 2: Reject verification with no token
  it('should reject verification without token', async () => {
    // ACTUAL TEST: Try to verify without token parameter
    const verifyResponse = await request(app)
      .get('/api/auth/verify-email'); // No ?token= parameter

    // ASSERTIONS: Should be rejected
    expect(verifyResponse.status).toBe(400);
    expect(verifyResponse.body).toHaveProperty('error');
    expect(verifyResponse.body.error).toContain('token');
  });

  // Test 3: Reject verification with invalid token
  it('should reject verification with invalid token', async () => {
    // ACTUAL TEST: Try to verify with token that doesn't exist in DB
    const verifyResponse = await request(app)
      .get('/api/auth/verify-email?token=invalid-token-12345');

    // ASSERTIONS: Should be rejected
    expect(verifyResponse.status).toBe(400);
    expect(verifyResponse.body).toHaveProperty('error');
    expect(verifyResponse.body.error).toMatch(/invalid|expired/i);
  });

  // Test 4: Reject verification with expired token
  it('should reject verification with expired token', async () => {
    // SETUP: Register a user
    const testUser = {
      name: 'Expired Token User',
      email: 'expired@test.com',
      password: 'Password123!'
    };

    await request(app)
      .post('/api/auth/register')
      .send(testUser);

    // Get the verification token
    const userResult = await pool.query(
      'SELECT email_verification_token FROM users WHERE email = $1',
      [testUser.email]
    );
    
    const token = userResult.rows[0].email_verification_token;

    // SIMULATE EXPIRATION: Manually set expiration to past
    // (In production, this would happen naturally after 24 hours)
    await pool.query(
      'UPDATE users SET email_verification_expires = $1 WHERE email = $2',
      [new Date(Date.now() - 1000), testUser.email] // 1 second ago
    );

    // ACTUAL TEST: Try to verify with expired token
    const verifyResponse = await request(app)
      .get(`/api/auth/verify-email?token=${token}`);

    // ASSERTIONS: Should be rejected
    expect(verifyResponse.status).toBe(400);
    expect(verifyResponse.body).toHaveProperty('error');
    expect(verifyResponse.body.error).toMatch(/expired/i);
  });
});

// ========================================
// PROTECTED ROUTE TESTS (Session 2)
// ========================================
describe('Protected Routes - JWT Middleware', () => {
  
  // Helper function to create and login a user, get token
  async function createAndLoginUser() {
    const testUser = {
      name: 'Protected Route User',
      email: 'protected@test.com',
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

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    return loginResponse.body.token;
  }

  // Test 1: Access protected route with valid token
  it('should allow access to protected route with valid JWT token', async () => {
    // SETUP: Get a valid token
    const token = await createAndLoginUser();

    // ACTUAL TEST: Access protected route with token
    // (Using /api/user/preferences as example protected route)
    const response = await request(app)
      .get('/api/user/preferences')
      .set('Authorization', `Bearer ${token}`); // ← JWT in Authorization header

    // ASSERTIONS: Should be allowed
    expect(response.status).toBe(200);
    // Should not get authentication error
    expect(response.body).not.toHaveProperty('error');
  });

  // Test 2: Reject access without token
  it('should reject access to protected route without token', async () => {
    // ACTUAL TEST: Try to access protected route WITHOUT Authorization header
    const response = await request(app)
      .get('/api/user/preferences');
    // Note: No .set('Authorization', ...) call!

    // ASSERTIONS: Should be rejected
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/token|unauthorized|authentication/i);
  });

  // Test 3: Reject access with invalid token
  it('should reject access to protected route with invalid token', async () => {
    // ACTUAL TEST: Try to access with fake/malformed token
    const response = await request(app)
      .get('/api/user/preferences')
      .set('Authorization', 'Bearer invalid-token-12345');

    // ASSERTIONS: Should be rejected
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/token|invalid|unauthorized/i);
  });

  // Test 4: Reject access with malformed Authorization header
  it('should reject access with malformed Authorization header', async () => {
    const token = await createAndLoginUser();

    // ACTUAL TEST: Send token without "Bearer " prefix
    const response = await request(app)
      .get('/api/user/preferences')
      .set('Authorization', token); // ← Missing "Bearer " prefix!

    // ASSERTIONS: Should be rejected
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  // Test 5: Reject access with expired token
  it('should reject access with expired JWT token', async () => {
    // This test requires generating a token with past expiration
    // We'll need to use jwt.sign directly to create an expired token
    
    const jwt = require('jsonwebtoken');
    
    // Create a token that expired 1 hour ago
    const expiredToken = jwt.sign(
      { 
        userId: 'test-user-id',
        email: 'test@example.com'
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' } // ← Negative time = already expired!
    );

    // ACTUAL TEST: Try to use expired token
    const response = await request(app)
      .get('/api/user/preferences')
      .set('Authorization', `Bearer ${expiredToken}`);

    // ASSERTIONS: Should be rejected
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/expired|invalid/i);
  });
});