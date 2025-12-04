/**
 * Encounter API Routes
 *
 * RESTful API for campaign encounter management.
 * Routes are nested under campaigns: /api/campaigns/:campaignId/encounters
 *
 * References:
 * - DESIGN_backend_encounters.md: API endpoint specifications
 * - PLANNING.md: Encounter API requirements
 */

import { Response, Router } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler, createError } from '../middleware/errorHandler';
import * as encounterLogic from '../logic/encounter.logic';

// Use mergeParams to access :campaignId from parent router
const router = Router({ mergeParams: true });

// ================================================================
// GET /api/campaigns/:campaignId/encounters
// Get all encounters for a campaign
// ================================================================

router.get(
	'/',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.campaignId);
		const includeDeleted = req.query.includeDeleted === 'true';

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		const encounters = await encounterLogic.getCampaignEncounters(
			campaign_id,
			user.id,
			user.is_admin,
			includeDeleted
		);

		res.json({
			count: encounters.length,
			encounters: encounters.map(serializeEncounter)
		});
	})
);

// ================================================================
// GET /api/campaigns/:campaignId/encounters/:id
// Get a specific encounter by database ID
// ================================================================

router.get(
	'/:id',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.campaignId);
		const encounter_id = parseInt(req.params.id);

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		if (isNaN(encounter_id)) {
			throw createError(400, 'Invalid encounter ID');
		}

		const encounter = await encounterLogic.getEncounter(
			encounter_id,
			user.id,
			user.is_admin
		);

		if (!encounter) {
			throw createError(404, 'Encounter not found or access denied');
		}

		// Verify encounter belongs to the campaign
		if (encounter.campaign_id !== campaign_id) {
			throw createError(404, 'Encounter not found in this campaign');
		}

		res.json({
			...serializeEncounter(encounter)
		});
	})
);

// ================================================================
// POST /api/campaigns/:campaignId/encounters
// Create a new encounter
// ================================================================

router.post(
	'/',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.campaignId);
		const { encounter } = req.body;

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		if (!encounter) {
			throw createError(400, 'Encounter object is required in request body');
		}

		// Validate encounter structure
		try {
			encounterLogic.validateEncounter(encounter);
		} catch (error) {
			throw createError(400, `Invalid encounter object: ${(error as Error).message}`);
		}

		try {
			const created = await encounterLogic.createEncounter(
				campaign_id,
				user.id,
				encounter,
				user.is_admin
			);

			res.status(201).json({
				...serializeEncounter(created)
			});
		} catch (error) {
			if (error instanceof Error && error.message.includes('Only campaign GMs')) {
				throw createError(403, error.message);
			}
			throw error;
		}
	})
);

// ================================================================
// PUT /api/campaigns/:campaignId/encounters/:id
// Update an existing encounter
// ================================================================

router.put(
	'/:id',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.campaignId);
		const encounter_id = parseInt(req.params.id);
		const { encounter } = req.body;

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		if (isNaN(encounter_id)) {
			throw createError(400, 'Invalid encounter ID');
		}

		if (!encounter) {
			throw createError(400, 'Encounter object is required in request body');
		}

		// Validate encounter structure
		try {
			encounterLogic.validateEncounter(encounter);
		} catch (error) {
			throw createError(400, `Invalid encounter object: ${(error as Error).message}`);
		}

		const updated = await encounterLogic.updateEncounter(
			encounter_id,
			user.id,
			encounter,
			user.is_admin
		);

		if (!updated) {
			throw createError(404, 'Encounter not found or you do not have permission to update it');
		}

		// Verify encounter belongs to the campaign
		if (updated.campaign_id !== campaign_id) {
			throw createError(404, 'Encounter not found in this campaign');
		}

		res.json({
			...serializeEncounter(updated)
		});
	})
);

// ================================================================
// DELETE /api/campaigns/:campaignId/encounters/:id
// Soft delete an encounter
// ================================================================

router.delete(
	'/:id',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.campaignId);
		const encounter_id = parseInt(req.params.id);

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		if (isNaN(encounter_id)) {
			throw createError(400, 'Invalid encounter ID');
		}

		// First verify the encounter exists and belongs to this campaign
		const existing = await encounterLogic.getEncounter(
			encounter_id,
			user.id,
			user.is_admin
		);

		if (!existing) {
			throw createError(404, 'Encounter not found or access denied');
		}

		if (existing.campaign_id !== campaign_id) {
			throw createError(404, 'Encounter not found in this campaign');
		}

		const deleted = await encounterLogic.deleteEncounter(
			encounter_id,
			user.id,
			user.is_admin
		);

		if (!deleted) {
			throw createError(404, 'Encounter not found or you do not have permission to delete it');
		}

		res.json({
			message: 'Encounter deleted successfully',
			encounter_id
		});
	})
);

// ================================================================
// GET /api/campaigns/:campaignId/encounters/:id/access
// Get user's access level for an encounter
// ================================================================

router.get(
	'/:id/access',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.campaignId);
		const encounter_id = parseInt(req.params.id);

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		if (isNaN(encounter_id)) {
			throw createError(400, 'Invalid encounter ID');
		}

		const accessLevel = await encounterLogic.getAccessLevel(
			encounter_id,
			user.id,
			user.is_admin
		);

		res.json({
			encounter_id,
			user_id: user.id,
			access_level: accessLevel
		});
	})
);

/**
 * Serialize encounter for JSON response
 */
function serializeEncounter(enc: encounterLogic.EncounterWithData) {
	return {
		id: enc.id,
		campaign_id: enc.campaign_id,
		campaign_name: enc.campaign_name,
		encounter_uuid: enc.encounter_uuid,
		name: enc.name,
		encounter: enc.encounter,
		created_by_user_id: enc.created_by_user_id,
		creator_email: enc.creator_email,
		creator_display_name: enc.creator_display_name,
		is_deleted: enc.is_deleted,
		created_at: enc.created_at.toISOString(),
		updated_at: enc.updated_at.toISOString()
	};
}

export default router;
