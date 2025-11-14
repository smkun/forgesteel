/**
 * Verify Campaign Projects Migration
 */

import pool from './data/db-connection';
import './utils/loadEnv';

async function verifyMigration() {
	try {
		console.log('[VERIFY] Checking campaign_projects table...');

		// Check if tables exist
		const [tables] = await pool.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('campaign_projects', 'campaign_project_history')
    `);

		console.log(`[VERIFY] Found ${(tables as any).length} project tables:`);
		(tables as any).forEach((table: any) => {
			console.log(`  ✅ ${table.TABLE_NAME}`);
		});

		// Describe campaign_projects table
		const [columns] = await pool.query('DESCRIBE campaign_projects');
		console.log('\n[VERIFY] campaign_projects columns:');
		(columns as any).forEach((col: any) => {
			console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
		});

		await pool.end();
		process.exit(0);
	} catch (error) {
		console.error('[VERIFY] ❌ Error:', error);
		await pool.end();
		process.exit(1);
	}
}

verifyMigration();
