-- Direct SQL to fix IC numbers for 27 staff members
-- This script updates existing entries to have correct ICs from the image

SET FOREIGN_KEY_CHECKS = 0;

-- Update ZUNNOR
UPDATE users SET ic = '710515-06-5193' WHERE ic = 'T0139046113' AND role = 'teacher';
UPDATE teachers SET user_ic = '710515-06-5193' WHERE user_ic = 'T0139046113';
UPDATE classes SET guru_ic = '710515-06-5193' WHERE guru_ic = 'T0139046113';

-- Update MOHD NOOR
UPDATE users SET ic = '701108-06-5175' WHERE ic = 'T0199706272' AND role = 'teacher';
UPDATE teachers SET user_ic = '701108-06-5175' WHERE user_ic = 'T0199706272';
UPDATE classes SET guru_ic = '701108-06-5175' WHERE guru_ic = 'T0199706272';

-- Update RIZZAL (if exists with wrong IC)
UPDATE users SET ic = '731014-06-5251' WHERE nama LIKE '%RIZZAL%' AND role = 'teacher' AND ic != '731014-06-5251';
UPDATE teachers SET user_ic = '731014-06-5251' WHERE user_ic IN (SELECT ic FROM (SELECT ic FROM users WHERE nama LIKE '%RIZZAL%' AND role = 'teacher' AND ic != '731014-06-5251') AS temp);
UPDATE classes SET guru_ic = '731014-06-5251' WHERE guru_ic IN (SELECT ic FROM (SELECT ic FROM users WHERE nama LIKE '%RIZZAL%' AND role = 'teacher' AND ic != '731014-06-5251') AS temp);

SET FOREIGN_KEY_CHECKS = 1;

