"use strict";
/**
 * Character API Routes
 *
 * RESTful API for character management (CRUD + sharing).
 *
 * References:
 * - PLANNING.md: Character API endpoints
 * - PRD.md: Character ownership and sharing requirements
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
const characterLogic = __importStar(require('../logic/character.logic.cjs'));
const router = (0, express_1.Router)();
// ================================================================
// GET /api/characters
// Get all characters for authenticated user (owned + shared)
// ================================================================
router.get('/', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const includeDeleted = req.query.includeDeleted === 'true';
    const scope = req.query.scope || 'user';
    let characters;
    if (scope === 'all') {
        if (!user.is_admin) {
            throw (0, errorHandler_1.createError)(403, 'Only admins can view all characters');
        }
        characters = await characterLogic.getAllCharacters(includeDeleted);
    }
    else {
        characters = await characterLogic.getUserCharacters(user.id, includeDeleted);
    }
    console.log('[CHARACTER ROUTE /] First character RAW from DB:', {
        id: characters[0]?.id,
        campaign_id: characters[0]?.campaign_id,
        campaign_name: characters[0]?.campaign_name
    });
    const serialized = characters.map(serializeCharacter);
    console.log('[CHARACTER ROUTE /] First character SERIALIZED:', {
        id: serialized[0]?.id,
        campaign_id: serialized[0]?.campaign_id,
        campaign_name: serialized[0]?.campaign_name
    });
    res.json({
        count: characters.length,
        characters: serialized
    });
}));
// ================================================================
// GET /api/characters/hero/:heroId
// Get a specific character by hero ID (UUID)
// ================================================================
router.get('/hero/:heroId', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const hero_id = req.params.heroId;
    const character = await characterLogic.getCharacterByHeroId(hero_id, user.id, user.is_admin);
    if (!character) {
        throw (0, errorHandler_1.createError)(404, 'Character not found or access denied');
    }
    console.log('[CHARACTER ROUTE /hero/:heroId] Raw character from DB:', {
        id: character.id,
        campaign_id: character.campaign_id,
        campaign_name: character.campaign_name
    });
    const serialized = serializeCharacter(character);
    console.log('[CHARACTER ROUTE /hero/:heroId] Serialized character:', {
        id: serialized.id,
        campaign_id: serialized.campaign_id,
        campaign_name: serialized.campaign_name
    });
    res.json({
        ...serialized
    });
}));
// ================================================================
// GET /api/characters/:id
// Get a specific character by database ID
// ================================================================
router.get('/:id', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const character_id = parseInt(req.params.id);
    if (isNaN(character_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid character ID');
    }
    const character = await characterLogic.getCharacter(character_id, user.id, user.is_admin);
    if (!character) {
        throw (0, errorHandler_1.createError)(404, 'Character not found or access denied');
    }
    res.json({
        ...serializeCharacter(character)
    });
}));
// ================================================================
// POST /api/characters
// Create a new character
// ================================================================
router.post('/', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const { hero } = req.body;
    if (!hero) {
        throw (0, errorHandler_1.createError)(400, 'Hero object is required in request body');
    }
    // Validate Hero structure
    try {
        characterLogic.validateHero(hero);
    }
    catch (error) {
        throw (0, errorHandler_1.createError)(400, `Invalid Hero object: ${error.message}`);
    }
    const character = await characterLogic.createCharacter(user.id, hero);
    res.status(201).json({
        ...serializeCharacter(character)
    });
}));
// ================================================================
// PUT /api/characters/:id
// Update an existing character
// ================================================================
router.put('/:id', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const character_id = parseInt(req.params.id);
    const { hero } = req.body;
    if (isNaN(character_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid character ID');
    }
    if (!hero) {
        throw (0, errorHandler_1.createError)(400, 'Hero object is required in request body');
    }
    // Validate Hero structure
    try {
        characterLogic.validateHero(hero);
    }
    catch (error) {
        throw (0, errorHandler_1.createError)(400, `Invalid Hero object: ${error.message}`);
    }
    const character = await characterLogic.updateCharacter(character_id, user.id, hero, user.is_admin);
    if (!character) {
        throw (0, errorHandler_1.createError)(404, 'Character not found or you do not have permission to update it');
    }
    res.json({
        ...serializeCharacter(character)
    });
}));
// ================================================================
// DELETE /api/characters/:id
// Soft delete a character
// ================================================================
router.delete('/:id', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const character_id = parseInt(req.params.id);
    if (isNaN(character_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid character ID');
    }
    const deleted = await characterLogic.deleteCharacter(character_id, user.id, user.is_admin);
    if (!deleted) {
        throw (0, errorHandler_1.createError)(404, 'Character not found or you do not have permission to delete it');
    }
    res.json({
        message: 'Character deleted successfully',
        character_id
    });
}));
// ================================================================
// POST /api/characters/:id/share
// Share character with GM
// ================================================================
router.post('/:id/share', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const character_id = parseInt(req.params.id);
    const { gm_user_id } = req.body;
    if (isNaN(character_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid character ID');
    }
    if (!gm_user_id || isNaN(parseInt(gm_user_id))) {
        throw (0, errorHandler_1.createError)(400, 'Valid gm_user_id is required in request body');
    }
    const character = await characterLogic.shareCharacterWithGM(character_id, user.id, parseInt(gm_user_id), user.is_admin);
    if (!character) {
        throw (0, errorHandler_1.createError)(404, 'Character not found or you do not have permission to share it');
    }
    res.json({
        message: 'Character shared with GM successfully',
        ...serializeCharacter(character)
    });
}));
// ================================================================
// POST /api/characters/:id/gm
// Share character with GM via email
// ================================================================
router.post('/:id/gm', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const character_id = parseInt(req.params.id);
    const { gm_email } = req.body;
    if (isNaN(character_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid character ID');
    }
    if (!gm_email || typeof gm_email !== 'string') {
        throw (0, errorHandler_1.createError)(400, 'Valid gm_email is required in request body');
    }
    try {
        const character = await characterLogic.shareCharacterWithGMByEmail(character_id, user.id, gm_email.trim(), user.is_admin);
        if (!character) {
            throw (0, errorHandler_1.createError)(404, 'Character not found or you do not have permission to share it');
        }
        res.json({
            message: 'Character shared with GM successfully',
            ...serializeCharacter(character)
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            throw (0, errorHandler_1.createError)(404, error.message);
        }
        throw error;
    }
}));
// ================================================================
// DELETE /api/characters/:id/share
// Unshare character from GM
// ================================================================
router.delete('/:id/share', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const character_id = parseInt(req.params.id);
    if (isNaN(character_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid character ID');
    }
    const character = await characterLogic.unshareCharacterFromGM(character_id, user.id, user.is_admin);
    if (!character) {
        throw (0, errorHandler_1.createError)(404, 'Character not found or you do not have permission to unshare it');
    }
    res.json({
        message: 'Character unshared from GM successfully',
        ...serializeCharacter(character)
    });
}));
// ================================================================
// DELETE /api/characters/:id/gm
// Unshare character (alias for share delete)
// ================================================================
router.delete('/:id/gm', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const character_id = parseInt(req.params.id);
    if (isNaN(character_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid character ID');
    }
    const character = await characterLogic.unshareCharacterFromGM(character_id, user.id, user.is_admin);
    if (!character) {
        throw (0, errorHandler_1.createError)(404, 'Character not found or you do not have permission to unshare it');
    }
    res.json({
        message: 'Character unshared from GM successfully',
        ...serializeCharacter(character)
    });
}));
// ================================================================
// GET /api/characters/:id/access
// Get user's access level for a character
// ================================================================
router.get('/:id/access', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const character_id = parseInt(req.params.id);
    if (isNaN(character_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid character ID');
    }
    const accessLevel = await characterLogic.getAccessLevel(character_id, user.id, user.is_admin);
    res.json({
        character_id,
        user_id: user.id,
        access_level: accessLevel
    });
}));
// ================================================================
// PATCH /api/characters/:id/owner
// Reassign character ownership (admin only)
// ================================================================
router.patch('/:id/owner', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    if (!user.is_admin) {
        throw (0, errorHandler_1.createError)(403, 'Only admins can reassign characters');
    }
    const character_id = parseInt(req.params.id);
    if (isNaN(character_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid character ID');
    }
    const { new_owner_email } = req.body;
    if (!new_owner_email || typeof new_owner_email !== 'string') {
        throw (0, errorHandler_1.createError)(400, 'new_owner_email is required in request body');
    }
    try {
        const character = await characterLogic.reassignCharacterOwner(character_id, new_owner_email.trim());
        if (!character) {
            throw (0, errorHandler_1.createError)(404, 'Character not found');
        }
        res.json({
            message: 'Character owner updated successfully',
            ...serializeCharacter(character)
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            throw (0, errorHandler_1.createError)(404, error.message);
        }
        throw error;
    }
}));
function serializeCharacter(char) {
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
exports.default = router;
//# sourceMappingURL=character.routes.js.map