-- Forgesteel Backend Character Storage Database Schema
-- Created: 2025-11-07
-- MySQL 5.7+ (with JSON support) or MySQL 5.6 (with LONGTEXT fallback)

-- ==================================================================
-- TABLE: users
-- Purpose: Store user authentication and profile information
-- References: PRD.md section 7 (Database Design)
-- ==================================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `firebase_uid` VARCHAR(128) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `display_name` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes for performance
  INDEX `idx_firebase_uid` (`firebase_uid`),
  INDEX `idx_email` (`email`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- TABLE: characters
-- Purpose: Store character data with ownership and GM relationships
-- References: PRD.md section 7 (Database Design)
-- Notes:
--   - character_json uses JSON type if MySQL >= 5.7, else LONGTEXT
--   - name column caches character name from JSON for faster queries
--   - Soft delete pattern with is_deleted flag
-- ==================================================================

CREATE TABLE IF NOT EXISTS `characters` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `owner_user_id` INT UNSIGNED NOT NULL,
  `gm_user_id` INT UNSIGNED NULL,
  `name` VARCHAR(255) NULL COMMENT 'Cached from character_json for listing performance',

  -- Character data storage
  -- Use JSON if MySQL >= 5.7, else LONGTEXT (determined at runtime)
  `character_json` LONGTEXT NOT NULL COMMENT 'Full .ds-hero character data',

  -- Soft delete flag
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,

  -- Timestamps
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key constraints
  CONSTRAINT `fk_characters_owner`
    FOREIGN KEY (`owner_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT `fk_characters_gm`
    FOREIGN KEY (`gm_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  -- Indexes for performance
  INDEX `idx_owner_user_id` (`owner_user_id`),
  INDEX `idx_gm_user_id` (`gm_user_id`),
  INDEX `idx_name` (`name`),
  INDEX `idx_is_deleted` (`is_deleted`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_updated_at` (`updated_at`),

  -- Composite index for common queries
  INDEX `idx_owner_not_deleted` (`owner_user_id`, `is_deleted`),
  INDEX `idx_gm_not_deleted` (`gm_user_id`, `is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- UPGRADE PATH: JSON Column (if MySQL >= 5.7)
-- ==================================================================
-- If iFastNet supports MySQL 5.7+, run this after initial schema:
-- ALTER TABLE `characters`
--   MODIFY COLUMN `character_json` JSON NOT NULL
--   COMMENT 'Full .ds-hero character data (JSON type)';

-- ==================================================================
-- SAMPLE QUERIES (for testing)
-- ==================================================================

-- Get all characters for a user (owner + GM)
-- SELECT * FROM characters
-- WHERE is_deleted = 0
--   AND (owner_user_id = ? OR gm_user_id = ?)
-- ORDER BY updated_at DESC;

-- Get all characters (admin only)
-- SELECT * FROM characters
-- WHERE is_deleted = 0
-- ORDER BY updated_at DESC;

-- Create new character
-- INSERT INTO characters (owner_user_id, gm_user_id, name, character_json)
-- VALUES (?, ?, ?, ?);

-- Update existing character
-- UPDATE characters
-- SET character_json = ?, name = ?, updated_at = CURRENT_TIMESTAMP
-- WHERE id = ? AND (owner_user_id = ? OR gm_user_id = ?);

-- Soft delete character
-- UPDATE characters
-- SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
-- WHERE id = ? AND owner_user_id = ?;

-- ==================================================================
-- ROLLBACK (if needed)
-- ==================================================================
-- DROP TABLE IF EXISTS `characters`;
-- DROP TABLE IF EXISTS `users`;
