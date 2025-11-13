ALTER TABLE users
MODIFY COLUMN role ENUM('student','teacher','admin','pic') NOT NULL DEFAULT 'student';

