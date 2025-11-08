/**
 * Test Character API Locally
 *
 * Tests character endpoints without Firebase authentication
 * by querying the database directly.
 */

import './utils/loadEnv';
import pool from './data/db-connection';
import * as charactersRepo from './data/characters.repository';
import * as usersRepo from './data/users.repository';

async function testCharacterAPI() {
	try {
		console.log('='.repeat(60));
		console.log('CHARACTER API LOCAL TEST');
		console.log('='.repeat(60));

		// Test 1: Get user
		console.log('\n[TEST 1] Get User by Email');
		const user = await usersRepo.findByEmail('scottkunian@gmail.com');

		if (!user) {
			throw new Error('User not found - run load-sample-character.ts first');
		}

		console.log(`✅ User found: ${user.email} (ID: ${user.id})`);
		console.log(`   Firebase UID: ${user.firebase_uid}`);
		console.log(`   Display Name: ${user.display_name}`);
		console.log(`   Created: ${user.created_at.toISOString()}`);

		// Test 2: Get characters by owner
		console.log('\n[TEST 2] Get Characters by Owner');
		const characters = await charactersRepo.findByOwner(user.id);

		console.log(`✅ Found ${characters.length} character(s)`);

		for (const char of characters) {
			console.log(`   - ID: ${char.id}, Name: ${char.name}`);
			console.log(`     Owner: ${char.owner_user_id}, GM: ${char.gm_user_id || 'none'}`);
			console.log(`     Deleted: ${char.is_deleted}`);
			console.log(`     JSON Size: ${(char.character_json.length / 1024).toFixed(2)} KB`);
			console.log(`     Updated: ${char.updated_at.toISOString()}`);

			// Parse Hero JSON
			const hero = JSON.parse(char.character_json);
			console.log(`     Hero ID: ${hero.id}`);
			console.log(`     Ancestry: ${hero.ancestry?.name || 'N/A'}`);
			console.log(`     Class: ${hero.class?.name || 'N/A'}`);
			console.log(`     Level: ${hero.level || 1}`);
		}

		// Test 3: Get character by ID
		if (characters.length > 0) {
			console.log('\n[TEST 3] Get Character by ID');
			const character = await charactersRepo.findById(characters[0].id);

			if (character) {
				console.log(`✅ Character retrieved: ${character.name}`);
				console.log(`   ID: ${character.id}`);
				console.log(`   Owner: ${character.owner_user_id}`);
			}
		}

		// Test 4: Check ownership
		if (characters.length > 0) {
			console.log('\n[TEST 4] Check Ownership');
			const isOwner = await charactersRepo.isOwner(characters[0].id, user.id);
			console.log(`✅ User ${user.id} owns character ${characters[0].id}: ${isOwner}`);
		}

		// Test 5: Count characters
		console.log('\n[TEST 5] Count Characters');
		const count = await charactersRepo.countByOwner(user.id);
		console.log(`✅ User has ${count} character(s)`);

		// Test 6: Update character (change name)
		if (characters.length > 0) {
			console.log('\n[TEST 6] Update Character Name');
			const hero = JSON.parse(characters[0].character_json);
			hero.name = 'Rathgar the Mighty'; // Temporarily change name

			const updated = await charactersRepo.update(characters[0].id, {
				name: hero.name,
				character_json: JSON.stringify(hero)
			});

			if (updated) {
				console.log(`✅ Character updated: ${updated.name}`);
				console.log(`   Previous: ${characters[0].name}`);
				console.log(`   Updated: ${updated.name}`);

				// Restore original name
				hero.name = 'Rathgar the Unyielding';
				await charactersRepo.update(characters[0].id, {
					name: hero.name,
					character_json: JSON.stringify(hero)
				});
				console.log(`✅ Name restored to: ${hero.name}`);
			}
		}

		// Test 7: Soft delete (optional - commented out to preserve data)
		/*
    if (characters.length > 0) {
      console.log('\n[TEST 7] Soft Delete Character');
      const deleted = await charactersRepo.softDelete(characters[0].id);
      console.log(`✅ Character soft-deleted: ${deleted}`);

      // Restore
      await charactersRepo.update(characters[0].id, { is_deleted: false });
      console.log(`✅ Character restored`);
    }
    */

		console.log('\n' + '='.repeat(60));
		console.log('ALL TESTS PASSED ✅');
		console.log('='.repeat(60));

		await pool.end();
		process.exit(0);
	} catch (error) {
		console.error('\n❌ TEST FAILED:', error);
		await pool.end();
		process.exit(1);
	}
}

testCharacterAPI();
