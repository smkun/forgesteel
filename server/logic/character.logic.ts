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
  name: string | null;
  hero: Hero;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
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

  // Check access
  const hasAccess = is_admin ||
    character.owner_user_id === user_id ||
    character.gm_user_id === user_id;

  if (!hasAccess) {
    console.log(`[CHARACTER LOGIC] ❌ Access denied: User ${user_id} cannot access character ${character_id}`);
    return null;
  }

  // Parse Hero JSON
  let hero: Hero;
  try {
    hero = JSON.parse(character.character_json);
  } catch (error) {
    console.error(`[CHARACTER LOGIC] ❌ Invalid JSON for character ${character_id}:`, error);
    throw new Error('Character data is corrupted');
  }

  return {
    id: character.id,
    owner_user_id: character.owner_user_id,
    gm_user_id: character.gm_user_id,
    name: character.name,
    hero,
    is_deleted: character.is_deleted,
    created_at: character.created_at,
    updated_at: character.updated_at
  };
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
  const allCharacters = [...ownedCharacters, ...gmCharacters];

  const charactersWithHero: CharacterWithHero[] = [];

  for (const character of allCharacters) {
    try {
      const hero = JSON.parse(character.character_json);
      charactersWithHero.push({
        id: character.id,
        owner_user_id: character.owner_user_id,
        gm_user_id: character.gm_user_id,
        name: character.name,
        hero,
        is_deleted: character.is_deleted,
        created_at: character.created_at,
        updated_at: character.updated_at
      });
    } catch (error) {
      console.error(`[CHARACTER LOGIC] ❌ Skipping corrupted character ${character.id}:`, error);
    }
  }

  return charactersWithHero;
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

  return {
    id: character.id,
    owner_user_id: character.owner_user_id,
    gm_user_id: character.gm_user_id,
    name: character.name,
    hero,
    is_deleted: character.is_deleted,
    created_at: character.created_at,
    updated_at: character.updated_at
  };
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

  if (!character) {
    return null;
  }

  return {
    id: character.id,
    owner_user_id: character.owner_user_id,
    gm_user_id: character.gm_user_id,
    name: character.name,
    hero,
    is_deleted: character.is_deleted,
    created_at: character.created_at,
    updated_at: character.updated_at
  };
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

  return {
    id: character.id,
    owner_user_id: character.owner_user_id,
    gm_user_id: character.gm_user_id,
    name: character.name,
    hero,
    is_deleted: character.is_deleted,
    created_at: character.created_at,
    updated_at: character.updated_at
  };
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

  return {
    id: character.id,
    owner_user_id: character.owner_user_id,
    gm_user_id: character.gm_user_id,
    name: character.name,
    hero,
    is_deleted: character.is_deleted,
    created_at: character.created_at,
    updated_at: character.updated_at
  };
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
