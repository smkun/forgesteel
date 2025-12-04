"use strict";
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
const express_1 = require("express");
const authMiddleware_1 = require('../middleware/authMiddleware.cjs');
const errorHandler_1 = require('../middleware/errorHandler.cjs');
const encounterLogic = __importStar(require('../logic/encounter.logic.cjs'));
// Use mergeParams to access :campaignId from parent router
const router = (0, express_1.Router)({ mergeParams: true });
// ================================================================
// GET /api/campaigns/:campaignId/encounters
// Get all encounters for a campaign
// ================================================================
router.get('/', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const campaign_id = parseInt(req.params.campaignId);
    const includeDeleted = req.query.includeDeleted === 'true';
    if (isNaN(campaign_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid campaign ID');
    }
    const encounters = await encounterLogic.getCampaignEncounters(campaign_id, user.id, user.is_admin, includeDeleted);
    res.json({
        count: encounters.length,
        encounters: encounters.map(serializeEncounter)
    });
}));
// ================================================================
// GET /api/campaigns/:campaignId/encounters/:id
// Get a specific encounter by database ID
// ================================================================
router.get('/:id', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const campaign_id = parseInt(req.params.campaignId);
    const encounter_id = parseInt(req.params.id);
    if (isNaN(campaign_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid campaign ID');
    }
    if (isNaN(encounter_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid encounter ID');
    }
    const encounter = await encounterLogic.getEncounter(encounter_id, user.id, user.is_admin);
    if (!encounter) {
        throw (0, errorHandler_1.createError)(404, 'Encounter not found or access denied');
    }
    // Verify encounter belongs to the campaign
    if (encounter.campaign_id !== campaign_id) {
        throw (0, errorHandler_1.createError)(404, 'Encounter not found in this campaign');
    }
    res.json({
        ...serializeEncounter(encounter)
    });
}));
// ================================================================
// POST /api/campaigns/:campaignId/encounters
// Create a new encounter
// ================================================================
router.post('/', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const campaign_id = parseInt(req.params.campaignId);
    const { encounter } = req.body;
    if (isNaN(campaign_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid campaign ID');
    }
    if (!encounter) {
        throw (0, errorHandler_1.createError)(400, 'Encounter object is required in request body');
    }
    // Validate encounter structure
    try {
        encounterLogic.validateEncounter(encounter);
    }
    catch (error) {
        throw (0, errorHandler_1.createError)(400, `Invalid encounter object: ${error.message}`);
    }
    try {
        const created = await encounterLogic.createEncounter(campaign_id, user.id, encounter, user.is_admin);
        res.status(201).json({
            ...serializeEncounter(created)
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Only campaign GMs')) {
            throw (0, errorHandler_1.createError)(403, error.message);
        }
        throw error;
    }
}));
// ================================================================
// PUT /api/campaigns/:campaignId/encounters/:id
// Update an existing encounter
// ================================================================
router.put('/:id', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const campaign_id = parseInt(req.params.campaignId);
    const encounter_id = parseInt(req.params.id);
    const { encounter } = req.body;
    if (isNaN(campaign_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid campaign ID');
    }
    if (isNaN(encounter_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid encounter ID');
    }
    if (!encounter) {
        throw (0, errorHandler_1.createError)(400, 'Encounter object is required in request body');
    }
    // Validate encounter structure
    try {
        encounterLogic.validateEncounter(encounter);
    }
    catch (error) {
        throw (0, errorHandler_1.createError)(400, `Invalid encounter object: ${error.message}`);
    }
    const updated = await encounterLogic.updateEncounter(encounter_id, user.id, encounter, user.is_admin);
    if (!updated) {
        throw (0, errorHandler_1.createError)(404, 'Encounter not found or you do not have permission to update it');
    }
    // Verify encounter belongs to the campaign
    if (updated.campaign_id !== campaign_id) {
        throw (0, errorHandler_1.createError)(404, 'Encounter not found in this campaign');
    }
    res.json({
        ...serializeEncounter(updated)
    });
}));
// ================================================================
// DELETE /api/campaigns/:campaignId/encounters/:id
// Soft delete an encounter
// ================================================================
router.delete('/:id', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const campaign_id = parseInt(req.params.campaignId);
    const encounter_id = parseInt(req.params.id);
    if (isNaN(campaign_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid campaign ID');
    }
    if (isNaN(encounter_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid encounter ID');
    }
    // First verify the encounter exists and belongs to this campaign
    const existing = await encounterLogic.getEncounter(encounter_id, user.id, user.is_admin);
    if (!existing) {
        throw (0, errorHandler_1.createError)(404, 'Encounter not found or access denied');
    }
    if (existing.campaign_id !== campaign_id) {
        throw (0, errorHandler_1.createError)(404, 'Encounter not found in this campaign');
    }
    const deleted = await encounterLogic.deleteEncounter(encounter_id, user.id, user.is_admin);
    if (!deleted) {
        throw (0, errorHandler_1.createError)(404, 'Encounter not found or you do not have permission to delete it');
    }
    res.json({
        message: 'Encounter deleted successfully',
        encounter_id
    });
}));
// ================================================================
// GET /api/campaigns/:campaignId/encounters/:id/access
// Get user's access level for an encounter
// ================================================================
router.get('/:id/access', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const campaign_id = parseInt(req.params.campaignId);
    const encounter_id = parseInt(req.params.id);
    if (isNaN(campaign_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid campaign ID');
    }
    if (isNaN(encounter_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid encounter ID');
    }
    const accessLevel = await encounterLogic.getAccessLevel(encounter_id, user.id, user.is_admin);
    res.json({
        encounter_id,
        user_id: user.id,
        access_level: accessLevel
    });
}));
/**
 * Serialize encounter for JSON response
 */
function serializeEncounter(enc) {
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
exports.default = router;
//# sourceMappingURL=encounter.routes.js.map