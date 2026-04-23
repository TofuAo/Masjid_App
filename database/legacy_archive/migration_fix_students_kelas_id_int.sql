-- Fix "Out of range value for column 'kelas_id' at row N" when students.kelas_id or exam_class_id was TINYINT/SMALLINT.
-- Run once: ensures kelas_id and exam_class_id are INT so class IDs > 255 (or > 127) are valid.

-- kelas_id: allow NULL to match schema (FK to classes.id ON DELETE SET NULL)
ALTER TABLE students MODIFY COLUMN kelas_id INT NULL COMMENT 'Class reference';

-- exam_class_id: only if column exists (added by ensureClassChangeTables)
-- ALTER TABLE students MODIFY COLUMN exam_class_id INT NULL COMMENT 'Temporary exam class';
