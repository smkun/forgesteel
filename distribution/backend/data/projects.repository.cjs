"use strict";
/**
 * Projects Repository
 *
 * Data access layer for campaign_projects table.
 * Handles all database operations for project records.
 *
 * References:
 * - DESIGN_CAMPAIGN_PROJECTS.md: Database schema and API design
 * - PLANNING.md: Campaign projects feature overview
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findById = findById;
exports.findByCampaign = findByCampaign;
exports.findByCharacter = findByCharacter;
exports.create = create;
exports.update = update;
exports.updateProgress = updateProgress;
exports.softDelete = softDelete;
exports.getProjectDepth = getProjectDepth;
exports.getDescendants = getDescendants;
exports.getAncestors = getAncestors;
exports.createHistoryEntry = createHistoryEntry;
exports.getHistory = getHistory;
const db_connection_1 = __importDefault(require('./db-connection.cjs'));
const PROJECT_SELECT = `
  SELECT
    p.id,
    p.campaign_id,
    p.parent_project_id,
    p.character_id,
    c.name AS character_name,
    p.name,
    p.description,
    p.goal_points,
    p.current_points,
    p.is_completed,
    p.is_deleted,
    p.created_by_user_id,
    creator.email AS creator_email,
    creator.display_name AS creator_display_name,
    p.created_at,
    p.updated_at,
    p.completed_at
  FROM campaign_projects p
  INNER JOIN characters c ON p.character_id = c.id
  LEFT JOIN users creator ON p.created_by_user_id = creator.id
`;
/**
 * Find project by ID
 *
 * @param id Project ID
 * @returns Project record or null if not found
 */
async function findById(id) {
    const [rows] = await db_connection_1.default.query(`${PROJECT_SELECT} WHERE p.id = ?`, [id]);
    if (rows.length === 0) {
        console.log(`[PROJECTS] Project not found: ID ${id}`);
        return null;
    }
    return rows[0];
}
/**
 * Find all projects for a campaign
 *
 * @param campaign_id Campaign ID
 * @param includeDeleted Include soft-deleted projects (default: false)
 * @returns Array of projects
 */
async function findByCampaign(campaign_id, includeDeleted = false) {
    const whereClause = includeDeleted
        ? 'WHERE p.campaign_id = ?'
        : 'WHERE p.campaign_id = ? AND p.is_deleted = 0';
    const [rows] = await db_connection_1.default.query(`${PROJECT_SELECT} ${whereClause} ORDER BY p.parent_project_id, p.created_at ASC`, [campaign_id]);
    console.log(`[PROJECTS] Found ${rows.length} projects for campaign ${campaign_id}`);
    return rows;
}
/**
 * Find all projects for a character
 *
 * @param character_id Character ID
 * @returns Array of projects
 */
async function findByCharacter(character_id) {
    const [rows] = await db_connection_1.default.query(`${PROJECT_SELECT} WHERE p.character_id = ? AND p.is_deleted = 0 ORDER BY p.updated_at DESC`, [character_id]);
    console.log(`[PROJECTS] Found ${rows.length} projects for character ${character_id}`);
    return rows;
}
/**
 * Create a new project
 *
 * @param data Project data
 * @returns Created project record
 */
async function create(data) {
    const [result] = await db_connection_1.default.query(`INSERT INTO campaign_projects (
      campaign_id, parent_project_id, character_id, name, description,
      goal_points, current_points, created_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        data.campaign_id,
        data.parent_project_id || null,
        data.character_id,
        data.name,
        data.description || null,
        data.goal_points,
        data.current_points || 0,
        data.created_by_user_id
    ]);
    const createdProject = await findById(result.insertId);
    if (!createdProject) {
        throw new Error('Failed to retrieve created project');
    }
    console.log(`[PROJECTS] ✅ Created project: ${createdProject.name} (ID: ${createdProject.id})`);
    return createdProject;
}
/**
 * Update an existing project
 *
 * @param id Project ID
 * @param data Project data to update
 * @returns Updated project record or null if not found
 */
async function update(id, data) {
    const updates = [];
    const values = [];
    if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
    }
    if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
    }
    if (data.goal_points !== undefined) {
        updates.push('goal_points = ?');
        values.push(data.goal_points);
    }
    if (data.current_points !== undefined) {
        updates.push('current_points = ?');
        values.push(data.current_points);
    }
    if (data.parent_project_id !== undefined) {
        updates.push('parent_project_id = ?');
        values.push(data.parent_project_id);
    }
    if (data.is_completed !== undefined) {
        updates.push('is_completed = ?');
        values.push(data.is_completed ? 1 : 0);
    }
    if (data.completed_at !== undefined) {
        updates.push('completed_at = ?');
        values.push(data.completed_at);
    }
    if (updates.length === 0) {
        console.log(`[PROJECTS] No updates provided for project ${id}`);
        return findById(id);
    }
    values.push(id);
    const [result] = await db_connection_1.default.query(`UPDATE campaign_projects SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
    if (result.affectedRows === 0) {
        console.log(`[PROJECTS] Project not found for update: ID ${id}`);
        return null;
    }
    console.log(`[PROJECTS] ✅ Updated project: ID ${id}`);
    return findById(id);
}
/**
 * Update project progress
 *
 * @param id Project ID
 * @param current_points New current points value
 * @returns Updated project or null if not found
 */
async function updateProgress(id, current_points) {
    return update(id, { current_points });
}
/**
 * Soft delete a project
 *
 * @param id Project ID
 * @returns True if deleted, false if not found
 */
async function softDelete(id) {
    const [result] = await db_connection_1.default.query('UPDATE campaign_projects SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
        console.log(`[PROJECTS] Project not found for deletion: ID ${id}`);
        return false;
    }
    console.log(`[PROJECTS] ✅ Soft-deleted project: ID ${id}`);
    return true;
}
/**
 * Get project hierarchy depth (how many levels deep)
 *
 * @param id Project ID
 * @returns Depth level (0 for root projects)
 */
async function getProjectDepth(id) {
    const [rows] = await db_connection_1.default.query(`
    WITH RECURSIVE ancestors AS (
      SELECT id, parent_project_id, 0 AS depth
      FROM campaign_projects
      WHERE id = ?
      UNION ALL
      SELECT p.id, p.parent_project_id, a.depth + 1
      FROM campaign_projects p
      INNER JOIN ancestors a ON p.id = a.parent_project_id
    )
    SELECT MAX(depth) as max_depth FROM ancestors
  `, [id]);
    return rows[0].max_depth || 0;
}
/**
 * Get all descendant projects (children, grandchildren, etc.)
 *
 * @param id Project ID
 * @returns Array of descendant projects
 */
async function getDescendants(id) {
    const [rows] = await db_connection_1.default.query(`
    WITH RECURSIVE descendants AS (
      SELECT id
      FROM campaign_projects
      WHERE parent_project_id = ? AND is_deleted = 0
      UNION ALL
      SELECT p.id
      FROM campaign_projects p
      INNER JOIN descendants d ON p.parent_project_id = d.id
      WHERE p.is_deleted = 0
    )
    SELECT p.*, c.name AS character_name
    FROM descendants d
    INNER JOIN campaign_projects p ON d.id = p.id
    INNER JOIN characters c ON p.character_id = c.id
  `, [id]);
    return rows;
}
/**
 * Get all ancestor projects (parent, grandparent, etc.)
 *
 * @param id Project ID
 * @returns Array of ancestor projects
 */
async function getAncestors(id) {
    const [rows] = await db_connection_1.default.query(`
    WITH RECURSIVE ancestors AS (
      SELECT parent_project_id
      FROM campaign_projects
      WHERE id = ?
      UNION ALL
      SELECT p.parent_project_id
      FROM campaign_projects p
      INNER JOIN ancestors a ON p.id = a.parent_project_id
    )
    SELECT p.*, c.name AS character_name
    FROM ancestors a
    INNER JOIN campaign_projects p ON a.parent_project_id = p.id
    INNER JOIN characters c ON p.character_id = c.id
    WHERE a.parent_project_id IS NOT NULL
  `, [id]);
    return rows;
}
/**
 * Create project history entry
 *
 * @param data History entry data
 */
async function createHistoryEntry(data) {
    await db_connection_1.default.query(`INSERT INTO campaign_project_history (
      project_id, user_id, action, previous_points, new_points, notes
    ) VALUES (?, ?, ?, ?, ?, ?)`, [
        data.project_id,
        data.user_id,
        data.action,
        data.previous_points || null,
        data.new_points || null,
        data.notes || null
    ]);
    console.log(`[PROJECTS] ✅ Created history entry for project ${data.project_id}: ${data.action}`);
}
/**
 * Get project history
 *
 * @param project_id Project ID
 * @returns Array of history entries
 */
async function getHistory(project_id) {
    const [rows] = await db_connection_1.default.query(`
    SELECT
      h.*,
      u.email AS user_email,
      u.display_name AS user_display_name
    FROM campaign_project_history h
    LEFT JOIN users u ON h.user_id = u.id
    WHERE h.project_id = ?
    ORDER BY h.created_at DESC
  `, [project_id]);
    return rows;
}
//# sourceMappingURL=projects.repository.js.map