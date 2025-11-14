/**
 * Campaign Model
 *
 * Campaigns group characters together with GM assignments.
 * GMs can edit all characters in their campaigns.
 * Players can view other characters in their campaigns.
 *
 * References:
 * - db/migrations/001_add_campaigns.sql: Database schema
 * - server/data/campaigns.repository.ts: Backend repository
 */

/**
 * Campaign database record
 */
export interface Campaign {
	id: number;
	name: string;
	description: string | null;
	created_by_user_id: number;
	is_deleted: boolean;
	created_at: string;
	updated_at: string;
	creator_email?: string | null;
	creator_display_name?: string | null;
	user_role?: 'gm' | 'player'; // Current user's role in this campaign
}

/**
 * Campaign member record
 */
export interface CampaignMember {
	id: number;
	campaign_id: number;
	user_id: number;
	role: 'gm' | 'player';
	joined_at: string;
	email?: string;
	display_name?: string | null;
}

/**
 * Data for creating a new campaign
 */
export interface CreateCampaignData {
	name: string;
	description?: string | null;
	gm_user_id?: number; // Optional: assign a different user as GM (otherwise creator becomes GM)
}

/**
 * Data for updating an existing campaign
 */
export interface UpdateCampaignData {
	name?: string;
	description?: string | null;
}

/**
 * Campaign with members
 */
export interface CampaignWithMembers extends Campaign {
	members?: CampaignMember[];
	gms?: CampaignMember[];
}

// ================================================================
// Campaign Projects
// ================================================================

/**
 * User summary for project ownership
 */
export interface UserSummary {
	id: number;
	email: string | null;
	displayName: string | null;
}

/**
 * Campaign Project
 */
export interface CampaignProject {
	id: number;
	campaignId: number;
	parentProjectId: number | null;
	characterId: number;
	characterName: string; // Name of character who started the project
	name: string;
	description: string | null;
	goalPoints: number;
	currentPoints: number;
	progressPercentage: number;
	isCompleted: boolean;
	isDeleted: boolean;
	createdBy: UserSummary;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;
	children?: CampaignProject[]; // Child projects (for hierarchy)
	aggregateProgress?: AggregateProgress;
}

/**
 * Aggregate progress for parent projects
 */
export interface AggregateProgress {
	totalGoalPoints: number;
	totalCurrentPoints: number;
	totalPercentage: number;
}

/**
 * Project history entry
 */
export interface ProjectHistoryEntry {
	id: number;
	projectId: number;
	userId: number;
	userEmail: string | null;
	userDisplayName: string | null;
	action: 'created' | 'updated_progress' | 'updated_goal' | 'completed' | 'deleted';
	previousPoints: number | null;
	newPoints: number | null;
	notes: string | null;
	createdAt: string;
}

/**
 * Data for creating a new project
 */
export interface CreateProjectRequest {
	name: string;
	description?: string | null;
	goalPoints: number;
	currentPoints?: number;
	parentProjectId?: number | null;
	characterId: number; // REQUIRED: Character who started project (set once, cannot change)
}

/**
 * Data for updating an existing project
 */
export interface UpdateProjectRequest {
	name?: string;
	description?: string | null;
	goalPoints?: number;
	parentProjectId?: number | null;
	// Note: characterId is intentionally excluded - it's immutable
}

/**
 * Data for updating project progress
 */
export interface UpdateProgressRequest {
	currentPoints?: number; // Absolute value
	incrementBy?: number; // Increment by this amount
	notes?: string;
}

/**
 * Data for completing a project
 */
export interface CompleteProjectRequest {
	notes?: string;
}
