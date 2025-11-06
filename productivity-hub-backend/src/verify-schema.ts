// src/verify-schema.ts - Check what tables were created
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function verifySchema() {
  try {
    console.log('🔍 Verifying database schema...\n');

    const tablesResult = await pool.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log(`📊 Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name} (${row.table_type})`);
    });

    console.log('\n👤 Users table structure:');
    const usersResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    usersResult.rows.forEach((row) => {
      const nullable = row.is_nullable === 'YES' ? 'optional' : 'required';
      const defaultVal = row.column_default ? ` (default: ${row.column_default})` : '';
      console.log(`   - ${row.column_name}: ${row.data_type} (${nullable})${defaultVal}`);
    });

    console.log('\n🔗 Foreign key relationships:');
    const fkResult = await pool.query(`
      SELECT 
        tc.table_name as from_table,
        kcu.column_name as from_column,
        ccu.table_name as to_table,
        ccu.column_name as to_column,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name;
    `);

    if (fkResult.rows.length === 0) {
      console.log('   No foreign key relationships found');
    } else {
      fkResult.rows.forEach((row) => {
        console.log(`   ${row.from_table}.${row.from_column} → ${row.to_table}.${row.to_column} (${row.delete_rule})`);
      });
    }

    console.log('\n📜 Migration history:');
    const migrationsResult = await pool.query(`
      SELECT id, filename, applied_at 
      FROM schema_migrations 
      ORDER BY applied_at;
    `);

    migrationsResult.rows.forEach((row) => {
      const appliedTime = new Date(row.applied_at).toLocaleString();
      console.log(`   ${row.id}. ${row.filename} (${appliedTime})`);
    });

    console.log('\n✅ Database schema verification complete!');

  } catch (error: any) {
    console.error('❌ Schema verification failed:', error.message);
  } finally {
    await pool.end();
  }
}

verifySchema();