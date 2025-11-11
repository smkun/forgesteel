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
