# 📚 Link Students Batch 2 to Class

## ✅ Students Created

**22 students** have been created in the database.

### Special Cases Handled ✅

1. **DZAWANI BT MUHAMAD** 
   - ✅ Linked to: ASAS - IMAM HANAFI (USTAZ IZMAN)
   - Schedule: SABTU & AHAD (9.00 am - 10.30 am)
   - Note: "TUKAR WAKTU KELAS (USTAZ IZMAN)"

2. **MD AZUANDY BIN MD ARIFFIN**
   - ✅ Linked to: TAHSIN ASAS - IMAM MALIKI (US ZULKIFLI)
   - Schedule: SELASA & KHAMIS (9.00 pm - 10.30 pm)
   - Note: "PINDAH PERINGKAT TAHSIN ASAS (US ZULKIFLI)"

### Main Group (20 students) - Need to Link

The following 20 students need to be linked to a class:

1. MOHD AZWAN BIN ABDULLAH
2. AZDALINA BINTI BAKAR
3. MASITAH BINTI TAHIR
4. MD ZAIDEY BIN ABD KADIR
5. ADI FAZULI BIN MAMAT
6. WAN SAHIZAN WAN ISAMAIL
7. MOHD NIZAM BIN MOHD ISA
8. MOHAMAD FAKHRUL ADHAM BIN WAHID
9. NUR SHARMILA BT SABRI
10. RAHAYU BT JUSOH EMBONG
11. FAUZIAH BINTI DAUD
12. MOHD KHAIRUL IDWAN BIN MOHD ABIDIN
13. SYED MOHD SOHAIMI BIN SYED NORDIN
14. NORMAH BINTI ABDUL MALEK
15. NORLELAWATI BINTI ABDUL MANAF
16. NORSUHAILA BINTI MOHD GHAZALI
17. FAKHRUL ASYRAF BIN ABDULLAH
18. MUHAMMAD ILYAS HANIF BIN SHAMSUDDIN
19. NORMI FATHUL SHUHADA BINTI ABI RAHMAN
20. MOHAMMAD HASIF BIN AB RAHMAN

## 🔗 Link Main Group to Class

**To link these 20 students, please provide:**
- Class level (e.g., ASAS, PERTENGAHAN, LANJUTAN, etc.)
- Teacher name
- Schedule (e.g., ISNIN & RABU, SELASA & KHAMIS, etc.)
- Time slot (e.g., 5.00 petang - 6.30 petang, 9.00 malam - 10.30 malam, etc.)

Or use this SQL command (replace `[CLASS_ID]` with the actual class ID):

```sql
INSERT INTO students (user_ic, kelas_id, tarikh_daftar)
SELECT u.ic, [CLASS_ID], CURDATE()
FROM users u
WHERE u.ic IN (
    'S01999278126', 'S0199928468', 'S0125027773', 'S0196125377', 'S0123130312',
    'S0178148442', 'S0169898008', 'S0142947672', 'S01128940369', 'S0169890009',
    'S0129853151', 'S0179744113', 'S01393204661', 'S0179732709', 'S0139336162',
    'S0132629753', 'S01119474459', 'S0179881676', 'S0189020187', 'S01137587089'
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

