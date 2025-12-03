"use strict";
/**
 * Test Database Connection Script
 *
 * Verifies MySQL connection and retrieves server information
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const db_connection_1 = __importStar(require('./data/db-connection.cjs'));
async function main() {
    try {
        console.log('[TEST] Testing MySQL connection...\n');
        // Test connection
        await (0, db_connection_1.testConnection)();
        // Get MySQL version
        const [versionRows] = await db_connection_1.default.query('SELECT VERSION() as version');
        const version = versionRows[0].version;
        console.log(`[TEST] MySQL Version: ${version}`);
        // Check if database exists and get character set
        const [dbRows] = await db_connection_1.default.query(`
      SELECT
        SCHEMA_NAME,
        DEFAULT_CHARACTER_SET_NAME,
        DEFAULT_COLLATION_NAME
      FROM information_schema.SCHEMATA
      WHERE SCHEMA_NAME = ?
    `, [process.env.DB_NAME]);
        if (dbRows && dbRows.length > 0) {
            const db = dbRows[0];
            console.log(`[TEST] Database: ${db.SCHEMA_NAME}`);
            console.log(`[TEST] Character Set: ${db.DEFAULT_CHARACTER_SET_NAME}`);
            console.log(`[TEST] Collation: ${db.DEFAULT_COLLATION_NAME}`);
        }
        // Check existing tables
        const [tableRows] = await db_connection_1.default.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);
        const tables = tableRows.map(row => row.TABLE_NAME);
        console.log(`[TEST] Existing Tables: ${tables.length > 0 ? tables.join(', ') : 'none'}`);
        console.log('\n[TEST] ✅ All checks passed!');
        process.exit(0);
    }
    catch (error) {
        console.error('[TEST] ❌ Connection failed:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=test-connection.js.map