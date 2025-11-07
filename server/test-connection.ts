/**
 * Test Database Connection Script
 *
 * Verifies MySQL connection and retrieves server information
 */

import pool, { testConnection } from './data/db-connection';

async function main() {
  try {
    console.log('[TEST] Testing MySQL connection...\n');

    // Test connection
    await testConnection();

    // Get MySQL version
    const [versionRows] = await pool.query('SELECT VERSION() as version');
    const version = (versionRows as any)[0].version;
    console.log(`[TEST] MySQL Version: ${version}`);

    // Check if database exists and get character set
    const [dbRows] = await pool.query(`
      SELECT
        SCHEMA_NAME,
        DEFAULT_CHARACTER_SET_NAME,
        DEFAULT_COLLATION_NAME
      FROM information_schema.SCHEMATA
      WHERE SCHEMA_NAME = ?
    `, [process.env.DB_NAME]);

    if (dbRows && (dbRows as any).length > 0) {
      const db = (dbRows as any)[0];
      console.log(`[TEST] Database: ${db.SCHEMA_NAME}`);
      console.log(`[TEST] Character Set: ${db.DEFAULT_CHARACTER_SET_NAME}`);
      console.log(`[TEST] Collation: ${db.DEFAULT_COLLATION_NAME}`);
    }

    // Check existing tables
    const [tableRows] = await pool.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);

    const tables = (tableRows as any[]).map(row => row.TABLE_NAME);
    console.log(`[TEST] Existing Tables: ${tables.length > 0 ? tables.join(', ') : 'none'}`);

    console.log('\n[TEST] ✅ All checks passed!');
    process.exit(0);
  } catch (error) {
    console.error('[TEST] ❌ Connection failed:', error);
    process.exit(1);
  }
}

main();
