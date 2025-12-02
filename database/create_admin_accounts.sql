-- Create Admin Accounts for MyMasjidApp
-- This script creates the 3 admin accounts with properly hashed passwords

-- Note: These passwords are hashed using bcrypt with salt rounds 12
-- IC: 920312065113, Password: Amir920313
-- IC: 951220065759, Password: Khai951259  
-- IC: 941218075641, Password: Izz941241

-- Delete existing admins if they exist (optional - comment out if you want to keep existing admins)
-- DELETE FROM users WHERE role = 'admin';

-- Insert Admin 1: USTAZ AMIR HASIF BIN HATA
-- Delete if exists first, then insert
DELETE FROM users WHERE REPLACE(ic, '-', '') = '920312065113';
INSERT INTO users (ic, nama, password, role, status, created_at, updated_at)
VALUES (
  '920312065113',
  'USTAZ AMIR HASIF BIN HATA',
  '$2a$12$0RdYCA0Exxyh4GyVEL1Uyu90H3N69DdqdM1PDj.3JXvGh9CJW9Jpu',
  'admin',
  'aktif',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Insert Admin 2: USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ
DELETE FROM users WHERE REPLACE(ic, '-', '') = '951220065759';
INSERT INTO users (ic, nama, password, role, status, created_at, updated_at)
VALUES (
  '951220065759',
  'USTAZ MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ',
  '$2a$12$dzmNIzsRBST1EbjNDs75iOzLnWD54uKYeOscFH/eLPK6VC3g8bEve',
  'admin',
  'aktif',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Insert Admin 3: USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI
DELETE FROM users WHERE REPLACE(ic, '-', '') = '941218075641';
INSERT INTO users (ic, nama, password, role, status, created_at, updated_at)
VALUES (
  '941218075641',
  'USTAZ MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI',
  '$2a$12$HSZI9YHc60OGQB53Q0e8Bu7FCjpLpqZ4WpngiMMu8ec5fQm/F4xlG',
  'admin',
  'aktif',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Verify the accounts were created
SELECT ic, nama, role, status FROM users WHERE role = 'admin';

