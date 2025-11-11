/**
 * Campaign API Routes
 *
 * RESTful API for campaign management and member management.
 *
 * References:
 * - db/migrations/001_add_campaigns.sql: Database schema
 * - Campaign system design: GMs manage campaigns, players can view
 */

import { Response, Router } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/authMiddleware';
import { asyncHandler, createError } from '../middleware/errorHandler';
import * as campaignLogic from '../logic/campaign.logic';
import * as characterLogic from '../logic/character.logic';
import * as Campaign from '../data/campaigns.repository';

const router = Router();

// ================================================================
// GET /api/campaigns
// Get all campaigns for authenticated user
// ================================================================

router.get(
	'/',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const includeDeleted = req.query.includeDeleted === 'true';
		const gmOnly = req.query.gmOnly === 'true';

		let campaigns;

		// Admins see ALL campaigns
		if (user.is_admin) {
			campaigns = await Campaign.findAll(includeDeleted);
		} else if (gmOnly) {
			campaigns = await campaignLogic.getGMCampaigns(user.id, includeDeleted);
		} else {
			campaigns = await campaignLogic.getUserCampaigns(user.id, includeDeleted);
		}

		res.json({
			count: campaigns.length,
			campaigns: campaigns.map(serializeCampaign)
		});
	})
);

// ================================================================
// GET /api/campaigns/:id
// Get a specific campaign by ID
// ================================================================

router.get(
	'/:id',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.id);

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		const campaign = await campaignLogic.getCampaign(
			campaign_id,
			user.id,
			user.is_admin
		);

		if (!campaign) {
			throw createError(404, 'Campaign not found or access denied');
		}

		res.json(serializeCampaign(campaign));
	})
);

// ================================================================
// GET /api/campaigns/:id/members
// Get all members of a campaign
// ================================================================

router.get(
	'/:id/members',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.id);

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		const campaign = await campaignLogic.getCampaignWithMembers(
			campaign_id,
			user.id,
			user.is_admin
		);

		if (!campaign) {
			throw createError(404, 'Campaign not found or access denied');
		}

		res.json({
			campaign_id: campaign.id,
			members: campaign.members || [],
			gms: campaign.gms || []
		});
	})
);

// ================================================================
// GET /api/campaigns/:id/characters
// Get all characters in a campaign
// ================================================================

router.get(
	'/:id/characters',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.id);

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		const characters = await campaignLogic.getCampaignCharacters(
			campaign_id,
			user.id,
			user.is_admin
		);

		if (!characters) {
			throw createError(404, 'Campaign not found or access denied');
		}

		// Map characters to include parsed hero JSON
		const mappedCharacters = characterLogic.mapCharacters(characters);

		res.json({
			campaign_id,
			count: mappedCharacters.length,
			characters: mappedCharacters.map(serializeCharacter)
		});
	})
);

// ================================================================
// POST /api/campaigns
// Create a new campaign
// ================================================================

router.post(
	'/',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const { name, description, gm_user_id } = req.body;

		if (!name || typeof name !== 'string') {
			throw createError(400, 'Campaign name is required');
		}

		const campaign = await campaignLogic.createCampaign(
			user.id,
			name,
			description,
			gm_user_id
		);

		res.status(201).json({
			message: 'Campaign created successfully',
			...serializeCampaign(campaign)
		});
	})
);

// ================================================================
// PUT /api/campaigns/:id
// Update a campaign
// ================================================================

router.put(
	'/:id',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.id);
		const { name, description } = req.body;

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		const updates: Campaign.UpdateCampaignData = {};

		if (name !== undefined) {
			if (typeof name !== 'string' || name.trim() === '') {
				throw createError(400, 'Campaign name cannot be empty');
			}
			updates.name = name.trim();
		}

		if (description !== undefined) {
			updates.description = description;
		}

		const campaign = await campaignLogic.updateCampaign(
			campaign_id,
			user.id,
			updates,
			user.is_admin
		);

		if (!campaign) {
			throw createError(404, 'Campaign not found or you do not have permission to update it');
		}

		res.json({
			message: 'Campaign updated successfully',
			...serializeCampaign(campaign)
		});
	})
);

// ================================================================
// DELETE /api/campaigns/:id
// Soft delete a campaign
// ================================================================

router.delete(
	'/:id',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.id);

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		const deleted = await campaignLogic.deleteCampaign(
			campaign_id,
			user.id,
			user.is_admin
		);

		if (!deleted) {
			throw createError(404, 'Campaign not found or you do not have permission to delete it');
		}

		res.json({
			message: 'Campaign deleted successfully',
			campaign_id
		});
	})
);

// ================================================================
// POST /api/campaigns/:id/members
// Add a member to a campaign
// ================================================================

router.post(
	'/:id/members',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.id);
		const { user_email, role } = req.body;

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		if (!user_email || typeof user_email !== 'string') {
			throw createError(400, 'User email is required');
		}

		if (role && role !== 'gm' && role !== 'player') {
			throw createError(400, 'Role must be "gm" or "player"');
		}

		try {
			const member = await campaignLogic.addCampaignMember(
				campaign_id,
				user.id,
				user_email.trim(),
				role || 'player',
				user.is_admin
			);

			if (!member) {
				throw createError(403, 'You do not have permission to add members to this campaign');
			}

			res.status(201).json({
				message: 'Member added successfully',
				member
			});
		} catch (error) {
			if (error instanceof Error && error.message.includes('not found')) {
				throw createError(404, error.message);
			}
			throw error;
		}
	})
);

// ================================================================
// DELETE /api/campaigns/:id/members/:userId
// Remove a member from a campaign
// ================================================================

router.delete(
	'/:id/members/:userId',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.id);
		const user_id = parseInt(req.params.userId);

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		if (isNaN(user_id)) {
			throw createError(400, 'Invalid user ID');
		}

		const removed = await campaignLogic.removeCampaignMember(
			campaign_id,
			user.id,
			user_id,
			user.is_admin
		);

		if (!removed) {
			throw createError(404, 'Member not found or you do not have permission to remove them');
		}

		res.json({
			message: 'Member removed successfully',
			campaign_id,
			user_id
		});
	})
);

// ================================================================
// PATCH /api/campaigns/:id/members/:userId
// Update a member's role in a campaign
// ================================================================

router.patch(
	'/:id/members/:userId',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.id);
		const user_id = parseInt(req.params.userId);
		const { role } = req.body;

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		if (isNaN(user_id)) {
			throw createError(400, 'Invalid user ID');
		}

		if (!role || (role !== 'gm' && role !== 'player')) {
			throw createError(400, 'Role must be "gm" or "player"');
		}

		const member = await campaignLogic.updateCampaignMemberRole(
			campaign_id,
			user.id,
			user_id,
			role,
			user.is_admin
		);

		if (!member) {
			throw createError(404, 'Member not found or you do not have permission to update their role');
		}

		res.json({
			message: 'Member role updated successfully',
			member
		});
	})
);

// ================================================================
// POST /api/campaigns/:id/characters/:characterId
// Assign a character to a campaign
// ================================================================

router.post(
	'/:id/characters/:characterId',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.id);
		const character_id = parseInt(req.params.characterId);

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		if (isNaN(character_id)) {
			throw createError(400, 'Invalid character ID');
		}

		const character = await campaignLogic.assignCharacterToCampaign(
			character_id,
			campaign_id,
			user.id,
			user.is_admin
		);

		if (!character) {
			throw createError(404, 'Character not found or you do not have permission to assign it');
		}

		res.json({
			message: 'Character assigned to campaign successfully',
			character
		});
	})
);

// ================================================================
// DELETE /api/campaigns/:id/characters/:characterId
// Remove a character from a campaign
// ================================================================

router.delete(
	'/:id/characters/:characterId',
	authMiddleware,
	asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
		const user = req.user!;
		const campaign_id = parseInt(req.params.id);
		const character_id = parseInt(req.params.characterId);

		if (isNaN(campaign_id)) {
			throw createError(400, 'Invalid campaign ID');
		}

		if (isNaN(character_id)) {
			throw createError(400, 'Invalid character ID');
		}

		// Removing from campaign means setting campaign_id to null
		const character = await campaignLogic.assignCharacterToCampaign(
			character_id,
			null,
			user.id,
			user.is_admin
		);

		if (!character) {
			throw createError(404, 'Character not found or you do not have permission to remove it');
		}

		res.json({
			message: 'Character removed from campaign successfully',
			character
		});
	})
);

// ================================================================
// Helper Functions
// ================================================================

function serializeCampaign(campaign: Campaign.Campaign | campaignLogic.CampaignWithMembers) {
	return {
		id: campaign.id,
		name: campaign.name,
		description: campaign.description,
		created_by_user_id: campaign.created_by_user_id,
		creator_email: campaign.creator_email,
		creator_display_name: campaign.creator_display_name,
		user_role: campaign.user_role,
		is_deleted: campaign.is_deleted,
		created_at: campaign.created_at.toISOString(),
		updated_at: campaign.updated_at.toISOString()
	};
}

function serializeCharacter(char: characterLogic.CharacterWithHero) {
	return {
		id: char.id,
		owner_user_id: char.owner_user_id,
		owner_email: char.owner_email,
		owner_display_name: char.owner_display_name,
		gm_user_id: char.gm_user_id,
		gm_email: char.gm_email,
		gm_display_name: char.gm_display_name,
		campaign_id: char.campaign_id,
		campaign_name: char.campaign_name,
		name: char.name,
		hero: char.hero,
		is_deleted: char.is_deleted,
		created_at: char.created_at.toISOString(),
		updated_at: char.updated_at.toISOString()
	};
}

export default router;
