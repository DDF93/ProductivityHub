-- Add name column to users table
ALTER TABLE users 
ADD COLUMN name VARCHAR(255);

-- Make it required for new users (existing rows will have NULL)
-- You can optionally update existing rows first if needed:
-- UPDATE users SET name = 'User' WHERE name IS NULL;

-- Then make it NOT NULL:
ALTER TABLE users 
ALTER COLUMN name SET NOT NULL;