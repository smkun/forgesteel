/**
 * Authentication Business Logic
 *
 * Handles user creation/updates on first login and admin role checks.
 *
 * References:
 * - PLANNING.md: Authentication flow
 * - PRD.md: Admin user requirements (scottkunian@gmail.com)
 */

import * as usersRepo from '../data/users.repository';

/**
 * Admin user email (hardcoded per PRD requirements)
 */
const ADMIN_EMAIL = 'scottkunian@gmail.com';

/**
 * User profile information from Firebase token
 */
export interface UserProfile {
  uid: string;
  email: string | undefined;
  displayName?: string | null;
}

/**
 * Enhanced user information with admin flag
 */
export interface AuthenticatedUser {
  id: number;
  firebase_uid: string;
  email: string;
  display_name: string | null;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

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
function normalizeDisplayName(name?: string | null): string | null {
  if (!name) {
    return null;
  }

  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function getOrCreateUser(profile: UserProfile): Promise<AuthenticatedUser> {
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
      const updatePayload: any = {
        firebase_uid: profile.uid,
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
  } else {
    // User exists - check if profile needs updating
    let needsUpdate = false;
    const updates: any = {};

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
export function isAdmin(email: string): boolean {
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Get user by Firebase UID with admin flag
 *
 * @param firebase_uid Firebase user identifier
 * @returns Authenticated user or null if not found
 */
export async function getUserByFirebaseUid(firebase_uid: string): Promise<AuthenticatedUser | null> {
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
export async function getUserById(id: number): Promise<AuthenticatedUser | null> {
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
export async function getUserByEmail(email: string): Promise<AuthenticatedUser | null> {
  const user = await usersRepo.findByEmail(email);

  if (!user) {
    return null;
  }

  return {
    ...user,
    is_admin: isAdmin(user.email)
  };
}
