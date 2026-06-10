-- MyMasjidApp Complete Database Schema
-- Generated automatically from current working database

SET FOREIGN_KEY_CHECKS=0;

-- Table structure for `achievements`
DROP TABLE IF EXISTS `achievements`;
CREATE TABLE IF NOT EXISTS `achievements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT 'trophy',
  `category` enum('attendance','academic','payment','social','milestone','special') NOT NULL,
  `points_reward` int(11) DEFAULT 0,
  `requirement_type` varchar(50) DEFAULT NULL,
  `requirement_value` int(11) DEFAULT NULL,
  `badge_color` varchar(20) DEFAULT 'gold',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_category` (`category`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `admin_action_snapshots`
DROP TABLE IF EXISTS `admin_action_snapshots`;
CREATE TABLE IF NOT EXISTS `admin_action_snapshots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `operation` enum('create','update','delete') NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_by` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `was_undone` tinyint(1) DEFAULT 0,
  `undone_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_admin_snapshots_entity` (`entity_type`,`entity_id`),
  KEY `idx_admin_snapshots_expires` (`expires_at`),
  KEY `idx_admin_snapshots_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `admin_logs`
DROP TABLE IF EXISTS `admin_logs`;
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_ic` varchar(20) NOT NULL,
  `action` varchar(100) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_al_admin` (`admin_ic`),
  KEY `idx_al_created` (`created_at`),
  KEY `idx_al_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `announcements`
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `author_ic` varchar(20) NOT NULL,
  `status` enum('draft','published','archived') DEFAULT 'published',
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `target_audience` enum('all','students','teachers','admin') DEFAULT 'all',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `author_ic` (`author_ic`),
  KEY `idx_announcements_status` (`status`),
  KEY `idx_announcements_target_audience` (`target_audience`),
  KEY `idx_announcements_dates` (`start_date`,`end_date`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`author_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `appointments`
DROP TABLE IF EXISTS `appointments`;
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `tarikh` date DEFAULT NULL,
  `hari` varchar(20) DEFAULT NULL,
  `masa` varchar(50) DEFAULT NULL,
  `guru_ic` varchar(20) DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `created_by_ic` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_tarikh` (`tarikh`),
  KEY `idx_guru` (`guru_ic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `archived_students`
DROP TABLE IF EXISTS `archived_students`;
CREATE TABLE IF NOT EXISTS `archived_students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_ic` varchar(20) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `umur` int(11) DEFAULT NULL,
  `alamat` varchar(255) DEFAULT NULL,
  `telefon` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `kelas_id` int(11) DEFAULT NULL,
  `tarikh_daftar` date DEFAULT NULL,
  `tarikh_arkib` date DEFAULT current_timestamp(),
  `alasan_arkib` varchar(500) DEFAULT NULL,
  `archived_by` varchar(20) DEFAULT NULL,
  `original_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`original_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_ic` (`user_ic`),
  KEY `idx_tarikh_arkib` (`tarikh_arkib`),
  KEY `kelas_id` (`kelas_id`),
  CONSTRAINT `archived_students_ibfk_1` FOREIGN KEY (`kelas_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `attendance`
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_ic` varchar(20) DEFAULT NULL,
  `class_id` int(11) DEFAULT NULL,
  `tarikh` date DEFAULT NULL,
  `status` enum('Hadir','Tidak Hadir','Cuti') DEFAULT 'Hadir',
  `catatan` text DEFAULT NULL,
  `proof_image` varchar(255) DEFAULT NULL,
  `marked_by` varchar(20) DEFAULT NULL,
  `document_confirmed` tinyint(1) DEFAULT 0,
  `confirmed_by` varchar(20) DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `confirmation_notes` text DEFAULT NULL,
  `approval_status` varchar(20) DEFAULT 'sent',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `student_ic` (`student_ic`),
  KEY `class_id` (`class_id`),
  KEY `marked_by` (`marked_by`),
  KEY `confirmed_by` (`confirmed_by`),
  KEY `idx_proof_image` (`proof_image`),
  KEY `idx_attendance_document_confirmed` (`document_confirmed`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`marked_by`) REFERENCES `users` (`ic`) ON DELETE SET NULL,
  CONSTRAINT `attendance_ibfk_4` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`ic`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `budgets`
DROP TABLE IF EXISTS `budgets`;
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `budget_type` enum('income','expense') NOT NULL,
  `allocated_amount` decimal(10,2) NOT NULL,
  `spent_amount` decimal(10,2) DEFAULT 0.00,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `status` enum('draft','active','completed','cancelled') DEFAULT 'draft',
  `created_by` varchar(20) NOT NULL COMMENT 'IC of creator',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_budget_type` (`budget_type`),
  KEY `idx_status` (`status`),
  KEY `idx_period` (`period_start`,`period_end`),
  CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`ic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `campus_life_items`
DROP TABLE IF EXISTS `campus_life_items`;
CREATE TABLE IF NOT EXISTS `campus_life_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `tarikh` date DEFAULT NULL,
  `hari` varchar(20) DEFAULT NULL,
  `masa` varchar(50) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_by_ic` varchar(20) DEFAULT NULL,
  `reviewed_by_ic` varchar(20) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `category` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reviewed_by_ic` (`reviewed_by_ic`),
  KEY `idx_status` (`status`),
  KEY `idx_created_by` (`created_by_ic`),
  KEY `idx_tarikh` (`tarikh`),
  CONSTRAINT `campus_life_items_ibfk_1` FOREIGN KEY (`created_by_ic`) REFERENCES `users` (`ic`) ON DELETE SET NULL,
  CONSTRAINT `campus_life_items_ibfk_2` FOREIGN KEY (`reviewed_by_ic`) REFERENCES `users` (`ic`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `class_assignments`
DROP TABLE IF EXISTS `class_assignments`;
CREATE TABLE IF NOT EXISTS `class_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_ic` varchar(20) NOT NULL COMMENT 'Student user_ic (IC)',
  `class_id` int(11) NOT NULL,
  `assignment_type` enum('permanent','exam') NOT NULL DEFAULT 'permanent',
  `exam_session_id` int(11) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ca_student` (`student_ic`),
  KEY `idx_ca_class` (`class_id`),
  KEY `idx_ca_active` (`is_active`),
  KEY `idx_ca_dates` (`start_date`,`end_date`),
  CONSTRAINT `class_assignments_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student-class assignments: permanent + temporary exam';

-- Table structure for `class_change_log`
DROP TABLE IF EXISTS `class_change_log`;
CREATE TABLE IF NOT EXISTS `class_change_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_ic` varchar(20) NOT NULL COMMENT 'IC of admin who made the change',
  `student_ic` varchar(20) NOT NULL COMMENT 'Student IC',
  `from_class_id` int(11) DEFAULT NULL COMMENT 'Previous class ID',
  `to_class_id` int(11) NOT NULL COMMENT 'New class ID',
  `assignment_type` enum('permanent','exam') NOT NULL DEFAULT 'permanent',
  `end_date` date DEFAULT NULL COMMENT 'For exam: when assignment ends',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_class_change_student` (`student_ic`),
  KEY `idx_class_change_created` (`created_at`),
  KEY `idx_class_change_admin` (`admin_ic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit log for student class changes';

-- Table structure for `classes`
DROP TABLE IF EXISTS `classes`;
CREATE TABLE IF NOT EXISTS `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_kelas` varchar(100) NOT NULL,
  `level` varchar(50) DEFAULT NULL,
  `jadual` varchar(100) DEFAULT NULL,
  `sessions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`sessions`)),
  `yuran` decimal(10,2) DEFAULT 0.00,
  `guru_ic` varchar(20) DEFAULT NULL,
  `kapasiti` int(11) DEFAULT 20,
  `status` enum('aktif','tidak_aktif','penuh') DEFAULT 'aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `guru_ic` (`guru_ic`),
  CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`guru_ic`) REFERENCES `users` (`ic`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `contact_submissions`
DROP TABLE IF EXISTS `contact_submissions`;
CREATE TABLE IF NOT EXISTS `contact_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `subject` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `contact_method` enum('email','whatsapp','both') DEFAULT 'email',
  `status` enum('pending','sent','read','replied','archived') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `document_access_logs`
DROP TABLE IF EXISTS `document_access_logs`;
CREATE TABLE IF NOT EXISTS `document_access_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_id` int(11) NOT NULL,
  `user_ic` varchar(20) NOT NULL,
  `action` enum('view','download','upload','update','delete') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_document_id` (`document_id`),
  KEY `idx_user_ic` (`user_ic`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `document_access_logs_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `document_access_logs_ibfk_2` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `documents`
DROP TABLE IF EXISTS `documents`;
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_name` varchar(500) NOT NULL,
  `file_path` varchar(1000) NOT NULL,
  `file_size` bigint(20) NOT NULL COMMENT 'Size in bytes',
  `file_type` varchar(100) NOT NULL COMMENT 'MIME type',
  `category` enum('general','announcement','result','fee','event','class','other') DEFAULT 'general',
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of tags' CHECK (json_valid(`tags`)),
  `is_public` tinyint(1) DEFAULT 0,
  `access_level` enum('public','students','teachers','admin','custom') DEFAULT 'public',
  `allowed_roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of allowed roles for custom access' CHECK (json_valid(`allowed_roles`)),
  `uploaded_by` varchar(20) NOT NULL COMMENT 'IC of uploader',
  `download_count` int(11) DEFAULT 0,
  `version` int(11) DEFAULT 1,
  `parent_document_id` int(11) DEFAULT NULL COMMENT 'For versioning',
  `status` enum('active','archived','deleted') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `parent_document_id` (`parent_document_id`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_uploaded_by` (`uploaded_by`),
  KEY `idx_is_public` (`is_public`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`ic`),
  CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`parent_document_id`) REFERENCES `documents` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `event_registrations`
DROP TABLE IF EXISTS `event_registrations`;
CREATE TABLE IF NOT EXISTS `event_registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `user_ic` varchar(20) NOT NULL,
  `status` enum('registered','attended','cancelled','no_show') DEFAULT 'registered',
  `payment_status` enum('pending','paid','refunded') DEFAULT 'pending',
  `payment_amount` decimal(10,2) DEFAULT 0.00,
  `payment_date` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_event_user` (`event_id`,`user_ic`),
  KEY `idx_event_id` (`event_id`),
  KEY `idx_user_ic` (`user_ic`),
  KEY `idx_status` (`status`),
  CONSTRAINT `event_registrations_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `event_registrations_ibfk_2` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `events`
DROP TABLE IF EXISTS `events`;
CREATE TABLE IF NOT EXISTS `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `event_type` enum('religious','educational','social','charity','other') DEFAULT 'other',
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `location_latitude` decimal(10,8) DEFAULT NULL,
  `location_longitude` decimal(11,8) DEFAULT NULL,
  `max_participants` int(11) DEFAULT NULL,
  `registration_required` tinyint(1) DEFAULT 0,
  `registration_deadline` datetime DEFAULT NULL,
  `fee` decimal(10,2) DEFAULT 0.00,
  `status` enum('draft','published','cancelled','completed') DEFAULT 'draft',
  `image_url` varchar(500) DEFAULT NULL,
  `created_by` varchar(20) NOT NULL COMMENT 'IC of creator',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_start_date` (`start_date`),
  KEY `idx_status` (`status`),
  KEY `idx_event_type` (`event_type`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`ic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `exam_sessions`
DROP TABLE IF EXISTS `exam_sessions`;
CREATE TABLE IF NOT EXISTS `exam_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_es_dates` (`start_date`,`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `exams`
DROP TABLE IF EXISTS `exams`;
CREATE TABLE IF NOT EXISTS `exams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) DEFAULT NULL,
  `subject` varchar(100) DEFAULT NULL,
  `tarikh_exam` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `class_id` (`class_id`),
  CONSTRAINT `exams_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `fees`
DROP TABLE IF EXISTS `fees`;
CREATE TABLE IF NOT EXISTS `fees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_ic` varchar(20) DEFAULT NULL,
  `jumlah` decimal(10,2) DEFAULT NULL,
  `status` enum('Bayar','Belum Bayar','terbayar','tunggak','pending') DEFAULT 'Belum Bayar',
  `tarikh` date DEFAULT NULL,
  `tarikh_bayar` date DEFAULT NULL,
  `bulan` varchar(20) DEFAULT NULL,
  `tahun` int(11) DEFAULT NULL,
  `cara_bayar` varchar(50) DEFAULT NULL,
  `no_resit` varchar(50) DEFAULT NULL,
  `resit_img` varchar(255) DEFAULT NULL,
  `document_confirmed` tinyint(1) DEFAULT 0,
  `confirmed_by` varchar(20) DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `confirmation_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `student_ic` (`student_ic`),
  KEY `confirmed_by` (`confirmed_by`),
  KEY `idx_fees_document_confirmed` (`document_confirmed`),
  CONSTRAINT `fees_ibfk_1` FOREIGN KEY (`student_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE,
  CONSTRAINT `fees_ibfk_2` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`ic`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `financial_transactions`
DROP TABLE IF EXISTS `financial_transactions`;
CREATE TABLE IF NOT EXISTS `financial_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_type` enum('income','expense') NOT NULL,
  `category` varchar(100) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `payment_method` enum('cash','bank_transfer','cheque','online','other') DEFAULT 'cash',
  `reference_number` varchar(100) DEFAULT NULL,
  `receipt_image` varchar(500) DEFAULT NULL,
  `related_type` varchar(50) DEFAULT NULL COMMENT 'Type of related entity (e.g., fee, event, donation)',
  `related_id` int(11) DEFAULT NULL COMMENT 'ID of related entity',
  `created_by` varchar(20) NOT NULL COMMENT 'IC of creator',
  `approved_by` varchar(20) DEFAULT NULL COMMENT 'IC of approver',
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_category` (`category`),
  KEY `idx_transaction_date` (`transaction_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `financial_transactions_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`ic`),
  CONSTRAINT `financial_transactions_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`ic`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `generated_reports`
DROP TABLE IF EXISTS `generated_reports`;
CREATE TABLE IF NOT EXISTS `generated_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) DEFAULT NULL,
  `report_name` varchar(255) NOT NULL,
  `report_type` varchar(100) NOT NULL,
  `parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Report parameters used' CHECK (json_valid(`parameters`)),
  `file_path` varchar(1000) DEFAULT NULL COMMENT 'Path to generated file',
  `file_format` enum('pdf','excel','csv','json') DEFAULT 'pdf',
  `file_size` bigint(20) DEFAULT NULL,
  `status` enum('generating','completed','failed') DEFAULT 'generating',
  `generated_by` varchar(20) NOT NULL COMMENT 'IC of generator',
  `generated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL COMMENT 'When report expires',
  `download_count` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  KEY `generated_by` (`generated_by`),
  KEY `idx_report_type` (`report_type`),
  KEY `idx_status` (`status`),
  KEY `idx_generated_at` (`generated_at`),
  CONSTRAINT `generated_reports_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `report_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `generated_reports_ibfk_2` FOREIGN KEY (`generated_by`) REFERENCES `users` (`ic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `global_events`
DROP TABLE IF EXISTS `global_events`;
CREATE TABLE IF NOT EXISTS `global_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_date` date NOT NULL,
  `label` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_event_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `ib_action_logs`
DROP TABLE IF EXISTS `ib_action_logs`;
CREATE TABLE IF NOT EXISTS `ib_action_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action_type` varchar(60) NOT NULL,
  `user_ic` varchar(20) NOT NULL,
  `bulan` varchar(20) DEFAULT NULL,
  `tahun` int(11) DEFAULT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `attendance_id` int(11) DEFAULT NULL,
  `document_type` enum('fee','attendance','monthly','general') DEFAULT 'general',
  `amount` decimal(12,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `metadata` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ib_action_logs_user_ic` (`user_ic`),
  KEY `idx_ib_action_logs_month_year` (`bulan`,`tahun`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `ib_document_flags`
DROP TABLE IF EXISTS `ib_document_flags`;
CREATE TABLE IF NOT EXISTS `ib_document_flags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_type` enum('fee','attendance') NOT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `attendance_id` int(11) DEFAULT NULL,
  `flagged_by_ic` varchar(20) NOT NULL,
  `needs_clarification` tinyint(1) NOT NULL DEFAULT 1,
  `send_back_to_pic` tinyint(1) NOT NULL DEFAULT 0,
  `reason` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `resolved` tinyint(1) NOT NULL DEFAULT 0,
  `resolved_by_ic` varchar(20) DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ib_document_flags_payment` (`payment_id`),
  KEY `idx_ib_document_flags_attendance` (`attendance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `idempotency_keys`
DROP TABLE IF EXISTS `idempotency_keys`;
CREATE TABLE IF NOT EXISTS `idempotency_keys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key_hash` varchar(64) NOT NULL,
  `payment_id` varchar(36) DEFAULT NULL,
  `response_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`response_data`)),
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_hash` (`key_hash`),
  KEY `idx_key_hash` (`key_hash`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `leaderboard_cache`
DROP TABLE IF EXISTS `leaderboard_cache`;
CREATE TABLE IF NOT EXISTS `leaderboard_cache` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_ic` varchar(20) NOT NULL,
  `rank_position` int(11) NOT NULL,
  `total_points` int(11) NOT NULL,
  `current_level` int(11) NOT NULL,
  `category` varchar(50) DEFAULT 'overall',
  `period_start` date DEFAULT NULL,
  `period_end` date DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_category_period` (`user_ic`,`category`,`period_start`),
  KEY `idx_category_period` (`category`,`period_start`,`period_end`),
  KEY `idx_rank` (`rank_position`),
  CONSTRAINT `leaderboard_cache_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `login_attempts`
DROP TABLE IF EXISTS `login_attempts`;
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_ic` varchar(20) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `timestamp` datetime NOT NULL,
  `successful` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_ic` (`user_ic`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_user_timestamp` (`user_ic`,`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `maintenance_mode`
DROP TABLE IF EXISTS `maintenance_mode`;
CREATE TABLE IF NOT EXISTS `maintenance_mode` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `is_active` tinyint(1) DEFAULT 0,
  `mode_type` varchar(20) DEFAULT 'none',
  `reason` text DEFAULT NULL,
  `scheduled_start` timestamp NULL DEFAULT NULL,
  `scheduled_end` timestamp NULL DEFAULT NULL,
  `activated_by` varchar(50) DEFAULT NULL,
  `activated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deactivated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_mode_type` (`mode_type`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `memo_entries`
DROP TABLE IF EXISTS `memo_entries`;
CREATE TABLE IF NOT EXISTS `memo_entries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `content` text DEFAULT NULL,
  `created_by_ic` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_dates` (`start_date`,`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `notification_interactions`
DROP TABLE IF EXISTS `notification_interactions`;
CREATE TABLE IF NOT EXISTS `notification_interactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_ic` varchar(20) NOT NULL,
  `notification_id` varchar(120) NOT NULL COMMENT 'e.g. PENDING_APPROVAL-{ic}, FAILED_PAYMENT-{id}, RESULTS_READY-{id}',
  `action` enum('read','dismissed') DEFAULT 'read',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_notification` (`user_ic`,`notification_id`),
  KEY `idx_user_ic` (`user_ic`),
  KEY `idx_notification_id` (`notification_id`),
  CONSTRAINT `notification_interactions_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `notification_preferences`
DROP TABLE IF EXISTS `notification_preferences`;
CREATE TABLE IF NOT EXISTS `notification_preferences` (
  `user_ic` varchar(20) NOT NULL,
  `email_notifications` tinyint(1) DEFAULT 1,
  `push_notifications` tinyint(1) DEFAULT 1,
  `in_app_notifications` tinyint(1) DEFAULT 1,
  `notify_on_fee_due` tinyint(1) DEFAULT 1,
  `notify_on_attendance` tinyint(1) DEFAULT 1,
  `notify_on_result` tinyint(1) DEFAULT 1,
  `notify_on_announcement` tinyint(1) DEFAULT 1,
  `notify_on_event` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_ic`),
  CONSTRAINT `notification_preferences_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `notifications`
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_ic` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','error','announcement','reminder') DEFAULT 'info',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `is_read` tinyint(1) DEFAULT 0,
  `link` varchar(500) DEFAULT NULL COMMENT 'Optional link to related page',
  `related_type` varchar(50) DEFAULT NULL COMMENT 'Type of related entity (e.g., fee, attendance, result)',
  `related_id` int(11) DEFAULT NULL COMMENT 'ID of related entity',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_ic` (`user_ic`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_type` (`type`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `password_reset_tokens`
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_ic` varchar(20) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_user_ic` (`user_ic`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `payment_confirmations`
DROP TABLE IF EXISTS `payment_confirmations`;
CREATE TABLE IF NOT EXISTS `payment_confirmations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bulan` varchar(20) NOT NULL,
  `tahun` int(11) NOT NULL,
  `confirmed_by_ic` varchar(20) NOT NULL,
  `confirmed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `confirmation_period_start` date NOT NULL,
  `confirmation_period_end` date NOT NULL,
  `status` enum('pending','confirmed','rejected') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `total_payments` int(11) DEFAULT 0,
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `verified_payments` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_month_year` (`bulan`,`tahun`),
  KEY `confirmed_by_ic` (`confirmed_by_ic`),
  KEY `idx_payment_confirmation_period` (`confirmation_period_start`,`confirmation_period_end`),
  KEY `idx_payment_confirmation_status` (`status`),
  CONSTRAINT `payment_confirmations_ibfk_1` FOREIGN KEY (`confirmed_by_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `payment_gateway_settings`
DROP TABLE IF EXISTS `payment_gateway_settings`;
CREATE TABLE IF NOT EXISTS `payment_gateway_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `gateway_name` varchar(50) NOT NULL,
  `enabled` tinyint(1) DEFAULT 0,
  `is_test_mode` tinyint(1) DEFAULT 1,
  `credentials` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`credentials`)),
  `enabled_methods` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`enabled_methods`)),
  `redirect_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`redirect_urls`)),
  `webhook_url` varchar(500) DEFAULT NULL,
  `callback_url` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `gateway_name` (`gateway_name`),
  KEY `idx_enabled` (`enabled`),
  KEY `idx_gateway_name` (`gateway_name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `payment_logs`
DROP TABLE IF EXISTS `payment_logs`;
CREATE TABLE IF NOT EXISTS `payment_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_id` varchar(36) NOT NULL,
  `action` varchar(50) NOT NULL,
  `status_from` varchar(50) DEFAULT NULL,
  `status_to` varchar(50) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `payment_logs_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `payment_method_settings`
DROP TABLE IF EXISTS `payment_method_settings`;
CREATE TABLE IF NOT EXISTS `payment_method_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `method_code` varchar(50) NOT NULL,
  `method_name` varchar(100) NOT NULL,
  `enabled` tinyint(1) DEFAULT 1,
  `provider` varchar(50) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `icon` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `method_code` (`method_code`),
  KEY `idx_enabled` (`enabled`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `payment_reconciliation`
DROP TABLE IF EXISTS `payment_reconciliation`;
CREATE TABLE IF NOT EXISTS `payment_reconciliation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_id` varchar(36) NOT NULL,
  `reconciliation_date` date NOT NULL,
  `provider_status` varchar(50) DEFAULT NULL,
  `local_status` varchar(50) DEFAULT NULL,
  `status_match` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_reconciliation_date` (`reconciliation_date`),
  KEY `idx_status_match` (`status_match`),
  CONSTRAINT `payment_reconciliation_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `payments`
DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` varchar(36) NOT NULL,
  `user_ic` varchar(20) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'MYR',
  `method` enum('fpx','duitnow_qr','duitnow_request','tng_ewallet','boost','grabpay') NOT NULL,
  `provider` enum('ipay88','eghl','2c2p','paydibs','paynet_direct') NOT NULL,
  `provider_reference` varchar(255) DEFAULT NULL,
  `status` enum('pending','processing','completed','failed','cancelled','refunded','expired') DEFAULT 'pending',
  `proof_url` varchar(500) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `idempotency_key` varchar(255) DEFAULT NULL,
  `webhook_received` tinyint(1) DEFAULT 0,
  `webhook_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`webhook_data`)),
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idempotency_key` (`idempotency_key`),
  KEY `idx_user_ic` (`user_ic`),
  KEY `idx_status` (`status`),
  KEY `idx_provider_reference` (`provider_reference`),
  KEY `idx_idempotency_key` (`idempotency_key`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `pending_pic_changes`
DROP TABLE IF EXISTS `pending_pic_changes`;
CREATE TABLE IF NOT EXISTS `pending_pic_changes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `action_key` varchar(150) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` varchar(191) DEFAULT NULL,
  `request_method` varchar(10) NOT NULL,
  `request_path` varchar(255) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_by` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_by` varchar(20) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pending_pic_changes_status` (`status`),
  KEY `idx_pending_pic_changes_actor` (`created_by`),
  KEY `idx_pending_pic_changes_entity` (`entity_type`,`entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `permissions`
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `pic_action_snapshots`
DROP TABLE IF EXISTS `pic_action_snapshots`;
CREATE TABLE IF NOT EXISTS `pic_action_snapshots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(100) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `entity_identifier` varchar(191) DEFAULT NULL,
  `operation` enum('create','update','delete','bulk-create','bulk-create-with-proof') NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Snapshot data of the action' CHECK (json_valid(`data`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional metadata about the action' CHECK (json_valid(`metadata`)),
  `pic_ic` varchar(20) NOT NULL COMMENT 'PIC who initiated the action',
  `approved_by` varchar(20) DEFAULT NULL COMMENT 'Admin who approved the action (NULL if pending)',
  `pending_pic_change_id` int(11) DEFAULT NULL COMMENT 'Reference to original pending_pic_changes.id',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT 'When this record was deleted (for recycle bin)',
  `expires_at` timestamp NULL DEFAULT NULL COMMENT 'When this snapshot expires (30 days)',
  `was_undone` tinyint(1) DEFAULT 0 COMMENT 'Whether this action has been undone',
  `undone_at` timestamp NULL DEFAULT NULL COMMENT 'When this action was undone',
  `undo_pending_id` int(11) DEFAULT NULL COMMENT 'Reference to undo request in pending_pic_changes.id',
  PRIMARY KEY (`id`),
  KEY `idx_pic_snapshots_entity` (`entity_type`,`entity_id`),
  KEY `idx_pic_snapshots_expires` (`expires_at`),
  KEY `idx_pic_snapshots_pic` (`pic_ic`),
  KEY `idx_pic_snapshots_pending` (`pending_pic_change_id`),
  KEY `idx_pic_snapshots_undo` (`undo_pending_id`),
  KEY `idx_pic_snapshots_approved_by` (`approved_by`),
  KEY `idx_pic_snapshots_deleted` (`deleted_at`),
  CONSTRAINT `fk_pic_snapshots_pending_pic_change` FOREIGN KEY (`pending_pic_change_id`) REFERENCES `pending_pic_changes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pic_snapshots_undo_pending` FOREIGN KEY (`undo_pending_id`) REFERENCES `pending_pic_changes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PIC Recycle Bin: Stores approved PIC actions for undo capability';

-- Table structure for `points_history`
DROP TABLE IF EXISTS `points_history`;
CREATE TABLE IF NOT EXISTS `points_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_ic` varchar(20) NOT NULL,
  `points` int(11) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `source_type` varchar(50) DEFAULT NULL,
  `source_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_points` (`user_ic`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_source` (`source_type`,`source_id`),
  CONSTRAINT `points_history_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `refresh_tokens`
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `user_ic` varchar(20) NOT NULL,
  `token` text NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`user_ic`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `report_templates`
DROP TABLE IF EXISTS `report_templates`;
CREATE TABLE IF NOT EXISTS `report_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `report_type` varchar(100) NOT NULL COMMENT 'e.g., attendance, financial, student',
  `template_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Report configuration' CHECK (json_valid(`template_config`)),
  `created_by` varchar(20) NOT NULL COMMENT 'IC of creator',
  `is_public` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_report_type` (`report_type`),
  CONSTRAINT `report_templates_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`ic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `resit_applications`
DROP TABLE IF EXISTS `resit_applications`;
CREATE TABLE IF NOT EXISTS `resit_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `result_id` int(11) NOT NULL,
  `student_ic` varchar(20) NOT NULL,
  `status` enum('eligible','applied','confirmed') NOT NULL DEFAULT 'eligible',
  `deadline` date DEFAULT NULL COMMENT 'Last date to apply for resit',
  `applied_at` datetime DEFAULT NULL,
  `fee_amount` decimal(10,2) DEFAULT NULL,
  `class_track` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_result_student` (`result_id`,`student_ic`),
  KEY `student_ic` (`student_ic`),
  CONSTRAINT `resit_applications_ibfk_1` FOREIGN KEY (`result_id`) REFERENCES `results` (`id`) ON DELETE CASCADE,
  CONSTRAINT `resit_applications_ibfk_2` FOREIGN KEY (`student_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `results`
DROP TABLE IF EXISTS `results`;
CREATE TABLE IF NOT EXISTS `results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_ic` varchar(20) DEFAULT NULL,
  `exam_id` int(11) DEFAULT NULL,
  `markah` int(11) DEFAULT NULL,
  `gred` varchar(5) DEFAULT NULL,
  `slip_img` varchar(255) DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `student_ic` (`student_ic`),
  KEY `exam_id` (`exam_id`),
  CONSTRAINT `results_ibfk_1` FOREIGN KEY (`student_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE,
  CONSTRAINT `results_ibfk_2` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `role_permissions`
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role` varchar(50) NOT NULL,
  `permission_code` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_perm` (`role`,`permission_code`),
  KEY `idx_rp_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for `settings`
DROP TABLE IF EXISTS `settings`;
CREATE TABLE IF NOT EXISTS `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('text','image','link','json') DEFAULT 'text',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `staff_checkin`
DROP TABLE IF EXISTS `staff_checkin`;
CREATE TABLE IF NOT EXISTS `staff_checkin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_ic` varchar(20) NOT NULL,
  `check_in_time` timestamp NULL DEFAULT NULL,
  `check_out_time` timestamp NULL DEFAULT NULL,
  `check_in_latitude` decimal(10,8) DEFAULT NULL,
  `check_in_longitude` decimal(11,8) DEFAULT NULL,
  `check_out_latitude` decimal(10,8) DEFAULT NULL,
  `check_out_longitude` decimal(11,8) DEFAULT NULL,
  `status` enum('checked_in','checked_out') DEFAULT 'checked_in',
  `distance_from_masjid` decimal(10,2) DEFAULT NULL COMMENT 'Distance in meters',
  `shift_type` enum('normal','shift') DEFAULT 'normal',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_staff_ic` (`staff_ic`),
  KEY `idx_check_in_time` (`check_in_time`),
  KEY `idx_status` (`status`),
  KEY `idx_shift_type` (`shift_type`),
  CONSTRAINT `staff_checkin_ibfk_1` FOREIGN KEY (`staff_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `staff_checkin_attempts`
DROP TABLE IF EXISTS `staff_checkin_attempts`;
CREATE TABLE IF NOT EXISTS `staff_checkin_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_ic` varchar(20) NOT NULL,
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `distance_from_masjid` decimal(10,2) DEFAULT NULL,
  `result` enum('outside_location','gps_unavailable','already_checked_in','error') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_staff_ic` (`staff_ic`),
  KEY `idx_attempted_at` (`attempted_at`),
  KEY `idx_result` (`result`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `students`
DROP TABLE IF EXISTS `students`;
CREATE TABLE IF NOT EXISTS `students` (
  `user_ic` varchar(20) NOT NULL,
  `kelas_id` int(11) DEFAULT NULL COMMENT 'Class reference',
  `tarikh_daftar` date DEFAULT NULL,
  `class_track` varchar(50) DEFAULT NULL COMMENT 'Full-Time, Part-Time, Online',
  `academic_bio` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_ic`),
  KEY `fk_students_classes` (`kelas_id`),
  CONSTRAINT `fk_students_classes` FOREIGN KEY (`kelas_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `teachers`
DROP TABLE IF EXISTS `teachers`;
CREATE TABLE IF NOT EXISTS `teachers` (
  `user_ic` varchar(20) NOT NULL,
  `kepakaran` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`kepakaran`)),
  PRIMARY KEY (`user_ic`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `user_achievements`
DROP TABLE IF EXISTS `user_achievements`;
CREATE TABLE IF NOT EXISTS `user_achievements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_ic` varchar(20) NOT NULL,
  `achievement_id` int(11) NOT NULL,
  `unlocked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `notified` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_achievement` (`user_ic`,`achievement_id`),
  KEY `achievement_id` (`achievement_id`),
  KEY `idx_user_achievements` (`user_ic`),
  KEY `idx_unlocked_at` (`unlocked_at`),
  CONSTRAINT `user_achievements_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE,
  CONSTRAINT `user_achievements_ibfk_2` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `user_points`
DROP TABLE IF EXISTS `user_points`;
CREATE TABLE IF NOT EXISTS `user_points` (
  `user_ic` varchar(20) NOT NULL,
  `total_points` int(11) DEFAULT 0,
  `current_level` int(11) DEFAULT 1,
  `experience_points` int(11) DEFAULT 0,
  `points_to_next_level` int(11) DEFAULT 100,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_ic`),
  KEY `idx_total_points` (`total_points`),
  KEY `idx_current_level` (`current_level`),
  CONSTRAINT `user_points_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `user_roles`
DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_ic` varchar(20) NOT NULL,
  `role` enum('admin','teacher','student','pic','staff','ib') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_role` (`user_ic`,`role`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `user_streaks`
DROP TABLE IF EXISTS `user_streaks`;
CREATE TABLE IF NOT EXISTS `user_streaks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_ic` varchar(20) NOT NULL,
  `streak_type` enum('attendance','login','fee_payment','exam_taken') NOT NULL,
  `current_streak` int(11) DEFAULT 0,
  `longest_streak` int(11) DEFAULT 0,
  `last_activity_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_streak` (`user_ic`,`streak_type`),
  KEY `idx_user_streak` (`user_ic`,`streak_type`),
  KEY `idx_streak_type` (`streak_type`),
  CONSTRAINT `user_streaks_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `ic` varchar(20) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `umur` int(11) DEFAULT NULL,
  `alamat` varchar(255) DEFAULT NULL,
  `telefon` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('student','teacher','admin','pic','staff','ib') NOT NULL DEFAULT 'student',
  `status` enum('aktif','tidak_aktif','cuti','pending') DEFAULT 'pending',
  `account_locked_until` datetime DEFAULT NULL,
  `preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`preferences`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `cover_photo` varchar(255) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL COMMENT 'Last successful login timestamp',
  PRIMARY KEY (`ic`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_last_login` (`last_login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `volunteer_activities`
DROP TABLE IF EXISTS `volunteer_activities`;
CREATE TABLE IF NOT EXISTS `volunteer_activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `volunteer_ic` varchar(20) NOT NULL,
  `activity_type` enum('event','maintenance','teaching','administrative','other') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `activity_date` date NOT NULL,
  `hours_worked` decimal(5,2) DEFAULT 0.00,
  `location` varchar(255) DEFAULT NULL,
  `supervisor_ic` varchar(20) DEFAULT NULL COMMENT 'IC of supervisor',
  `status` enum('scheduled','completed','cancelled','no_show') DEFAULT 'scheduled',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `supervisor_ic` (`supervisor_ic`),
  KEY `idx_volunteer_ic` (`volunteer_ic`),
  KEY `idx_activity_date` (`activity_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `volunteer_activities_ibfk_1` FOREIGN KEY (`volunteer_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE,
  CONSTRAINT `volunteer_activities_ibfk_2` FOREIGN KEY (`supervisor_ic`) REFERENCES `users` (`ic`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `volunteer_recognitions`
DROP TABLE IF EXISTS `volunteer_recognitions`;
CREATE TABLE IF NOT EXISTS `volunteer_recognitions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `volunteer_ic` varchar(20) NOT NULL,
  `recognition_type` enum('certificate','award','appreciation','badge') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `recognition_date` date NOT NULL,
  `hours_threshold` int(11) DEFAULT NULL COMMENT 'Hours required for recognition',
  `certificate_url` varchar(500) DEFAULT NULL,
  `awarded_by` varchar(20) NOT NULL COMMENT 'IC of person awarding',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `awarded_by` (`awarded_by`),
  KEY `idx_volunteer_ic` (`volunteer_ic`),
  KEY `idx_recognition_date` (`recognition_date`),
  CONSTRAINT `volunteer_recognitions_ibfk_1` FOREIGN KEY (`volunteer_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE,
  CONSTRAINT `volunteer_recognitions_ibfk_2` FOREIGN KEY (`awarded_by`) REFERENCES `users` (`ic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for `volunteers`
DROP TABLE IF EXISTS `volunteers`;
CREATE TABLE IF NOT EXISTS `volunteers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_ic` varchar(20) NOT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of skills' CHECK (json_valid(`skills`)),
  `availability` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Availability schedule' CHECK (json_valid(`availability`)),
  `interests` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of interests' CHECK (json_valid(`interests`)),
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `joined_date` date NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_volunteer` (`user_ic`),
  KEY `idx_status` (`status`),
  CONSTRAINT `volunteers_ibfk_1` FOREIGN KEY (`user_ic`) REFERENCES `users` (`ic`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS=1;
