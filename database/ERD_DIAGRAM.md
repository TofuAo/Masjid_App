# Entity Relationship Diagram (ERD) - MyMasjidApp Database

## Database Schema Overview

This document contains the Entity Relationship Diagram for the MyMasjidApp database.

## ERD Diagram

```mermaid
erDiagram
    users ||--o{ students : "has"
    users ||--o{ teachers : "has"
    users ||--o{ classes : "teaches"
    users ||--o{ attendance : "attends"
    users ||--o{ results : "receives"
    users ||--o{ fees : "pays"
    users ||--o{ announcements : "creates"
    users ||--o{ staff_checkin : "checks_in"
    
    classes ||--o{ students : "enrolls"
    classes ||--o{ attendance : "tracks"
    classes ||--o{ exams : "conducts"
    
    exams ||--o{ results : "produces"
    
    users {
        VARCHAR ic PK "Primary Key"
        VARCHAR nama "NOT NULL"
        INT umur
        VARCHAR alamat
        VARCHAR telefon
        VARCHAR email "UNIQUE"
        VARCHAR password
        ENUM role "student,teacher,admin"
        ENUM status "aktif,tidak_aktif,cuti"
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    students {
        VARCHAR user_ic PK "FK -> users.ic"
        INT kelas_id "FK -> classes.id"
        DATE tarikh_daftar
    }
    
    teachers {
        VARCHAR user_ic PK "FK -> users.ic"
        JSON kepakaran
    }
    
    classes {
        INT id PK "Auto Increment"
        VARCHAR nama_kelas "NOT NULL"
        VARCHAR level
        VARCHAR jadual
        JSON sessions
        DECIMAL yuran
        VARCHAR guru_ic "FK -> users.ic"
        INT kapasiti
        ENUM status "aktif,tidak_aktif,penuh"
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    attendance {
        INT id PK "Auto Increment"
        VARCHAR student_ic "FK -> users.ic"
        INT class_id "FK -> classes.id"
        DATE tarikh
        ENUM status "Hadir,Tidak Hadir,Cuti"
        TEXT catatan
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    exams {
        INT id PK "Auto Increment"
        INT class_id "FK -> classes.id"
        VARCHAR subject
        DATE tarikh_exam
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    results {
        INT id PK "Auto Increment"
        VARCHAR student_ic "FK -> users.ic"
        INT exam_id "FK -> exams.id"
        INT markah
        VARCHAR gred
        VARCHAR slip_img
        TEXT catatan
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    fees {
        INT id PK "Auto Increment"
        VARCHAR student_ic "FK -> users.ic"
        DECIMAL jumlah
        ENUM status "Bayar,Belum Bayar,terbayar,tunggak,pending"
        DATE tarikh
        DATE tarikh_bayar
        VARCHAR bulan
        INT tahun
        VARCHAR cara_bayar
        VARCHAR no_resit
        VARCHAR resit_img
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    announcements {
        INT id PK "Auto Increment"
        VARCHAR title "NOT NULL"
        TEXT content "NOT NULL"
        VARCHAR author_ic "FK -> users.ic"
        ENUM status "draft,published,archived"
        ENUM priority "low,normal,high,urgent"
        ENUM target_audience "all,students,teachers,admin"
        DATETIME start_date
        DATETIME end_date
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
    
    staff_checkin {
        INT id PK "Auto Increment"
        VARCHAR staff_ic "FK -> users.ic"
        TIMESTAMP check_in_time
        TIMESTAMP check_out_time
        DECIMAL check_in_latitude
        DECIMAL check_in_longitude
        DECIMAL check_out_latitude
        DECIMAL check_out_longitude
        ENUM status "checked_in,checked_out"
        DECIMAL distance_from_masjid
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }
```

## Table Relationships

### Core Relationships

1. **users** (Master Table)
   - One-to-One with **students** (via `user_ic`)
   - One-to-One with **teachers** (via `user_ic`)
   - One-to-Many with **classes** (as teacher via `guru_ic`)
   - One-to-Many with **attendance** (as student via `student_ic`)
   - One-to-Many with **results** (via `student_ic`)
   - One-to-Many with **fees** (via `student_ic`)
   - One-to-Many with **announcements** (via `author_ic`)
   - One-to-Many with **staff_checkin** (via `staff_ic`)

2. **classes**
   - One-to-Many with **students** (via `kelas_id`)
   - One-to-Many with **attendance** (via `class_id`)
   - One-to-Many with **exams** (via `class_id`)

3. **exams**
   - One-to-Many with **results** (via `exam_id`)

## Key Constraints

- **Primary Keys**: Each table has a primary key (PK)
- **Foreign Keys**: Relationships are enforced via foreign key constraints
- **Cascade Deletes**: Most relationships use `ON DELETE CASCADE` to maintain referential integrity
- **Set Null**: Some relationships use `ON DELETE SET NULL` (e.g., students.kelas_id, classes.guru_ic)

## Notes

- The `users` table is the central entity that all other tables reference
- Students and Teachers are specializations of Users (inheritance pattern)
- All timestamps are automatically managed with `created_at` and `updated_at` columns
- The database uses MySQL/MariaDB with InnoDB engine for transaction support
