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

import pool from './db-connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

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
 * Campaign Project database record
 */
export interface CampaignProject {
	id: number;
	campaign_id: number;
	parent_project_id: number | null;
	character_id: number;
	character_name: string;
	name: string;
	description: string | null;
	goal_points: number;
	current_points: number;
	is_completed: boolean;
	is_deleted: boolean;
	created_by_user_id: number;
	creator_email?: string | null;
	creator_display_name?: string | null;
	created_at: Date;
	updated_at: Date;
	completed_at: Date | null;
}

/**
 * Data for creating a new project
 */
export interface CreateProjectData {
	campaign_id: number;
	parent_project_id?: number | null;
	character_id: number;
	name: string;
	description?: string | null;
	goal_points: number;
	current_points?: number;
	created_by_user_id: number;
}

/**
 * Data for updating an existing project
 */
export interface UpdateProjectData {
	name?: string;
	description?: string | null;
	goal_points?: number;
	current_points?: number;
	parent_project_id?: number | null;
	is_completed?: boolean;
	completed_at?: Date | null;
}

/**
 * Find project by ID
 *
 * @param id Project ID
 * @returns Project record or null if not found
 */
export async function findById(id: number): Promise<CampaignProject | null> {
	const [rows] = await pool.query<RowDataPacket[]>(`${PROJECT_SELECT} WHERE p.id = ?`, [id]);

	if (rows.length === 0) {
		console.log(`[PROJECTS] Project not found: ID ${id}`);
		return null;
	}

	return rows[0] as CampaignProject;
}

/**
 * Find all projects for a campaign
 *
 * @param campaign_id Campaign ID
 * @param includeDeleted Include soft-deleted projects (default: false)
 * @returns Array of projects
 */
export async function findByCampaign(
	campaign_id: number,
	includeDeleted: boolean = false
): Promise<CampaignProject[]> {
	const whereClause = includeDeleted
		? 'WHERE p.campaign_id = ?'
		: 'WHERE p.campaign_id = ? AND p.is_deleted = 0';

	const [rows] = await pool.query<RowDataPacket[]>(
		`${PROJECT_SELECT} ${whereClause} ORDER BY p.parent_project_id, p.created_at ASC`,
		[campaign_id]
	);

	console.log(`[PROJECTS] Found ${rows.length} projects for campaign ${campaign_id}`);
	return rows as CampaignProject[];
}

/**
 * Find all projects for a character
 *
 * @param character_id Character ID
 * @returns Array of projects
 */
export async function findByCharacter(character_id: number): Promise<CampaignProject[]> {
	const [rows] = await pool.query<RowDataPacket[]>(
		`${PROJECT_SELECT} WHERE p.character_id = ? AND p.is_deleted = 0 ORDER BY p.updated_at DESC`,
		[character_id]
	);

	console.log(`[PROJECTS] Found ${rows.length} projects for character ${character_id}`);
	return rows as CampaignProject[];
}

/**
 * Create a new project
 *
 * @param data Project data
 * @returns Created project record
 */
export async function create(data: CreateProjectData): Promise<CampaignProject> {
	const [result] = await pool.query<ResultSetHeader>(
		`INSERT INTO campaign_projects (
      campaign_id, parent_project_id, character_id, name, description,
      goal_points, current_points, created_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			data.campaign_id,
			data.parent_project_id || null,
			data.character_id,
			data.name,
			data.description || null,
			data.goal_points,
			data.current_points || 0,
			data.created_by_user_id
		]
	);

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
export async function update(id: number, data: UpdateProjectData): Promise<CampaignProject | null> {
	const updates: string[] = [];
	const values: any[] = [];

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

	const [result] = await pool.query<ResultSetHeader>(
		`UPDATE campaign_projects SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		values
	);

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
export async function updateProgress(id: number, current_points: number): Promise<CampaignProject | null> {
	return update(id, { current_points });
}

/**
 * Soft delete a project
 *
 * @param id Project ID
 * @returns True if deleted, false if not found
 */
export async function softDelete(id: number): Promise<boolean> {
	const [result] = await pool.query<ResultSetHeader>(
		'UPDATE campaign_projects SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
		[id]
	);

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
export async function getProjectDepth(id: number): Promise<number> {
	const [rows] = await pool.query<RowDataPacket[]>(
		`
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
  `,
		[id]
	);

	return (rows[0] as any).max_depth || 0;
}

/**
 * Get all descendant projects (children, grandchildren, etc.)
 *
 * @param id Project ID
 * @returns Array of descendant projects
 */
export async function getDescendants(id: number): Promise<CampaignProject[]> {
	const [rows] = await pool.query<RowDataPacket[]>(
		`
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
  `,
		[id]
	);

	return rows as CampaignProject[];
}

/**
 * Get all ancestor projects (parent, grandparent, etc.)
 *
 * @param id Project ID
 * @returns Array of ancestor projects
 */
export async function getAncestors(id: number): Promise<CampaignProject[]> {
	const [rows] = await pool.query<RowDataPacket[]>(
		`
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
  `,
		[id]
	);

	return rows as CampaignProject[];
}

/**
 * Create project history entry
 *
 * @param data History entry data
 */
export async function createHistoryEntry(data: {
	project_id: number;
	user_id: number;
	action: 'created' | 'updated_progress' | 'updated_goal' | 'completed' | 'deleted';
	previous_points?: number | null;
	new_points?: number | null;
	notes?: string | null;
}): Promise<void> {
	await pool.query(
		`INSERT INTO campaign_project_history (
      project_id, user_id, action, previous_points, new_points, notes
    ) VALUES (?, ?, ?, ?, ?, ?)`,
		[
			data.project_id,
			data.user_id,
			data.action,
			data.previous_points || null,
			data.new_points || null,
			data.notes || null
		]
	);

	console.log(`[PROJECTS] ✅ Created history entry for project ${data.project_id}: ${data.action}`);
}

/**
 * Get project history
 *
 * @param project_id Project ID
 * @returns Array of history entries
 */
export async function getHistory(project_id: number): Promise<any[]> {
	const [rows] = await pool.query<RowDataPacket[]>(
		`
    SELECT
      h.*,
      u.email AS user_email,
      u.display_name AS user_display_name
    FROM campaign_project_history h
    LEFT JOIN users u ON h.user_id = u.id
    WHERE h.project_id = ?
    ORDER BY h.created_at DESC
  `,
		[project_id]
	);

	return rows;
}
