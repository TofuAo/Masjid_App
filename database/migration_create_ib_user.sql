-- Migration: Create IB (Master Admin) User
-- IC: 731014-06-5251 (normalized: 731014065251)
-- Password: Rizzal731051
-- Name: IB Master Admin (can be updated later)

-- Normalize IC (remove hyphens)
SET @ib_ic = '731014065251';
SET @ib_nama = 'IB Master Admin';
SET @ib_email = 'ib@masjid.app'; -- Can be updated
SET @ib_password = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5K5XvJ5K5K5K5'; -- Placeholder - needs actual hash

-- Check if user already exists
SET @user_exists = (SELECT COUNT(*) FROM users WHERE ic = @ib_ic OR REPLACE(ic, '-', '') = @ib_ic);

-- Insert IB user if not exists
-- Note: Password will need to be set via admin panel or password reset
INSERT INTO users (ic, nama, email, password, role, status, created_at, updated_at)
VALUES (
    @ib_ic,
    @ib_nama,
    @ib_email,
    @ib_password, -- Placeholder hash - will be updated
    'ib',
    'aktif',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE 
    nama = COALESCE(@ib_nama, nama),
    email = COALESCE(@ib_email, email),
    role = 'ib',
    status = 'aktif',
    updated_at = CURRENT_TIMESTAMP;

-- Verify the user was created
SELECT 
    ic,
    nama,
    email,
    role,
    status,
    'User created successfully. Password needs to be set via admin panel.' as note
FROM users 
WHERE ic = @ib_ic;

-- IMPORTANT: After running this migration, you need to set the password:
-- Option 1: Use admin panel to change password for this user
-- Option 2: Run a password update query with properly hashed password
-- Option 3: Use password reset feature
