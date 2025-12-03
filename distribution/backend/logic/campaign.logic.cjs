"use strict";
/**
 * Campaign Business Logic
 *
 * Handles campaign management, member management, and access control.
 *
 * References:
 * - db/migrations/001_add_campaigns.sql: Database schema
 * - Campaign system design: GMs assigned to campaigns, players can view characters
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
exports.CampaignAccessLevel = void 0;
exports.getCampaign = getCampaign;
exports.getCampaignWithMembers = getCampaignWithMembers;
exports.getUserCampaigns = getUserCampaigns;
exports.getGMCampaigns = getGMCampaigns;
exports.createCampaign = createCampaign;
exports.updateCampaign = updateCampaign;
exports.deleteCampaign = deleteCampaign;
exports.addCampaignMember = addCampaignMember;
exports.removeCampaignMember = removeCampaignMember;
exports.updateCampaignMemberRole = updateCampaignMemberRole;
exports.getCampaignAccessLevel = getCampaignAccessLevel;
exports.getCampaignCharacters = getCampaignCharacters;
exports.assignCharacterToCampaign = assignCharacterToCampaign;
const campaignsRepo = __importStar(require('../data/campaigns.repository.cjs'));
const charactersRepo = __importStar(require('../data/characters.repository.cjs'));
const usersRepo = __importStar(require('../data/users.repository.cjs'));
/**
 * Campaign member access level
 */
var CampaignAccessLevel;
(function (CampaignAccessLevel) {
    CampaignAccessLevel["GM"] = "gm";
    CampaignAccessLevel["Player"] = "player";
    CampaignAccessLevel["None"] = "none";
})(CampaignAccessLevel || (exports.CampaignAccessLevel = CampaignAccessLevel = {}));
/**
 * Get campaign by ID with access control
 *
 * @param campaign_id Campaign ID
 * @param user_id Requesting user ID
 * @param is_admin Is user an admin
 * @returns Campaign or null if not found/no access
 */
async function getCampaign(campaign_id, user_id, is_admin = false) {
    const campaign = await campaignsRepo.findById(campaign_id);
    if (!campaign) {
        return null;
    }
    // Check access: must be a member, creator, or admin
    const isMember = await campaignsRepo.isMember(campaign_id, user_id);
    const isCreator = campaign.created_by_user_id === user_id;
    const hasAccess = is_admin || isMember || isCreator;
    if (!hasAccess) {
        console.log(`[CAMPAIGN LOGIC] ❌ Access denied: User ${user_id} is not a member or creator of campaign ${campaign_id}`);
        return null;
    }
    // Get user's role in the campaign
    const userRole = await campaignsRepo.getUserRole(campaign_id, user_id);
    return {
        ...campaign,
        user_role: userRole || undefined
    };
}
/**
 * Get campaign with full member list
 *
 * @param campaign_id Campaign ID
 * @param user_id Requesting user ID
 * @param is_admin Is user an admin
 * @returns Campaign with members or null if not found/no access
 */
async function getCampaignWithMembers(campaign_id, user_id, is_admin = false) {
    const campaign = await getCampaign(campaign_id, user_id, is_admin);
    if (!campaign) {
        return null;
    }
    // Get all members
    const members = await campaignsRepo.getMembers(campaign_id);
    const gms = await campaignsRepo.getGMs(campaign_id);
    return {
        ...campaign,
        members,
        gms
    };
}
/**
 * Get all campaigns for a user
 *
 * @param user_id User ID
 * @param includeDeleted Include soft-deleted campaigns
 * @returns Array of campaigns
 */
async function getUserCampaigns(user_id, includeDeleted = false) {
    return campaignsRepo.findByUser(user_id, includeDeleted);
}
/**
 * Get campaigns where user is GM
 *
 * @param user_id User ID
 * @param includeDeleted Include soft-deleted campaigns
 * @returns Array of campaigns
 */
async function getGMCampaigns(user_id, includeDeleted = false) {
    return campaignsRepo.findByGM(user_id, includeDeleted);
}
/**
 * Create a new campaign
 *
 * @param user_id Creator user ID
 * @param name Campaign name
 * @param description Campaign description (optional)
 * @param gm_user_id Optional GM user ID (if not provided, creator becomes GM)
 * @returns Created campaign
 */
async function createCampaign(user_id, name, description, gm_user_id) {
    if (!name || name.trim() === '') {
        throw new Error('Campaign name is required');
    }
    const campaign = await campaignsRepo.create({
        name: name.trim(),
        description: description?.trim() || null,
        created_by_user_id: user_id
    });
    // Automatically add the GM as a member
    // If gm_user_id is provided, add that user as GM
    // Otherwise, add the creator as GM
    const gmUserId = gm_user_id || user_id;
    await campaignsRepo.addMember(campaign.id, gmUserId, 'gm');
    console.log(`[CAMPAIGN LOGIC] ✅ Created campaign ${campaign.id} by user ${user_id}, GM: ${gmUserId}`);
    return campaign;
}
/**
 * Update a campaign
 * Only GMs can update campaigns
 *
 * @param campaign_id Campaign ID
 * @param user_id Requesting user ID
 * @param updates Updates to apply
 * @param is_admin Is user an admin
 * @returns Updated campaign or null if not found/no permission
 */
async function updateCampaign(campaign_id, user_id, updates, is_admin = false) {
    // Check if user is GM or admin
    const isGM = await campaignsRepo.isGM(campaign_id, user_id);
    if (!is_admin && !isGM) {
        console.log(`[CAMPAIGN LOGIC] ❌ Permission denied: User ${user_id} is not a GM of campaign ${campaign_id}`);
        return null;
    }
    return campaignsRepo.update(campaign_id, updates);
}
/**
 * Delete a campaign (soft delete)
 * Only GMs can delete campaigns
 *
 * @param campaign_id Campaign ID
 * @param user_id Requesting user ID
 * @param is_admin Is user an admin
 * @returns True if deleted
 */
async function deleteCampaign(campaign_id, user_id, is_admin = false) {
    // Check if user is GM or admin
    const isGM = await campaignsRepo.isGM(campaign_id, user_id);
    if (!is_admin && !isGM) {
        console.log(`[CAMPAIGN LOGIC] ❌ Permission denied: User ${user_id} is not a GM of campaign ${campaign_id}`);
        return false;
    }
    return campaignsRepo.softDelete(campaign_id);
}
/**
 * Add a member to a campaign
 * Only GMs can add members
 *
 * @param campaign_id Campaign ID
 * @param requesting_user_id User making the request
 * @param user_email Email of user to add
 * @param role Role to assign ('gm' or 'player')
 * @param is_admin Is requesting user an admin
 * @returns Added member or null if permission denied
 */
async function addCampaignMember(campaign_id, requesting_user_id, user_email, role = 'player', is_admin = false) {
    // Check if requesting user is GM or admin
    const isGM = await campaignsRepo.isGM(campaign_id, requesting_user_id);
    if (!is_admin && !isGM) {
        console.log(`[CAMPAIGN LOGIC] ❌ Permission denied: User ${requesting_user_id} is not a GM of campaign ${campaign_id}`);
        return null;
    }
    // Find user by email
    const user = await usersRepo.findByEmail(user_email);
    if (!user) {
        throw new Error(`User with email ${user_email} not found`);
    }
    // Add member
    return campaignsRepo.addMember(campaign_id, user.id, role);
}
/**
 * Remove a member from a campaign
 * Only GMs can remove members
 *
 * @param campaign_id Campaign ID
 * @param requesting_user_id User making the request
 * @param user_id User ID to remove
 * @param is_admin Is requesting user an admin
 * @returns True if removed
 */
async function removeCampaignMember(campaign_id, requesting_user_id, user_id, is_admin = false) {
    // Check if requesting user is GM or admin
    const isGM = await campaignsRepo.isGM(campaign_id, requesting_user_id);
    if (!is_admin && !isGM) {
        console.log(`[CAMPAIGN LOGIC] ❌ Permission denied: User ${requesting_user_id} is not a GM of campaign ${campaign_id}`);
        return false;
    }
    return campaignsRepo.removeMember(campaign_id, user_id);
}
/**
 * Update a member's role in a campaign
 * Only GMs can update roles
 *
 * @param campaign_id Campaign ID
 * @param requesting_user_id User making the request
 * @param user_id User ID to update
 * @param role New role
 * @param is_admin Is requesting user an admin
 * @returns Updated member or null if permission denied
 */
async function updateCampaignMemberRole(campaign_id, requesting_user_id, user_id, role, is_admin = false) {
    // Check if requesting user is GM or admin
    const isGM = await campaignsRepo.isGM(campaign_id, requesting_user_id);
    if (!is_admin && !isGM) {
        console.log(`[CAMPAIGN LOGIC] ❌ Permission denied: User ${requesting_user_id} is not a GM of campaign ${campaign_id}`);
        return null;
    }
    return campaignsRepo.updateMemberRole(campaign_id, user_id, role);
}
/**
 * Get user's access level in a campaign
 *
 * @param campaign_id Campaign ID
 * @param user_id User ID
 * @returns Access level
 */
async function getCampaignAccessLevel(campaign_id, user_id) {
    const role = await campaignsRepo.getUserRole(campaign_id, user_id);
    if (!role) {
        return CampaignAccessLevel.None;
    }
    return role === 'gm' ? CampaignAccessLevel.GM : CampaignAccessLevel.Player;
}
/**
 * Get all characters in a campaign
 * Members can view all characters in their campaigns
 *
 * @param campaign_id Campaign ID
 * @param user_id Requesting user ID
 * @param is_admin Is user an admin
 * @returns Array of characters or null if no access
 */
async function getCampaignCharacters(campaign_id, user_id, is_admin = false) {
    // Check if user is a member or admin
    const hasAccess = is_admin || await campaignsRepo.isMember(campaign_id, user_id);
    if (!hasAccess) {
        console.log(`[CAMPAIGN LOGIC] ❌ Access denied: User ${user_id} is not a member of campaign ${campaign_id}`);
        return null;
    }
    return charactersRepo.findByCampaign(campaign_id);
}
/**
 * Assign a character to a campaign
 * Only character owner or campaign GMs can assign characters
 *
 * @param character_id Character ID
 * @param campaign_id Campaign ID (null to remove from campaign)
 * @param user_id Requesting user ID
 * @param is_admin Is user an admin
 * @returns Updated character or null if permission denied
 */
async function assignCharacterToCampaign(character_id, campaign_id, user_id, is_admin = false) {
    // Get the character to check current campaign
    const character = await charactersRepo.findById(character_id);
    if (!character) {
        console.log(`[CAMPAIGN LOGIC] ❌ Character ${character_id} not found`);
        return null;
    }
    // Check if user is character owner
    const isOwner = await charactersRepo.isOwner(character_id, user_id);
    // Check if user is GM of the target campaign (when assigning)
    let isTargetCampaignGM = false;
    if (campaign_id) {
        isTargetCampaignGM = await campaignsRepo.isGM(campaign_id, user_id);
    }
    // Check if user is GM of the current campaign (when removing)
    let isCurrentCampaignGM = false;
    if (character.campaign_id && campaign_id === null) {
        isCurrentCampaignGM = await campaignsRepo.isGM(character.campaign_id, user_id);
    }
    if (!is_admin && !isOwner && !isTargetCampaignGM && !isCurrentCampaignGM) {
        console.log(`[CAMPAIGN LOGIC] ❌ Permission denied: User ${user_id} cannot assign character ${character_id} to campaign ${campaign_id}`);
        return null;
    }
    return charactersRepo.assignToCampaign(character_id, campaign_id);
}
//# sourceMappingURL=campaign.logic.js.map