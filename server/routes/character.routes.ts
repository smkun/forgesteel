/**
 * Character API Routes
 *
 * RESTful API for character management (CRUD + sharing).
 *
 * References:
 * - PLANNING.md: Character API endpoints
 * - PRD.md: Character ownership and sharing requirements
 */

import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { asyncHandler, createError } from '../middleware/errorHandler';
import * as characterLogic from '../logic/character.logic';

const router = Router();

// ================================================================
// GET /api/characters
// Get all characters for authenticated user (owned + shared)
// ================================================================

router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const includeDeleted = req.query.includeDeleted === 'true';

    const characters = await characterLogic.getUserCharacters(
      user.id,
      includeDeleted
    );

    res.json({
      count: characters.length,
      characters: characters.map(char => ({
        id: char.id,
        owner_user_id: char.owner_user_id,
        gm_user_id: char.gm_user_id,
        name: char.name,
        hero: char.hero,
        is_deleted: char.is_deleted,
        created_at: char.created_at.toISOString(),
        updated_at: char.updated_at.toISOString()
      }))
    });
  })
);

// ================================================================
// GET /api/characters/:id
// Get a specific character by ID
// ================================================================

router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const character_id = parseInt(req.params.id);

    if (isNaN(character_id)) {
      throw createError(400, 'Invalid character ID');
    }

    const character = await characterLogic.getCharacter(
      character_id,
      user.id,
      user.is_admin
    );

    if (!character) {
      throw createError(404, 'Character not found or access denied');
    }

    res.json({
      id: character.id,
      owner_user_id: character.owner_user_id,
      gm_user_id: character.gm_user_id,
      name: character.name,
      hero: character.hero,
      is_deleted: character.is_deleted,
      created_at: character.created_at.toISOString(),
      updated_at: character.updated_at.toISOString()
    });
  })
);

// ================================================================
// POST /api/characters
// Create a new character
// ================================================================

router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { hero } = req.body;

    if (!hero) {
      throw createError(400, 'Hero object is required in request body');
    }

    // Validate Hero structure
    try {
      characterLogic.validateHero(hero);
    } catch (error) {
      throw createError(400, `Invalid Hero object: ${(error as Error).message}`);
    }

    const character = await characterLogic.createCharacter(
      user.id,
      hero
    );

    res.status(201).json({
      id: character.id,
      owner_user_id: character.owner_user_id,
      gm_user_id: character.gm_user_id,
      name: character.name,
      hero: character.hero,
      is_deleted: character.is_deleted,
      created_at: character.created_at.toISOString(),
      updated_at: character.updated_at.toISOString()
    });
  })
);

// ================================================================
// PUT /api/characters/:id
// Update an existing character
// ================================================================

router.put(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const character_id = parseInt(req.params.id);
    const { hero } = req.body;

    if (isNaN(character_id)) {
      throw createError(400, 'Invalid character ID');
    }

    if (!hero) {
      throw createError(400, 'Hero object is required in request body');
    }

    // Validate Hero structure
    try {
      characterLogic.validateHero(hero);
    } catch (error) {
      throw createError(400, `Invalid Hero object: ${(error as Error).message}`);
    }

    const character = await characterLogic.updateCharacter(
      character_id,
      user.id,
      hero,
      user.is_admin
    );

    if (!character) {
      throw createError(404, 'Character not found or you do not have permission to update it');
    }

    res.json({
      id: character.id,
      owner_user_id: character.owner_user_id,
      gm_user_id: character.gm_user_id,
      name: character.name,
      hero: character.hero,
      is_deleted: character.is_deleted,
      created_at: character.created_at.toISOString(),
      updated_at: character.updated_at.toISOString()
    });
  })
);

// ================================================================
// DELETE /api/characters/:id
// Soft delete a character
// ================================================================

router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const character_id = parseInt(req.params.id);

    if (isNaN(character_id)) {
      throw createError(400, 'Invalid character ID');
    }

    const deleted = await characterLogic.deleteCharacter(
      character_id,
      user.id,
      user.is_admin
    );

    if (!deleted) {
      throw createError(404, 'Character not found or you do not have permission to delete it');
    }

    res.json({
      message: 'Character deleted successfully',
      character_id
    });
  })
);

// ================================================================
// POST /api/characters/:id/share
// Share character with GM
// ================================================================

router.post(
  '/:id/share',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const character_id = parseInt(req.params.id);
    const { gm_user_id } = req.body;

    if (isNaN(character_id)) {
      throw createError(400, 'Invalid character ID');
    }

    if (!gm_user_id || isNaN(parseInt(gm_user_id))) {
      throw createError(400, 'Valid gm_user_id is required in request body');
    }

    const character = await characterLogic.shareCharacterWithGM(
      character_id,
      user.id,
      parseInt(gm_user_id),
      user.is_admin
    );

    if (!character) {
      throw createError(404, 'Character not found or you do not have permission to share it');
    }

    res.json({
      message: 'Character shared with GM successfully',
      id: character.id,
      owner_user_id: character.owner_user_id,
      gm_user_id: character.gm_user_id,
      name: character.name,
      hero: character.hero,
      is_deleted: character.is_deleted,
      created_at: character.created_at.toISOString(),
      updated_at: character.updated_at.toISOString()
    });
  })
);

// ================================================================
// DELETE /api/characters/:id/share
// Unshare character from GM
// ================================================================

router.delete(
  '/:id/share',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const character_id = parseInt(req.params.id);

    if (isNaN(character_id)) {
      throw createError(400, 'Invalid character ID');
    }

    const character = await characterLogic.unshareCharacterFromGM(
      character_id,
      user.id,
      user.is_admin
    );

    if (!character) {
      throw createError(404, 'Character not found or you do not have permission to unshare it');
    }

    res.json({
      message: 'Character unshared from GM successfully',
      id: character.id,
      owner_user_id: character.owner_user_id,
      gm_user_id: character.gm_user_id,
      name: character.name,
      hero: character.hero,
      is_deleted: character.is_deleted,
      created_at: character.created_at.toISOString(),
      updated_at: character.updated_at.toISOString()
    });
  })
);

// ================================================================
// GET /api/characters/:id/access
// Get user's access level for a character
// ================================================================

router.get(
  '/:id/access',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const character_id = parseInt(req.params.id);

    if (isNaN(character_id)) {
      throw createError(400, 'Invalid character ID');
    }

    const accessLevel = await characterLogic.getAccessLevel(
      character_id,
      user.id,
      user.is_admin
    );

    res.json({
      character_id,
      user_id: user.id,
      access_level: accessLevel
    });
  })
);

export default router;
