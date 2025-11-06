import { Pool, PoolClient, QueryResult } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
// Import the new connection system that handles both development and production
import { pool, testConnection } from './db/connection';

dotenv.config();

interface MigrationRecord {
  id: number;
  filename: string;
  applied_at: Date;
}

const migrationsPath: string = path.resolve(process.cwd(), 'src', 'migrations');

function getPendingMigrations(
  allMigrations: string[], 
  appliedMigrations: string[]
): string[] {
  return allMigrations.filter((filename: string): boolean => {
    return !appliedMigrations.includes(filename);
  });
}

function extractFilenames(queryRows: MigrationRecord[]): string[] {
  return queryRows.map((row: MigrationRecord): string => row.filename);
}

function filterAndSortSqlFiles(allFiles: string[]): string[] {
  const sqlFiles: string[] = allFiles.filter((filename: string): boolean => {
    return filename.endsWith('.sql');
  });
  
  sqlFiles.sort();
  
  return sqlFiles;
}

async function setupMigrationTracking(): Promise<void> {
  console.log('🗃️  Setting up migration tracking...');
  
  const createTrackingTableSQL: string = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  try {
    const result: QueryResult = await pool.query(createTrackingTableSQL);
    console.log('✅ Migration tracking table ready');
    
    console.log('📊 Query result:', {
      command: result.command,
      rowCount: result.rowCount ?? 0
    });
    
  } catch (error: any) {
    console.error('❌ Failed to create tracking table:', error.message);
    throw error;
  }
}

function readMigrationsDirectory(): string[] {
  console.log('📁 Reading migrations directory...');
  console.log('📂 Directory path:', migrationsPath);
  
  try {
    const allFiles: string[] = fs.readdirSync(migrationsPath);
    console.log('📋 All files found:', allFiles);
    
    return allFiles;
    
  } catch (error: any) {
    console.error('❌ Cannot read migrations directory:', error.message);
    console.error('💡 Make sure the migrations directory exists and contains your .sql files');
    throw error;
  }
}

async function queryAppliedMigrations(): Promise<string[]> {
  console.log('🔍 Checking which migrations have already been applied...');
  
  try {
    const result: QueryResult<MigrationRecord> = await pool.query(`
      SELECT filename, applied_at 
      FROM schema_migrations 
      ORDER BY applied_at ASC
    `);
    
    console.log(`📋 Found ${result.rows.length} previously applied migrations:`);
    
    result.rows.forEach((row: MigrationRecord, index: number): void => {
      const appliedDate: string = new Date(row.applied_at).toLocaleString();
      console.log(`   ${index + 1}. ${row.filename} (applied: ${appliedDate})`);
    });
    
    return extractFilenames(result.rows);
    
  } catch (error: any) {
    console.error('❌ Failed to check applied migrations:', error.message);
    throw error;
  }
}

function readMigrationFile(filename: string): string {
  console.log(`📖 Reading migration file: ${filename}`);
  
  try {
    const filePath: string = path.join(migrationsPath, filename);
    console.log(`📂 Full file path: ${filePath}`);
    
    const sqlContent: string = fs.readFileSync(filePath, 'utf8');
    
    console.log(`📄 File size: ${sqlContent.length} characters`);
    console.log(`📄 Preview: ${sqlContent.substring(0, 100)}...`);
    
    return sqlContent;
    
  } catch (error: any) {
    console.error(`❌ Failed to read migration file ${filename}:`, error.message);
    console.error('💡 Check that the file exists and is readable');
    throw error;
  }
}

async function executeSingleMigration(filename: string): Promise<void> {
  console.log(`\n🚀 Starting migration: ${filename}`);
  
  const sqlContent: string = readMigrationFile(filename);
  
  const client: PoolClient = await pool.connect();
  console.log('🔌 Got dedicated database client for transaction');
  
  try {
    await client.query('BEGIN');
    console.log('📝 Transaction started (BEGIN)');
    
    console.log('⚡ Executing migration SQL...');
    const migrationResult: QueryResult = await client.query(sqlContent);
    
    console.log('✅ Migration SQL executed successfully');
    console.log(`📊 Database command: ${migrationResult.command}`);
    console.log(`📊 Rows affected: ${migrationResult.rowCount ?? 'unknown'}`);
    
    console.log('📝 Recording migration in tracking table...');
    const insertResult: QueryResult = await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename]
    );
    
    console.log('📝 Successfully recorded in schema_migrations table');
    console.log(`📝 Insert result: ${insertResult.rowCount ?? 0} row(s) inserted`);
    
    await client.query('COMMIT');
    console.log('✅ Transaction committed - all changes are permanent');
    
    console.log(`🎯 Migration ${filename} completed successfully!`);
    
  } catch (error: any) {
    console.error(`❌ Migration ${filename} failed:`, error.message);
    console.error('📋 Error details:', error.stack);
    
    try {
      await client.query('ROLLBACK');
      console.log('↩️  Transaction rolled back - database unchanged');
      
    } catch (rollbackError: any) {
      console.error('💥 CRITICAL: Rollback also failed:', rollbackError.message);
      console.error('⚠️  Database may be in inconsistent state - check manually');
    }
    
    throw error;
    
  } finally {
    client.release();
    console.log('🔌 Database client released back to connection pool');
  }
}

// =============================================================================
// LOGGING/PRESENTATION FUNCTIONS - HANDLE USER INTERFACE
// These functions focus solely on displaying information to the user
// =============================================================================

function logMigrationStatus(
  allMigrations: string[], 
  appliedMigrations: string[], 
  pendingMigrations: string[]
): void {
  console.log('🎯 Analyzing migration status...');
  
  allMigrations.forEach((filename: string): void => {
    const isPending: boolean = pendingMigrations.includes(filename);
    const status: string = isPending ? 'PENDING' : 'already applied';
    console.log(`   ${filename}: ${status}`);
  });
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   Total migration files: ${allMigrations.length}`);
  console.log(`   Already applied: ${appliedMigrations.length}`);
  console.log(`   Pending execution: ${pendingMigrations.length}`);
}

function logExecutionPlan(pendingMigrations: string[]): void {
  console.log('\n🚀 Migration execution plan:');
  console.log('   The following migrations will be applied:');
  
  pendingMigrations.forEach((filename: string, index: number): void => {
    console.log(`   ${index + 1}. ${filename}`);
  });
  
  console.log('');
}

// =============================================================================
// MAIN ORCHESTRATION FUNCTION - COORDINATES ALL THE PIECES
// =============================================================================

async function runMigrations(): Promise<void> {
  console.log('🔧 Database Migration Runner Starting...\n');
  
  try {
    // NEW: Test database connection first and show which database we're using
    await testConnection();
    console.log(''); // Add spacing after connection test
    
    await setupMigrationTracking();
    
    const allFiles: string[] = readMigrationsDirectory();
    
    const migrationFiles: string[] = filterAndSortSqlFiles(allFiles);
    
    if (migrationFiles.length === 0) {
      console.log('📝 No migration files found in directory.');
      console.log('💡 Add .sql files to the migrations directory to get started.');
      return;
    }
    
    const appliedMigrations: string[] = await queryAppliedMigrations();
    
    const pendingMigrations: string[] = getPendingMigrations(migrationFiles, appliedMigrations);
    
    logMigrationStatus(migrationFiles, appliedMigrations, pendingMigrations);
    
    if (pendingMigrations.length === 0) {
      console.log('\n✨ All migrations are up to date!');
      console.log('🎯 No action needed - database schema is current.');
      return;
    }
    
    logExecutionPlan(pendingMigrations);
    
    for (const filename of pendingMigrations) {
      await executeSingleMigration(filename);
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    console.log('✅ Database schema is now up to date.');
    
  } catch (error: any) {
    console.error('\n💥 Migration process failed:', error.message);
    console.error('❗ Database may be in an inconsistent state.');
    console.error('📋 Check the error messages above and fix the issue.');
    console.error('💡 You may need to manually clean up and retry.');
    
    process.exit(1);
    
  } finally {
    await pool.end();
    console.log('🔌 All database connections closed');
    console.log('👋 Migration runner finished');
  }
}

// =============================================================================
// MODULE EXECUTION AND EXPORTS
// =============================================================================
if (require.main === module) {
  runMigrations().catch((error: any) => {
    console.error('💥 Unhandled error in migration runner:', error);
    process.exit(1);
  });
}

export { 
  runMigrations,
  getPendingMigrations,
  extractFilenames,
  filterAndSortSqlFiles,
};

export type { MigrationRecord };