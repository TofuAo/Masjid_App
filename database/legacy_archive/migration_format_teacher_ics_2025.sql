-- ==============================================
-- DATABASE MIGRATION: Format Teacher ICs Correctly
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- ==============================================
-- This script formats all teacher IC numbers to standard format: YYMMDD-PB-G###G
-- Standard Malaysian IC format: 12 digits with hyphens (e.g., 731014-06-5251)

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- ====================================================
-- STEP 1: Fix 13-digit ICs first (remove extra leading digit if needed)
-- ====================================================
-- For ICs with 13 digits, take the last 12 digits
UPDATE users SET ic = CONCAT(
    SUBSTRING(REPLACE(ic, '-', ''), -12, 6), '-',
    SUBSTRING(REPLACE(ic, '-', ''), -6, 2), '-',
    SUBSTRING(REPLACE(ic, '-', ''), -4, 4)
) WHERE role = 'teacher' 
  AND LENGTH(REPLACE(ic, '-', '')) = 13
  AND ic NOT LIKE 'T%'
  AND ic NOT LIKE '123456%';

-- ====================================================
-- STEP 2: Format all 12-digit ICs without hyphens to standard format
-- ====================================================
UPDATE users SET ic = CONCAT(
    SUBSTRING(REPLACE(ic, '-', ''), 1, 6), '-',
    SUBSTRING(REPLACE(ic, '-', ''), 7, 2), '-',
    SUBSTRING(REPLACE(ic, '-', ''), 9, 4)
) WHERE role = 'teacher' 
  AND LENGTH(REPLACE(ic, '-', '')) = 12
  AND ic NOT LIKE '%-%-%'
  AND ic NOT LIKE 'T%'
  AND ic NOT LIKE '123456%';

-- ====================================================
-- STEP 3: Update classes table to match new IC formats
-- ====================================================
UPDATE classes SET guru_ic = '660322-06-5653' WHERE guru_ic = '6603220605653';
UPDATE classes SET guru_ic = '691222-06-5287' WHERE guru_ic = '6912220605287';
UPDATE classes SET guru_ic = '701108-06-5175' WHERE guru_ic = '7011080605175';
UPDATE classes SET guru_ic = '710515-06-5193' WHERE guru_ic = '7105150605193';
UPDATE classes SET guru_ic = '720301-06-5533' WHERE guru_ic = '7203010605533';
UPDATE classes SET guru_ic = '720323-06-5059' WHERE guru_ic = '7203230605059';
UPDATE classes SET guru_ic = '731014-06-5251' WHERE guru_ic = '7310140605251';
UPDATE classes SET guru_ic = '740101-06-5000' WHERE guru_ic = '7401010605000';
UPDATE classes SET guru_ic = '770704-06-5541' WHERE guru_ic = '7707040605541';
UPDATE classes SET guru_ic = '811026-06-5435' WHERE guru_ic = '8110260605435';
UPDATE classes SET guru_ic = '840714-02-5376' WHERE guru_ic = '8407140205376';
UPDATE classes SET guru_ic = '870526-06-5845' WHERE guru_ic = '8705260605845';
UPDATE classes SET guru_ic = '891003-06-5929' WHERE guru_ic = '8910030605929';
UPDATE classes SET guru_ic = '900102-06-6005' WHERE guru_ic = '9001020606005';
UPDATE classes SET guru_ic = '911115-06-5216' WHERE guru_ic = '9111150605216';
UPDATE classes SET guru_ic = '911210-06-5097' WHERE guru_ic = '9112100605097';
UPDATE classes SET guru_ic = '920312-06-5113' WHERE guru_ic = '9203120605113';
UPDATE classes SET guru_ic = '921125-06-5606' WHERE guru_ic = '9211250605606';
UPDATE classes SET guru_ic = '930929-06-5390' WHERE guru_ic = '9309290605390';
UPDATE classes SET guru_ic = '931129-06-5047' WHERE guru_ic = '9311290605047';
UPDATE classes SET guru_ic = '941218-07-5641' WHERE guru_ic = '9412180705641';
UPDATE classes SET guru_ic = '950717-06-5661' WHERE guru_ic = '9507170605661';
UPDATE classes SET guru_ic = '951209-06-5192' WHERE guru_ic = '9512090605192';
UPDATE classes SET guru_ic = '951220-06-5759' WHERE guru_ic = '9512200605759';
UPDATE classes SET guru_ic = '960505-06-5909' WHERE guru_ic = '9605050605909';
UPDATE classes SET guru_ic = '990124-06-5179' WHERE guru_ic = '9901240605179';
UPDATE classes SET guru_ic = '991002-01-6189' WHERE guru_ic = '9910020106189';

-- ====================================================
-- STEP 4: Update teachers table to match new IC formats
-- ====================================================
UPDATE teachers SET user_ic = '660322-06-5653' WHERE user_ic = '6603220605653';
UPDATE teachers SET user_ic = '691222-06-5287' WHERE user_ic = '6912220605287';
UPDATE teachers SET user_ic = '701108-06-5175' WHERE user_ic = '7011080605175';
UPDATE teachers SET user_ic = '710515-06-5193' WHERE user_ic = '7105150605193';
UPDATE teachers SET user_ic = '720301-06-5533' WHERE user_ic = '7203010605533';
UPDATE teachers SET user_ic = '720323-06-5059' WHERE user_ic = '7203230605059';
UPDATE teachers SET user_ic = '731014-06-5251' WHERE user_ic = '7310140605251';
UPDATE teachers SET user_ic = '740101-06-5000' WHERE user_ic = '7401010605000';
UPDATE teachers SET user_ic = '770704-06-5541' WHERE user_ic = '7707040605541';
UPDATE teachers SET user_ic = '811026-06-5435' WHERE user_ic = '8110260605435';
UPDATE teachers SET user_ic = '840714-02-5376' WHERE user_ic = '8407140205376';
UPDATE teachers SET user_ic = '870526-06-5845' WHERE user_ic = '8705260605845';
UPDATE teachers SET user_ic = '891003-06-5929' WHERE user_ic = '8910030605929';
UPDATE teachers SET user_ic = '900102-06-6005' WHERE user_ic = '9001020606005';
UPDATE teachers SET user_ic = '911115-06-5216' WHERE user_ic = '9111150605216';
UPDATE teachers SET user_ic = '911210-06-5097' WHERE user_ic = '9112100605097';
UPDATE teachers SET user_ic = '920312-06-5113' WHERE user_ic = '9203120605113';
UPDATE teachers SET user_ic = '921125-06-5606' WHERE user_ic = '9211250605606';
UPDATE teachers SET user_ic = '930929-06-5390' WHERE user_ic = '9309290605390';
UPDATE teachers SET user_ic = '931129-06-5047' WHERE user_ic = '9311290605047';
UPDATE teachers SET user_ic = '941218-07-5641' WHERE user_ic = '9412180705641';
UPDATE teachers SET user_ic = '950717-06-5661' WHERE user_ic = '9507170605661';
UPDATE teachers SET user_ic = '951209-06-5192' WHERE user_ic = '9512090605192';
UPDATE teachers SET user_ic = '951220-06-5759' WHERE user_ic = '9512200605759';
UPDATE teachers SET user_ic = '960505-06-5909' WHERE user_ic = '9605050605909';
UPDATE teachers SET user_ic = '990124-06-5179' WHERE user_ic = '9901240605179';
UPDATE teachers SET user_ic = '991002-01-6189' WHERE user_ic = '9910020106189';

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================
-- VERIFICATION: Check formatted ICs
-- ====================================================
SELECT 
    ic,
    nama,
    LENGTH(REPLACE(ic, '-', '')) as digit_count,
    CASE 
        WHEN ic LIKE '%-%-%' AND LENGTH(REPLACE(ic, '-', '')) = 12 THEN '✅ Correct'
        WHEN ic LIKE 'T%' THEN '⚠️ Placeholder'
        ELSE '❌ Needs Fix'
    END as status
FROM users 
WHERE role = 'teacher' 
ORDER BY 
    CASE WHEN ic LIKE 'T%' THEN 1 ELSE 0 END,
    ic;
