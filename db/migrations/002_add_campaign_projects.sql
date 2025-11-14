-- Migration: Add Campaign Projects System
-- Date: 2025-01-14
-- Description: Adds campaign_projects and campaign_project_history tables for tracking
--              hierarchical project goals with character assignment and progress tracking

-- ==================================================================
-- TABLE: campaign_projects
-- Purpose: Store campaign project information with hierarchical structure
-- ==================================================================

CREATE TABLE IF NOT EXISTS `campaign_projects` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT UNSIGNED NOT NULL COMMENT 'Campaign this project belongs to',
  `parent_project_id` INT UNSIGNED NULL COMMENT 'Parent project ID for sub-projects',
  `character_id` INT UNSIGNED NOT NULL COMMENT 'Character who started/owns this project (required)',
  `name` VARCHAR(255) NOT NULL COMMENT 'Project name',
  `description` TEXT NULL COMMENT 'Project description/details',
  `goal_points` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Target points to complete',
  `current_points` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Current progress points',
  `display_order` INT NOT NULL DEFAULT 0 COMMENT 'Sort order for display',
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Manual completion flag',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  `created_by_user_id` INT UNSIGNED NOT NULL COMMENT 'User who created the project',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` DATETIME NULL COMMENT 'When project was marked complete',

  -- Foreign key constraints
  CONSTRAINT `fk_campaign_projects_campaign`
    FOREIGN KEY (`campaign_id`)
    REFERENCES `campaigns` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_campaign_projects_parent`
    FOREIGN KEY (`parent_project_id`)
    REFERENCES `campaign_projects` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_campaign_projects_character`
    FOREIGN KEY (`character_id`)
    REFERENCES `characters` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT `fk_campaign_projects_creator`
    FOREIGN KEY (`created_by_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  -- Constraints
  CONSTRAINT `chk_progress_not_exceed_goal`
    CHECK (`current_points` <= `goal_points`),

  -- Note: Self-parent check (parent_project_id != id) must be enforced in application logic
  -- MySQL does not support column references in CHECK constraints

  -- Indexes for performance
  INDEX `idx_campaign_id` (`campaign_id`),
  INDEX `idx_parent_project_id` (`parent_project_id`),
  INDEX `idx_character_id` (`character_id`),
  INDEX `idx_created_by` (`created_by_user_id`),
  INDEX `idx_is_deleted` (`is_deleted`),
  INDEX `idx_is_completed` (`is_completed`),
  INDEX `idx_display_order` (`display_order`),

  -- Composite indexes for common queries
  INDEX `idx_campaign_active` (`campaign_id`, `is_deleted`, `is_completed`),
  INDEX `idx_campaign_hierarchy` (`campaign_id`, `parent_project_id`, `display_order`),
  INDEX `idx_character_projects` (`character_id`, `is_deleted`, `is_completed`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- TABLE: campaign_project_history
-- Purpose: Audit trail for project changes (progress updates, completions)
-- ==================================================================

CREATE TABLE IF NOT EXISTS `campaign_project_history` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL COMMENT 'User who made the change',
  `action` ENUM('created', 'updated_progress', 'updated_goal', 'completed', 'deleted') NOT NULL,
  `previous_points` INT UNSIGNED NULL COMMENT 'Points before change',
  `new_points` INT UNSIGNED NULL COMMENT 'Points after change',
  `notes` TEXT NULL COMMENT 'Optional notes about the change',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  CONSTRAINT `fk_project_history_project`
    FOREIGN KEY (`project_id`)
    REFERENCES `campaign_projects` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_project_history_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Indexes
  INDEX `idx_project_id` (`project_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- NOTES:
-- ==================================================================
-- Schema Features:
--   - Hierarchical projects via self-referential foreign key (parent_project_id)
--   - Character assignment REQUIRED and immutable (character_id NOT NULL)
--   - ON DELETE RESTRICT prevents deleting characters with projects
--   - ON DELETE CASCADE removes child projects when parent deleted
--   - Progress validation: current_points <= goal_points
--   - Soft deletes preserve history (is_deleted flag)
--   - Audit trail tracks all changes with user attribution
--
-- Business Rules:
--   - Character assignment required at creation (character_id NOT NULL)
--   - Character cannot be reassigned (immutable - enforce in API)
--   - Sub-project goals should sum to parent goal (not enforced by DB)
--   - Parent progress = sum of all descendant current_points (calculated)
--   - Players create projects for own characters only
--   - GMs create projects for any character in campaign
--   - Admins create projects for any character
--
-- Sample Queries:
--
-- Get all projects for a campaign with character names:
-- SELECT
--   p.*,
--   c.name as character_name
-- FROM campaign_projects p
-- INNER JOIN characters c ON p.character_id = c.id
-- WHERE p.campaign_id = ? AND p.is_deleted = 0
-- ORDER BY p.display_order;
--
-- Get project hierarchy (recursive CTE):
-- WITH RECURSIVE project_tree AS (
--   SELECT *, 0 as depth
--   FROM campaign_projects
--   WHERE campaign_id = ? AND parent_project_id IS NULL AND is_deleted = 0
--   UNION ALL
--   SELECT p.*, pt.depth + 1
--   FROM campaign_projects p
--   INNER JOIN project_tree pt ON p.parent_project_id = pt.id
--   WHERE p.is_deleted = 0
-- )
-- SELECT * FROM project_tree ORDER BY depth, display_order;
--
-- Calculate aggregate progress for a parent project:
-- WITH RECURSIVE descendants AS (
--   SELECT id, current_points, goal_points
--   FROM campaign_projects
--   WHERE id = ?
--   UNION ALL
--   SELECT p.id, p.current_points, p.goal_points
--   FROM campaign_projects p
--   INNER JOIN descendants d ON p.parent_project_id = d.id
--   WHERE p.is_deleted = 0
-- )
-- SELECT
--   SUM(current_points) as total_current,
--   SUM(goal_points) as total_goal
-- FROM descendants;

-- ==================================================================
-- ROLLBACK (if needed)
-- ==================================================================
-- DROP TABLE IF EXISTS `campaign_project_history`;
-- DROP TABLE IF EXISTS `campaign_projects`;
