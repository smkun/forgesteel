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

import pool from './db-connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Character database record
 */
export interface Character {
  id: number;
  owner_user_id: number;
  gm_user_id: number | null;
  name: string | null;
  character_json: string; // JSON stringified Hero object
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Data for creating a new character
 */
export interface CreateCharacterData {
  owner_user_id: number;
  gm_user_id?: number | null;
  name?: string | null;
  character_json: string;
}

/**
 * Data for updating an existing character
 */
export interface UpdateCharacterData {
  name?: string | null;
  character_json?: string;
  gm_user_id?: number | null;
  is_deleted?: boolean;
}

/**
 * Find character by ID
 *
 * @param id Character ID
 * @returns Character record or null if not found
 */
export async function findById(id: number): Promise<Character | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM characters WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    console.log(`[CHARACTERS] Character not found: ID ${id}`);
    return null;
  }

  return rows[0] as Character;
}

/**
 * Find all characters owned by a user
 *
 * @param owner_user_id Owner user ID
 * @param includeDeleted Include soft-deleted characters (default: false)
 * @returns Array of characters
 */
export async function findByOwner(
  owner_user_id: number,
  includeDeleted: boolean = false
): Promise<Character[]> {
  const whereClause = includeDeleted
    ? 'WHERE owner_user_id = ?'
    : 'WHERE owner_user_id = ? AND is_deleted = 0';

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM characters ${whereClause} ORDER BY updated_at DESC`,
    [owner_user_id]
  );

  console.log(`[CHARACTERS] Found ${rows.length} characters for user ${owner_user_id}`);
  return rows as Character[];
}

/**
 * Find all characters shared with a GM
 *
 * @param gm_user_id GM user ID
 * @param includeDeleted Include soft-deleted characters (default: false)
 * @returns Array of characters
 */
export async function findByGM(
  gm_user_id: number,
  includeDeleted: boolean = false
): Promise<Character[]> {
  const whereClause = includeDeleted
    ? 'WHERE gm_user_id = ?'
    : 'WHERE gm_user_id = ? AND is_deleted = 0';

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM characters ${whereClause} ORDER BY updated_at DESC`,
    [gm_user_id]
  );

  console.log(`[CHARACTERS] Found ${rows.length} characters shared with GM ${gm_user_id}`);
  return rows as Character[];
}

/**
 * Create a new character
 *
 * @param data Character data
 * @returns Created character record
 */
export async function create(data: CreateCharacterData): Promise<Character> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO characters (owner_user_id, gm_user_id, name, character_json)
     VALUES (?, ?, ?, ?)`,
    [
      data.owner_user_id,
      data.gm_user_id || null,
      data.name || null,
      data.character_json
    ]
  );

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
export async function update(id: number, data: UpdateCharacterData): Promise<Character | null> {
  const updates: string[] = [];
  const values: any[] = [];

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

  if (data.is_deleted !== undefined) {
    updates.push('is_deleted = ?');
    values.push(data.is_deleted ? 1 : 0);
  }

  if (updates.length === 0) {
    console.log(`[CHARACTERS] No updates provided for character ${id}`);
    return findById(id);
  }

  values.push(id);

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE characters SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );

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
export async function softDelete(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE characters SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id]
  );

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
export async function hardDelete(id: number): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM characters WHERE id = ?',
    [id]
  );

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
export async function countByOwner(
  owner_user_id: number,
  includeDeleted: boolean = false
): Promise<number> {
  const whereClause = includeDeleted
    ? 'WHERE owner_user_id = ?'
    : 'WHERE owner_user_id = ? AND is_deleted = 0';

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count FROM characters ${whereClause}`,
    [owner_user_id]
  );

  return (rows[0] as any).count;
}

/**
 * Verify character ownership
 *
 * @param character_id Character ID
 * @param user_id User ID
 * @returns True if user owns the character
 */
export async function isOwner(character_id: number, user_id: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM characters WHERE id = ? AND owner_user_id = ?',
    [character_id, user_id]
  );

  return rows.length > 0;
}

/**
 * Verify character is shared with GM
 *
 * @param character_id Character ID
 * @param gm_user_id GM user ID
 * @returns True if character is shared with GM
 */
export async function isSharedWithGM(character_id: number, gm_user_id: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM characters WHERE id = ? AND gm_user_id = ?',
    [character_id, gm_user_id]
  );

  return rows.length > 0;
}

/**
 * Share character with GM
 *
 * @param character_id Character ID
 * @param gm_user_id GM user ID
 * @returns Updated character or null if not found
 */
export async function shareWithGM(character_id: number, gm_user_id: number): Promise<Character | null> {
  return update(character_id, { gm_user_id });
}

/**
 * Unshare character from GM
 *
 * @param character_id Character ID
 * @returns Updated character or null if not found
 */
export async function unshareFromGM(character_id: number): Promise<Character | null> {
  return update(character_id, { gm_user_id: null });
}
