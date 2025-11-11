/**
 * Character Business Logic
 *
 * Handles character ownership, sharing, and JSON validation.
 *
 * References:
 * - PLANNING.md: Character ownership and access control
 * - PRD.md: Character sharing requirements
 */

import * as charactersRepo from '../data/characters.repository';
import * as usersRepo from '../data/users.repository';
import * as campaignsRepo from '../data/campaigns.repository';

// Hero model from frontend source
// Note: Using relative path because backend tsconfig doesn't include @ alias
import type { Hero } from '../../src/models/hero';

/**
 * Character with parsed Hero JSON
 */
export interface CharacterWithHero {
	id: number;
	owner_user_id: number;
	gm_user_id: number | null;
	campaign_id: number | null;
	name: string | null;
	hero: Hero;
	is_deleted: boolean;
	created_at: Date;
	updated_at: Date;
	owner_email: string | null;
	owner_display_name: string | null;
	gm_email: string | null;
	gm_display_name: string | null;
	campaign_name: string | null;
}

/**
 * Character access level
 */
export enum AccessLevel {
	Owner = 'owner',
	GM = 'gm',
	None = 'none'
}

/**
 * Get character by ID with access control
 *
 * @param character_id Character ID
 * @param user_id Requesting user ID
 * @param is_admin Is user an admin
 * @returns Character with Hero or null if not found/no access
 */
export async function getCharacter(
	character_id: number,
	user_id: number,
	is_admin: boolean = false
): Promise<CharacterWithHero | null> {
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
export async function getCharacterByHeroId(
	hero_id: string,
	user_id: number,
	is_admin: boolean = false
): Promise<CharacterWithHero | null> {
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
export async function getUserCharacters(
	user_id: number,
	includeDeleted: boolean = false
): Promise<CharacterWithHero[]> {
	// Get owned characters
	const ownedCharacters = await charactersRepo.findByOwner(user_id, includeDeleted);

	// Get GM characters
	const gmCharacters = await charactersRepo.findByGM(user_id, includeDeleted);

	// Combine and parse
	const allCharacters = [ ...ownedCharacters, ...gmCharacters ];

	// Extra safety: ensure no unauthorized rows slip through due to any upstream issues
	const filteredCharacters = allCharacters.filter(character => {
		const hasAccess =
			character.owner_user_id === user_id ||
      character.gm_user_id === user_id;

		if (!hasAccess) {
			console.warn(
				`[CHARACTER LOGIC] ⚠️ Filtering unauthorized character ${character.id} for user ${user_id}`
			);
		}

		return hasAccess;
	});

	const uniqueCharacters: charactersRepo.Character[] = [];
	const seen = new Set<number>();

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
export async function getAllCharacters(
	includeDeleted: boolean = false
): Promise<CharacterWithHero[]> {
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
export async function createCharacter(
	owner_user_id: number,
	hero: Hero
): Promise<CharacterWithHero> {
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
export async function updateCharacter(
	character_id: number,
	user_id: number,
	hero: Hero,
	is_admin: boolean = false
): Promise<CharacterWithHero | null> {
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
export async function deleteCharacter(
	character_id: number,
	user_id: number,
	is_admin: boolean = false
): Promise<boolean> {
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
export async function shareCharacterWithGM(
	character_id: number,
	owner_user_id: number,
	gm_user_id: number,
	is_admin: boolean = false
): Promise<CharacterWithHero | null> {
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

export async function shareCharacterWithGMByEmail(
	character_id: number,
	owner_user_id: number,
	gm_email: string,
	is_admin: boolean = false
): Promise<CharacterWithHero | null> {
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
export async function unshareCharacterFromGM(
	character_id: number,
	owner_user_id: number,
	is_admin: boolean = false
): Promise<CharacterWithHero | null> {
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
export async function getAccessLevel(
	character_id: number,
	user_id: number,
	is_admin: boolean = false
): Promise<AccessLevel> {
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
export async function reassignCharacterOwner(
	character_id: number,
	new_owner_email: string
): Promise<CharacterWithHero | null> {
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
export function validateHero(hero: any): boolean {
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

export function mapCharacters(characters: charactersRepo.Character[]): CharacterWithHero[] {
	const mapped: CharacterWithHero[] = [];

	for (const character of characters) {
		const parsed = mapCharacterRecord(character);
		if (parsed) {
			mapped.push(parsed);
		}
	}

	return mapped;
}

function mapCharacterRecord(character: charactersRepo.Character): CharacterWithHero | null {
	try {
		const hero = JSON.parse(character.character_json) as Hero;
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
	} catch (error) {
		console.error(`[CHARACTER LOGIC] ❌ Invalid JSON for character ${character.id}:`, error);
		return null;
	}
}
