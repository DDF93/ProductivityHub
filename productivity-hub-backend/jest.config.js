module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/helpers/',
    '/config/',
  ],
  
  // Use wildcards to match anywhere in path
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    'server.ts',                    // ← Remove leading slash, matches anywhere
    'test-email.ts',                // ← Matches any test-email.ts
    'test-connection.ts',           // ← Matches any test-connection.ts
    'connection.ts',                // ← Matches any connection.ts (if you want to exclude it)
    'migrate.ts',
    'migrateTest.ts',
    'verify-schema.ts',
    '/config/',
    '/__tests__/',
  ],
  
  collectCoverageFrom: [
    'src/**/*.ts',                  // Include all .ts files in src
    '!src/**/*.test.ts',            // Exclude test files
    '!src/**/*.spec.ts',            // Exclude spec files
    '!src/**/test-*.ts',            // ← Exclude any file starting with "test-"
    '!src/**/migrate*.ts',          // ← Exclude migration files
    '!src/**/verify-*.ts',          // ← Exclude verification scripts
    '!src/server.ts',               // Exclude server startup
    '!src/config/**',               // Exclude config directory
    '!src/__tests__/**',            // Exclude test helpers
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};