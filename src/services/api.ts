import { Hero } from '@/models/hero';
import { getIdToken } from './firebase';

const DEFAULT_DEV_API_BASE = 'http://localhost:4000';
const DEFAULT_PROD_API_BASE = 'https://32gamers.com/forgesteel/api';

function resolveApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? DEFAULT_DEV_API_BASE : DEFAULT_PROD_API_BASE);
}

const API_BASE_URL = resolveApiBaseUrl();

export interface CharacterResponse {
  id: number;
  owner_user_id: number;
  owner_email: string | null;
  owner_display_name: string | null;
  gm_user_id: number | null;
  gm_email: string | null;
  gm_display_name: string | null;
  name: string | null;
  hero: Hero;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  firebase_uid: string;
  email: string;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export class ApiError extends Error {
  constructor(public statusCode: number, public error: string, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getIdToken();

  if (!token) {
    throw new ApiError(401, 'Unauthorized', 'Not signed in');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers as Record<string, string>
  };

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => {
    throw new ApiError(response.status, 'InvalidJSON', 'Response was not valid JSON');
  });

  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'UnknownError', data.message || 'An error occurred', data.details);
  }

  return data as T;
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/auth/me');
}

export interface GetCharactersParams {
  includeDeleted?: boolean;
  scope?: 'user' | 'all';
}

export async function getCharacters(params: GetCharactersParams = {}): Promise<CharacterResponse[]> {
  const searchParams = new URLSearchParams();
  if (params.includeDeleted) {
    searchParams.set('includeDeleted', 'true');
  }
  if (params.scope) {
    searchParams.set('scope', params.scope);
  }
  const query = searchParams.toString();
  const response = await apiRequest<{ count: number; characters: CharacterResponse[] }>(
    `/api/characters${query ? `?${query}` : ''}`
  );
  return response.characters;
}

export async function getCharacter(id: number): Promise<CharacterResponse> {
  return apiRequest<CharacterResponse>(`/api/characters/${id}`);
}

export async function createCharacter(hero: Hero): Promise<CharacterResponse> {
  return apiRequest<CharacterResponse>('/api/characters', {
    method: 'POST',
    body: JSON.stringify({ hero })
  });
}

export async function updateCharacter(id: number, hero: Hero): Promise<CharacterResponse> {
  return apiRequest<CharacterResponse>(`/api/characters/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ hero })
  });
}

export async function deleteCharacter(id: number): Promise<void> {
  await apiRequest(`/api/characters/${id}`, { method: 'DELETE' });
}

export async function reassignCharacterOwner(id: number, newOwnerEmail: string): Promise<CharacterResponse> {
  return apiRequest<CharacterResponse>(`/api/characters/${id}/owner`, {
    method: 'PATCH',
    body: JSON.stringify({ new_owner_email: newOwnerEmail })
  });
}

export async function assignGMByEmail(id: number, gmEmail: string): Promise<CharacterResponse> {
  return apiRequest<CharacterResponse>(`/api/characters/${id}/gm`, {
    method: 'POST',
    body: JSON.stringify({ gm_email: gmEmail })
  });
}

export async function clearGM(id: number): Promise<CharacterResponse> {
  return apiRequest<CharacterResponse>(`/api/characters/${id}/gm`, { method: 'DELETE' });
}

export interface AdminUserSummary {
  id: number;
  email: string;
  display_name: string | null;
  firebase_uid: string;
  created_at: string;
  updated_at: string;
}

export interface PublicUserSummary {
  id: number;
  email: string;
  display_name: string | null;
}

export async function getUsers(limit: number = 100, offset: number = 0): Promise<AdminUserSummary[]> {
  const params = new URLSearchParams({ limit: `${limit}`, offset: `${offset}` });
  const response = await apiRequest<{ count: number; users: AdminUserSummary[] }>(`/api/admin/users?${params.toString()}`);
  return response.users;
}

export async function searchUsers(query: string): Promise<PublicUserSummary[]> {
  const params = new URLSearchParams({ query });
  const response = await apiRequest<{ count: number; users: PublicUserSummary[] }>(`/api/users/search?${params.toString()}`);
  return response.users;
}
