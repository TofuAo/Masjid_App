-- Direct SQL to fix IC numbers
SET FOREIGN_KEY_CHECKS = 0;

-- Fix ZUNNOR
UPDATE users SET ic = '710515-06-5193' WHERE ic = 'T0139046113' AND role = 'teacher';
UPDATE teachers SET user_ic = '710515-06-5193' WHERE user_ic = 'T0139046113';
UPDATE classes SET guru_ic = '710515-06-5193' WHERE guru_ic = 'T0139046113';

-- Fix NOOR
UPDATE users SET ic = '701108-06-5175' WHERE ic = 'T0199706272' AND role = 'teacher';
UPDATE teachers SET user_ic = '701108-06-5175' WHERE user_ic = 'T0199706272';
UPDATE classes SET guru_ic = '701108-06-5175' WHERE guru_ic = 'T0199706272';

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'IC updates completed' as status;

