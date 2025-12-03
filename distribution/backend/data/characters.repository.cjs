"use strict";
/**
 * Characters Repository
 *
 * Data access layer for characters table.
 * Handles all database operations for character records.
 *
 * References:
 * - PLANNING.md: Database schema design
 * - PRD.md: Character ownership and sharing requirements
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findById = findById;
exports.findByHeroId = findByHeroId;
exports.findByOwner = findByOwner;
exports.findByGM = findByGM;
exports.create = create;
exports.update = update;
exports.softDelete = softDelete;
exports.hardDelete = hardDelete;
exports.countByOwner = countByOwner;
exports.isOwner = isOwner;
exports.isSharedWithGM = isSharedWithGM;
exports.shareWithGM = shareWithGM;
exports.unshareFromGM = unshareFromGM;
exports.findAll = findAll;
exports.findByCampaign = findByCampaign;
exports.canEditCharacter = canEditCharacter;
exports.canViewCharacter = canViewCharacter;
exports.assignToCampaign = assignToCampaign;
const db_connection_1 = __importDefault(require('./db-connection.cjs'));
const CHARACTER_SELECT = `
  SELECT
    c.*,
    owner.email AS owner_email,
    owner.display_name AS owner_display_name,
    gm.email AS gm_email,
    gm.display_name AS gm_display_name,
    campaign.name AS campaign_name
  FROM characters c
  LEFT JOIN users owner ON c.owner_user_id = owner.id
  LEFT JOIN users gm ON c.gm_user_id = gm.id
  LEFT JOIN campaigns campaign ON c.campaign_id = campaign.id
`;
/**
 * Find character by ID
 *
 * @param id Character ID
 * @returns Character record or null if not found
 */
async function findById(id) {
    const [rows] = await db_connection_1.default.query(`${CHARACTER_SELECT} WHERE c.id = ?`, [id]);
    if (rows.length === 0) {
        console.log(`[CHARACTERS] Character not found: ID ${id}`);
        return null;
    }
    return rows[0];
}
/**
 * Find character by hero ID (UUID from character_json)
 *
 * @param hero_id Hero ID (UUID string)
 * @returns Character or null if not found
 */
async function findByHeroId(hero_id) {
    const [rows] = await db_connection_1.default.query(`${CHARACTER_SELECT} WHERE JSON_EXTRACT(c.character_json, '$.id') = ?`, [hero_id]);
    if (rows.length === 0) {
        console.log(`[CHARACTERS] Character not found with hero_id: ${hero_id}`);
        return null;
    }
    console.log('[REPO findByHeroId] RAW row from MySQL:', {
        id: rows[0].id,
        campaign_id: rows[0].campaign_id,
        campaign_name: rows[0].campaign_name,
        allKeys: Object.keys(rows[0])
    });
    return rows[0];
}
/**
 * Find all characters owned by a user
 *
 * @param owner_user_id Owner user ID
 * @param includeDeleted Include soft-deleted characters (default: false)
 * @returns Array of characters
 */
async function findByOwner(owner_user_id, includeDeleted = false) {
    const whereClause = includeDeleted
        ? 'WHERE c.owner_user_id = ?'
        : 'WHERE c.owner_user_id = ? AND c.is_deleted = 0';
    const [rows] = await db_connection_1.default.query(`${CHARACTER_SELECT} ${whereClause} ORDER BY c.updated_at DESC`, [owner_user_id]);
    console.log(`[CHARACTERS] Found ${rows.length} characters for user ${owner_user_id}`);
    if (rows.length > 0) {
        console.log('[REPO findByOwner] First RAW row from MySQL:', {
            id: rows[0].id,
            campaign_id: rows[0].campaign_id,
            campaign_name: rows[0].campaign_name,
            allKeys: Object.keys(rows[0])
        });
    }
    return rows;
}
/**
 * Find all characters shared with a GM
 *
 * @param gm_user_id GM user ID
 * @param includeDeleted Include soft-deleted characters (default: false)
 * @returns Array of characters
 */
async function findByGM(gm_user_id, includeDeleted = false) {
    const whereClause = includeDeleted
        ? 'WHERE c.gm_user_id = ?'
        : 'WHERE c.gm_user_id = ? AND c.is_deleted = 0';
    const [rows] = await db_connection_1.default.query(`${CHARACTER_SELECT} ${whereClause} ORDER BY c.updated_at DESC`, [gm_user_id]);
    console.log(`[CHARACTERS] Found ${rows.length} characters shared with GM ${gm_user_id}`);
    return rows;
}
/**
 * Create a new character
 *
 * @param data Character data
 * @returns Created character record
 */
async function create(data) {
    const [result] = await db_connection_1.default.query(`INSERT INTO characters (owner_user_id, gm_user_id, campaign_id, name, character_json)
     VALUES (?, ?, ?, ?, ?)`, [
        data.owner_user_id,
        data.gm_user_id || null,
        data.campaign_id || null,
        data.name || null,
        data.character_json
    ]);
    const createdCharacter = await findById(result.insertId);
    if (!createdCharacter) {
        throw new Error('Failed to retrieve created character');
    }
    console.log(`[CHARACTERS] ✅ Created character: ${createdCharacter.name || 'Unnamed'} (ID: ${createdCharacter.id})`);
    return createdCharacter;
}
/**
 * Update an existing character
 *
 * @param id Character ID
 * @param data Character data to update
 * @returns Updated character record or null if not found
 */
async function update(id, data) {
    const updates = [];
    const values = [];
    if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
    }
    if (data.character_json !== undefined) {
        updates.push('character_json = ?');
        values.push(data.character_json);
    }
    if (data.gm_user_id !== undefined) {
        updates.push('gm_user_id = ?');
        values.push(data.gm_user_id);
    }
    if (data.campaign_id !== undefined) {
        updates.push('campaign_id = ?');
        values.push(data.campaign_id);
    }
    if (data.owner_user_id !== undefined) {
        updates.push('owner_user_id = ?');
        values.push(data.owner_user_id);
    }
    if (data.is_deleted !== undefined) {
        updates.push('is_deleted = ?');
        values.push(data.is_deleted ? 1 : 0);
    }
    if (updates.length === 0) {
        console.log(`[CHARACTERS] No updates provided for character ${id}`);
        return findById(id);
    }
    values.push(id);
    const [result] = await db_connection_1.default.query(`UPDATE characters SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
    if (result.affectedRows === 0) {
        console.log(`[CHARACTERS] Character not found for update: ID ${id}`);
        return null;
    }
    console.log(`[CHARACTERS] ✅ Updated character: ID ${id}`);
    return findById(id);
}
/**
 * Soft delete a character
 *
 * @param id Character ID
 * @returns True if deleted, false if not found
 */
async function softDelete(id) {
    const [result] = await db_connection_1.default.query('UPDATE characters SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
        console.log(`[CHARACTERS] Character not found for deletion: ID ${id}`);
        return false;
    }
    console.log(`[CHARACTERS] ✅ Soft-deleted character: ID ${id}`);
    return true;
}
/**
 * Hard delete a character (permanent)
 *
 * @param id Character ID
 * @returns True if deleted, false if not found
 */
async function hardDelete(id) {
    const [result] = await db_connection_1.default.query('DELETE FROM characters WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
        console.log(`[CHARACTERS] Character not found for hard deletion: ID ${id}`);
        return false;
    }
    console.log(`[CHARACTERS] ✅ Hard-deleted character: ID ${id}`);
    return true;
}
/**
 * Count characters for a user
 *
 * @param owner_user_id Owner user ID
 * @param includeDeleted Include soft-deleted characters (default: false)
 * @returns Number of characters
 */
async function countByOwner(owner_user_id, includeDeleted = false) {
    const whereClause = includeDeleted
        ? 'WHERE owner_user_id = ?'
        : 'WHERE owner_user_id = ? AND is_deleted = 0';
    const [rows] = await db_connection_1.default.query(`SELECT COUNT(*) as count FROM characters ${whereClause}`, [owner_user_id]);
    return rows[0].count;
}
/**
 * Verify character ownership
 *
 * @param character_id Character ID
 * @param user_id User ID
 * @returns True if user owns the character
 */
async function isOwner(character_id, user_id) {
    const [rows] = await db_connection_1.default.query('SELECT id FROM characters WHERE id = ? AND owner_user_id = ?', [character_id, user_id]);
    return rows.length > 0;
}
/**
 * Verify character is shared with GM
 *
 * @param character_id Character ID
 * @param gm_user_id GM user ID
 * @returns True if character is shared with GM
 */
async function isSharedWithGM(character_id, gm_user_id) {
    const [rows] = await db_connection_1.default.query('SELECT id FROM characters WHERE id = ? AND gm_user_id = ?', [character_id, gm_user_id]);
    return rows.length > 0;
}
/**
 * Share character with GM
 *
 * @param character_id Character ID
 * @param gm_user_id GM user ID
 * @returns Updated character or null if not found
 */
async function shareWithGM(character_id, gm_user_id) {
    return update(character_id, { gm_user_id });
}
/**
 * Unshare character from GM
 *
 * @param character_id Character ID
 * @returns Updated character or null if not found
 */
async function unshareFromGM(character_id) {
    return update(character_id, { gm_user_id: null });
}
/**
 * Find all characters (admin use)
 */
async function findAll(includeDeleted = false) {
    const whereClause = includeDeleted ? '' : 'WHERE c.is_deleted = 0';
    const [rows] = await db_connection_1.default.query(`${CHARACTER_SELECT} ${whereClause} ORDER BY c.updated_at DESC`);
    console.log(`[CHARACTERS] Found ${rows.length} total characters`);
    return rows;
}
/**
 * Find all characters in a campaign
 *
 * @param campaign_id Campaign ID
 * @param includeDeleted Include soft-deleted characters (default: false)
 * @returns Array of characters
 */
async function findByCampaign(campaign_id, includeDeleted = false) {
    const whereClause = includeDeleted
        ? 'WHERE c.campaign_id = ?'
        : 'WHERE c.campaign_id = ? AND c.is_deleted = 0';
    const [rows] = await db_connection_1.default.query(`${CHARACTER_SELECT} ${whereClause} ORDER BY c.updated_at DESC`, [campaign_id]);
    console.log(`[CHARACTERS] Found ${rows.length} characters in campaign ${campaign_id}`);
    return rows;
}
/**
 * Check if user can edit a character
 * User can edit if they are:
 * - Character owner, OR
 * - Campaign GM (if character is in a campaign), OR
 * - Legacy GM (gm_user_id)
 *
 * @param character_id Character ID
 * @param user_id User ID
 * @returns True if user can edit the character
 */
async function canEditCharacter(character_id, user_id) {
    const [rows] = await db_connection_1.default.query(`SELECT COUNT(*) as can_edit
     FROM characters c
     LEFT JOIN campaign_members cm ON c.campaign_id = cm.campaign_id AND cm.user_id = ? AND cm.role = 'gm'
     WHERE c.id = ?
       AND (
         c.owner_user_id = ?
         OR c.gm_user_id = ?
         OR cm.id IS NOT NULL
       )`, [user_id, character_id, user_id, user_id]);
    return rows[0].can_edit > 0;
}
/**
 * Check if user can view a character
 * User can view if they are:
 * - Character owner, OR
 * - Campaign GM, OR
 * - Campaign member (player), OR
 * - Legacy GM (gm_user_id)
 *
 * @param character_id Character ID
 * @param user_id User ID
 * @returns True if user can view the character
 */
async function canViewCharacter(character_id, user_id) {
    const [rows] = await db_connection_1.default.query(`SELECT COUNT(*) as can_view
     FROM characters c
     LEFT JOIN campaign_members cm ON c.campaign_id = cm.campaign_id AND cm.user_id = ?
     WHERE c.id = ?
       AND (
         c.owner_user_id = ?
         OR c.gm_user_id = ?
         OR cm.id IS NOT NULL
       )`, [user_id, character_id, user_id, user_id]);
    return rows[0].can_view > 0;
}
/**
 * Assign character to campaign
 *
 * @param character_id Character ID
 * @param campaign_id Campaign ID (null to remove from campaign)
 * @returns Updated character or null if not found
 */
async function assignToCampaign(character_id, campaign_id) {
    return update(character_id, { campaign_id });
}
//# sourceMappingURL=characters.repository.js.map