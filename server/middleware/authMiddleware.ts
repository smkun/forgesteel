/**
 * Firebase Authentication Middleware
 *
 * Verifies Firebase ID tokens from Authorization header and attaches
 * decoded user information to Express request object.
 *
 * References:
 * - PLANNING.md: Authentication architecture
 * - PRD.md: Security requirements
 */

import { NextFunction, Request, Response } from 'express';
import admin from 'firebase-admin';
import fs from 'fs';
import '../utils/loadEnv';

// Initialize Firebase Admin SDK
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath || !fs.existsSync(credPath)) {
	console.error('[AUTH] ❌ Firebase credentials file not found');
	console.error(`[AUTH] Expected path: ${credPath}`);
	process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
admin.initializeApp({
	credential: admin.credential.cert(credentials)
});

console.log('[AUTH] ✅ Firebase Admin SDK initialized');
console.log(`[AUTH] Project: ${credentials.project_id}`);

import { AuthenticatedUser, getOrCreateUser } from '../logic/auth.logic';

/**
 * Extended Express Request with database user information
 */
export interface AuthenticatedRequest extends Request {
	user?: AuthenticatedUser;
}

/**
 * Authentication Middleware
 *
 * Extracts and verifies Firebase ID token from Authorization header.
 * Attaches decoded user information to req.user if valid.
 *
 * Usage:
 * ```typescript
 * app.get('/api/protected', authMiddleware, (req: AuthenticatedRequest, res) => {
 *   console.log('User ID:', req.user?.uid);
 * });
 * ```
 *
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export async function authMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> {
	try {
		// Extract Authorization header
		const authHeader = req.headers.authorization;

		if (!authHeader) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'No Authorization header provided'
			});
			return;
		}

		// Verify format: "Bearer <token>"
		if (!authHeader.startsWith('Bearer ')) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'Invalid Authorization header format. Expected: Bearer <token>'
			});
			return;
		}

		// Extract token
		const token = authHeader.slice(7); // Remove "Bearer " prefix

		if (!token || token.length === 0) {
			res.status(401).json({
				error: 'Unauthorized',
				message: 'No token provided'
			});
			return;
		}

		// Verify token with Firebase Admin SDK
		const decodedToken = await admin.auth().verifyIdToken(token);

		// Get or create user in database (auto-creates on first login)
		const user = await getOrCreateUser({
			uid: decodedToken.uid,
			email: decodedToken.email,
			displayName: decodedToken.name || null
		});

		// Attach database user information to request
		(req as AuthenticatedRequest).user = user;

		console.log(`[AUTH] ✅ Authenticated: ${user.email} (ID: ${user.id}, Admin: ${user.is_admin})`);

		// Continue to next middleware/route
		next();
	} catch (error) {
		console.error('[AUTH] ❌ Token verification failed:', error);

		// Handle specific Firebase errors
		if (error instanceof Error) {
			if (error.message.includes('expired')) {
				res.status(401).json({
					error: 'Unauthorized',
					message: 'Token has expired. Please sign in again.'
				});
				return;
			}

			if (error.message.includes('invalid')) {
				res.status(401).json({
					error: 'Unauthorized',
					message: 'Invalid token. Please sign in again.'
				});
				return;
			}
		}

		// Generic error response
		res.status(401).json({
			error: 'Unauthorized',
			message: 'Authentication failed'
		});
	}
}
