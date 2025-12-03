"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findById = findById;
exports.findAll = findAll;
exports.findByUser = findByUser;
exports.findByGM = findByGM;
exports.create = create;
exports.update = update;
exports.softDelete = softDelete;
exports.getMembers = getMembers;
exports.getGMs = getGMs;
exports.isMember = isMember;
exports.isGM = isGM;
exports.addMember = addMember;
exports.removeMember = removeMember;
exports.updateMemberRole = updateMemberRole;
exports.getUserRole = getUserRole;
const db_connection_1 = __importDefault(require('./db-connection.cjs'));
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
async function findById(id) {
    const [rows] = await db_connection_1.default.query(`${CAMPAIGN_SELECT} WHERE c.id = ?`, [id]);
    if (rows.length === 0) {
        console.log(`[CAMPAIGNS] Campaign not found: ID ${id}`);
        return null;
    }
    return rows[0];
}
/**
 * Find all campaigns (admin only)
 */
async function findAll(includeDeleted = false) {
    const deletedClause = includeDeleted ? '' : 'WHERE c.is_deleted = 0';
    const [rows] = await db_connection_1.default.query(`${CAMPAIGN_SELECT}
    ${deletedClause}
    ORDER BY c.updated_at DESC`);
    console.log(`[CAMPAIGNS] Found ${rows.length} total campaigns`);
    return rows;
}
/**
 * Find all campaigns for a user (as GM or player)
 */
async function findByUser(user_id, includeDeleted = false) {
    const deletedClause = includeDeleted ? '' : 'AND c.is_deleted = 0';
    const [rows] = await db_connection_1.default.query(`SELECT
      c.*,
      creator.email AS creator_email,
      creator.display_name AS creator_display_name,
      cm.role AS user_role
    FROM campaigns c
    LEFT JOIN users creator ON c.created_by_user_id = creator.id
    LEFT JOIN campaign_members cm ON c.id = cm.campaign_id AND cm.user_id = ?
    WHERE (cm.user_id = ? OR c.created_by_user_id = ?)
    ${deletedClause}
    ORDER BY c.updated_at DESC`, [user_id, user_id, user_id]);
    console.log(`[CAMPAIGNS] Found ${rows.length} campaigns for user ${user_id}`);
    console.log(`[CAMPAIGNS] Campaign details:`, rows.map(r => ({
        id: r.id,
        name: r.name,
        created_by: r.created_by_user_id,
        user_role: r.user_role,
        creator_email: r.creator_email
    })));
    return rows;
}
/**
 * Find all campaigns where user is GM
 */
async function findByGM(gm_user_id, includeDeleted = false) {
    const whereClause = includeDeleted
        ? 'WHERE cm.user_id = ? AND cm.role = \'gm\''
        : 'WHERE cm.user_id = ? AND cm.role = \'gm\' AND c.is_deleted = 0';
    const [rows] = await db_connection_1.default.query(`SELECT
      c.*,
      creator.email AS creator_email,
      creator.display_name AS creator_display_name,
      cm.role AS user_role
    FROM campaigns c
    LEFT JOIN users creator ON c.created_by_user_id = creator.id
    INNER JOIN campaign_members cm ON c.id = cm.campaign_id
    ${whereClause}
    ORDER BY c.updated_at DESC`, [gm_user_id]);
    console.log(`[CAMPAIGNS] Found ${rows.length} campaigns where user ${gm_user_id} is GM`);
    return rows;
}
/**
 * Create a new campaign
 * Automatically adds creator as GM member
 */
async function create(data) {
    const connection = await db_connection_1.default.getConnection();
    try {
        await connection.beginTransaction();
        // Create campaign
        const [result] = await connection.query(`INSERT INTO campaigns (name, description, created_by_user_id)
       VALUES (?, ?, ?)`, [data.name, data.description || null, data.created_by_user_id]);
        const campaignId = result.insertId;
        // Add creator as GM
        await connection.query(`INSERT INTO campaign_members (campaign_id, user_id, role)
       VALUES (?, ?, 'gm')`, [campaignId, data.created_by_user_id]);
        await connection.commit();
        const createdCampaign = await findById(campaignId);
        if (!createdCampaign) {
            throw new Error('Failed to retrieve created campaign');
        }
        console.log(`[CAMPAIGNS] ✅ Created campaign: ${createdCampaign.name} (ID: ${createdCampaign.id})`);
        return createdCampaign;
    }
    catch (error) {
        await connection.rollback();
        console.error('[CAMPAIGNS] ❌ Failed to create campaign:', error);
        throw error;
    }
    finally {
        connection.release();
    }
}
/**
 * Update an existing campaign
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
    if (data.is_deleted !== undefined) {
        updates.push('is_deleted = ?');
        values.push(data.is_deleted ? 1 : 0);
    }
    if (updates.length === 0) {
        console.log(`[CAMPAIGNS] No updates provided for campaign ${id}`);
        return findById(id);
    }
    values.push(id);
    const [result] = await db_connection_1.default.query(`UPDATE campaigns SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
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
async function softDelete(id) {
    const [result] = await db_connection_1.default.query('UPDATE campaigns SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
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
async function getMembers(campaign_id) {
    const [rows] = await db_connection_1.default.query(`SELECT
      cm.*,
      u.email,
      u.display_name
    FROM campaign_members cm
    INNER JOIN users u ON cm.user_id = u.id
    WHERE cm.campaign_id = ?
    ORDER BY cm.role DESC, cm.joined_at ASC`, [campaign_id]);
    console.log(`[CAMPAIGNS] Found ${rows.length} members for campaign ${campaign_id}`);
    return rows;
}
/**
 * Get all GMs of a campaign
 */
async function getGMs(campaign_id) {
    const [rows] = await db_connection_1.default.query(`SELECT
      cm.*,
      u.email,
      u.display_name
    FROM campaign_members cm
    INNER JOIN users u ON cm.user_id = u.id
    WHERE cm.campaign_id = ? AND cm.role = 'gm'
    ORDER BY cm.joined_at ASC`, [campaign_id]);
    console.log(`[CAMPAIGNS] Found ${rows.length} GMs for campaign ${campaign_id}`);
    return rows;
}
/**
 * Check if user is a member of campaign
 */
async function isMember(campaign_id, user_id) {
    const [rows] = await db_connection_1.default.query('SELECT id FROM campaign_members WHERE campaign_id = ? AND user_id = ?', [campaign_id, user_id]);
    return rows.length > 0;
}
/**
 * Check if user is GM of campaign
 */
async function isGM(campaign_id, user_id) {
    const [rows] = await db_connection_1.default.query('SELECT id FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND role = \'gm\'', [campaign_id, user_id]);
    return rows.length > 0;
}
/**
 * Add member to campaign
 */
async function addMember(campaign_id, user_id, role = 'player') {
    try {
        const [result] = await db_connection_1.default.query(`INSERT INTO campaign_members (campaign_id, user_id, role)
       VALUES (?, ?, ?)`, [campaign_id, user_id, role]);
        const [rows] = await db_connection_1.default.query(`SELECT
        cm.*,
        u.email,
        u.display_name
      FROM campaign_members cm
      INNER JOIN users u ON cm.user_id = u.id
      WHERE cm.id = ?`, [result.insertId]);
        console.log(`[CAMPAIGNS] ✅ Added ${role} to campaign ${campaign_id}: user ${user_id}`);
        return rows[0];
    }
    catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log(`[CAMPAIGNS] User ${user_id} already member of campaign ${campaign_id}`);
            // Return existing member
            const [rows] = await db_connection_1.default.query(`SELECT
          cm.*,
          u.email,
          u.display_name
        FROM campaign_members cm
        INNER JOIN users u ON cm.user_id = u.id
        WHERE cm.campaign_id = ? AND cm.user_id = ?`, [campaign_id, user_id]);
            return rows[0];
        }
        throw error;
    }
}
/**
 * Remove member from campaign
 */
async function removeMember(campaign_id, user_id) {
    const [result] = await db_connection_1.default.query('DELETE FROM campaign_members WHERE campaign_id = ? AND user_id = ?', [campaign_id, user_id]);
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
async function updateMemberRole(campaign_id, user_id, role) {
    const [result] = await db_connection_1.default.query('UPDATE campaign_members SET role = ? WHERE campaign_id = ? AND user_id = ?', [role, campaign_id, user_id]);
    if (result.affectedRows === 0) {
        console.log(`[CAMPAIGNS] Member not found for role update: campaign ${campaign_id}, user ${user_id}`);
        return null;
    }
    const [rows] = await db_connection_1.default.query(`SELECT
      cm.*,
      u.email,
      u.display_name
    FROM campaign_members cm
    INNER JOIN users u ON cm.user_id = u.id
    WHERE cm.campaign_id = ? AND cm.user_id = ?`, [campaign_id, user_id]);
    console.log(`[CAMPAIGNS] ✅ Updated role to ${role} for user ${user_id} in campaign ${campaign_id}`);
    return rows[0];
}
/**
 * Get user's role in campaign
 */
async function getUserRole(campaign_id, user_id) {
    const [rows] = await db_connection_1.default.query('SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ?', [campaign_id, user_id]);
    if (rows.length === 0) {
        return null;
    }
    return rows[0].role;
}
//# sourceMappingURL=campaigns.repository.js.map