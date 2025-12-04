-- Migration: Add Campaign Encounters System
-- Date: 2025-12-03
-- Description: Adds campaign_encounters table for server-side encounter storage
--              enabling GMs to access encounters from any device

-- ==================================================================
-- TABLE: campaign_encounters
-- Purpose: Store encounter data per campaign for cross-device access
-- ==================================================================

CREATE TABLE IF NOT EXISTS `campaign_encounters` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT UNSIGNED NOT NULL COMMENT 'Campaign this encounter belongs to',
  `encounter_uuid` VARCHAR(36) NOT NULL COMMENT 'Frontend UUID for encounter',
  `name` VARCHAR(255) NULL COMMENT 'Cached from JSON for listing',
  `encounter_json` LONGTEXT NOT NULL COMMENT 'Full Encounter object as JSON',
  `created_by_user_id` INT UNSIGNED NOT NULL COMMENT 'User who created',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key constraints
  CONSTRAINT `fk_encounters_campaign`
    FOREIGN KEY (`campaign_id`)
    REFERENCES `campaigns` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_encounters_creator`
    FOREIGN KEY (`created_by_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  -- Indexes for performance
  INDEX `idx_campaign_id` (`campaign_id`),
  INDEX `idx_encounter_uuid` (`encounter_uuid`),
  INDEX `idx_created_by` (`created_by_user_id`),
  INDEX `idx_is_deleted` (`is_deleted`),
  INDEX `idx_name` (`name`),

  -- Composite indexes for common queries
  INDEX `idx_campaign_active` (`campaign_id`, `is_deleted`),

  -- Unique constraint: UUID must be unique within campaign
  UNIQUE KEY `unique_campaign_encounter` (`campaign_id`, `encounter_uuid`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- NOTES:
-- ==================================================================
-- Schema Features:
--   - Encounters belong to campaigns (campaign_id NOT NULL)
--   - ON DELETE CASCADE removes encounters when campaign deleted
--   - ON DELETE RESTRICT prevents deleting users with encounters
--   - encounter_uuid links to frontend Encounter.id field
--   - encounter_json stores full Encounter object serialized
--   - name cached for efficient listing without JSON parsing
--   - Soft deletes preserve history (is_deleted flag)
--
-- Access Control Logic:
--   Campaign GM: Full CRUD access to all campaign encounters
--   Campaign Player: Read-only access to campaign encounters
--   Admin: Full CRUD access to all encounters
--   Creator: Full CRUD access to own encounters
--
-- Sample Queries:
--
-- Get all encounters for a campaign:
-- SELECT
--   id, encounter_uuid, name, created_at, updated_at
-- FROM campaign_encounters
-- WHERE campaign_id = ? AND is_deleted = 0
-- ORDER BY updated_at DESC;
--
-- Get encounter by UUID within campaign:
-- SELECT *
-- FROM campaign_encounters
-- WHERE campaign_id = ? AND encounter_uuid = ? AND is_deleted = 0;
--
-- Get encounters created by a user:
-- SELECT ce.*, c.name as campaign_name
-- FROM campaign_encounters ce
-- INNER JOIN campaigns c ON ce.campaign_id = c.id
-- WHERE ce.created_by_user_id = ? AND ce.is_deleted = 0
-- ORDER BY ce.updated_at DESC;
--
-- Check if user is GM of campaign (for access control):
-- SELECT COUNT(*) > 0 as is_gm
-- FROM campaign_members
-- WHERE campaign_id = ? AND user_id = ? AND role = 'gm';

-- ==================================================================
-- ROLLBACK (if needed)
-- ==================================================================
-- DROP TABLE IF EXISTS `campaign_encounters`;
