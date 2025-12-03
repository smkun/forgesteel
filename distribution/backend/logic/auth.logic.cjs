"use strict";
/**
 * Authentication Business Logic
 *
 * Handles user creation/updates on first login and admin role checks.
 *
 * References:
 * - PLANNING.md: Authentication flow
 * - PRD.md: Admin user requirements (scottkunian@gmail.com)
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
exports.getOrCreateUser = getOrCreateUser;
exports.isAdmin = isAdmin;
exports.getUserByFirebaseUid = getUserByFirebaseUid;
exports.getUserById = getUserById;
exports.getUserByEmail = getUserByEmail;
const usersRepo = __importStar(require('../data/users.repository.cjs'));
/**
 * Admin user email (hardcoded per PRD requirements)
 */
const ADMIN_EMAIL = 'scottkunian@gmail.com';
/**
 * Get or create user on login
 *
 * This function implements the "create user on first login" pattern:
 * 1. Check if user exists in database by Firebase UID
 * 2. If not exists, create new user record
 * 3. If exists, update profile information if changed
 * 4. Attach admin flag based on email
 *
 * @param profile Firebase user profile from decoded token
 * @returns Authenticated user with admin flag
 * @throws Error if email is missing or database operation fails
 */
function normalizeDisplayName(name) {
    if (!name) {
        return null;
    }
    const trimmed = name.trim();
    return trimmed.length > 0 ? trimmed : null;
}
async function getOrCreateUser(profile) {
    // Validate email exists
    if (!profile.email) {
        throw new Error('User email is required for authentication');
    }
    console.log(`[AUTH LOGIC] Processing login for: ${profile.email}`);
    const normalizedDisplayName = normalizeDisplayName(profile.displayName);
    // Check if user exists by Firebase UID
    let user = await usersRepo.findByFirebaseUid(profile.uid);
    // If no user by UID, attempt to merge by email (handles placeholder users)
    if (!user && profile.email) {
        const userByEmail = await usersRepo.findByEmail(profile.email);
        if (userByEmail) {
            console.log(`[AUTH LOGIC] Found existing user by email, updating Firebase UID for: ${profile.email}`);
            const updatePayload = {
                firebase_uid: profile.uid
            };
            if (normalizedDisplayName) {
                updatePayload.display_name = normalizedDisplayName;
            }
            const updatedUser = await usersRepo.update(userByEmail.id, updatePayload);
            if (updatedUser) {
                user = updatedUser;
            }
        }
    }
    if (!user) {
        // User doesn't exist - create new record
        console.log(`[AUTH LOGIC] First login detected - creating user: ${profile.email}`);
        user = await usersRepo.create({
            firebase_uid: profile.uid,
            email: profile.email,
            display_name: normalizedDisplayName
        });
        console.log(`[AUTH LOGIC] ✅ User created: ${user.email} (ID: ${user.id})`);
    }
    else {
        // User exists - check if profile needs updating
        let needsUpdate = false;
        const updates = {};
        if (user.email !== profile.email) {
            updates.email = profile.email;
            needsUpdate = true;
        }
        if (normalizedDisplayName && user.display_name !== normalizedDisplayName) {
            updates.display_name = normalizedDisplayName;
            needsUpdate = true;
        }
        if (needsUpdate) {
            console.log(`[AUTH LOGIC] Updating user profile: ${profile.email}`);
            const updatedUser = await usersRepo.update(user.id, updates);
            if (updatedUser) {
                user = updatedUser;
                console.log(`[AUTH LOGIC] ✅ User profile updated: ${user.email}`);
            }
        }
    }
    // Check admin status
    const is_admin = isAdmin(user.email);
    if (is_admin) {
        console.log(`[AUTH LOGIC] 🔒 Admin access granted: ${user.email}`);
    }
    // Return enhanced user object
    return {
        ...user,
        is_admin
    };
}
/**
 * Check if user is admin
 *
 * Admin status is determined by email matching the hardcoded admin email.
 * Per PRD requirements: scottkunian@gmail.com
 *
 * @param email User's email address
 * @returns True if user is admin
 */
function isAdmin(email) {
    return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
/**
 * Get user by Firebase UID with admin flag
 *
 * @param firebase_uid Firebase user identifier
 * @returns Authenticated user or null if not found
 */
async function getUserByFirebaseUid(firebase_uid) {
    const user = await usersRepo.findByFirebaseUid(firebase_uid);
    if (!user) {
        return null;
    }
    return {
        ...user,
        is_admin: isAdmin(user.email)
    };
}
/**
 * Get user by ID with admin flag
 *
 * @param id User ID
 * @returns Authenticated user or null if not found
 */
async function getUserById(id) {
    const user = await usersRepo.findById(id);
    if (!user) {
        return null;
    }
    return {
        ...user,
        is_admin: isAdmin(user.email)
    };
}
/**
 * Get user by email with admin flag
 *
 * @param email User's email address
 * @returns Authenticated user or null if not found
 */
async function getUserByEmail(email) {
    const user = await usersRepo.findByEmail(email);
    if (!user) {
        return null;
    }
    return {
        ...user,
        is_admin: isAdmin(user.email)
    };
}
//# sourceMappingURL=auth.logic.js.map