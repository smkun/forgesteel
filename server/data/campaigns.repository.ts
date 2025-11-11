/**
 * Campaigns Repository
 *
 * Data access layer for campaigns and campaign_members tables.
 * Handles all database operations for campaign records and membership.
 *
 * References:
 * - db/migrations/001_add_campaigns.sql: Database schema
 * - Campaign system design: characters grouped into campaigns with GM assignments
 */

import pool from './db-connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * Campaign database record
 */
export interface Campaign {
	id: number;
	name: string;
	description: string | null;
	created_by_user_id: number;
	is_deleted: boolean;
	created_at: Date;
	updated_at: Date;
	// Joined data from queries
	creator_email?: string | null;
	creator_display_name?: string | null;
	user_role?: 'gm' | 'player'; // Role of querying user in this campaign
}

/**
 * Campaign member database record
 */
export interface CampaignMember {
	id: number;
	campaign_id: number;
	user_id: number;
	role: 'gm' | 'player';
	joined_at: Date;
	// Joined data from queries
	email?: string;
	display_name?: string | null;
}

/**
 * Data for creating a new campaign
 */
export interface CreateCampaignData {
	name: string;
	description?: string | null;
	created_by_user_id: number;
}

/**
 * Data for updating an existing campaign
 */
export interface UpdateCampaignData {
	name?: string;
	description?: string | null;
	is_deleted?: boolean;
}

const CAMPAIGN_SELECT = `
  SELECT
    c.*,
    creator.email AS creator_email,
    creator.display_name AS creator_display_name
  FROM campaigns c
  LEFT JOIN users creator ON c.created_by_user_id = creator.id
`;

/**
 * Find campaign by ID
 */
export async function findById(id: number): Promise<Campaign | null> {
	const [rows] = await pool.query<RowDataPacket[]>(
		`${CAMPAIGN_SELECT} WHERE c.id = ?`,
		[id]
	);

	if (rows.length === 0) {
		console.log(`[CAMPAIGNS] Campaign not found: ID ${id}`);
		return null;
	}

	return rows[0] as Campaign;
}

/**
 * Find all campaigns (admin only)
 */
export async function findAll(
	includeDeleted: boolean = false
): Promise<Campaign[]> {
	const deletedClause = includeDeleted ? '' : 'WHERE c.is_deleted = 0';

	const [rows] = await pool.query<RowDataPacket[]>(
		`${CAMPAIGN_SELECT}
    ${deletedClause}
    ORDER BY c.updated_at DESC`
	);

	console.log(`[CAMPAIGNS] Found ${rows.length} total campaigns`);
	return rows as Campaign[];
}

/**
 * Find all campaigns for a user (as GM or player)
 */
export async function findByUser(
	user_id: number,
	includeDeleted: boolean = false
): Promise<Campaign[]> {
	const deletedClause = includeDeleted ? '' : 'AND c.is_deleted = 0';

	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT
      c.*,
      creator.email AS creator_email,
      creator.display_name AS creator_display_name,
      cm.role AS user_role
    FROM campaigns c
    LEFT JOIN users creator ON c.created_by_user_id = creator.id
    LEFT JOIN campaign_members cm ON c.id = cm.campaign_id AND cm.user_id = ?
    WHERE (cm.user_id = ? OR c.created_by_user_id = ?)
    ${deletedClause}
    ORDER BY c.updated_at DESC`,
		[user_id, user_id, user_id]
	);

	console.log(`[CAMPAIGNS] Found ${rows.length} campaigns for user ${user_id}`);
	console.log(`[CAMPAIGNS] Campaign details:`, rows.map(r => ({
		id: r.id,
		name: r.name,
		created_by: r.created_by_user_id,
		user_role: r.user_role,
		creator_email: r.creator_email
	})));
	return rows as Campaign[];
}

/**
 * Find all campaigns where user is GM
 */
export async function findByGM(
	gm_user_id: number,
	includeDeleted: boolean = false
): Promise<Campaign[]> {
	const whereClause = includeDeleted
		? 'WHERE cm.user_id = ? AND cm.role = \'gm\''
		: 'WHERE cm.user_id = ? AND cm.role = \'gm\' AND c.is_deleted = 0';

	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT
      c.*,
      creator.email AS creator_email,
      creator.display_name AS creator_display_name,
      cm.role AS user_role
    FROM campaigns c
    LEFT JOIN users creator ON c.created_by_user_id = creator.id
    INNER JOIN campaign_members cm ON c.id = cm.campaign_id
    ${whereClause}
    ORDER BY c.updated_at DESC`,
		[gm_user_id]
	);

	console.log(`[CAMPAIGNS] Found ${rows.length} campaigns where user ${gm_user_id} is GM`);
	return rows as Campaign[];
}

/**
 * Create a new campaign
 * Automatically adds creator as GM member
 */
export async function create(data: CreateCampaignData): Promise<Campaign> {
	const connection = await pool.getConnection();

	try {
		await connection.beginTransaction();

		// Create campaign
		const [result] = await connection.query<ResultSetHeader>(
			`INSERT INTO campaigns (name, description, created_by_user_id)
       VALUES (?, ?, ?)`,
			[data.name, data.description || null, data.created_by_user_id]
		);

		const campaignId = result.insertId;

		// Add creator as GM
		await connection.query(
			`INSERT INTO campaign_members (campaign_id, user_id, role)
       VALUES (?, ?, 'gm')`,
			[campaignId, data.created_by_user_id]
		);

		await connection.commit();

		const createdCampaign = await findById(campaignId);
		if (!createdCampaign) {
			throw new Error('Failed to retrieve created campaign');
		}

		console.log(`[CAMPAIGNS] ✅ Created campaign: ${createdCampaign.name} (ID: ${createdCampaign.id})`);
		return createdCampaign;
	} catch (error) {
		await connection.rollback();
		console.error('[CAMPAIGNS] ❌ Failed to create campaign:', error);
		throw error;
	} finally {
		connection.release();
	}
}

/**
 * Update an existing campaign
 */
export async function update(id: number, data: UpdateCampaignData): Promise<Campaign | null> {
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

	if (data.is_deleted !== undefined) {
		updates.push('is_deleted = ?');
		values.push(data.is_deleted ? 1 : 0);
	}

	if (updates.length === 0) {
		console.log(`[CAMPAIGNS] No updates provided for campaign ${id}`);
		return findById(id);
	}

	values.push(id);

	const [result] = await pool.query<ResultSetHeader>(
		`UPDATE campaigns SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		values
	);

	if (result.affectedRows === 0) {
		console.log(`[CAMPAIGNS] Campaign not found for update: ID ${id}`);
		return null;
	}

	console.log(`[CAMPAIGNS] ✅ Updated campaign: ID ${id}`);
	return findById(id);
}

/**
 * Soft delete a campaign
 */
export async function softDelete(id: number): Promise<boolean> {
	const [result] = await pool.query<ResultSetHeader>(
		'UPDATE campaigns SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
		[id]
	);

	if (result.affectedRows === 0) {
		console.log(`[CAMPAIGNS] Campaign not found for deletion: ID ${id}`);
		return false;
	}

	console.log(`[CAMPAIGNS] ✅ Soft-deleted campaign: ID ${id}`);
	return true;
}

/**
 * Get all members of a campaign
 */
export async function getMembers(campaign_id: number): Promise<CampaignMember[]> {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT
      cm.*,
      u.email,
      u.display_name
    FROM campaign_members cm
    INNER JOIN users u ON cm.user_id = u.id
    WHERE cm.campaign_id = ?
    ORDER BY cm.role DESC, cm.joined_at ASC`,
		[campaign_id]
	);

	console.log(`[CAMPAIGNS] Found ${rows.length} members for campaign ${campaign_id}`);
	return rows as CampaignMember[];
}

/**
 * Get all GMs of a campaign
 */
export async function getGMs(campaign_id: number): Promise<CampaignMember[]> {
	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT
      cm.*,
      u.email,
      u.display_name
    FROM campaign_members cm
    INNER JOIN users u ON cm.user_id = u.id
    WHERE cm.campaign_id = ? AND cm.role = 'gm'
    ORDER BY cm.joined_at ASC`,
		[campaign_id]
	);

	console.log(`[CAMPAIGNS] Found ${rows.length} GMs for campaign ${campaign_id}`);
	return rows as CampaignMember[];
}

/**
 * Check if user is a member of campaign
 */
export async function isMember(campaign_id: number, user_id: number): Promise<boolean> {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT id FROM campaign_members WHERE campaign_id = ? AND user_id = ?',
		[campaign_id, user_id]
	);

	return rows.length > 0;
}

/**
 * Check if user is GM of campaign
 */
export async function isGM(campaign_id: number, user_id: number): Promise<boolean> {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT id FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND role = \'gm\'',
		[campaign_id, user_id]
	);

	return rows.length > 0;
}

/**
 * Add member to campaign
 */
export async function addMember(
	campaign_id: number,
	user_id: number,
	role: 'gm' | 'player' = 'player'
): Promise<CampaignMember> {
	try {
		const [result] = await pool.query<ResultSetHeader>(
			`INSERT INTO campaign_members (campaign_id, user_id, role)
       VALUES (?, ?, ?)`,
			[campaign_id, user_id, role]
		);

		const [rows] = await pool.query<RowDataPacket[]>(
			`SELECT
        cm.*,
        u.email,
        u.display_name
      FROM campaign_members cm
      INNER JOIN users u ON cm.user_id = u.id
      WHERE cm.id = ?`,
			[result.insertId]
		);

		console.log(`[CAMPAIGNS] ✅ Added ${role} to campaign ${campaign_id}: user ${user_id}`);
		return rows[0] as CampaignMember;
	} catch (error: any) {
		if (error.code === 'ER_DUP_ENTRY') {
			console.log(`[CAMPAIGNS] User ${user_id} already member of campaign ${campaign_id}`);
			// Return existing member
			const [rows] = await pool.query<RowDataPacket[]>(
				`SELECT
          cm.*,
          u.email,
          u.display_name
        FROM campaign_members cm
        INNER JOIN users u ON cm.user_id = u.id
        WHERE cm.campaign_id = ? AND cm.user_id = ?`,
				[campaign_id, user_id]
			);
			return rows[0] as CampaignMember;
		}
		throw error;
	}
}

/**
 * Remove member from campaign
 */
export async function removeMember(campaign_id: number, user_id: number): Promise<boolean> {
	const [result] = await pool.query<ResultSetHeader>(
		'DELETE FROM campaign_members WHERE campaign_id = ? AND user_id = ?',
		[campaign_id, user_id]
	);

	if (result.affectedRows === 0) {
		console.log(`[CAMPAIGNS] Member not found for removal: campaign ${campaign_id}, user ${user_id}`);
		return false;
	}

	console.log(`[CAMPAIGNS] ✅ Removed user ${user_id} from campaign ${campaign_id}`);
	return true;
}

/**
 * Update member role
 */
export async function updateMemberRole(
	campaign_id: number,
	user_id: number,
	role: 'gm' | 'player'
): Promise<CampaignMember | null> {
	const [result] = await pool.query<ResultSetHeader>(
		'UPDATE campaign_members SET role = ? WHERE campaign_id = ? AND user_id = ?',
		[role, campaign_id, user_id]
	);

	if (result.affectedRows === 0) {
		console.log(`[CAMPAIGNS] Member not found for role update: campaign ${campaign_id}, user ${user_id}`);
		return null;
	}

	const [rows] = await pool.query<RowDataPacket[]>(
		`SELECT
      cm.*,
      u.email,
      u.display_name
    FROM campaign_members cm
    INNER JOIN users u ON cm.user_id = u.id
    WHERE cm.campaign_id = ? AND cm.user_id = ?`,
		[campaign_id, user_id]
	);

	console.log(`[CAMPAIGNS] ✅ Updated role to ${role} for user ${user_id} in campaign ${campaign_id}`);
	return rows[0] as CampaignMember;
}

/**
 * Get user's role in campaign
 */
export async function getUserRole(campaign_id: number, user_id: number): Promise<'gm' | 'player' | null> {
	const [rows] = await pool.query<RowDataPacket[]>(
		'SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ?',
		[campaign_id, user_id]
	);

	if (rows.length === 0) {
		return null;
	}

	return (rows[0] as any).role;
}
