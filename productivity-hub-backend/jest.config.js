module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Only files with .test.ts or .spec.ts are tests
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Explicitly ignore these patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/helpers/',  // Ignore helper files
    '/config/',              // Ignore config files
  ],
  
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/migrate.ts',
    '!src/migrateTest.ts',
    '!src/verify-schema.ts',
    '!src/config/**',         // Don't include config in coverage
    '!src/__tests__/**',      // Don't include test helpers in coverage
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