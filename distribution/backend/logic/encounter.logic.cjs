"use strict";
/**
 * Encounter Business Logic
 *
 * Handles encounter access control and JSON validation.
 * GMs can create/edit/delete encounters within their campaigns.
 * Players have read-only access to campaign encounters.
 *
 * References:
 * - DESIGN_backend_encounters.md: Design specification
 * - PLANNING.md: Access control requirements
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncounterAccessLevel = void 0;
exports.getEncounter = getEncounter;
exports.getCampaignEncounters = getCampaignEncounters;
exports.getAllEncounters = getAllEncounters;
exports.createEncounter = createEncounter;
exports.updateEncounter = updateEncounter;
exports.deleteEncounter = deleteEncounter;
exports.getAccessLevel = getAccessLevel;
exports.validateEncounter = validateEncounter;
exports.mapEncounters = mapEncounters;
const encountersRepo = __importStar(require('../data/encounters.repository.cjs'));
const campaignsRepo = __importStar(require('../data/campaigns.repository.cjs'));
/**
 * Encounter access level
 */
var EncounterAccessLevel;
(function (EncounterAccessLevel) {
    /** Full CRUD access (creator, campaign GM, admin) */
    EncounterAccessLevel["Full"] = "full";
    /** Read-only access (campaign player) */
    EncounterAccessLevel["ReadOnly"] = "readonly";
    /** No access */
    EncounterAccessLevel["None"] = "none";
})(EncounterAccessLevel || (exports.EncounterAccessLevel = EncounterAccessLevel = {}));
/**
 * Get encounter by ID with access control
 *
 * @param encounter_id Encounter ID
 * @param user_id Requesting user ID
 * @param is_admin Is user an admin
 * @returns Encounter with data or null if not found/no access
 */
async function getEncounter(encounter_id, user_id, is_admin = false) {
    const encounter = await encountersRepo.findById(encounter_id);
    if (!encounter) {
        return null;
    }
    // Check access - need to be campaign member
    const accessLevel = await getAccessLevel(encounter_id, user_id, is_admin);
    if (accessLevel === EncounterAccessLevel.None) {
        console.log(`[ENCOUNTER LOGIC] ❌ Access denied: User ${user_id} cannot access encounter ${encounter_id}`);
        return null;
    }
    return mapEncounterRecord(encounter);
}
/**
 * Get all encounters for a campaign
 *
 * @param campaign_id Campaign ID
 * @param user_id Requesting user ID
 * @param is_admin Is user an admin
 * @param includeDeleted Include soft-deleted encounters
 * @returns Array of encounters with data
 */
async function getCampaignEncounters(campaign_id, user_id, is_admin = false, includeDeleted = false) {
    // Check if user is a member of the campaign
    if (!is_admin) {
        const userRole = await campaignsRepo.getUserRole(campaign_id, user_id);
        if (!userRole) {
            console.log(`[ENCOUNTER LOGIC] ❌ Access denied: User ${user_id} is not a member of campaign ${campaign_id}`);
            return [];
        }
    }
    const encounters = await encountersRepo.findByCampaign(campaign_id, includeDeleted);
    return mapEncounters(encounters);
}
/**
 * Get all encounters (admin only)
 *
 * @param includeDeleted Include soft-deleted encounters
 * @returns Array of all encounters
 */
async function getAllEncounters(includeDeleted = false) {
    const encounters = await encountersRepo.findAll(includeDeleted);
    return mapEncounters(encounters);
}
/**
 * Create a new encounter
 *
 * @param campaign_id Campaign ID
 * @param user_id User ID (creator)
 * @param encounter Encounter object from frontend
 * @param is_admin Is user an admin
 * @returns Created encounter with data
 */
async function createEncounter(campaign_id, user_id, encounter, is_admin = false) {
    // Check if user is a GM of the campaign (or admin)
    if (!is_admin) {
        const userRole = await campaignsRepo.getUserRole(campaign_id, user_id);
        if (userRole !== 'gm') {
            throw new Error('Only campaign GMs can create encounters');
        }
    }
    // Validate encounter has required fields
    validateEncounter(encounter);
    // Stringify encounter JSON
    const encounter_json = JSON.stringify(encounter);
    // Create encounter
    const created = await encountersRepo.create({
        campaign_id,
        encounter_uuid: encounter.id,
        name: encounter.name || null,
        encounter_json,
        created_by_user_id: user_id
    });
    const mapped = mapEncounterRecord(created);
    if (!mapped) {
        throw new Error('Failed to parse created encounter');
    }
    console.log(`[ENCOUNTER LOGIC] ✅ Created encounter: ${mapped.name || 'Unnamed'} in campaign ${campaign_id}`);
    return mapped;
}
/**
 * Update an encounter
 *
 * @param encounter_id Encounter ID
 * @param user_id Requesting user ID
 * @param encounter Updated encounter object
 * @param is_admin Is user an admin
 * @returns Updated encounter with data or null if not found/no access
 */
async function updateEncounter(encounter_id, user_id, encounter, is_admin = false) {
    // Get the existing encounter to check access
    const existing = await encountersRepo.findById(encounter_id);
    if (!existing) {
        console.log(`[ENCOUNTER LOGIC] ❌ Encounter not found: ${encounter_id}`);
        return null;
    }
    // Check access - must be creator, campaign GM, or admin
    const accessLevel = await getAccessLevel(encounter_id, user_id, is_admin);
    if (accessLevel !== EncounterAccessLevel.Full) {
        console.log(`[ENCOUNTER LOGIC] ❌ Update denied: User ${user_id} cannot edit encounter ${encounter_id}`);
        return null;
    }
    // Validate encounter
    validateEncounter(encounter);
    // Stringify encounter JSON
    const encounter_json = JSON.stringify(encounter);
    // Update encounter
    const updated = await encountersRepo.update(encounter_id, {
        name: encounter.name || null,
        encounter_json
    });
    if (!updated) {
        return null;
    }
    console.log(`[ENCOUNTER LOGIC] ✅ Updated encounter: ${encounter_id}`);
    return mapEncounterRecord(updated);
}
/**
 * Delete an encounter (soft delete)
 *
 * @param encounter_id Encounter ID
 * @param user_id Requesting user ID
 * @param is_admin Is user an admin
 * @returns True if deleted, false if not found/no access
 */
async function deleteEncounter(encounter_id, user_id, is_admin = false) {
    // Get the existing encounter to check access
    const existing = await encountersRepo.findById(encounter_id);
    if (!existing) {
        console.log(`[ENCOUNTER LOGIC] ❌ Encounter not found: ${encounter_id}`);
        return false;
    }
    // Check access - must be creator, campaign GM, or admin
    const accessLevel = await getAccessLevel(encounter_id, user_id, is_admin);
    if (accessLevel !== EncounterAccessLevel.Full) {
        console.log(`[ENCOUNTER LOGIC] ❌ Delete denied: User ${user_id} cannot delete encounter ${encounter_id}`);
        return false;
    }
    const result = await encountersRepo.softDelete(encounter_id);
    if (result) {
        console.log(`[ENCOUNTER LOGIC] ✅ Deleted encounter: ${encounter_id}`);
    }
    return result;
}
/**
 * Get encounter access level for a user
 *
 * @param encounter_id Encounter ID
 * @param user_id User ID
 * @param is_admin Is user an admin
 * @returns Access level
 */
async function getAccessLevel(encounter_id, user_id, is_admin = false) {
    // Admins have full access
    if (is_admin) {
        return EncounterAccessLevel.Full;
    }
    // Get the encounter
    const encounter = await encountersRepo.findById(encounter_id);
    if (!encounter) {
        return EncounterAccessLevel.None;
    }
    // Check if user is the creator
    if (encounter.created_by_user_id === user_id) {
        return EncounterAccessLevel.Full;
    }
    // Check user's role in the campaign
    const userRole = await campaignsRepo.getUserRole(encounter.campaign_id, user_id);
    // GM has full access
    if (userRole === 'gm') {
        return EncounterAccessLevel.Full;
    }
    // Player has read-only access
    if (userRole === 'player') {
        return EncounterAccessLevel.ReadOnly;
    }
    // Not a campaign member
    return EncounterAccessLevel.None;
}
/**
 * Validate encounter JSON structure
 *
 * Basic validation to ensure Encounter has required fields
 *
 * @param encounter Encounter object
 * @returns True if valid
 * @throws Error if invalid
 */
function validateEncounter(encounter) {
    if (!encounter || typeof encounter !== 'object') {
        throw new Error('Encounter must be an object');
    }
    if (!encounter.id || typeof encounter.id !== 'string') {
        throw new Error('Encounter must have a string ID');
    }
    if (encounter.name !== undefined && encounter.name !== null && typeof encounter.name !== 'string') {
        throw new Error('Encounter name must be a string or null');
    }
    // Validate groups array exists
    if (!Array.isArray(encounter.groups)) {
        throw new Error('Encounter must have a groups array');
    }
    // Validate terrain array exists
    if (!Array.isArray(encounter.terrain)) {
        throw new Error('Encounter must have a terrain array');
    }
    return true;
}
/**
 * Map multiple encounter records to EncounterWithData
 */
function mapEncounters(encounters) {
    const mapped = [];
    for (const encounter of encounters) {
        const parsed = mapEncounterRecord(encounter);
        if (parsed) {
            mapped.push(parsed);
        }
    }
    return mapped;
}
/**
 * Map a single encounter record to EncounterWithData
 */
function mapEncounterRecord(record) {
    try {
        const encounter = JSON.parse(record.encounter_json);
        return {
            id: record.id,
            campaign_id: record.campaign_id,
            encounter_uuid: record.encounter_uuid,
            name: record.name,
            encounter,
            created_by_user_id: record.created_by_user_id,
            is_deleted: record.is_deleted,
            created_at: record.created_at,
            updated_at: record.updated_at,
            creator_email: record.creator_email || null,
            creator_display_name: record.creator_display_name || null,
            campaign_name: record.campaign_name || null
        };
    }
    catch (error) {
        console.error(`[ENCOUNTER LOGIC] ❌ Invalid JSON for encounter ${record.id}:`, error);
        return null;
    }
}
//# sourceMappingURL=encounter.logic.js.map