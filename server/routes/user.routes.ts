/**
 * User routes
 *
 * Provides search endpoint for selecting GMs by email.
 */

import { Response, Router } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler, createError } from '../middleware/errorHandler';
import * as usersRepo from '../data/users.repository';

const router = Router();

router.get(
	'/search',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const query = (req.query.query as string) || '';

		if (query.trim().length < 2) {
			throw createError(400, 'Query must be at least 2 characters');
		}

		const users = await usersRepo.searchByEmailOrName(query.trim(), 10);

		res.json({
			count: users.length,
			users: users.map(user => ({
				id: user.id,
				email: user.email,
				display_name: user.display_name
			}))
		});
	})
);

export default router;
