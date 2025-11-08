/**
 * MySQL Database Connection Pool
 *
 * Provides connection pool management for iFastNet MySQL database.
 * Uses mysql2/promise for async/await support.
 *
 * References:
 * - PLANNING.md: Database connection architecture
 * - .env.local.example: Configuration format
 */

import mysql from 'mysql2/promise';
import '../utils/loadEnv';

/**
 * Create MySQL connection pool
 *
 * Configuration:
 * - Use individual connection parameters instead of URI to avoid encoding issues
 * - waitForConnections: Queue requests when pool is full
 * - connectionLimit: Max 10 concurrent connections (iFastNet shared hosting)
 * - queueLimit: 0 = unlimited queued requests
 * - enableKeepAlive: Maintain connections to avoid reconnection overhead
 */

console.log('[DB] Initializing connection pool...');
console.log('[DB] Host:', process.env.DB_HOST);
console.log('[DB] Port:', process.env.DB_PORT);
console.log('[DB] Database:', process.env.DB_NAME);
console.log('[DB] User:', process.env.DB_USER);
console.log('[DB] Password:', process.env.DB_PASS ? '***SET***' : 'NOT SET');

const pool = mysql.createPool({
	host: process.env.DB_HOST,
	port: parseInt(process.env.DB_PORT || '3306'),
	database: process.env.DB_NAME,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
	enableKeepAlive: true,
	keepAliveInitialDelay: 0
});

/**
 * Test database connection
 *
 * Attempts to acquire connection from pool and execute simple query.
 * Useful for server startup validation and health checks.
 *
 * @returns Promise resolving to true if connection successful
 * @throws Error if connection fails
 */
export async function testConnection(): Promise<boolean> {
	try {
		const connection = await pool.getConnection();
		console.log('[DB] ✅ MySQL connection pool established');

		// Test query
		const [ rows ] = await connection.query('SELECT 1 as test');
		console.log('[DB] ✅ Test query successful');

		connection.release();
		return true;
	} catch (error) {
		console.error('[DB] ❌ Connection failed:', error);
		throw error;
	}
}

/**
 * Export pool as default for use in repositories
 *
 * Usage in repositories:
 * ```typescript
 * import pool from './db-connection';
 * const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
 * ```
 */
export default pool;
