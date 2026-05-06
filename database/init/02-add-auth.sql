-- Add authentication fields to users table
ALTER TABLE users 
ADD COLUMN password_hash TEXT,
ADD COLUMN password_change_required BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN login_enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN last_login TIMESTAMP;

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Set default password hash for existing users (password: TempPass123!)
-- This is bcrypt hash of "TempPass123!" - users will be required to change on first login
UPDATE users 
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eidnZh5y7K2m',
    password_change_required = TRUE,
    login_enabled = TRUE
WHERE password_hash IS NULL;
