-- Add access control and audit logging
-- This migration adds:
-- 1. Audit log table for tracking user logins and access
-- 2. Updates user roles to admin/client model
-- 3. Adds platform admin user

-- Create audit log table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    organization_id INT REFERENCES organizations(id),
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_organization ON audit_log(organization_id);

-- Update existing user roles to new model
-- Convert existing roles to 'client' (regular users can only see their org)
UPDATE users 
SET role = 'client' 
WHERE role IN ('executive', 'analyst', 'care_manager');

-- Keep existing admin as platform admin
-- Eric Hamilton is already admin, keep as is

-- Add platform admin user for Deepansh Arora
-- Using the same default password hash as other users (TempPass123!)
INSERT INTO users (organization_id, email, full_name, role, password_hash, password_change_required, login_enabled, active_flag)
VALUES (1, 'deepansh.arora@demoadmin.com', 'Deepansh Arora', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eidnZh5y7K2m', TRUE, TRUE, TRUE)
ON CONFLICT (email) DO UPDATE 
SET role = 'admin', 
    active_flag = TRUE,
    login_enabled = TRUE;

-- Add comment to document role types
COMMENT ON COLUMN users.role IS 'User role: admin (platform admin - sees all orgs) or client (sees only their org)';
