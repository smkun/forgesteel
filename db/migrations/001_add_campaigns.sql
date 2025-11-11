-- Migration: Add Campaign System
-- Date: 2025-01-11
-- Description: Adds campaigns table and campaign_members table for organizing characters into campaigns with GM assignments

-- ==================================================================
-- TABLE: campaigns
-- Purpose: Store campaign information
-- ==================================================================

CREATE TABLE IF NOT EXISTS `campaigns` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_by_user_id` INT UNSIGNED NOT NULL COMMENT 'User who created the campaign',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key constraints
  CONSTRAINT `fk_campaigns_created_by`
    FOREIGN KEY (`created_by_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  -- Indexes for performance
  INDEX `idx_created_by` (`created_by_user_id`),
  INDEX `idx_is_deleted` (`is_deleted`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- TABLE: campaign_members
-- Purpose: Junction table for campaigns and users with role assignments
-- Notes:
--   - role can be 'gm' or 'player'
--   - A user can be GM of multiple campaigns
--   - A campaign can have multiple GMs
--   - Players in a campaign can see all characters in that campaign
-- ==================================================================

CREATE TABLE IF NOT EXISTS `campaign_members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `role` ENUM('gm', 'player') NOT NULL DEFAULT 'player',
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  CONSTRAINT `fk_campaign_members_campaign`
    FOREIGN KEY (`campaign_id`)
    REFERENCES `campaigns` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_campaign_members_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Indexes for performance
  INDEX `idx_campaign_id` (`campaign_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_role` (`role`),

  -- Composite indexes for common queries
  INDEX `idx_campaign_role` (`campaign_id`, `role`),

  -- Ensure unique user per campaign
  UNIQUE KEY `unique_campaign_user` (`campaign_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- ALTER TABLE: characters
-- Add campaign_id foreign key
-- ==================================================================

ALTER TABLE `characters`
  ADD COLUMN `campaign_id` INT UNSIGNED NULL AFTER `gm_user_id`,
  ADD CONSTRAINT `fk_characters_campaign`
    FOREIGN KEY (`campaign_id`)
    REFERENCES `campaigns` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  ADD INDEX `idx_campaign_id` (`campaign_id`),
  ADD INDEX `idx_campaign_not_deleted` (`campaign_id`, `is_deleted`);

-- ==================================================================
-- NOTES:
-- ==================================================================
-- Migration Path:
--   1. Existing characters keep their gm_user_id for backward compatibility
--   2. New characters can optionally be assigned to campaigns
--   3. When a character is in a campaign, campaign GMs have edit access
--   4. gm_user_id can coexist with campaign_id during transition
--
-- Access Control Logic:
--   Character Owner: Full edit access (always)
--   Campaign GM: Full edit access to all characters in their campaigns
--   Campaign Player: Read-only access to other characters in same campaign
--   Legacy GM (gm_user_id): Full edit access (backward compatibility)
--
-- Sample Queries:
--
-- Get all campaigns for a user (as GM or player):
-- SELECT c.*, cm.role
-- FROM campaigns c
-- INNER JOIN campaign_members cm ON c.id = cm.campaign_id
-- WHERE cm.user_id = ? AND c.is_deleted = 0;
--
-- Get all GMs for a campaign:
-- SELECT u.*
-- FROM users u
-- INNER JOIN campaign_members cm ON u.id = cm.user_id
-- WHERE cm.campaign_id = ? AND cm.role = 'gm';
--
-- Get all characters in a campaign:
-- SELECT c.*
-- FROM characters c
-- WHERE c.campaign_id = ? AND c.is_deleted = 0;
--
-- Check if user is GM of a campaign:
-- SELECT COUNT(*) > 0 as is_gm
-- FROM campaign_members
-- WHERE campaign_id = ? AND user_id = ? AND role = 'gm';

-- ==================================================================
-- ROLLBACK (if needed)
-- ==================================================================
-- ALTER TABLE `characters` DROP FOREIGN KEY `fk_characters_campaign`;
-- ALTER TABLE `characters` DROP INDEX `idx_campaign_id`;
-- ALTER TABLE `characters` DROP INDEX `idx_campaign_not_deleted`;
-- ALTER TABLE `characters` DROP COLUMN `campaign_id`;
-- DROP TABLE IF EXISTS `campaign_members`;
-- DROP TABLE IF EXISTS `campaigns`;
