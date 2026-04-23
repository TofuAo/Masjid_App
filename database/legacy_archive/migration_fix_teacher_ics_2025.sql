-- ==============================================
-- DATABASE MIGRATION: Fix Teacher ICs to Correct Format
-- MASJID NEGERI SULTAN AHMAD 1, KUANTAN
-- ==============================================
-- This script fixes incorrectly formatted ICs back to the correct format from the staff list

SET FOREIGN_KEY_CHECKS = 0;

-- Fix ICs based on the original staff list data
-- Format: YYMMDD-PB-G###G

-- Update users table with correct ICs
UPDATE users SET ic = '660322-06-5653' WHERE nama = 'ZANAL ABIDIN BIN ISMAIL' AND role = 'teacher';
UPDATE users SET ic = '691222-06-5287' WHERE nama = 'MOHAMMAD WAZAR BIN MOHD DAWI' AND role = 'teacher';
UPDATE users SET ic = '701108-06-5175' WHERE nama = 'MOHD NOOR BIN DIN' AND role = 'teacher';
UPDATE users SET ic = '710515-06-5193' WHERE nama = 'A. ZUNNOR BIN ABD RAHMAN' AND role = 'teacher';
UPDATE users SET ic = '720301-06-5533' WHERE nama = 'RUSDAN BIN ABDUL JALIL' AND role = 'teacher';
UPDATE users SET ic = '720323-06-5059' WHERE nama = 'SHAIFUDDIN BIN NGAH' AND role = 'teacher';
UPDATE users SET ic = '731014-06-5251' WHERE nama = 'TUAN HAJI MOHD RIZZAL BIN MOHD ALI NAFIAH' AND role = 'teacher';
UPDATE users SET ic = '740101-06-5000' WHERE nama = 'KHAIRUL AZZURA BINTI ISMAIL' AND role = 'teacher';
UPDATE users SET ic = '770704-06-5541' WHERE nama = 'AHMAD SHARIZAL BIN SAFFRIM' AND role = 'teacher';
UPDATE users SET ic = '811026-06-5435' WHERE nama = 'MOHD HASBULLAH BIN ABDULLAH @ ISMAIL' AND role = 'teacher';
UPDATE users SET ic = '840714-02-5376' WHERE nama = 'NABIJAH BINTI ZAKARIA' AND role = 'teacher';
UPDATE users SET ic = '870526-06-5845' WHERE nama = 'SYED FIRMAN SYAMIL BIN SYED AFFENDY' AND role = 'teacher';
UPDATE users SET ic = '891003-06-5929' WHERE nama = 'WAN MOHAMAD SYAFIQ BIN WAN NOORAZIZAN' AND role = 'teacher';
UPDATE users SET ic = '900102-06-6005' WHERE nama = 'MOHAMAD IZWANUDDIN BIN MOHD DAHALAN' AND role = 'teacher';
UPDATE users SET ic = '911115-06-5216' WHERE nama = 'NURUL SYAZWANI AISYAH BINTI RUSLI' AND role = 'teacher';
UPDATE users SET ic = '911210-06-5097' WHERE nama = 'MUHAMMAD IHSAN BIN MHD ZAHARI' AND role = 'teacher';
UPDATE users SET ic = '920312-06-5113' WHERE nama = 'AMIR HASIF BIN HATA' AND role = 'teacher';
UPDATE users SET ic = '921125-06-5606' WHERE nama = 'PUTRI ANATI BINTI AZAHAR' AND role = 'teacher';
UPDATE users SET ic = '930929-06-5390' WHERE nama = 'SYAHIRAH AISYAH BINTI SUFIAN' AND role = 'teacher';
UPDATE users SET ic = '931129-06-5047' WHERE nama = 'AHMAD HAYATUL FAIZ BIN ABD LATIF' AND role = 'teacher';
UPDATE users SET ic = '941218-07-5641' WHERE nama = 'MUHAMMAD SYAIFUL IZZHAR BIN ZULKIFLI' AND role = 'teacher';
UPDATE users SET ic = '950717-06-5661' WHERE nama = 'MUHAMMAD \'IZZAN BIN IDRIS' AND role = 'teacher';
UPDATE users SET ic = '951209-06-5192' WHERE nama = 'NURAIN NASUHA BINTI MOHD YUSOFF' AND role = 'teacher';
UPDATE users SET ic = '951220-06-5759' WHERE nama = 'MUHAMAD KHAIRUL MUSTAKIM BIN CHE AZIZ' AND role = 'teacher';
UPDATE users SET ic = '960505-06-5909' WHERE nama = 'MUHAMMAD HAFIZUDDIN BIN TAJUDDIN' AND role = 'teacher';
UPDATE users SET ic = '990124-06-5179' WHERE nama = 'MUHAMMAD ARIF HAFIZUDDIN BIN MOHD FADZLI' AND role = 'teacher';
UPDATE users SET ic = '991002-01-6189' WHERE nama = 'MOHAMAD SADIQ UMAIR BIN NAHAR' AND role = 'teacher';

-- Update classes table
UPDATE classes SET guru_ic = '660322-06-5653' WHERE guru_ic IN ('603220-60-5653', '6603220605653');
UPDATE classes SET guru_ic = '691222-06-5287' WHERE guru_ic IN ('912220-60-5287', '6912220605287');
UPDATE classes SET guru_ic = '701108-06-5175' WHERE guru_ic IN ('011080-60-5175', '7011080605175');
UPDATE classes SET guru_ic = '710515-06-5193' WHERE guru_ic IN ('105150-60-5193', '7105150605193');
UPDATE classes SET guru_ic = '720301-06-5533' WHERE guru_ic IN ('203010-60-5533', '7203010605533');
UPDATE classes SET guru_ic = '720323-06-5059' WHERE guru_ic IN ('203230-60-5059', '7203230605059');
UPDATE classes SET guru_ic = '731014-06-5251' WHERE guru_ic IN ('310140-60-5251', '7310140605251');
UPDATE classes SET guru_ic = '740101-06-5000' WHERE guru_ic IN ('401010-60-5000', '7401010605000');
UPDATE classes SET guru_ic = '770704-06-5541' WHERE guru_ic IN ('707040-60-5541', '7707040605541');
UPDATE classes SET guru_ic = '811026-06-5435' WHERE guru_ic IN ('110260-60-5435', '8110260605435');
UPDATE classes SET guru_ic = '840714-02-5376' WHERE guru_ic IN ('407140-20-5376', '8407140205376');
UPDATE classes SET guru_ic = '870526-06-5845' WHERE guru_ic IN ('705260-60-5845', '8705260605845');
UPDATE classes SET guru_ic = '891003-06-5929' WHERE guru_ic IN ('910030-60-5929', '8910030605929');
UPDATE classes SET guru_ic = '900102-06-6005' WHERE guru_ic IN ('001020-60-6005', '9001020606005');
UPDATE classes SET guru_ic = '911115-06-5216' WHERE guru_ic IN ('111150-60-5216', '9111150605216');
UPDATE classes SET guru_ic = '911210-06-5097' WHERE guru_ic IN ('112100-60-5097', '9112100605097');
UPDATE classes SET guru_ic = '920312-06-5113' WHERE guru_ic IN ('203120-60-5113', '9203120605113');
UPDATE classes SET guru_ic = '921125-06-5606' WHERE guru_ic IN ('211250-60-5606', '9211250605606');
UPDATE classes SET guru_ic = '930929-06-5390' WHERE guru_ic IN ('309290-60-5390', '9309290605390');
UPDATE classes SET guru_ic = '931129-06-5047' WHERE guru_ic IN ('311290-60-5047', '9311290605047');
UPDATE classes SET guru_ic = '941218-07-5641' WHERE guru_ic IN ('412180-70-5641', '9412180705641');
UPDATE classes SET guru_ic = '950717-06-5661' WHERE guru_ic IN ('507170-60-5661', '9507170605661');
UPDATE classes SET guru_ic = '951209-06-5192' WHERE guru_ic IN ('512090-60-5192', '9512090605192');
UPDATE classes SET guru_ic = '951220-06-5759' WHERE guru_ic IN ('512200-60-5759', '9512200605759');
UPDATE classes SET guru_ic = '960505-06-5909' WHERE guru_ic IN ('605050-60-5909', '9605050605909');
UPDATE classes SET guru_ic = '990124-06-5179' WHERE guru_ic IN ('901240-60-5179', '9901240605179');
UPDATE classes SET guru_ic = '991002-01-6189' WHERE guru_ic IN ('910020-10-6189', '9910020106189');

-- Update teachers table
UPDATE teachers SET user_ic = '660322-06-5653' WHERE user_ic IN ('603220-60-5653', '6603220605653');
UPDATE teachers SET user_ic = '691222-06-5287' WHERE user_ic IN ('912220-60-5287', '6912220605287');
UPDATE teachers SET user_ic = '701108-06-5175' WHERE user_ic IN ('011080-60-5175', '7011080605175');
UPDATE teachers SET user_ic = '710515-06-5193' WHERE user_ic IN ('105150-60-5193', '7105150605193');
UPDATE teachers SET user_ic = '720301-06-5533' WHERE user_ic IN ('203010-60-5533', '7203010605533');
UPDATE teachers SET user_ic = '720323-06-5059' WHERE user_ic IN ('203230-60-5059', '7203230605059');
UPDATE teachers SET user_ic = '731014-06-5251' WHERE user_ic IN ('310140-60-5251', '7310140605251');
UPDATE teachers SET user_ic = '740101-06-5000' WHERE user_ic IN ('401010-60-5000', '7401010605000');
UPDATE teachers SET user_ic = '770704-06-5541' WHERE user_ic IN ('707040-60-5541', '7707040605541');
UPDATE teachers SET user_ic = '811026-06-5435' WHERE user_ic IN ('110260-60-5435', '8110260605435');
UPDATE teachers SET user_ic = '840714-02-5376' WHERE user_ic IN ('407140-20-5376', '8407140205376');
UPDATE teachers SET user_ic = '870526-06-5845' WHERE user_ic IN ('705260-60-5845', '8705260605845');
UPDATE teachers SET user_ic = '891003-06-5929' WHERE user_ic IN ('910030-60-5929', '8910030605929');
UPDATE teachers SET user_ic = '900102-06-6005' WHERE user_ic IN ('001020-60-6005', '9001020606005');
UPDATE teachers SET user_ic = '911115-06-5216' WHERE user_ic IN ('111150-60-5216', '9111150605216');
UPDATE teachers SET user_ic = '911210-06-5097' WHERE user_ic IN ('112100-60-5097', '9112100605097');
UPDATE teachers SET user_ic = '920312-06-5113' WHERE user_ic IN ('203120-60-5113', '9203120605113');
UPDATE teachers SET user_ic = '921125-06-5606' WHERE user_ic IN ('211250-60-5606', '9211250605606');
UPDATE teachers SET user_ic = '930929-06-5390' WHERE user_ic IN ('309290-60-5390', '9309290605390');
UPDATE teachers SET user_ic = '931129-06-5047' WHERE user_ic IN ('311290-60-5047', '9311290605047');
UPDATE teachers SET user_ic = '941218-07-5641' WHERE user_ic IN ('412180-70-5641', '9412180705641');
UPDATE teachers SET user_ic = '950717-06-5661' WHERE user_ic IN ('507170-60-5661', '9507170605661');
UPDATE teachers SET user_ic = '951209-06-5192' WHERE user_ic IN ('512090-60-5192', '9512090605192');
UPDATE teachers SET user_ic = '951220-06-5759' WHERE user_ic IN ('512200-60-5759', '9512200605759');
UPDATE teachers SET user_ic = '960505-06-5909' WHERE user_ic IN ('605050-60-5909', '9605050605909');
UPDATE teachers SET user_ic = '990124-06-5179' WHERE user_ic IN ('901240-60-5179', '9901240605179');
UPDATE teachers SET user_ic = '991002-01-6189' WHERE user_ic IN ('910020-10-6189', '9910020106189');

SET FOREIGN_KEY_CHECKS = 1;

-- Verification
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
  AND nama IN (
    'ZANAL ABIDIN BIN ISMAIL',
    'MOHD NOOR BIN DIN',
    'A. ZUNNOR BIN ABD RAHMAN',
    'TUAN HAJI MOHD RIZZAL BIN MOHD ALI NAFIAH',
    'MOHAMMAD WAZAR BIN MOHD DAWI',
    'AHMAD HAYATUL FAIZ BIN ABD LATIF'
  )
ORDER BY nama;

