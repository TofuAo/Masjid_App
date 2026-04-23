import fs from 'fs';
import path from 'path';

const sqlPath = 'c:\\MyMasjidApp\\database\\masjid_app_full_schema.sql';
let content = fs.readFileSync(sqlPath, 'utf8');

// Replace Attendance CREATE TABLE
const oldAttendance = `CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_ic VARCHAR(20),
    class_id INT,
    tarikh DATE,
    status ENUM('Hadir','Tidak Hadir','Cuti') DEFAULT 'Hadir',
    catatan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);`;

const newAttendance = `CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_ic VARCHAR(20),
    class_id INT,
    tarikh DATE,
    status ENUM('Hadir','Tidak Hadir','Cuti') DEFAULT 'Hadir',
    catatan TEXT,
    proof_image VARCHAR(255) NULL,
    marked_by VARCHAR(20) NULL,
    document_confirmed TINYINT(1) DEFAULT 0,
    confirmed_by VARCHAR(20) NULL,
    confirmed_at TIMESTAMP NULL,
    confirmation_notes TEXT NULL,
    approval_status VARCHAR(20) DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(ic) ON DELETE SET NULL,
    FOREIGN KEY (confirmed_by) REFERENCES users(ic) ON DELETE SET NULL,
    INDEX idx_proof_image (proof_image),
    INDEX idx_attendance_document_confirmed (document_confirmed)
);`;

// Replace Fees CREATE TABLE
const oldFees = `CREATE TABLE fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_ic VARCHAR(20),
    jumlah DECIMAL(10,2),
    status ENUM('Bayar','Belum Bayar','terbayar','tunggak','pending') DEFAULT 'Belum Bayar',
    tarikh DATE,
    tarikh_bayar DATE,
    bulan VARCHAR(20),
    tahun INT,
    cara_bayar VARCHAR(50),
    no_resit VARCHAR(50),
    resit_img VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_ic) REFERENCES users(ic) ON DELETE CASCADE
);`;

const newFees = `CREATE TABLE fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_ic VARCHAR(20),
    jumlah DECIMAL(10,2),
    status ENUM('Bayar','Belum Bayar','terbayar','tunggak','pending') DEFAULT 'Belum Bayar',
    tarikh DATE,
    tarikh_bayar DATE,
    bulan VARCHAR(20),
    tahun INT,
    cara_bayar VARCHAR(50),
    no_resit VARCHAR(50),
    resit_img VARCHAR(255),
    document_confirmed TINYINT(1) DEFAULT 0,
    confirmed_by VARCHAR(20) NULL,
    confirmed_at TIMESTAMP NULL,
    confirmation_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_ic) REFERENCES users(ic) ON DELETE CASCADE,
    FOREIGN KEY (confirmed_by) REFERENCES users(ic) ON DELETE SET NULL,
    INDEX idx_fees_document_confirmed (document_confirmed)
);`;

if (content.includes(oldAttendance)) {
    content = content.replace(oldAttendance, newAttendance);
    console.log("Replaced Attendance schema fully inline.");
} else {
    console.log("Could not find exact attendance CREATE TABLE syntax.");
}

if (content.includes(oldFees)) {
    content = content.replace(oldFees, newFees);
    console.log("Replaced Fees schema fully inline.");
} else {
    console.log("Could not find exact fees CREATE TABLE syntax.");
}

fs.writeFileSync(sqlPath, content, 'utf8');
console.log("masjid_app_full_schema.sql updated successfully.");
