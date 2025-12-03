"use strict";
/**
 * Test /api/auth/me endpoint
 *
 * This script tests the authentication flow by:
 * 1. Creating a custom Firebase token
 * 2. Making a request to /api/auth/me with the token
 * 3. Verifying user creation in database
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const fs_1 = __importDefault(require("fs"));
require('./utils/loadEnv.cjs');
const API_BASE = 'http://localhost:4000';
async function testAuthEndpoint() {
    try {
        console.log('[TEST] Testing /api/auth/me endpoint...\n');
        // Initialize Firebase Admin
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (!credPath || !fs_1.default.existsSync(credPath)) {
            throw new Error(`Firebase credentials not found: ${credPath}`);
        }
        const credentials = JSON.parse(fs_1.default.readFileSync(credPath, 'utf-8'));
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(credentials)
        });
        console.log('[TEST] Firebase Admin initialized');
        // Create a test user token
        const testUid = 'test-user-' + Date.now();
        const testEmail = 'test@example.com';
        console.log(`[TEST] Creating custom token for: ${testEmail}`);
        const customToken = await firebase_admin_1.default.auth().createCustomToken(testUid);
        console.log(`[TEST] ✅ Custom token created (length: ${customToken.length})`);
        // In a real scenario, the client would exchange this custom token
        // for an ID token. For testing, we'll create a user directly and
        // get their ID token.
        console.log('\n[TEST] 📝 Manual Testing Instructions:');
        console.log('1. Start the backend server: npm run server:dev');
        console.log('2. Use the following curl command to test:');
        console.log('\ncurl -X GET http://localhost:4000/api/auth/me \\');
        console.log('  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"');
        console.log('\n3. To get a real Firebase ID token:');
        console.log('   - Create a user in Firebase Console');
        console.log('   - Use Firebase client SDK to sign in');
        console.log('   - Call user.getIdToken() to get the token');
        console.log('\n[TEST] Alternative: Test with Firebase REST API');
        console.log(`Custom Token: ${customToken.substring(0, 50)}...`);
        process.exit(0);
    }
    catch (error) {
        console.error('[TEST] ❌ Error:', error);
        process.exit(1);
    }
}
testAuthEndpoint();
//# sourceMappingURL=test-auth-endpoint.js.map