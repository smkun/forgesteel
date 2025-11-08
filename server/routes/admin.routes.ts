/**
 * Admin Routes
 *
 * Admin-only utilities such as listing all users.
 */

import { Response, Router } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler, createError } from '../middleware/errorHandler';
import * as usersRepo from '../data/users.repository';

const router = Router();

router.get(
	'/users',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const authUser = req.user!;

		if (!authUser.is_admin) {
			throw createError(403, 'Only admins can list users');
		}

		const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 500);
		const offset = Math.max(parseInt((req.query.offset as string) || '0', 10), 0);

		const users = await usersRepo.findAll(limit, offset);

		res.json({
			count: users.length,
			users: users.map(user => ({
				id: user.id,
				email: user.email,
				display_name: user.display_name,
				firebase_uid: user.firebase_uid,
				created_at: user.created_at.toISOString(),
				updated_at: user.updated_at.toISOString()
			}))
		});
	})
);

export default router;
