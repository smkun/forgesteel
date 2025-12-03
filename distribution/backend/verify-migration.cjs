"use strict";
/**
 * Verify Campaign Projects Migration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_connection_1 = __importDefault(require('./data/db-connection.cjs'));
require('./utils/loadEnv.cjs');
async function verifyMigration() {
    try {
        console.log('[VERIFY] Checking campaign_projects table...');
        // Check if tables exist
        const [tables] = await db_connection_1.default.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('campaign_projects', 'campaign_project_history')
    `);
        console.log(`[VERIFY] Found ${tables.length} project tables:`);
        tables.forEach((table) => {
            console.log(`  ✅ ${table.TABLE_NAME}`);
        });
        // Describe campaign_projects table
        const [columns] = await db_connection_1.default.query('DESCRIBE campaign_projects');
        console.log('\n[VERIFY] campaign_projects columns:');
        columns.forEach((col) => {
            console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
        await db_connection_1.default.end();
        process.exit(0);
    }
    catch (error) {
        console.error('[VERIFY] ❌ Error:', error);
        await db_connection_1.default.end();
        process.exit(1);
    }
}
verifyMigration();
//# sourceMappingURL=verify-migration.js.map