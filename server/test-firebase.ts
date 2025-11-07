/**
 * Test Firebase Admin SDK Connection
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function testFirebase() {
  try {
    console.log('[TEST] Testing Firebase Admin SDK...\n');

    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    console.log(`[TEST] Credentials path: ${credPath}`);

    // Check if file exists
    if (!credPath || !fs.existsSync(credPath)) {
      throw new Error(`Firebase credentials file not found at: ${credPath}`);
    }

    const credentialsJson = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
    console.log(`[TEST] Project ID: ${credentialsJson.project_id}`);
    console.log(`[TEST] Client Email: ${credentialsJson.client_email}`);

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(credentialsJson)
    });

    console.log('\n[TEST] ✅ Firebase Admin SDK initialized successfully!');

    // Test creating a custom token (doesn't require actual users)
    const testUid = 'test-uid-' + Date.now();
    const customToken = await admin.auth().createCustomToken(testUid);
    console.log(`[TEST] ✅ Test token created (length: ${customToken.length} chars)`);

    console.log('\n[TEST] 🎉 All Firebase tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('[TEST] ❌ Firebase test failed:', error);
    process.exit(1);
  }
}

testFirebase();
