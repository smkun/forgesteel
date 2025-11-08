/**
 * Users Repository
 *
 * Database operations for the users table.
 * All queries use parameterized statements to prevent SQL injection.
 *
 * References:
 * - PLANNING.md: Repository pattern architecture
 * - db/schema.sql: users table definition
 */

import pool from './db-connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

/**
 * User data model
 */
export interface User {
	id: number;
	firebase_uid: string;
	email: string;
	display_name: string | null;
	created_at: Date;
	updated_at: Date;
}

/**
 * User creation data (without auto-generated fields)
 */
export interface CreateUserData {
	firebase_uid: string;
	email: string;
	display_name?: string | null;
}

/**
 * User update data (partial updates allowed)
 */
export interface UpdateUserData {
	email?: string;
	display_name?: string | null;
	firebase_uid?: string;
}

/**
 * Find user by Firebase UID
 *
 * @param firebase_uid Firebase user identifier
 * @returns User object or null if not found
 */
export async function findByFirebaseUid(firebase_uid: string): Promise<User | null> {
	const [ rows ] = await pool.query<RowDataPacket[]>(
		'SELECT * FROM users WHERE firebase_uid = ?',
		[ firebase_uid ]
	);

	if (rows.length === 0) {
		return null;
	}

	return rows[0] as User;
}

/**
 * Find user by email address
 *
 * @param email User's email address
 * @returns User object or null if not found
 */
export async function findByEmail(email: string): Promise<User | null> {
	const [ rows ] = await pool.query<RowDataPacket[]>(
		'SELECT * FROM users WHERE email = ?',
		[ email ]
	);

	if (rows.length === 0) {
		return null;
	}

	return rows[0] as User;
}

/**
 * Find user by ID
 *
 * @param id User ID
 * @returns User object or null if not found
 */
export async function findById(id: number): Promise<User | null> {
	const [ rows ] = await pool.query<RowDataPacket[]>(
		'SELECT * FROM users WHERE id = ?',
		[ id ]
	);

	if (rows.length === 0) {
		return null;
	}

	return rows[0] as User;
}

/**
 * Create new user
 *
 * @param userData User data for creation
 * @returns Created user object with generated ID
 * @throws Error if creation fails (e.g., duplicate firebase_uid or email)
 */
export async function create(userData: CreateUserData): Promise<User> {
	const [ result ] = await pool.query<ResultSetHeader>(
		`INSERT INTO users (firebase_uid, email, display_name)
     VALUES (?, ?, ?)`,
		[ userData.firebase_uid, userData.email, userData.display_name || null ]
	);

	// Fetch and return the created user
	const createdUser = await findById(result.insertId);

	if (!createdUser) {
		throw new Error('Failed to retrieve created user');
	}

	console.log(`[USERS] ✅ Created user: ${createdUser.email} (ID: ${createdUser.id})`);

	return createdUser;
}

/**
 * Update existing user
 *
 * @param id User ID
 * @param userData Partial user data to update
 * @returns Updated user object or null if user not found
 */
export async function update(id: number, userData: UpdateUserData): Promise<User | null> {
	// Build dynamic UPDATE query based on provided fields
	const updates: string[] = [];
	const values: any[] = [];

	if (userData.email !== undefined) {
		updates.push('email = ?');
		values.push(userData.email);
	}

	if (userData.display_name !== undefined) {
		updates.push('display_name = ?');
		values.push(userData.display_name);
	}

	if (userData.firebase_uid !== undefined) {
		updates.push('firebase_uid = ?');
		values.push(userData.firebase_uid);
	}

	// If no fields to update, return existing user
	if (updates.length === 0) {
		return findById(id);
	}

	// Add ID to values array
	values.push(id);

	// Execute update
	await pool.query(
		`UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		values
	);

	// Fetch and return updated user
	const updatedUser = await findById(id);

	if (updatedUser) {
		console.log(`[USERS] ✅ Updated user: ${updatedUser.email} (ID: ${updatedUser.id})`);
	}

	return updatedUser;
}

/**
 * Delete user (hard delete - use with caution)
 *
 * Note: This performs a hard delete. Consider if soft delete is needed.
 * Foreign key constraints will prevent deletion if user owns characters.
 *
 * @param id User ID
 * @returns True if deleted, false if user not found
 */
export async function deleteUser(id: number): Promise<boolean> {
	const [ result ] = await pool.query<ResultSetHeader>(
		'DELETE FROM users WHERE id = ?',
		[ id ]
	);

	const deleted = result.affectedRows > 0;

	if (deleted) {
		console.log(`[USERS] ✅ Deleted user ID: ${id}`);
	}

	return deleted;
}

/**
 * Get all users (admin only - use with caution)
 *
 * @param limit Maximum number of users to return
 * @param offset Number of users to skip
 * @returns Array of users
 */
export async function findAll(limit: number = 100, offset: number = 0): Promise<User[]> {
	const [ rows ] = await pool.query<RowDataPacket[]>(
		'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
		[ limit, offset ]
	);

	return rows as User[];
}

/**
 * Count total users
 *
 * @returns Total number of users in database
 */
export async function count(): Promise<number> {
	const [ rows ] = await pool.query<RowDataPacket[]>(
		'SELECT COUNT(*) as total FROM users'
	);

	return (rows[0] as any).total;
}

/**
 * Search users by email or display name (limited results)
 */
export async function searchByEmailOrName(
	query: string,
	limit: number = 10
): Promise<User[]> {
	const likeQuery = `%${query}%`;

	const [ rows ] = await pool.query<RowDataPacket[]>(
		`SELECT * FROM users
     WHERE email LIKE ? OR (display_name IS NOT NULL AND display_name LIKE ?)
     ORDER BY email ASC
     LIMIT ?`,
		[ likeQuery, likeQuery, limit ]
	);

	return rows as User[];
}
