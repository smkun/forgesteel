"use strict";
/**
 * Load Sample Character into Database
 *
 * Loads a character from sample_characters/ folder into the database
 * for the specified user.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_connection_1 = __importDefault(require('./data/db-connection.cjs'));
const usersRepo = __importStar(require('./data/users.repository.cjs'));
const charactersRepo = __importStar(require('./data/characters.repository.cjs'));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
require('./utils/loadEnv.cjs');
async function loadSampleCharacter() {
    try {
        const characterFile = process.argv[2] || 'Rathgar the Unyielding.ds-hero';
        const ownerEmail = process.argv[3] || 'scottkunian@gmail.com';
        console.log(`[LOAD] Loading character: ${characterFile}`);
        console.log(`[LOAD] Owner email: ${ownerEmail}`);
        // Read character file
        const filePath = path_1.default.join('sample_characters', characterFile);
        if (!fs_1.default.existsSync(filePath)) {
            throw new Error(`Character file not found: ${filePath}`);
        }
        const characterJson = fs_1.default.readFileSync(filePath, 'utf-8');
        const hero = JSON.parse(characterJson);
        console.log(`[LOAD] ✅ Character JSON loaded: ${hero.name} (ID: ${hero.id})`);
        console.log(`[LOAD] Character size: ${(characterJson.length / 1024).toFixed(2)} KB`);
        // Find or create user
        let user = await usersRepo.findByEmail(ownerEmail);
        if (!user) {
            console.log(`[LOAD] User not found, creating user: ${ownerEmail}`);
            // Create user with placeholder Firebase UID
            user = await usersRepo.create({
                firebase_uid: `placeholder-${Date.now()}`,
                email: ownerEmail,
                display_name: 'Scott Kunian'
            });
            console.log(`[LOAD] ✅ User created: ${user.email} (ID: ${user.id})`);
        }
        else {
            console.log(`[LOAD] ✅ User found: ${user.email} (ID: ${user.id})`);
        }
        // Create character
        const character = await charactersRepo.create({
            owner_user_id: user.id,
            name: hero.name,
            character_json: characterJson
        });
        console.log('[LOAD] ✅ Character created in database:');
        console.log(`       ID: ${character.id}`);
        console.log(`       Name: ${character.name}`);
        console.log(`       Owner: ${user.email} (ID: ${user.id})`);
        console.log(`       Created: ${character.created_at.toISOString()}`);
        console.log(`       JSON Size: ${character.character_json.length} bytes`);
        // Verify retrieval
        const retrieved = await charactersRepo.findById(character.id);
        if (retrieved) {
            const parsedHero = JSON.parse(retrieved.character_json);
            console.log('[LOAD] ✅ Verification: Character retrieved successfully');
            console.log(`       Hero Name: ${parsedHero.name}`);
            console.log(`       Hero ID: ${parsedHero.id}`);
        }
        await db_connection_1.default.end();
        console.log('[LOAD] ✅ Complete! Character loaded successfully.');
        process.exit(0);
    }
    catch (error) {
        console.error('[LOAD] ❌ Error:', error);
        await db_connection_1.default.end();
        process.exit(1);
    }
}
loadSampleCharacter();
//# sourceMappingURL=load-sample-character.js.map