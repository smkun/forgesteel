/**
 * Simple Schema Deployment
 */

import pool from './data/db-connection';

async function deploy() {
  console.log('[DEPLOY] Creating users table...');

  // Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`firebase_uid\` VARCHAR(128) NOT NULL UNIQUE,
      \`email\` VARCHAR(255) NOT NULL UNIQUE,
      \`display_name\` VARCHAR(255) NULL,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_firebase_uid\` (\`firebase_uid\`),
      INDEX \`idx_email\` (\`email\`),
      INDEX \`idx_created_at\` (\`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('[DEPLOY] ✅ users table created');

  console.log('[DEPLOY] Creating characters table...');

  // Create characters table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`characters\` (
      \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      \`owner_user_id\` INT UNSIGNED NOT NULL,
      \`gm_user_id\` INT UNSIGNED NULL,
      \`name\` VARCHAR(255) NULL,
      \`character_json\` LONGTEXT NOT NULL,
      \`is_deleted\` TINYINT(1) NOT NULL DEFAULT 0,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`fk_characters_owner\`
        FOREIGN KEY (\`owner_user_id\`)
        REFERENCES \`users\` (\`id\`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
      CONSTRAINT \`fk_characters_gm\`
        FOREIGN KEY (\`gm_user_id\`)
        REFERENCES \`users\` (\`id\`)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
      INDEX \`idx_owner_user_id\` (\`owner_user_id\`),
      INDEX \`idx_gm_user_id\` (\`gm_user_id\`),
      INDEX \`idx_name\` (\`name\`),
      INDEX \`idx_is_deleted\` (\`is_deleted\`),
      INDEX \`idx_created_at\` (\`created_at\`),
      INDEX \`idx_updated_at\` (\`updated_at\`),
      INDEX \`idx_owner_not_deleted\` (\`owner_user_id\`, \`is_deleted\`),
      INDEX \`idx_gm_not_deleted\` (\`gm_user_id\`, \`is_deleted\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('[DEPLOY] ✅ characters table created');

  // Verify tables
  const [tables] = await pool.query(`
    SELECT TABLE_NAME, TABLE_ROWS
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ?
    ORDER BY TABLE_NAME
  `, [process.env.DB_NAME]);

  console.log('\n[DEPLOY] Database Tables:');
  (tables as any[]).forEach(row => {
    console.log(`  - ${row.TABLE_NAME} (${row.TABLE_ROWS} rows)`);
  });

  console.log('\n[DEPLOY] ✅ Schema deployment complete!');
  process.exit(0);
}

deploy().catch(err => {
  console.error('[DEPLOY] ❌ Error:', err);
  process.exit(1);
});
