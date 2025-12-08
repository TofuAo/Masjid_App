-- Verify IC Numbers Against Image Data
-- This SQL script checks if all staff have correct IC numbers

-- Check users with correct ICs from image
SELECT 
    'CORRECT ICs' as status,
    ic,
    nama,
    role
FROM users
WHERE ic IN (
    '731014-06-5251', '950717-06-5661', '660322-06-5653', '710515-06-5193',
    '701108-06-5175', '740101-06-5000', '720323-06-5059', '930929-06-5390',
    '911210-06-5097', '900102-06-6005', '870526-06-5845', '770704-06-5541',
    '811026-06-5435', '920312-06-5113', '960505-06-5909', '951220-06-5759',
    '941218-07-5641', '921125-06-5606', '951209-06-5192', '931129-06-5047',
    '840714-02-5376', '911115-06-5216', '891003-06-5929', '990124-06-5179',
    '720301-06-5533', '691222-06-5287', '991002-01-6189'
)
ORDER BY nama;

-- Check for users with phone number format ICs (T0...)
SELECT 
    'PHONE FORMAT ICs' as status,
    ic,
    nama,
    role
FROM users
WHERE ic LIKE 'T%' AND role IN ('teacher', 'staff', 'admin', 'pic')
ORDER BY nama;

-- Check for invalid IC formats
SELECT 
    'INVALID FORMAT ICs' as status,
    ic,
    nama,
    role
FROM users
WHERE role IN ('teacher', 'staff', 'admin', 'pic')
  AND ic NOT REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$'
  AND ic NOT LIKE 'T%'
ORDER BY nama;

-- Count by IC format type
SELECT 
    CASE 
        WHEN ic REGEXP '^[0-9]{6}-[0-9]{2}-[0-9]{4}$' THEN 'Valid IC Format'
        WHEN ic LIKE 'T%' THEN 'Phone Format (T...)'
        ELSE 'Other/Invalid Format'
    END as ic_type,
    COUNT(*) as count
FROM users
WHERE role IN ('teacher', 'staff', 'admin', 'pic')
GROUP BY ic_type;

