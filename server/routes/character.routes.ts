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
    const scope = (req.query.scope as string) || 'user';

    let characters;

    if (scope === 'all') {
      if (!user.is_admin) {
        throw createError(403, 'Only admins can view all characters');
      }
      characters = await characterLogic.getAllCharacters(includeDeleted);
    } else {
      characters = await characterLogic.getUserCharacters(
        user.id,
        includeDeleted
      );
    }

    res.json({
      count: characters.length,
      characters: characters.map(serializeCharacter)
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
      ...serializeCharacter(character)
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
      ...serializeCharacter(character)
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
      ...serializeCharacter(character)
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
      ...serializeCharacter(character)
    });
  })
);

// ================================================================
// POST /api/characters/:id/gm
// Share character with GM via email
// ================================================================

router.post(
  '/:id/gm',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const character_id = parseInt(req.params.id);
    const { gm_email } = req.body;

    if (isNaN(character_id)) {
      throw createError(400, 'Invalid character ID');
    }

    if (!gm_email || typeof gm_email !== 'string') {
      throw createError(400, 'Valid gm_email is required in request body');
    }

    try {
      const character = await characterLogic.shareCharacterWithGMByEmail(
        character_id,
        user.id,
        gm_email.trim(),
        user.is_admin
      );

      if (!character) {
        throw createError(404, 'Character not found or you do not have permission to share it');
      }

      res.json({
        message: 'Character shared with GM successfully',
        ...serializeCharacter(character)
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
      ...serializeCharacter(character)
    });
  })
);

// ================================================================
// DELETE /api/characters/:id/gm
// Unshare character (alias for share delete)
// ================================================================

router.delete(
  '/:id/gm',
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
      ...serializeCharacter(character)
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

// ================================================================
// PATCH /api/characters/:id/owner
// Reassign character ownership (admin only)
// ================================================================

router.patch(
  '/:id/owner',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    if (!user.is_admin) {
      throw createError(403, 'Only admins can reassign characters');
    }

    const character_id = parseInt(req.params.id);

    if (isNaN(character_id)) {
      throw createError(400, 'Invalid character ID');
    }

    const { new_owner_email } = req.body;

    if (!new_owner_email || typeof new_owner_email !== 'string') {
      throw createError(400, 'new_owner_email is required in request body');
    }

    try {
      const character = await characterLogic.reassignCharacterOwner(
        character_id,
        new_owner_email.trim()
      );

      if (!character) {
        throw createError(404, 'Character not found');
      }

      res.json({
        message: 'Character owner updated successfully',
        ...serializeCharacter(character)
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw createError(404, error.message);
      }
      throw error;
    }
  })
);

function serializeCharacter(char: characterLogic.CharacterWithHero) {
  return {
    id: char.id,
    owner_user_id: char.owner_user_id,
    owner_email: char.owner_email,
    owner_display_name: char.owner_display_name,
    gm_user_id: char.gm_user_id,
    gm_email: char.gm_email,
    gm_display_name: char.gm_display_name,
    name: char.name,
    hero: char.hero,
    is_deleted: char.is_deleted,
    created_at: char.created_at.toISOString(),
    updated_at: char.updated_at.toISOString()
  };
}

export default router;
