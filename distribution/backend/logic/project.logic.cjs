"use strict";
/**
 * Project Business Logic
 *
 * Handles campaign project management, permission checks, and business rules.
 *
 * References:
 * - DESIGN_CAMPAIGN_PROJECTS.md: Complete feature specification
 * - PLANNING.md: Campaign projects overview and business rules
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
exports.canUserCreateProject = canUserCreateProject;
exports.canUserEditProject = canUserEditProject;
exports.canUserViewProject = canUserViewProject;
exports.getCampaignProjects = getCampaignProjects;
exports.buildProjectTree = buildProjectTree;
exports.calculateAggregateProgress = calculateAggregateProgress;
exports.validateProjectHierarchy = validateProjectHierarchy;
exports.updateProjectProgress = updateProjectProgress;
exports.checkAutoComplete = checkAutoComplete;
const projectsRepo = __importStar(require('../data/projects.repository.cjs'));
const campaignsRepo = __importStar(require('../data/campaigns.repository.cjs'));
const charactersRepo = __importStar(require('../data/characters.repository.cjs'));
/**
 * Permission check: Can user create a project for a character?
 *
 * Rules:
 * - Admins: Can create for any character
 * - GMs: Can create for any character in their campaigns
 * - Players: Can create for their own characters only
 *
 * @param user_id User ID
 * @param character_id Character ID
 * @param is_admin Is user an admin
 * @returns True if user can create project
 */
async function canUserCreateProject(user_id, character_id, is_admin) {
    // Admins can create for anyone
    if (is_admin) {
        return true;
    }
    // Get character
    const character = await charactersRepo.findById(character_id);
    if (!character) {
        return false;
    }
    // Players can only create for their own characters
    if (character.owner_user_id === user_id) {
        return true;
    }
    // GMs can create for characters in their campaigns
    if (character.campaign_id) {
        const isGM = await campaignsRepo.isGM(character.campaign_id, user_id);
        return isGM;
    }
    return false;
}
/**
 * Permission check: Can user edit a project?
 *
 * Rules:
 * - Admins: Can edit any project
 * - GMs: Can edit projects in their campaigns
 * - Players: Can edit projects for their own characters only
 *
 * @param user_id User ID
 * @param project_id Project ID
 * @param is_admin Is user an admin
 * @returns True if user can edit project
 */
async function canUserEditProject(user_id, project_id, is_admin) {
    // Admins can edit anything
    if (is_admin) {
        return true;
    }
    // Get project
    const project = await projectsRepo.findById(project_id);
    if (!project) {
        return false;
    }
    // Get character
    const character = await charactersRepo.findById(project.character_id);
    if (!character) {
        return false;
    }
    // Players can only edit their own character's projects
    if (character.owner_user_id === user_id) {
        return true;
    }
    // GMs can edit projects in their campaigns
    const isGM = await campaignsRepo.isGM(project.campaign_id, user_id);
    return isGM;
}
/**
 * Permission check: Can user view a project?
 *
 * Rules:
 * - Admins: Can view any project
 * - Campaign members (GM or player): Can view projects in their campaigns
 *
 * @param user_id User ID
 * @param project_id Project ID
 * @param is_admin Is user an admin
 * @returns True if user can view project
 */
async function canUserViewProject(user_id, project_id, is_admin) {
    // Admins can view anything
    if (is_admin) {
        return true;
    }
    // Get project
    const project = await projectsRepo.findById(project_id);
    if (!project) {
        return false;
    }
    // Campaign members can view
    const isMember = await campaignsRepo.isMember(project.campaign_id, user_id);
    return isMember;
}
/**
 * Get all projects for a campaign with hierarchy
 *
 * @param campaign_id Campaign ID
 * @param user_id Requesting user ID
 * @param is_admin Is user an admin
 * @param options Query options
 * @returns Array of projects (hierarchical if not flat)
 */
async function getCampaignProjects(campaign_id, user_id, is_admin, options = {}) {
    // Check access: must be campaign member
    const isMember = await campaignsRepo.isMember(campaign_id, user_id);
    if (!isMember && !is_admin) {
        console.log(`[PROJECT LOGIC] ❌ Access denied: User ${user_id} is not a member of campaign ${campaign_id}`);
        return [];
    }
    // Get all projects
    const projects = await projectsRepo.findByCampaign(campaign_id, options.includeDeleted || false);
    // Filter by completion if needed
    let filtered = projects;
    if (options.includeCompleted === false) {
        filtered = projects.filter((p) => !p.is_completed);
    }
    // Return flat list if requested
    if (options.flat) {
        return filtered;
    }
    // Build hierarchy
    return buildProjectTree(filtered);
}
/**
 * Build hierarchical tree from flat project list
 *
 * @param projects Flat array of projects
 * @returns Hierarchical tree structure
 */
function buildProjectTree(projects) {
    const projectMap = new Map();
    const rootProjects = [];
    // Create map of all projects
    projects.forEach((project) => {
        projectMap.set(project.id, { ...project, children: [] });
    });
    // Build tree structure
    projects.forEach((project) => {
        const node = projectMap.get(project.id);
        if (project.parent_project_id === null) {
            // Root level project
            rootProjects.push(node);
        }
        else {
            // Child project
            const parent = projectMap.get(project.parent_project_id);
            if (parent) {
                parent.children = parent.children || [];
                parent.children.push(node);
            }
            else {
                // Orphaned project (parent deleted) - treat as root
                rootProjects.push(node);
            }
        }
    });
    return rootProjects;
}
/**
 * Calculate aggregate progress for a project (sum of all descendants)
 *
 * @param project_id Project ID
 * @returns Aggregate progress data
 */
async function calculateAggregateProgress(project_id) {
    // Get project
    const project = await projectsRepo.findById(project_id);
    if (!project) {
        throw new Error(`Project not found: ${project_id}`);
    }
    // Get all descendants
    const descendants = await projectsRepo.getDescendants(project_id);
    // Calculate totals (include self)
    let total_goal = project.goal_points;
    let total_current = project.current_points;
    descendants.forEach((desc) => {
        total_goal += desc.goal_points;
        total_current += desc.current_points;
    });
    const total_percentage = total_goal > 0 ? Math.round((total_current / total_goal) * 100) : 0;
    return {
        total_goal_points: total_goal,
        total_current_points: total_current,
        total_percentage
    };
}
/**
 * Validate project hierarchy (prevent circular references, max depth)
 *
 * @param project_id Project ID (or null for new project)
 * @param new_parent_id New parent project ID
 * @param campaign_id Campaign ID
 * @returns Validation result with error message if invalid
 */
async function validateProjectHierarchy(project_id, new_parent_id, campaign_id) {
    // No parent = always valid
    if (!new_parent_id) {
        return { valid: true };
    }
    // Get parent project
    const parent = await projectsRepo.findById(new_parent_id);
    if (!parent) {
        return { valid: false, error: 'Parent project not found' };
    }
    // Parent must be in same campaign
    if (parent.campaign_id !== campaign_id) {
        return { valid: false, error: 'Parent project must be in same campaign' };
    }
    // Cannot be own parent
    if (project_id && project_id === new_parent_id) {
        return { valid: false, error: 'Project cannot be its own parent' };
    }
    // Check if project_id is in parent's ancestor chain (circular reference)
    if (project_id) {
        const ancestors = await projectsRepo.getAncestors(new_parent_id);
        const isCircular = ancestors.some((ancestor) => ancestor.id === project_id);
        if (isCircular) {
            return { valid: false, error: 'Circular reference detected: project cannot be parent of its ancestor' };
        }
    }
    // Check max depth (recommend 3 levels, allow 5 max)
    const depth = await projectsRepo.getProjectDepth(new_parent_id);
    if (depth >= 5) {
        return { valid: false, error: 'Maximum project depth exceeded (5 levels)' };
    }
    return { valid: true };
}
/**
 * Update project progress with history tracking
 *
 * @param project_id Project ID
 * @param user_id User making the update
 * @param new_points New progress value (or increment)
 * @param is_increment If true, add to current; if false, set absolute value
 * @param notes Optional notes for history
 * @returns Updated project
 */
async function updateProjectProgress(project_id, user_id, new_points, is_increment = false, notes) {
    // Get current project
    const project = await projectsRepo.findById(project_id);
    if (!project) {
        return null;
    }
    const previous_points = project.current_points;
    const updated_points = is_increment ? previous_points + new_points : new_points;
    // Validate: cannot exceed goal
    if (updated_points > project.goal_points) {
        throw new Error(`Progress (${updated_points}) cannot exceed goal (${project.goal_points})`);
    }
    // Update progress
    const updated = await projectsRepo.updateProgress(project_id, updated_points);
    // Create history entry
    await projectsRepo.createHistoryEntry({
        project_id,
        user_id,
        action: 'updated_progress',
        previous_points,
        new_points: updated_points,
        notes
    });
    return updated;
}
/**
 * Auto-complete project when goal reached
 *
 * @param project_id Project ID
 * @returns True if project was completed
 */
async function checkAutoComplete(project_id) {
    const project = await projectsRepo.findById(project_id);
    if (!project) {
        return false;
    }
    // Already completed
    if (project.is_completed) {
        return false;
    }
    // Goal reached
    if (project.current_points >= project.goal_points) {
        await projectsRepo.update(project_id, {
            is_completed: true,
            completed_at: new Date()
        });
        console.log(`[PROJECT LOGIC] ✅ Auto-completed project: ${project.name} (ID: ${project_id})`);
        return true;
    }
    return false;
}
//# sourceMappingURL=project.logic.js.map