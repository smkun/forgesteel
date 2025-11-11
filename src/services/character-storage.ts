import { Hero } from '@/models/hero';
import LocalForage from 'localforage';
import * as api from './api';
import { getCurrentUser, isSignedIn } from './firebase';
import { Utils } from '@/utils/utils';

const LOCALFORAGE_NAMESPACE = 'forgesteel-heroes';
const LEGACY_LOCALFORAGE_KEY = 'forgesteel-heroes';
const GUEST_LOCALFORAGE_KEY = `${LOCALFORAGE_NAMESPACE}:guest`;
const apiCharacterCache = new Map<string, api.CharacterResponse>();
let currentUserIsAdmin = false;

interface GetAllCharactersOptions {
	adminScope?: 'all' | 'user';
}

function getLocalForageKey(): string {
	const user = getCurrentUser();
	if (user?.uid) {
		return `${LOCALFORAGE_NAMESPACE}:${user.uid}`;
	}
	return GUEST_LOCALFORAGE_KEY;
}

async function migrateLegacyHeroes(targetKey: string): Promise<Hero[] | null> {
	if (targetKey === LEGACY_LOCALFORAGE_KEY) {
		return null;
	}
	try {
		const legacyHeroes = await LocalForage.getItem<Hero[]>(LEGACY_LOCALFORAGE_KEY);
		if (legacyHeroes && legacyHeroes.length > 0) {
			await LocalForage.setItem(targetKey, legacyHeroes);
			await LocalForage.removeItem(LEGACY_LOCALFORAGE_KEY);
			return legacyHeroes;
		}
	} catch (error) {
		console.error('[STORAGE] ❌ Failed to migrate legacy heroes:', error);
	}
	return null;
}

async function adoptGuestHeroes(targetKey: string): Promise<Hero[] | null> {
	if (targetKey === GUEST_LOCALFORAGE_KEY) {
		return null;
	}
	try {
		const guestHeroes = await LocalForage.getItem<Hero[]>(GUEST_LOCALFORAGE_KEY);
		if (guestHeroes && guestHeroes.length > 0) {
			await LocalForage.setItem(targetKey, guestHeroes);
			await LocalForage.removeItem(GUEST_LOCALFORAGE_KEY);
			return guestHeroes;
		}
	} catch (error) {
		console.error('[STORAGE] ❌ Failed to adopt guest heroes:', error);
	}
	return null;
}

export enum StorageMode {
	API = 'api',
	LOCAL = 'local'
}

export function getStorageMode(): StorageMode {
	return isSignedIn() ? StorageMode.API : StorageMode.LOCAL;
}

export async function getAllCharacters(options: GetAllCharactersOptions = {}): Promise<Hero[]> {
	const mode = getStorageMode();
	if (mode === StorageMode.API) {
		try {
			const characters = await api.getCharacters({ scope: options.adminScope === 'all' ? 'all' : undefined });
			replaceApiCache(characters);
			return characters.map(char => char.hero);
		} catch (error) {
			console.error('[STORAGE] ❌ API failed, falling back to LocalForage:', error);
			return getLocalCharacters();
		}
	}
	return getLocalCharacters();
}

export async function getCharacter(heroId: string): Promise<Hero | null> {
	const heroes = await getAllCharacters();
	return heroes.find(h => h.id === heroId) || null;
}

export async function saveCharacter(hero: Hero): Promise<Hero> {
	const mode = getStorageMode();
	if (mode === StorageMode.API) {
		try {
			let record = apiCharacterCache.get(hero.id);
			if (!record) {
				const fetched = await api.getCharacters(currentUserIsAdmin ? { scope: 'all' } : {});
				replaceApiCache(fetched);
				record = apiCharacterCache.get(hero.id);
			}
			if (record) {
				const updated = await api.updateCharacter(record.id, hero);
				upsertApiCache(updated);
				return updated.hero;
			}
			const created = await api.createCharacter(hero);
			upsertApiCache(created);
			return created.hero;
		} catch (error) {
			console.error('[STORAGE] ❌ API failed, falling back to LocalForage:', error);
			return saveLocalCharacter(hero);
		}
	}
	return saveLocalCharacter(hero);
}

export async function deleteCharacter(heroId: string): Promise<void> {
	const mode = getStorageMode();
	if (mode === StorageMode.API) {
		try {
			let record = apiCharacterCache.get(heroId);
			if (!record) {
				const fetched = await api.getCharacters(currentUserIsAdmin ? { scope: 'all' } : {});
				replaceApiCache(fetched);
				record = apiCharacterCache.get(heroId);
			}
			if (record) {
				await api.deleteCharacter(record.id);
				removeFromApiCache(heroId);
				return;
			}
		} catch (error) {
			console.error('[STORAGE] ❌ API failed, falling back to LocalForage:', error);
		}
	}
	const heroes = await getLocalCharacters();
	const filtered = heroes.filter(h => h.id !== heroId);
	const key = getLocalForageKey();
	await LocalForage.setItem(key, filtered);
}

async function getLocalCharacters(): Promise<Hero[]> {
	try {
		const key = getLocalForageKey();
		const heroes = await LocalForage.getItem<Hero[]>(key);
		if (heroes && heroes.length > 0) {
			return heroes;
		}
		const migrated = await migrateLegacyHeroes(key);
		if (migrated) {
			return migrated;
		}
		const adopted = await adoptGuestHeroes(key);
		if (adopted) {
			return adopted;
		}
		return [];
	} catch (error) {
		console.error('[STORAGE] ❌ Failed to load from LocalForage:', error);
		return [];
	}
}

async function saveLocalCharacter(hero: Hero): Promise<Hero> {
	const heroes = await getLocalCharacters();
	const idx = heroes.findIndex(h => h.id === hero.id);
	if (idx >= 0) {
		heroes[idx] = hero;
	} else {
		heroes.push(hero);
	}
	const key = getLocalForageKey();
	await LocalForage.setItem(key, heroes);
	return hero;
}

export async function setLocalCharacters(heroes: Hero[]): Promise<void> {
	const key = getLocalForageKey();
	await LocalForage.setItem(key, heroes);
}

export async function setGuestCharacters(heroes: Hero[]): Promise<void> {
	await LocalForage.setItem(GUEST_LOCALFORAGE_KEY, heroes);
}

export async function getGuestCharacters(): Promise<Hero[]> {
	try {
		const heroes = await LocalForage.getItem<Hero[]>(GUEST_LOCALFORAGE_KEY);
		return heroes || [];
	} catch (error) {
		console.error('[STORAGE] ❌ Failed to load guest heroes:', error);
		return [];
	}
}

export async function migrateToBackend(): Promise<{ migrated: number; errors: number }> {
	if (!isSignedIn()) {
		return { migrated: 0, errors: 0 };
	}
	try {
		const localHeroes = await getGuestCharacters();
		if (localHeroes.length === 0) {
			return { migrated: 0, errors: 0 };
		}
		const backendCharacters = await api.getCharacters();
		const backendHeroIds = new Set(backendCharacters.map(c => c.hero.id));
		let migrated = 0;
		let errors = 0;
		const remaining: Hero[] = [];
		for (const hero of localHeroes) {
			try {
				let heroToCreate = { ...hero };
				while (backendHeroIds.has(heroToCreate.id)) {
					heroToCreate = { ...heroToCreate, id: Utils.guid() };
				}
				await api.createCharacter(heroToCreate);
				backendHeroIds.add(heroToCreate.id);
				migrated++;
			} catch (error) {
				console.error('[STORAGE] ❌ Failed to migrate', hero.name || hero.id, error);
				errors++;
				remaining.push(hero);
			}
		}
		await setGuestCharacters(remaining);
		return { migrated, errors };
	} catch (error) {
		console.error('[STORAGE] ❌ Migration failed:', error);
		return { migrated: 0, errors: 1 };
	}
}

export async function clearLocalStorage(): Promise<void> {
	const key = getLocalForageKey();
	await LocalForage.removeItem(key);
	if (key !== LEGACY_LOCALFORAGE_KEY) {
		await LocalForage.removeItem(LEGACY_LOCALFORAGE_KEY);
	}
}

export async function needsMigration(): Promise<boolean> {
	if (!isSignedIn()) {
		return false;
	}
	const localHeroes = await getGuestCharacters();
	return localHeroes.length > 0;
}

export function setAdminMode(isAdmin: boolean): void {
	currentUserIsAdmin = isAdmin;
}

export function clearApiCache(): void {
	apiCharacterCache.clear();
}

function replaceApiCache(characters: api.CharacterResponse[]) {
	apiCharacterCache.clear();
	characters.forEach(character => {
		apiCharacterCache.set(character.hero.id, character);
	});
}

function upsertApiCache(character: api.CharacterResponse) {
	apiCharacterCache.set(character.hero.id, character);
}

function removeFromApiCache(heroId: string) {
	apiCharacterCache.delete(heroId);
}

export async function getCharacterRecord(heroId: string): Promise<api.CharacterResponse | null> {
	const cached = apiCharacterCache.get(heroId);
	if (cached) {
		return cached;
	}
	if (getStorageMode() !== StorageMode.API) {
		return null;
	}
	const characters = await api.getCharacters(currentUserIsAdmin ? { scope: 'all' } : {});
	replaceApiCache(characters);
	return apiCharacterCache.get(heroId) ?? null;
}

export async function getCharacterByDatabaseId(characterId: number): Promise<api.CharacterResponse | null> {
	if (getStorageMode() !== StorageMode.API) {
		return null;
	}
	try {
		const character = await api.getCharacter(characterId);
		upsertApiCache(character);
		return character;
	} catch (error) {
		console.error('[STORAGE] ❌ Failed to fetch character by database ID:', error);
		return null;
	}
}

export async function assignGMToHero(heroId: string, gmEmail: string): Promise<api.CharacterResponse> {
	const record = await getCharacterRecord(heroId);
	if (!record) {
		throw new Error('Character not found in backend');
	}
	const updated = await api.assignGMByEmail(record.id, gmEmail);
	upsertApiCache(updated);
	return updated;
}

export async function clearGMFromHero(heroId: string): Promise<api.CharacterResponse> {
	const record = await getCharacterRecord(heroId);
	if (!record) {
		throw new Error('Character not found in backend');
	}
	const updated = await api.clearGM(record.id);
	upsertApiCache(updated);
	return updated;
}
