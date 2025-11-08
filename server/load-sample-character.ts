/**
 * Load Sample Character into Database
 *
 * Loads a character from sample_characters/ folder into the database
 * for the specified user.
 */

import pool from './data/db-connection';
import * as usersRepo from './data/users.repository';
import * as charactersRepo from './data/characters.repository';
import fs from 'fs';
import path from 'path';
import './utils/loadEnv';

async function loadSampleCharacter() {
	try {
		const characterFile = process.argv[2] || 'Rathgar the Unyielding.ds-hero';
		const ownerEmail = process.argv[3] || 'scottkunian@gmail.com';

		console.log(`[LOAD] Loading character: ${characterFile}`);
		console.log(`[LOAD] Owner email: ${ownerEmail}`);

		// Read character file
		const filePath = path.join('sample_characters', characterFile);

		if (!fs.existsSync(filePath)) {
			throw new Error(`Character file not found: ${filePath}`);
		}

		const characterJson = fs.readFileSync(filePath, 'utf-8');
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
		} else {
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

		await pool.end();
		console.log('[LOAD] ✅ Complete! Character loaded successfully.');
		process.exit(0);
	} catch (error) {
		console.error('[LOAD] ❌ Error:', error);
		await pool.end();
		process.exit(1);
	}
}

loadSampleCharacter();
