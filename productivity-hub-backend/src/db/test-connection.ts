import * as dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

console.log('🔍 Testing database connection...');
console.log('Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'productivity_hub_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'devpassword',
};

console.log('\n🔧 Connection config:');
console.log(config);

const pool = new Pool(config);

async function testConnection() {
  try {
    console.log('\n🚀 Attempting connection...');
    const client = await pool.connect();
    
    const result = await client.query('SELECT NOW() as current_time, current_database() as db_name');
    
    console.log('✅ Connection successful!');
    console.log('📅 Server time:', result.rows[0].current_time);
    console.log('🗃️ Database name:', result.rows[0].db_name);
    
    client.release();
    await pool.end();
    
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  }
}

testConnection();