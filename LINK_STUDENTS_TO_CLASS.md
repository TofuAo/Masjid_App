# 📚 Link Students to Class

## ✅ Students Created

**15 students** have been created in the database (HAJJAH FADZILAH appears twice in source but only one entry created).

### Student List:
1. ROHANAH BINTI ATAN
2. SITI HAFIZAH BINTI AMJAD ALI
3. NORMALA BINTI NGAH
4. MUHAMMAD ZAMRI BIN MANSOR
5. ROSLELAWATI BINTI ARHAM
6. ZAKARIA BIN MUHAMMAD
7. MOHAMAD HAZIQ BIN ABU OTHMAN
8. NURULHUDA BINTI MOHD JOHARI
9. HAJJAH FADZILAH BINTI HJ OMAR (duplicate removed)
10. WAN ADNAN BIN WAN SHAFIE
11. SHAHRIL AZLIN BIN MOHTAR
12. NUR AFIFAH BINTI HAZLAN
13. NOR HALIZA BINTI MD AMIN
14. CHE IZANI BIN CHE HASSAN
15. WAN ANIZAR BINTI WAN MALEK

## 🔗 Link Students to Class

**To link these students to a specific class, please provide:**
- Class name / level (e.g., ASAS, PERTENGAHAN, etc.)
- Teacher name
- Schedule (e.g., ISNIN & RABU, SELASA & KHAMIS, etc.)
- Time slot (e.g., 5.00 petang - 6.30 petang, 9.00 malam - 10.30 malam, etc.)

Or use this SQL command (replace `[CLASS_ID]` with the actual class ID):

```sql
INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT u.ic, [CLASS_ID], CURDATE()
FROM users u
WHERE u.ic IN (
    'S0124664455', 'S0139819437', 'S0132407202', 'S01160902509', 'S0139219059',
    'S0139346402', 'S0192575907', 'S0195462234', 'S0123712446', 'S0199330260',
    'S0139184575', 'S0189076844', 'S0199639857', 'S0199285947', 'S0129486132'
)
ON DUPLICATE KEY UPDATE tarikh_daftar = VALUES(tarikh_daftar);
```

## 📋 Available Classes

To see available classes, run:
```sql
SELECT c.id, c.nama_kelas, c.level, c.jadual, u.nama as guru_nama
FROM classes c
LEFT JOIN users u ON c.guru_ic = u.ic
WHERE c.status = 'aktif'
ORDER BY c.level, c.nama_kelas;
```

