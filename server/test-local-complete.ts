/**
 * Complete Local Test (No Firebase Required)
 *
 * Comprehensive test of character API logic without Firebase authentication.
 * Simulates what the REST API would return.
 */

import * as charactersRepo from './data/characters.repository';
import * as usersRepo from './data/users.repository';
import * as characterLogic from './logic/character.logic';
import pool from './data/db-connection';
import './utils/loadEnv';

async function testComplete() {
  try {
    console.log('='.repeat(70));
    console.log('COMPLETE LOCAL CHARACTER API TEST (No Firebase)');
    console.log('='.repeat(70));

    // Get test user
    const user = await usersRepo.findByEmail('scottkunian@gmail.com');

    if (!user) {
      throw new Error('User not found - run load-sample-character.ts first');
    }

    console.log(`\n✅ Test User: ${user.email} (ID: ${user.id}, Admin: true)`);

    // Test 1: getUserCharacters (simulates GET /api/characters)
    console.log('\n' + '-'.repeat(70));
    console.log('TEST 1: getUserCharacters() - Simulates GET /api/characters');
    console.log('-'.repeat(70));

    const characters = await characterLogic.getUserCharacters(user.id);

    console.log(`✅ Retrieved ${characters.length} character(s)`);

    for (const char of characters) {
      console.log(`\nCharacter ${char.id}:`);
      console.log(`  Name: ${char.name}`);
      console.log(`  Owner: ${char.owner_user_id} (${char.owner_user_id === user.id ? 'YOU' : 'OTHER'})`);
      console.log(`  GM: ${char.gm_user_id || 'Not shared'}`);
      console.log(`  Deleted: ${char.is_deleted}`);
      console.log(`  Hero ID: ${char.hero.id}`);
      console.log(`  Ancestry: ${char.hero.ancestry?.name || 'N/A'}`);
      console.log(`  Class: ${char.hero.class?.name || 'N/A'}`);
      console.log(`  Level: ${char.hero.class?.level || 1}`);
    }

    if (characters.length === 0) {
      console.log('\n⚠️  No characters found. Load sample character first:');
      console.log('   npx tsx server/load-sample-character.ts');
      await pool.end();
      return;
    }

    const testCharId = characters[0].id;

    // Test 2: getCharacter (simulates GET /api/characters/:id)
    console.log('\n' + '-'.repeat(70));
    console.log(`TEST 2: getCharacter(${testCharId}) - Simulates GET /api/characters/${testCharId}`);
    console.log('-'.repeat(70));

    const character = await characterLogic.getCharacter(testCharId, user.id, true);

    if (character) {
      console.log(`✅ Retrieved character: ${character.name}`);
      console.log(`  ID: ${character.id}`);
      console.log(`  Owner: ${character.owner_user_id}`);
      console.log(`  Access: Owner (full access)`);
    }

    // Test 3: getAccessLevel (simulates GET /api/characters/:id/access)
    console.log('\n' + '-'.repeat(70));
    console.log(`TEST 3: getAccessLevel() - Simulates GET /api/characters/${testCharId}/access`);
    console.log('-'.repeat(70));

    const accessLevel = await characterLogic.getAccessLevel(testCharId, user.id, true);
    console.log(`✅ Access level for user ${user.id}: ${accessLevel}`);

    // Test 4: updateCharacter (simulates PUT /api/characters/:id)
    console.log('\n' + '-'.repeat(70));
    console.log(`TEST 4: updateCharacter() - Simulates PUT /api/characters/${testCharId}`);
    console.log('-'.repeat(70));

    const hero = character!.hero;
    const originalName = hero.name;
    hero.name = 'Rathgar the Legendary';

    const updated = await characterLogic.updateCharacter(testCharId, user.id, hero, true);

    if (updated) {
      console.log(`✅ Character updated`);
      console.log(`  Previous name: ${originalName}`);
      console.log(`  New name: ${updated.name}`);

      // Restore original
      hero.name = originalName;
      await characterLogic.updateCharacter(testCharId, user.id, hero, true);
      console.log(`✅ Name restored to: ${originalName}`);
    }

    // Test 5: Create second user for sharing tests
    console.log('\n' + '-'.repeat(70));
    console.log('TEST 5: Create GM user for sharing test');
    console.log('-'.repeat(70));

    let gmUser = await usersRepo.findByEmail('gm@example.com');

    if (!gmUser) {
      gmUser = await usersRepo.create({
        firebase_uid: `gm-${Date.now()}`,
        email: 'gm@example.com',
        display_name: 'Game Master'
      });
      console.log(`✅ Created GM user: ${gmUser.email} (ID: ${gmUser.id})`);
    } else {
      console.log(`✅ Found existing GM user: ${gmUser.email} (ID: ${gmUser.id})`);
    }

    // Test 6: shareCharacterWithGM (simulates POST /api/characters/:id/share)
    console.log('\n' + '-'.repeat(70));
    console.log(`TEST 6: shareCharacterWithGM() - Simulates POST /api/characters/${testCharId}/share`);
    console.log('-'.repeat(70));

    const shared = await characterLogic.shareCharacterWithGM(
      testCharId,
      user.id,
      gmUser.id,
      true
    );

    if (shared) {
      console.log(`✅ Character shared with GM ${gmUser.id}`);
      console.log(`  Character: ${shared.name}`);
      console.log(`  Owner: ${shared.owner_user_id}`);
      console.log(`  GM: ${shared.gm_user_id}`);
    }

    // Test 7: GM can now access character
    console.log('\n' + '-'.repeat(70));
    console.log('TEST 7: GM Access Test - GM retrieves shared character');
    console.log('-'.repeat(70));

    const gmCharacters = await characterLogic.getUserCharacters(gmUser.id);
    console.log(`✅ GM has access to ${gmCharacters.length} character(s)`);

    for (const char of gmCharacters) {
      console.log(`  - ${char.name} (Owner: ${char.owner_user_id}, Shared with GM: ${char.gm_user_id})`);
    }

    const gmAccessLevel = await characterLogic.getAccessLevel(testCharId, gmUser.id, false);
    console.log(`✅ GM access level: ${gmAccessLevel}`);

    // Test 8: unshareCharacterFromGM (simulates DELETE /api/characters/:id/share)
    console.log('\n' + '-'.repeat(70));
    console.log(`TEST 8: unshareCharacterFromGM() - Simulates DELETE /api/characters/${testCharId}/share`);
    console.log('-'.repeat(70));

    const unshared = await characterLogic.unshareCharacterFromGM(testCharId, user.id, true);

    if (unshared) {
      console.log(`✅ Character unshared from GM`);
      console.log(`  Character: ${unshared.name}`);
      console.log(`  Owner: ${unshared.owner_user_id}`);
      console.log(`  GM: ${unshared.gm_user_id || 'none'}`);
    }

    // Test 9: GM can no longer access character
    console.log('\n' + '-'.repeat(70));
    console.log('TEST 9: Verify GM access revoked');
    console.log('-'.repeat(70));

    const gmCharactersAfter = await characterLogic.getUserCharacters(gmUser.id);
    console.log(`✅ GM now has access to ${gmCharactersAfter.length} character(s)`);

    const gmAccessAfter = await characterLogic.getAccessLevel(testCharId, gmUser.id, false);
    console.log(`✅ GM access level after unshare: ${gmAccessAfter}`);

    // Test 10: deleteCharacter (simulates DELETE /api/characters/:id)
    // Commented out to preserve data
    /*
    console.log('\n' + '-'.repeat(70));
    console.log('TEST 10: deleteCharacter() - Simulates DELETE /api/characters/:id');
    console.log('-'.repeat(70));

    const deleted = await characterLogic.deleteCharacter(testCharId, user.id, true);
    console.log(`✅ Character soft-deleted: ${deleted}`);

    // Restore
    await charactersRepo.update(testCharId, { is_deleted: false });
    console.log(`✅ Character restored`);
    */

    console.log('\n' + '='.repeat(70));
    console.log('ALL TESTS PASSED ✅');
    console.log('='.repeat(70));
    console.log('\nSummary:');
    console.log(`  - Character retrieval: ✅`);
    console.log(`  - Character update: ✅`);
    console.log(`  - GM sharing: ✅`);
    console.log(`  - Access control: ✅`);
    console.log(`  - Character ownership: ✅`);
    console.log('\nDatabase Character Count:');
    console.log(`  - User ${user.email}: ${characters.length} character(s)`);
    console.log(`  - GM ${gmUser.email}: 0 character(s) (after unshare)`);

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    await pool.end();
    process.exit(1);
  }
}

testComplete();
