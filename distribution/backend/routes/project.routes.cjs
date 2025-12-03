"use strict";
/**
 * Project API Routes
 *
 * RESTful API for campaign project management.
 *
 * References:
 * - DESIGN_CAMPAIGN_PROJECTS.md: Complete API specification
 * - PLANNING.md: Campaign projects feature overview
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
const projectLogic = __importStar(require('../logic/project.logic.cjs'));
const projectsRepo = __importStar(require('../data/projects.repository.cjs'));
const router = (0, express_1.Router)({ mergeParams: true });
// ================================================================
// GET /api/campaigns/:campaignId/projects
// Get all projects for a campaign (with hierarchy)
// ================================================================
router.get('/', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const campaign_id = parseInt(req.params.campaignId);
    const includeDeleted = req.query.includeDeleted === 'true';
    const includeCompleted = req.query.includeCompleted !== 'false'; // Default true
    const flat = req.query.flat === 'true';
    if (isNaN(campaign_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid campaign ID');
    }
    const projects = await projectLogic.getCampaignProjects(campaign_id, user.id, user.is_admin, { includeDeleted, includeCompleted, flat });
    res.json({
        count: projects.length,
        projects: projects.map(serializeProject)
    });
}));
// ================================================================
// GET /api/campaigns/:campaignId/projects/:projectId
// Get a specific project by ID
// ================================================================
router.get('/:projectId', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const campaign_id = parseInt(req.params.campaignId);
    const project_id = parseInt(req.params.projectId);
    const includeHistory = req.query.includeHistory === 'true';
    const includeChildren = req.query.includeChildren === 'true';
    if (isNaN(campaign_id) || isNaN(project_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid campaign or project ID');
    }
    // Check view permission
    const canView = await projectLogic.canUserViewProject(user.id, project_id, user.is_admin);
    if (!canView) {
        throw (0, errorHandler_1.createError)(404, 'Project not found or access denied');
    }
    const project = await projectsRepo.findById(project_id);
    if (!project || project.campaign_id !== campaign_id) {
        throw (0, errorHandler_1.createError)(404, 'Project not found');
    }
    const serialized = serializeProject(project);
    // Include history if requested
    if (includeHistory) {
        const history = await projectsRepo.getHistory(project_id);
        serialized.history = history;
    }
    // Include children if requested
    if (includeChildren) {
        const descendants = await projectsRepo.getDescendants(project_id);
        serialized.children = descendants.map(serializeProject);
    }
    // Always include aggregate progress
    const aggregateProgress = await projectLogic.calculateAggregateProgress(project_id);
    serialized.aggregate_progress = aggregateProgress;
    res.json(serialized);
}));
// ================================================================
// POST /api/campaigns/:campaignId/projects
// Create a new project
// ================================================================
router.post('/', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const campaign_id = parseInt(req.params.campaignId);
    const { name, description, goalPoints, currentPoints, parentProjectId, characterId } = req.body;
    if (isNaN(campaign_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid campaign ID');
    }
    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw (0, errorHandler_1.createError)(400, 'Project name is required');
    }
    if (!characterId || typeof characterId !== 'number') {
        throw (0, errorHandler_1.createError)(400, 'Character ID is required');
    }
    if (!goalPoints || typeof goalPoints !== 'number' || goalPoints <= 0) {
        throw (0, errorHandler_1.createError)(400, 'Goal points must be a positive number');
    }
    if (currentPoints !== undefined && (typeof currentPoints !== 'number' || currentPoints < 0)) {
        throw (0, errorHandler_1.createError)(400, 'Current points must be a non-negative number');
    }
    if (currentPoints !== undefined && currentPoints > goalPoints) {
        throw (0, errorHandler_1.createError)(400, 'Current points cannot exceed goal points');
    }
    // Check permission to create for this character
    const canCreate = await projectLogic.canUserCreateProject(user.id, characterId, user.is_admin);
    if (!canCreate) {
        throw (0, errorHandler_1.createError)(403, 'You do not have permission to create projects for this character');
    }
    // Validate hierarchy if parent specified
    if (parentProjectId) {
        const validation = await projectLogic.validateProjectHierarchy(null, parentProjectId, campaign_id);
        if (!validation.valid) {
            throw (0, errorHandler_1.createError)(400, validation.error || 'Invalid project hierarchy');
        }
    }
    // Create project
    const project = await projectsRepo.create({
        campaign_id,
        parent_project_id: parentProjectId || null,
        character_id: characterId,
        name: name.trim(),
        description: description || null,
        goal_points: goalPoints,
        current_points: currentPoints || 0,
        created_by_user_id: user.id
    });
    // Create history entry
    await projectsRepo.createHistoryEntry({
        project_id: project.id,
        user_id: user.id,
        action: 'created',
        notes: 'Project created'
    });
    res.status(201).json(serializeProject(project));
}));
// ================================================================
// PUT /api/campaigns/:campaignId/projects/:projectId
// Update a project
// ================================================================
router.put('/:projectId', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const campaign_id = parseInt(req.params.campaignId);
    const project_id = parseInt(req.params.projectId);
    const { name, description, goalPoints, parentProjectId } = req.body;
    if (isNaN(campaign_id) || isNaN(project_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid campaign or project ID');
    }
    // Check edit permission
    const canEdit = await projectLogic.canUserEditProject(user.id, project_id, user.is_admin);
    if (!canEdit) {
        throw (0, errorHandler_1.createError)(403, 'You do not have permission to edit this project');
    }
    // Validate hierarchy if parent is being changed
    if (parentProjectId !== undefined) {
        const validation = await projectLogic.validateProjectHierarchy(project_id, parentProjectId, campaign_id);
        if (!validation.valid) {
            throw (0, errorHandler_1.createError)(400, validation.error || 'Invalid project hierarchy');
        }
    }
    // Build update data
    const updateData = {};
    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            throw (0, errorHandler_1.createError)(400, 'Project name cannot be empty');
        }
        updateData.name = name.trim();
    }
    if (description !== undefined) {
        updateData.description = description;
    }
    if (goalPoints !== undefined) {
        if (typeof goalPoints !== 'number' || goalPoints <= 0) {
            throw (0, errorHandler_1.createError)(400, 'Goal points must be a positive number');
        }
        updateData.goal_points = goalPoints;
    }
    if (parentProjectId !== undefined) {
        updateData.parent_project_id = parentProjectId;
    }
    const updated = await projectsRepo.update(project_id, updateData);
    if (!updated) {
        throw (0, errorHandler_1.createError)(404, 'Project not found');
    }
    // Create history if goal was updated
    if (goalPoints !== undefined) {
        await projectsRepo.createHistoryEntry({
            project_id,
            user_id: user.id,
            action: 'updated_goal',
            notes: 'Goal points updated'
        });
    }
    res.json(serializeProject(updated));
}));
// ================================================================
// PATCH /api/campaigns/:campaignId/projects/:projectId/progress
// Update project progress
// ================================================================
router.patch('/:projectId/progress', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const campaign_id = parseInt(req.params.campaignId);
    const project_id = parseInt(req.params.projectId);
    const { currentPoints, incrementBy, notes } = req.body;
    if (isNaN(campaign_id) || isNaN(project_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid campaign or project ID');
    }
    // Check edit permission
    const canEdit = await projectLogic.canUserEditProject(user.id, project_id, user.is_admin);
    if (!canEdit) {
        throw (0, errorHandler_1.createError)(403, 'You do not have permission to update this project');
    }
    // Determine if increment or absolute
    let newPoints;
    let isIncrement;
    if (currentPoints !== undefined) {
        if (typeof currentPoints !== 'number' || currentPoints < 0) {
            throw (0, errorHandler_1.createError)(400, 'Current points must be a non-negative number');
        }
        newPoints = currentPoints;
        isIncrement = false;
    }
    else if (incrementBy !== undefined) {
        if (typeof incrementBy !== 'number') {
            throw (0, errorHandler_1.createError)(400, 'Increment value must be a number');
        }
        newPoints = incrementBy;
        isIncrement = true;
    }
    else {
        throw (0, errorHandler_1.createError)(400, 'Either currentPoints or incrementBy must be provided');
    }
    // Update progress
    const updated = await projectLogic.updateProjectProgress(project_id, user.id, newPoints, isIncrement, notes);
    if (!updated) {
        throw (0, errorHandler_1.createError)(404, 'Project not found');
    }
    // Check auto-complete
    await projectLogic.checkAutoComplete(project_id);
    res.json(serializeProject(updated));
}));
// ================================================================
// POST /api/campaigns/:campaignId/projects/:projectId/complete
// Mark project as completed
// ================================================================
router.post('/:projectId/complete', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const campaign_id = parseInt(req.params.campaignId);
    const project_id = parseInt(req.params.projectId);
    const { notes } = req.body;
    if (isNaN(campaign_id) || isNaN(project_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid campaign or project ID');
    }
    // Check edit permission
    const canEdit = await projectLogic.canUserEditProject(user.id, project_id, user.is_admin);
    if (!canEdit) {
        throw (0, errorHandler_1.createError)(403, 'You do not have permission to complete this project');
    }
    const updated = await projectsRepo.update(project_id, {
        is_completed: true,
        completed_at: new Date()
    });
    if (!updated) {
        throw (0, errorHandler_1.createError)(404, 'Project not found');
    }
    // Create history entry
    await projectsRepo.createHistoryEntry({
        project_id,
        user_id: user.id,
        action: 'completed',
        notes: notes || 'Project marked as completed'
    });
    res.json(serializeProject(updated));
}));
// ================================================================
// DELETE /api/campaigns/:campaignId/projects/:projectId
// Soft delete a project
// ================================================================
router.delete('/:projectId', authMiddleware_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const campaign_id = parseInt(req.params.campaignId);
    const project_id = parseInt(req.params.projectId);
    if (isNaN(campaign_id) || isNaN(project_id)) {
        throw (0, errorHandler_1.createError)(400, 'Invalid campaign or project ID');
    }
    // Check edit permission
    const canEdit = await projectLogic.canUserEditProject(user.id, project_id, user.is_admin);
    if (!canEdit) {
        throw (0, errorHandler_1.createError)(403, 'You do not have permission to delete this project');
    }
    const deleted = await projectsRepo.softDelete(project_id);
    if (!deleted) {
        throw (0, errorHandler_1.createError)(404, 'Project not found');
    }
    // Create history entry
    await projectsRepo.createHistoryEntry({
        project_id,
        user_id: user.id,
        action: 'deleted',
        notes: 'Project deleted'
    });
    res.status(204).send();
}));
// ================================================================
// Helper Functions
// ================================================================
function serializeProject(project) {
    return {
        id: project.id,
        campaignId: project.campaign_id,
        parentProjectId: project.parent_project_id,
        characterId: project.character_id,
        characterName: project.character_name,
        name: project.name,
        description: project.description,
        goalPoints: project.goal_points,
        currentPoints: project.current_points,
        progressPercentage: project.goal_points > 0
            ? Math.round((project.current_points / project.goal_points) * 100)
            : 0,
        isCompleted: Boolean(project.is_completed),
        isDeleted: Boolean(project.is_deleted),
        createdBy: {
            id: project.created_by_user_id,
            email: project.creator_email,
            displayName: project.creator_display_name
        },
        createdAt: project.created_at.toISOString(),
        updatedAt: project.updated_at.toISOString(),
        completedAt: project.completed_at ? project.completed_at.toISOString() : null
    };
}
exports.default = router;
//# sourceMappingURL=project.routes.js.map