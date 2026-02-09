import request from 'supertest';
import express from 'express';
import authRoutes from '../auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Routes', () => {
  
  describe('POST /api/auth/register', () => {
    
    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'Test123!',
          name: 'Test User'
          // email is missing!
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
    
    it('should return 400 if password is too weak', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',  // Too weak!
          name: 'Test User'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
    
  });
  
});