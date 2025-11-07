/**
 * Deploy Database Schema Script
 *
 * Deploys users and characters tables to MySQL database
 */

import pool from './data/db-connection';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    console.log('[DEPLOY] Reading schema from db/schema.sql...\n');

    const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolons to execute each statement separately
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`[DEPLOY] Found ${statements.length} SQL statements\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 80).replace(/\s+/g, ' ');
      console.log(`[DEPLOY] Executing statement ${i + 1}/${statements.length}: ${preview}...`);

      await pool.query(stmt);
      console.log(`[DEPLOY] ✅ Success`);
    }

    // Verify tables were created
    console.log('\n[DEPLOY] Verifying table creation...');
    const [tableRows] = await pool.query(`
      SELECT TABLE_NAME, TABLE_ROWS
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [process.env.DB_NAME]);

    console.log('\n[DEPLOY] Database Tables:');
    (tableRows as any[]).forEach(row => {
      console.log(`  - ${row.TABLE_NAME} (${row.TABLE_ROWS} rows)`);
    });

    console.log('\n[DEPLOY] ✅ Schema deployment complete!');
    process.exit(0);
  } catch (error) {
    console.error('[DEPLOY] ❌ Deployment failed:', error);
    process.exit(1);
  }
}

main();
