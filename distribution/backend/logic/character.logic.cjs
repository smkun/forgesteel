"use strict";
/**
 * Character Business Logic
 *
 * Handles character ownership, sharing, and JSON validation.
 *
 * References:
 * - PLANNING.md: Character ownership and access control
 * - PRD.md: Character sharing requirements
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
exports.AccessLevel = void 0;
exports.getCharacter = getCharacter;
exports.getCharacterByHeroId = getCharacterByHeroId;
exports.getUserCharacters = getUserCharacters;
exports.getAllCharacters = getAllCharacters;
exports.createCharacter = createCharacter;
exports.updateCharacter = updateCharacter;
exports.deleteCharacter = deleteCharacter;
exports.shareCharacterWithGM = shareCharacterWithGM;
exports.shareCharacterWithGMByEmail = shareCharacterWithGMByEmail;
exports.unshareCharacterFromGM = unshareCharacterFromGM;
exports.getAccessLevel = getAccessLevel;
exports.reassignCharacterOwner = reassignCharacterOwner;
exports.validateHero = validateHero;
exports.mapCharacters = mapCharacters;
const charactersRepo = __importStar(require('../data/characters.repository.cjs'));
const usersRepo = __importStar(require('../data/users.repository.cjs'));
const campaignsRepo = __importStar(require('../data/campaigns.repository.cjs'));
/**
 * Character access level
 */
var AccessLevel;
(function (AccessLevel) {
    AccessLevel["Owner"] = "owner";
    AccessLevel["GM"] = "gm";
    AccessLevel["None"] = "none";
})(AccessLevel || (exports.AccessLevel = AccessLevel = {}));
/**
 * Get character by ID with access control
 *
 * @param character_id Character ID
 * @param user_id Requesting user ID
 * @param is_admin Is user an admin
 * @returns Character with Hero or null if not found/no access
 */
async function getCharacter(character_id, user_id, is_admin = false) {
    const character = await charactersRepo.findById(character_id);
    if (!character) {
        return null;
    }
    // Check access - allow if:
    // 1. User is admin
    // 2. User owns the character
    // 3. User is assigned as GM to the character
    // 4. Character is in a campaign where user is a GM
    let hasAccess = is_admin ||
        character.owner_user_id === user_id ||
        character.gm_user_id === user_id;
    // If not already granted access, check campaign GM permissions
    if (!hasAccess && character.campaign_id) {
        const userRole = await campaignsRepo.getUserRole(character.campaign_id, user_id);
        hasAccess = userRole === 'gm';
    }
    if (!hasAccess) {
        console.log(`[CHARACTER LOGIC] ❌ Access denied: User ${user_id} cannot access character ${character_id}`);
        return null;
    }
    return mapCharacterRecord(character);
}
/**
 * Get character by hero ID (UUID)
 *
 * @param hero_id Hero ID (UUID string)
 * @param user_id Requesting user ID
 * @param is_admin Is user an admin
 * @returns Character with Hero or null if not found/no access
 */
async function getCharacterByHeroId(hero_id, user_id, is_admin = false) {
    const character = await charactersRepo.findByHeroId(hero_id);
    if (!character) {
        return null;
    }
    // Check access - allow if:
    // 1. User is admin
    // 2. User owns the character
    // 3. User is assigned as GM to the character
    // 4. Character is in a campaign where user is a GM
    let hasAccess = is_admin ||
        character.owner_user_id === user_id ||
        character.gm_user_id === user_id;
    // If not already granted access, check campaign GM permissions
    if (!hasAccess && character.campaign_id) {
        const userRole = await campaignsRepo.getUserRole(character.campaign_id, user_id);
        hasAccess = userRole === 'gm';
    }
    if (!hasAccess) {
        console.log(`[CHARACTER LOGIC] ❌ Access denied: User ${user_id} cannot access character with hero_id ${hero_id}`);
        return null;
    }
    return mapCharacterRecord(character);
}
/**
 * Get all characters for a user (owned + shared)
 *
 * @param user_id User ID
 * @param includeDeleted Include soft-deleted characters
 * @returns Array of characters with Hero
 */
async function getUserCharacters(user_id, includeDeleted = false) {
    // Get owned characters
    const ownedCharacters = await charactersRepo.findByOwner(user_id, includeDeleted);
    // Get GM characters
    const gmCharacters = await charactersRepo.findByGM(user_id, includeDeleted);
    // Combine and parse
    const allCharacters = [...ownedCharacters, ...gmCharacters];
    // Extra safety: ensure no unauthorized rows slip through due to any upstream issues
    const filteredCharacters = allCharacters.filter(character => {
        const hasAccess = character.owner_user_id === user_id ||
            character.gm_user_id === user_id;
        if (!hasAccess) {
            console.warn(`[CHARACTER LOGIC] ⚠️ Filtering unauthorized character ${character.id} for user ${user_id}`);
        }
        return hasAccess;
    });
    const uniqueCharacters = [];
    const seen = new Set();
    for (const character of filteredCharacters) {
        if (seen.has(character.id)) {
            continue;
        }
        seen.add(character.id);
        uniqueCharacters.push(character);
    }
    return mapCharacters(uniqueCharacters);
}
/**
 * Get all characters (admin only)
 */
async function getAllCharacters(includeDeleted = false) {
    const characters = await charactersRepo.findAll(includeDeleted);
    return mapCharacters(characters);
}
/**
 * Create a new character
 *
 * @param owner_user_id Owner user ID
 * @param hero Hero object
 * @returns Created character with Hero
 */
async function createCharacter(owner_user_id, hero) {
    // Validate Hero object has required fields
    if (!hero.id) {
        throw new Error('Hero must have an ID');
    }
    // Stringify Hero JSON
    const character_json = JSON.stringify(hero);
    // Extract name from Hero
    const name = hero.name || null;
    // Create character
    const character = await charactersRepo.create({
        owner_user_id,
        name,
        character_json
    });
    const mapped = mapCharacterRecord(character);
    if (!mapped) {
        throw new Error('Failed to parse created character');
    }
    return mapped;
}
/**
 * Update a character
 *
 * @param character_id Character ID
 * @param user_id Requesting user ID
 * @param hero Updated Hero object
 * @param is_admin Is user an admin
 * @returns Updated character with Hero or null if not found/no access
 */
async function updateCharacter(character_id, user_id, hero, is_admin = false) {
    // Verify ownership (only owner can update)
    const isOwner = await charactersRepo.isOwner(character_id, user_id);
    if (!isOwner && !is_admin) {
        console.log(`[CHARACTER LOGIC] ❌ Update denied: User ${user_id} is not owner of character ${character_id}`);
        return null;
    }
    // Stringify Hero JSON
    const character_json = JSON.stringify(hero);
    // Extract name from Hero
    const name = hero.name || null;
    // Update character
    const character = await charactersRepo.update(character_id, {
        name,
        character_json
    });
    return character ? mapCharacterRecord(character) : null;
}
/**
 * Delete a character (soft delete)
 *
 * @param character_id Character ID
 * @param user_id Requesting user ID
 * @param is_admin Is user an admin
 * @returns True if deleted, false if not found/no access
 */
async function deleteCharacter(character_id, user_id, is_admin = false) {
    // Verify ownership (only owner can delete)
    const isOwner = await charactersRepo.isOwner(character_id, user_id);
    if (!isOwner && !is_admin) {
        console.log(`[CHARACTER LOGIC] ❌ Delete denied: User ${user_id} is not owner of character ${character_id}`);
        return false;
    }
    return charactersRepo.softDelete(character_id);
}
/**
 * Share character with GM
 *
 * @param character_id Character ID
 * @param owner_user_id Owner user ID
 * @param gm_user_id GM user ID
 * @param is_admin Is owner an admin
 * @returns Updated character or null if not found/no access
 */
async function shareCharacterWithGM(character_id, owner_user_id, gm_user_id, is_admin = false) {
    // Verify ownership (only owner can share)
    const isOwner = await charactersRepo.isOwner(character_id, owner_user_id);
    if (!isOwner && !is_admin) {
        console.log(`[CHARACTER LOGIC] ❌ Share denied: User ${owner_user_id} is not owner of character ${character_id}`);
        return null;
    }
    // Share character
    const character = await charactersRepo.shareWithGM(character_id, gm_user_id);
    if (!character) {
        return null;
    }
    const hero = JSON.parse(character.character_json);
    console.log(`[CHARACTER LOGIC] ✅ Shared character ${character_id} with GM ${gm_user_id}`);
    return mapCharacterRecord(character);
}
async function shareCharacterWithGMByEmail(character_id, owner_user_id, gm_email, is_admin = false) {
    const trimmedEmail = gm_email.trim();
    if (trimmedEmail.length === 0) {
        return unshareCharacterFromGM(character_id, owner_user_id, is_admin);
    }
    const gmUser = await usersRepo.findByEmail(trimmedEmail);
    if (!gmUser) {
        throw new Error(`User with email ${gm_email} not found`);
    }
    return shareCharacterWithGM(character_id, owner_user_id, gmUser.id, is_admin);
}
/**
 * Unshare character from GM
 *
 * @param character_id Character ID
 * @param owner_user_id Owner user ID
 * @param is_admin Is owner an admin
 * @returns Updated character or null if not found/no access
 */
async function unshareCharacterFromGM(character_id, owner_user_id, is_admin = false) {
    // Verify ownership (only owner can unshare)
    const isOwner = await charactersRepo.isOwner(character_id, owner_user_id);
    if (!isOwner && !is_admin) {
        console.log(`[CHARACTER LOGIC] ❌ Unshare denied: User ${owner_user_id} is not owner of character ${character_id}`);
        return null;
    }
    // Unshare character
    const character = await charactersRepo.unshareFromGM(character_id);
    if (!character) {
        return null;
    }
    const hero = JSON.parse(character.character_json);
    console.log(`[CHARACTER LOGIC] ✅ Unshared character ${character_id} from GM`);
    return mapCharacterRecord(character);
}
/**
 * Get character access level for a user
 *
 * @param character_id Character ID
 * @param user_id User ID
 * @param is_admin Is user an admin
 * @returns Access level
 */
async function getAccessLevel(character_id, user_id, is_admin = false) {
    if (is_admin) {
        return AccessLevel.Owner; // Admins have full access
    }
    const isOwner = await charactersRepo.isOwner(character_id, user_id);
    if (isOwner) {
        return AccessLevel.Owner;
    }
    const isShared = await charactersRepo.isSharedWithGM(character_id, user_id);
    if (isShared) {
        return AccessLevel.GM;
    }
    return AccessLevel.None;
}
/**
 * Reassign character ownership (admin only)
 */
async function reassignCharacterOwner(character_id, new_owner_email) {
    const newOwner = await usersRepo.findByEmail(new_owner_email);
    if (!newOwner) {
        throw new Error(`User with email ${new_owner_email} not found`);
    }
    const character = await charactersRepo.update(character_id, {
        owner_user_id: newOwner.id
    });
    if (!character) {
        return null;
    }
    return mapCharacterRecord(character);
}
/**
 * Validate Hero JSON structure
 *
 * Basic validation to ensure Hero has required fields
 *
 * @param hero Hero object
 * @returns True if valid
 * @throws Error if invalid
 */
function validateHero(hero) {
    if (!hero || typeof hero !== 'object') {
        throw new Error('Hero must be an object');
    }
    if (!hero.id || typeof hero.id !== 'string') {
        throw new Error('Hero must have a string ID');
    }
    if (hero.name !== undefined && hero.name !== null && typeof hero.name !== 'string') {
        throw new Error('Hero name must be a string or null');
    }
    // Additional validation can be added here
    // For now, we trust the frontend sends valid Hero objects
    return true;
}
function mapCharacters(characters) {
    const mapped = [];
    for (const character of characters) {
        const parsed = mapCharacterRecord(character);
        if (parsed) {
            mapped.push(parsed);
        }
    }
    return mapped;
}
function mapCharacterRecord(character) {
    try {
        const hero = JSON.parse(character.character_json);
        return {
            id: character.id,
            owner_user_id: character.owner_user_id,
            owner_email: character.owner_email || null,
            owner_display_name: character.owner_display_name || null,
            gm_user_id: character.gm_user_id,
            gm_email: character.gm_email || null,
            gm_display_name: character.gm_display_name || null,
            campaign_id: character.campaign_id || null,
            campaign_name: character.campaign_name || null,
            name: character.name,
            hero,
            is_deleted: character.is_deleted,
            created_at: character.created_at,
            updated_at: character.updated_at
        };
    }
    catch (error) {
        console.error(`[CHARACTER LOGIC] ❌ Invalid JSON for character ${character.id}:`, error);
        return null;
    }
}
//# sourceMappingURL=character.logic.js.map