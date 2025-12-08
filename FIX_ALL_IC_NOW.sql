-- Force fix all IC numbers - Direct SQL approach
SET FOREIGN_KEY_CHECKS = 0;

-- Fix ZUNNOR
UPDATE users SET ic = '710515-06-5193' WHERE ic = 'T0139046113' AND role = 'teacher';
UPDATE teachers SET user_ic = '710515-06-5193' WHERE user_ic = 'T0139046113';
UPDATE classes SET guru_ic = '710515-06-5193' WHERE guru_ic = 'T0139046113';

-- Fix NOOR  
UPDATE users SET ic = '701108-06-5175' WHERE ic = 'T0199706272' AND role = 'teacher';
UPDATE teachers SET user_ic = '701108-06-5175' WHERE user_ic = 'T0199706272';
UPDATE classes SET guru_ic = '701108-06-5175' WHERE guru_ic = 'T0199706272';

-- Fix IHSAN
UPDATE users SET ic = '911210-06-5097' WHERE ic = 'T0162457106' AND role = 'teacher';
UPDATE teachers SET user_ic = '911210-06-5097' WHERE user_ic = 'T0162457106';
UPDATE classes SET guru_ic = '911210-06-5097' WHERE guru_ic = 'T0162457106';

-- Fix WAZAR
UPDATE users SET ic = '691222-06-5287' WHERE ic = 'T0139000168' AND role = 'teacher';
UPDATE teachers SET user_ic = '691222-06-5287' WHERE user_ic = 'T0139000168';
UPDATE classes SET guru_ic = '691222-06-5287' WHERE guru_ic = 'T0139000168';

-- Fix RIZZAL (by name pattern)
UPDATE users SET ic = '731014-06-5251' WHERE nama LIKE '%RIZZAL%' AND role = 'teacher' AND ic != '731014-06-5251';
UPDATE teachers SET user_ic = '731014-06-5251' WHERE user_ic IN (SELECT ic FROM (SELECT ic FROM users WHERE nama LIKE '%RIZZAL%' AND role = 'teacher' AND ic != '731014-06-5251') AS temp);
UPDATE classes SET guru_ic = '731014-06-5251' WHERE guru_ic IN (SELECT ic FROM (SELECT ic FROM users WHERE nama LIKE '%RIZZAL%' AND role = 'teacher' AND ic != '731014-06-5251') AS temp);

-- Fix IZZAN
UPDATE users SET ic = '950717-06-5661' WHERE nama LIKE '%IZZAN%' AND role = 'teacher' AND ic != '950717-06-5661';
UPDATE teachers SET user_ic = '950717-06-5661' WHERE user_ic IN (SELECT ic FROM (SELECT ic FROM users WHERE nama LIKE '%IZZAN%' AND role = 'teacher' AND ic != '950717-06-5661') AS temp);
UPDATE classes SET guru_ic = '950717-06-5661' WHERE guru_ic IN (SELECT ic FROM (SELECT ic FROM users WHERE nama LIKE '%IZZAN%' AND role = 'teacher' AND ic != '950717-06-5661') AS temp);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'IC updates completed' as status;

