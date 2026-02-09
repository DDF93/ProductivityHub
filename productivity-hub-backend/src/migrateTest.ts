import './config/test';
import { runMigrations } from './migrate';

async function migrateTestDatabase() {
  console.log('Running migrations on TEST database...');
  console.log('Database URL:', process.env.DATABASE_URL);
  
  try {
    await runMigrations();
    console.log('✅ Test database migrations complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test database migration failed:', error);
    process.exit(1);
  }
}

migrateTestDatabase();