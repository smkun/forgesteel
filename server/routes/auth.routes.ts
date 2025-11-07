/**
 * Authentication Routes
 *
 * Handles user authentication and profile endpoints.
 *
 * References:
 * - PLANNING.md: API design
 * - PRD.md: Authentication requirements
 */

import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/auth/me
 *
 * Get current authenticated user's profile.
 * Creates user in database on first login.
 *
 * Request Headers:
 *   Authorization: Bearer <firebase-token>
 *
 * Response 200:
 *   {
 *     id: number,
 *     firebase_uid: string,
 *     email: string,
 *     display_name: string | null,
 *     is_admin: boolean,
 *     created_at: string,
 *     updated_at: string
 *   }
 *
 * Response 401:
 *   { error: "Unauthorized", message: "..." }
 */
router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // User already loaded by authMiddleware (includes auto-creation on first login)
    const user = req.user!;

    // Return user profile
    res.json({
      id: user.id,
      firebase_uid: user.firebase_uid,
      email: user.email,
      display_name: user.display_name,
      is_admin: user.is_admin,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString()
    });
  })
);

/**
 * POST /api/auth/logout (optional - client-side only)
 *
 * Firebase logout is handled client-side.
 * This endpoint exists for consistency but doesn't need server-side logic.
 */
router.post('/logout', (req, res) => {
  res.json({
    message: 'Logout successful. Clear Firebase token on client.'
  });
});

export default router;
