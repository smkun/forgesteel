"use strict";
/**
 * Test Firebase Admin SDK Connection
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const fs_1 = __importDefault(require("fs"));
require('./utils/loadEnv.cjs');
async function testFirebase() {
    try {
        console.log('[TEST] Testing Firebase Admin SDK...\n');
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        console.log(`[TEST] Credentials path: ${credPath}`);
        // Check if file exists
        if (!credPath || !fs_1.default.existsSync(credPath)) {
            throw new Error(`Firebase credentials file not found at: ${credPath}`);
        }
        const credentialsJson = JSON.parse(fs_1.default.readFileSync(credPath, 'utf-8'));
        console.log(`[TEST] Project ID: ${credentialsJson.project_id}`);
        console.log(`[TEST] Client Email: ${credentialsJson.client_email}`);
        // Initialize Firebase Admin
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(credentialsJson)
        });
        console.log('\n[TEST] ✅ Firebase Admin SDK initialized successfully!');
        // Test creating a custom token (doesn't require actual users)
        const testUid = 'test-uid-' + Date.now();
        const customToken = await firebase_admin_1.default.auth().createCustomToken(testUid);
        console.log(`[TEST] ✅ Test token created (length: ${customToken.length} chars)`);
        console.log('\n[TEST] 🎉 All Firebase tests passed!');
        process.exit(0);
    }
    catch (error) {
        console.error('[TEST] ❌ Firebase test failed:', error);
        process.exit(1);
    }
}
testFirebase();
//# sourceMappingURL=test-firebase.js.map