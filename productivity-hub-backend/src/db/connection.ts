import '../config/test';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const developmentConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'productivity_hub_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'devpassword',
};

const productionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
};

const testConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: false  // Docker doesn't support SSL
};

const dbConfig = isTest ? testConfig : (isDevelopment ? developmentConfig : productionConfig);

console.log(`🔌 Database mode: ${process.env.NODE_ENV || 'development'}`);
console.log(`📍 Connecting to: ${isDevelopment ? 'Local Docker PostgreSQL' : isTest ? 'Local Docker Test Database' : 'Railway PostgreSQL'}`);

export const pool = new Pool(dbConfig);

export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        NOW() as current_time, 
        current_database() as db_name,
        version() as postgres_version
    `);
    
    const row = result.rows[0];
    
    console.log('✅ Database connected successfully');
    console.log(`📅 Server time: ${row.current_time}`);
    console.log(`🗃️  Database name: ${row.db_name}`);
    console.log(`🐘 PostgreSQL version: ${row.postgres_version.split(',')[0]}`);
    
    client.release();
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    throw error; 
  }
}