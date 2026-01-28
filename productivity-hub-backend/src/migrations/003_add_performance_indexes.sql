-- Migration: Add performance indexes for frequently queried columns
-- Created: 2026-01-23
-- Purpose: Improve query performance on users table

-- ============================================================================
-- INDEX 2: Email verification token lookup
-- ============================================================================
-- Why: Email verification searches by token
-- Impact: Speeds up the "click verification link" flow
-- Usage: WHERE email_verification_token = '...'
CREATE INDEX IF NOT EXISTS idx_users_verification_token 
ON users(email_verification_token);

-- ============================================================================
-- INDEX 3: Composite index for verified users
-- ============================================================================
-- Why: Auth middleware checks BOTH id AND email_verified together
-- Impact: Optimizes the most frequent query in the entire app
-- Usage: WHERE id = '...' AND email_verified = true
CREATE INDEX IF NOT EXISTS idx_users_id_verified 
ON users(id, email_verified) 
WHERE email_verified = true;

-- ============================================================================
-- OPTIONAL: Partial index for unverified users (future cleanup)
-- ============================================================================
-- Why: You might want to find old unverified accounts to delete
-- Impact: Makes cleanup queries fast
-- Usage: WHERE email_verified = false AND created_at < ...
CREATE INDEX IF NOT EXISTS idx_users_unverified 
ON users(created_at) 
WHERE email_verified = false;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to confirm indexes were created:

-- List all indexes on users table:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'users';

-- Verify query now uses index:
-- EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
-- (Should show "Index Scan" instead of "Seq Scan")