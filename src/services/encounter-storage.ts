/**
 * Encounter Storage Service
 *
 * Manages encounter storage with campaign-based backend sync.
 * When user is a GM of a campaign, encounters can be synced to the backend
 * for access from any device.
 *
 * Storage Strategy:
 * - Local encounters: Always stored in LocalForage (playbook)
 * - Campaign encounters: Synced to backend when user is GM
 * - Merge on load: Campaign encounters are merged with local encounters
 */

import { Encounter } from '@/models/encounter';
import { Playbook } from '@/models/playbook';
import * as api from './api';
import { isSignedIn } from './firebase';

// Cache for campaign encounters (campaign_id -> encounters)
const campaignEncounterCache = new Map<number, api.CampaignEncounterResponse[]>();

// Track which encounters have been synced (encounter UUID -> database ID)
const syncedEncounterMap = new Map<string, { dbId: number; campaignId: number }>();

/**
 * Check if backend sync is available (user is signed in)
 */
export function isSyncAvailable(): boolean {
	return isSignedIn();
}

/**
 * Get all encounters for a campaign from the backend
 */
export async function getCampaignEncounters(campaignId: number): Promise<Encounter[]> {
	if (!isSyncAvailable()) {
		return [];
	}

	try {
		const encounters = await api.getCampaignEncounters(campaignId);

		// Update cache
		campaignEncounterCache.set(campaignId, encounters);

		// Update sync map
		encounters.forEach(enc => {
			syncedEncounterMap.set(enc.encounter_uuid, {
				dbId: enc.id,
				campaignId: enc.campaign_id
			});
		});

		return encounters.map(enc => enc.encounter);
	} catch (error) {
		console.error('[ENCOUNTER STORAGE] Failed to fetch campaign encounters:', error);
		return [];
	}
}

/**
 * Sync a local encounter to a campaign
 */
export async function syncEncounterToCampaign(
	campaignId: number,
	encounter: Encounter
): Promise<api.CampaignEncounterResponse | null> {
	if (!isSyncAvailable()) {
		console.warn('[ENCOUNTER STORAGE] Cannot sync - not signed in');
		return null;
	}

	try {
		// Check if already synced
		const existing = syncedEncounterMap.get(encounter.id);

		if (existing && existing.campaignId === campaignId) {
			// Update existing
			const updated = await api.updateCampaignEncounter(campaignId, existing.dbId, encounter);
			updateCache(campaignId, updated);
			console.log('[ENCOUNTER STORAGE] Updated synced encounter:', encounter.name || encounter.id);
			return updated;
		} else {
			// Create new
			const created = await api.createCampaignEncounter(campaignId, encounter);
			updateCache(campaignId, created);
			syncedEncounterMap.set(encounter.id, {
				dbId: created.id,
				campaignId: created.campaign_id
			});
			console.log('[ENCOUNTER STORAGE] Created synced encounter:', encounter.name || encounter.id);
			return created;
		}
	} catch (error) {
		console.error('[ENCOUNTER STORAGE] Failed to sync encounter:', error);
		return null;
	}
}

/**
 * Remove an encounter from campaign sync
 */
export async function unsyncEncounterFromCampaign(
	campaignId: number,
	encounterId: string
): Promise<boolean> {
	if (!isSyncAvailable()) {
		return false;
	}

	const syncInfo = syncedEncounterMap.get(encounterId);
	if (!syncInfo || syncInfo.campaignId !== campaignId) {
		return false;
	}

	try {
		await api.deleteCampaignEncounter(campaignId, syncInfo.dbId);
		removeFromCache(campaignId, syncInfo.dbId);
		syncedEncounterMap.delete(encounterId);
		console.log('[ENCOUNTER STORAGE] Unsynced encounter:', encounterId);
		return true;
	} catch (error) {
		console.error('[ENCOUNTER STORAGE] Failed to unsync encounter:', error);
		return false;
	}
}

/**
 * Check if an encounter is synced to a campaign
 */
export function isEncounterSynced(encounterId: string): boolean {
	return syncedEncounterMap.has(encounterId);
}

/**
 * Get sync info for an encounter
 */
export function getEncounterSyncInfo(encounterId: string): { dbId: number; campaignId: number } | null {
	return syncedEncounterMap.get(encounterId) || null;
}

/**
 * Merge campaign encounters into local playbook
 * Returns a new playbook with merged encounters (doesn't modify original)
 */
export async function mergeWithCampaignEncounters(
	playbook: Playbook,
	campaignId: number
): Promise<Playbook> {
	if (!isSyncAvailable()) {
		return playbook;
	}

	try {
		const campaignEncounters = await getCampaignEncounters(campaignId);

		// Get IDs of local encounters
		const localEncounterIds = new Set(playbook.encounters.map(e => e.id));

		// Find encounters from campaign that aren't in local
		const newEncounters = campaignEncounters.filter(e => !localEncounterIds.has(e.id));

		if (newEncounters.length === 0) {
			return playbook;
		}

		// Return merged playbook
		return {
			...playbook,
			encounters: [...playbook.encounters, ...newEncounters]
		};
	} catch (error) {
		console.error('[ENCOUNTER STORAGE] Failed to merge campaign encounters:', error);
		return playbook;
	}
}

/**
 * Sync all local encounters to a campaign
 * Useful for initial bulk sync
 */
export async function syncAllEncountersToCampaign(
	playbook: Playbook,
	campaignId: number
): Promise<{ synced: number; errors: number }> {
	if (!isSyncAvailable()) {
		return { synced: 0, errors: 0 };
	}

	let synced = 0;
	let errors = 0;

	for (const encounter of playbook.encounters) {
		try {
			await syncEncounterToCampaign(campaignId, encounter);
			synced++;
		} catch (error) {
			console.error('[ENCOUNTER STORAGE] Failed to sync encounter:', encounter.name || encounter.id, error);
			errors++;
		}
	}

	return { synced, errors };
}

/**
 * Clear the encounter cache
 */
export function clearCache(): void {
	campaignEncounterCache.clear();
	syncedEncounterMap.clear();
}

/**
 * Refresh cache for a specific campaign
 */
export async function refreshCampaignCache(campaignId: number): Promise<void> {
	campaignEncounterCache.delete(campaignId);

	// Remove sync entries for this campaign
	for (const [encounterId, info] of syncedEncounterMap.entries()) {
		if (info.campaignId === campaignId) {
			syncedEncounterMap.delete(encounterId);
		}
	}

	// Reload
	await getCampaignEncounters(campaignId);
}

// Internal cache helpers
function updateCache(campaignId: number, encounter: api.CampaignEncounterResponse): void {
	const cached = campaignEncounterCache.get(campaignId) || [];
	const idx = cached.findIndex(e => e.id === encounter.id);
	if (idx >= 0) {
		cached[idx] = encounter;
	} else {
		cached.push(encounter);
	}
	campaignEncounterCache.set(campaignId, cached);
}

function removeFromCache(campaignId: number, dbId: number): void {
	const cached = campaignEncounterCache.get(campaignId) || [];
	const filtered = cached.filter(e => e.id !== dbId);
	campaignEncounterCache.set(campaignId, filtered);
}

/**
 * Get cached campaign encounters (for quick access without API call)
 */
export function getCachedCampaignEncounters(campaignId: number): api.CampaignEncounterResponse[] {
	return campaignEncounterCache.get(campaignId) || [];
}

/**
 * Get all synced encounter IDs
 */
export function getAllSyncedEncounterIds(): string[] {
	return Array.from(syncedEncounterMap.keys());
}
