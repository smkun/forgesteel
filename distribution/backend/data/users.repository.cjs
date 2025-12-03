"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findByFirebaseUid = findByFirebaseUid;
exports.findByEmail = findByEmail;
exports.findById = findById;
exports.create = create;
exports.update = update;
exports.deleteUser = deleteUser;
exports.findAll = findAll;
exports.count = count;
exports.searchByEmailOrName = searchByEmailOrName;
const db_connection_1 = __importDefault(require('./db-connection.cjs'));
/**
 * Find user by Firebase UID
 *
 * @param firebase_uid Firebase user identifier
 * @returns User object or null if not found
 */
async function findByFirebaseUid(firebase_uid) {
    const [rows] = await db_connection_1.default.query('SELECT * FROM users WHERE firebase_uid = ?', [firebase_uid]);
    if (rows.length === 0) {
        return null;
    }
    return rows[0];
}
/**
 * Find user by email address
 *
 * @param email User's email address
 * @returns User object or null if not found
 */
async function findByEmail(email) {
    const [rows] = await db_connection_1.default.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
        return null;
    }
    return rows[0];
}
/**
 * Find user by ID
 *
 * @param id User ID
 * @returns User object or null if not found
 */
async function findById(id) {
    const [rows] = await db_connection_1.default.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
        return null;
    }
    return rows[0];
}
/**
 * Create new user
 *
 * @param userData User data for creation
 * @returns Created user object with generated ID
 * @throws Error if creation fails (e.g., duplicate firebase_uid or email)
 */
async function create(userData) {
    const [result] = await db_connection_1.default.query(`INSERT INTO users (firebase_uid, email, display_name)
     VALUES (?, ?, ?)`, [userData.firebase_uid, userData.email, userData.display_name || null]);
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
async function update(id, userData) {
    // Build dynamic UPDATE query based on provided fields
    const updates = [];
    const values = [];
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
    await db_connection_1.default.query(`UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
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
async function deleteUser(id) {
    const [result] = await db_connection_1.default.query('DELETE FROM users WHERE id = ?', [id]);
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
async function findAll(limit = 100, offset = 0) {
    const [rows] = await db_connection_1.default.query('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    return rows;
}
/**
 * Count total users
 *
 * @returns Total number of users in database
 */
async function count() {
    const [rows] = await db_connection_1.default.query('SELECT COUNT(*) as total FROM users');
    return rows[0].total;
}
/**
 * Search users by email or display name (limited results)
 */
async function searchByEmailOrName(query, limit = 10) {
    const likeQuery = `%${query}%`;
    const [rows] = await db_connection_1.default.query(`SELECT * FROM users
     WHERE email LIKE ? OR (display_name IS NOT NULL AND display_name LIKE ?)
     ORDER BY email ASC
     LIMIT ?`, [likeQuery, likeQuery, limit]);
    return rows;
}
//# sourceMappingURL=users.repository.js.map