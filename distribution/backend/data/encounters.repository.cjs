"use strict";
/**
 * Encounters Repository
 *
 * Data access layer for campaign_encounters table.
 * Handles all database operations for encounter records.
 *
 * References:
 * - DESIGN_backend_encounters.md: Design specification
 * - PLANNING.md: Database schema design
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findById = findById;
exports.findByUUID = findByUUID;
exports.findByCampaign = findByCampaign;
exports.findByCreator = findByCreator;
exports.create = create;
exports.update = update;
exports.softDelete = softDelete;
exports.hardDelete = hardDelete;
exports.countByCampaign = countByCampaign;
exports.belongsToCampaign = belongsToCampaign;
exports.isCreator = isCreator;
exports.findAll = findAll;
const db_connection_1 = __importDefault(require('./db-connection.cjs'));
const ENCOUNTER_SELECT = `
  SELECT
    e.*,
    creator.email AS creator_email,
    creator.display_name AS creator_display_name,
    campaign.name AS campaign_name
  FROM campaign_encounters e
  LEFT JOIN users creator ON e.created_by_user_id = creator.id
  LEFT JOIN campaigns campaign ON e.campaign_id = campaign.id
`;
/**
 * Find encounter by ID
 *
 * @param id Encounter ID
 * @returns Encounter record or null if not found
 */
async function findById(id) {
    const [rows] = await db_connection_1.default.query(`${ENCOUNTER_SELECT} WHERE e.id = ?`, [id]);
    if (rows.length === 0) {
        console.log(`[ENCOUNTERS] Encounter not found: ID ${id}`);
        return null;
    }
    return rows[0];
}
/**
 * Find encounter by UUID within a campaign
 *
 * @param campaign_id Campaign ID
 * @param encounter_uuid Encounter UUID (frontend ID)
 * @returns Encounter or null if not found
 */
async function findByUUID(campaign_id, encounter_uuid) {
    const [rows] = await db_connection_1.default.query(`${ENCOUNTER_SELECT} WHERE e.campaign_id = ? AND e.encounter_uuid = ?`, [campaign_id, encounter_uuid]);
    if (rows.length === 0) {
        console.log(`[ENCOUNTERS] Encounter not found with UUID: ${encounter_uuid} in campaign ${campaign_id}`);
        return null;
    }
    return rows[0];
}
/**
 * Find all encounters in a campaign
 *
 * @param campaign_id Campaign ID
 * @param includeDeleted Include soft-deleted encounters (default: false)
 * @returns Array of encounters
 */
async function findByCampaign(campaign_id, includeDeleted = false) {
    const whereClause = includeDeleted
        ? 'WHERE e.campaign_id = ?'
        : 'WHERE e.campaign_id = ? AND e.is_deleted = 0';
    const [rows] = await db_connection_1.default.query(`${ENCOUNTER_SELECT} ${whereClause} ORDER BY e.updated_at DESC`, [campaign_id]);
    console.log(`[ENCOUNTERS] Found ${rows.length} encounters in campaign ${campaign_id}`);
    return rows;
}
/**
 * Find all encounters created by a user
 *
 * @param user_id Creator user ID
 * @param includeDeleted Include soft-deleted encounters (default: false)
 * @returns Array of encounters
 */
async function findByCreator(user_id, includeDeleted = false) {
    const whereClause = includeDeleted
        ? 'WHERE e.created_by_user_id = ?'
        : 'WHERE e.created_by_user_id = ? AND e.is_deleted = 0';
    const [rows] = await db_connection_1.default.query(`${ENCOUNTER_SELECT} ${whereClause} ORDER BY e.updated_at DESC`, [user_id]);
    console.log(`[ENCOUNTERS] Found ${rows.length} encounters created by user ${user_id}`);
    return rows;
}
/**
 * Create a new encounter
 *
 * @param data Encounter data
 * @returns Created encounter record
 */
async function create(data) {
    const [result] = await db_connection_1.default.query(`INSERT INTO campaign_encounters (campaign_id, encounter_uuid, name, encounter_json, created_by_user_id)
     VALUES (?, ?, ?, ?, ?)`, [
        data.campaign_id,
        data.encounter_uuid,
        data.name || null,
        data.encounter_json,
        data.created_by_user_id
    ]);
    const createdEncounter = await findById(result.insertId);
    if (!createdEncounter) {
        throw new Error('Failed to retrieve created encounter');
    }
    console.log(`[ENCOUNTERS] ✅ Created encounter: ${createdEncounter.name || 'Unnamed'} (ID: ${createdEncounter.id})`);
    return createdEncounter;
}
/**
 * Update an existing encounter
 *
 * @param id Encounter ID
 * @param data Encounter data to update
 * @returns Updated encounter record or null if not found
 */
async function update(id, data) {
    const updates = [];
    const values = [];
    if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
    }
    if (data.encounter_json !== undefined) {
        updates.push('encounter_json = ?');
        values.push(data.encounter_json);
    }
    if (data.is_deleted !== undefined) {
        updates.push('is_deleted = ?');
        values.push(data.is_deleted ? 1 : 0);
    }
    if (updates.length === 0) {
        console.log(`[ENCOUNTERS] No updates provided for encounter ${id}`);
        return findById(id);
    }
    values.push(id);
    const [result] = await db_connection_1.default.query(`UPDATE campaign_encounters SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
    if (result.affectedRows === 0) {
        console.log(`[ENCOUNTERS] Encounter not found for update: ID ${id}`);
        return null;
    }
    console.log(`[ENCOUNTERS] ✅ Updated encounter: ID ${id}`);
    return findById(id);
}
/**
 * Soft delete an encounter
 *
 * @param id Encounter ID
 * @returns True if deleted, false if not found
 */
async function softDelete(id) {
    const [result] = await db_connection_1.default.query('UPDATE campaign_encounters SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
        console.log(`[ENCOUNTERS] Encounter not found for deletion: ID ${id}`);
        return false;
    }
    console.log(`[ENCOUNTERS] ✅ Soft-deleted encounter: ID ${id}`);
    return true;
}
/**
 * Hard delete an encounter (permanent)
 *
 * @param id Encounter ID
 * @returns True if deleted, false if not found
 */
async function hardDelete(id) {
    const [result] = await db_connection_1.default.query('DELETE FROM campaign_encounters WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
        console.log(`[ENCOUNTERS] Encounter not found for hard deletion: ID ${id}`);
        return false;
    }
    console.log(`[ENCOUNTERS] ✅ Hard-deleted encounter: ID ${id}`);
    return true;
}
/**
 * Count encounters in a campaign
 *
 * @param campaign_id Campaign ID
 * @param includeDeleted Include soft-deleted encounters (default: false)
 * @returns Number of encounters
 */
async function countByCampaign(campaign_id, includeDeleted = false) {
    const whereClause = includeDeleted
        ? 'WHERE campaign_id = ?'
        : 'WHERE campaign_id = ? AND is_deleted = 0';
    const [rows] = await db_connection_1.default.query(`SELECT COUNT(*) as count FROM campaign_encounters ${whereClause}`, [campaign_id]);
    return rows[0].count;
}
/**
 * Verify encounter belongs to campaign
 *
 * @param encounter_id Encounter ID
 * @param campaign_id Campaign ID
 * @returns True if encounter belongs to campaign
 */
async function belongsToCampaign(encounter_id, campaign_id) {
    const [rows] = await db_connection_1.default.query('SELECT id FROM campaign_encounters WHERE id = ? AND campaign_id = ?', [encounter_id, campaign_id]);
    return rows.length > 0;
}
/**
 * Verify user is creator of encounter
 *
 * @param encounter_id Encounter ID
 * @param user_id User ID
 * @returns True if user created the encounter
 */
async function isCreator(encounter_id, user_id) {
    const [rows] = await db_connection_1.default.query('SELECT id FROM campaign_encounters WHERE id = ? AND created_by_user_id = ?', [encounter_id, user_id]);
    return rows.length > 0;
}
/**
 * Find all encounters (admin use)
 *
 * @param includeDeleted Include soft-deleted encounters (default: false)
 * @returns Array of all encounters
 */
async function findAll(includeDeleted = false) {
    const whereClause = includeDeleted ? '' : 'WHERE e.is_deleted = 0';
    const [rows] = await db_connection_1.default.query(`${ENCOUNTER_SELECT} ${whereClause} ORDER BY e.updated_at DESC`);
    console.log(`[ENCOUNTERS] Found ${rows.length} total encounters`);
    return rows;
}
//# sourceMappingURL=encounters.repository.js.map