# Design: Backend Encounters System

**Date:** December 3, 2025
**Status:** Design Document
**Goal:** Enable GMs to access encounters from any PC via server-side storage

## Overview

Currently, encounters are stored only in browser local storage (IndexedDB via localforage). This design adds server-side encounter storage so GMs can:
- Access their encounters from any device
- Share encounters with other GMs in campaigns
- Persist encounters across browser sessions/devices

## Current State

### Where Encounters Are Stored Now
```
Frontend: localforage → IndexedDB
Key: 'forgesteel-homebrew-settings'
Contains: Sourcebook[] with encounters[] array per sourcebook
```

### Current Flow
1. `createEncounter()` → Creates encounter object
2. Pushes to `sourcebook.encounters[]`
3. `persistHomebrewSourcebooks()` → Saves to IndexedDB
4. **NOT synced to server**

## Architecture Decision

### Option A: Campaign-Based Encounters (Recommended)
Encounters belong to campaigns, similar to characters and projects.
- GMs can share encounters within campaigns
- Follows existing access control patterns
- Natural fit for session-based gameplay

### Option B: User-Based Encounters
Encounters belong to individual users only.
- Simpler but less collaborative
- Would need separate sharing mechanism

**Decision: Option A (Campaign-Based)**

## Database Schema

### New Table: `campaign_encounters`

```sql
-- Migration: db/migrations/003_add_campaign_encounters.sql

CREATE TABLE IF NOT EXISTS `campaign_encounters` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT UNSIGNED NOT NULL COMMENT 'Campaign this encounter belongs to',
  `encounter_uuid` VARCHAR(36) NOT NULL COMMENT 'Frontend UUID for encounter',
  `name` VARCHAR(255) NULL COMMENT 'Cached from JSON for listing',
  `encounter_json` LONGTEXT NOT NULL COMMENT 'Full Encounter object as JSON',
  `created_by_user_id` INT UNSIGNED NOT NULL COMMENT 'User who created',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign key constraints
  CONSTRAINT `fk_encounters_campaign`
    FOREIGN KEY (`campaign_id`)
    REFERENCES `campaigns` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_encounters_creator`
    FOREIGN KEY (`created_by_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  -- Indexes
  INDEX `idx_campaign_id` (`campaign_id`),
  INDEX `idx_encounter_uuid` (`encounter_uuid`),
  INDEX `idx_created_by` (`created_by_user_id`),
  INDEX `idx_is_deleted` (`is_deleted`),
  INDEX `idx_name` (`name`),

  -- Composite indexes
  INDEX `idx_campaign_active` (`campaign_id`, `is_deleted`),

  -- Unique constraint: UUID must be unique within campaign
  UNIQUE KEY `unique_campaign_encounter` (`campaign_id`, `encounter_uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## API Endpoints

### Routes: `server/routes/encounter.routes.ts`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/campaigns/:campaignId/encounters` | List all encounters in campaign | Campaign member |
| GET | `/api/campaigns/:campaignId/encounters/:id` | Get single encounter | Campaign member |
| POST | `/api/campaigns/:campaignId/encounters` | Create encounter | Campaign GM |
| PUT | `/api/campaigns/:campaignId/encounters/:id` | Update encounter | Campaign GM |
| DELETE | `/api/campaigns/:campaignId/encounters/:id` | Soft delete encounter | Campaign GM |

### Request/Response Examples

**POST `/api/campaigns/1/encounters`**
```json
// Request
{
  "encounter": {
    "id": "uuid-here",
    "name": "Goblin Ambush",
    "groups": [...],
    "terrain": [...],
    "heroes": [],
    "objective": null,
    "notes": [],
    "initiative": undefined,
    "round": 0,
    "malice": 0,
    "additionalTurnsTaken": [],
    "hiddenMaliceFeatures": []
  }
}

// Response (201 Created)
{
  "id": 1,
  "campaign_id": 1,
  "encounter_uuid": "uuid-here",
  "name": "Goblin Ambush",
  "encounter": { ... },
  "created_at": "2025-12-03T...",
  "updated_at": "2025-12-03T..."
}
```

## Server Files to Create

### 1. Repository: `server/data/encounters.repository.ts`

```typescript
/**
 * Encounters Repository
 *
 * Database operations for campaign encounters.
 * Follows same pattern as characters.repository.ts
 */

export interface Encounter {
  id: number;
  campaign_id: number;
  encounter_uuid: string;
  name: string | null;
  encounter_json: string;
  created_by_user_id: number;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

// Functions:
// - findById(id: number): Promise<Encounter | null>
// - findByCampaign(campaignId: number, includeDeleted?: boolean): Promise<Encounter[]>
// - findByUUID(campaignId: number, uuid: string): Promise<Encounter | null>
// - create(data: CreateEncounterData): Promise<Encounter>
// - update(id: number, data: UpdateEncounterData): Promise<Encounter | null>
// - softDelete(id: number): Promise<boolean>
```

### 2. Logic: `server/logic/encounter.logic.ts`

```typescript
/**
 * Encounter Business Logic
 *
 * Handles access control and encounter operations.
 * Follows same pattern as character.logic.ts
 */

export interface EncounterWithData {
  id: number;
  campaign_id: number;
  encounter_uuid: string;
  name: string | null;
  encounter: Encounter; // Parsed from JSON
  created_by_user_id: number;
  created_at: Date;
  updated_at: Date;
}

// Access Control:
// - Campaign GMs: Full CRUD
// - Campaign Players: Read only
// - Admin: Full CRUD on all

// Functions:
// - getCampaignEncounters(campaignId, userId, isAdmin): Promise<EncounterWithData[]>
// - getEncounter(encounterId, userId, isAdmin): Promise<EncounterWithData | null>
// - createEncounter(campaignId, userId, encounter, isAdmin): Promise<EncounterWithData>
// - updateEncounter(encounterId, userId, encounter, isAdmin): Promise<EncounterWithData | null>
// - deleteEncounter(encounterId, userId, isAdmin): Promise<boolean>
// - validateEncounter(encounter: any): boolean
```

### 3. Routes: `server/routes/encounter.routes.ts`

```typescript
/**
 * Encounter API Routes
 *
 * RESTful API for campaign encounter management.
 * Nested under campaigns: /api/campaigns/:campaignId/encounters
 */

// All routes require authentication
// Campaign membership verified in logic layer
```

### 4. Register Routes in `server/app.ts` or index

```typescript
import encounterRoutes from './routes/encounter.routes';

// Mount nested under campaigns
app.use('/api/campaigns/:campaignId/encounters', encounterRoutes);
```

## Frontend Integration

### 1. API Service: `src/services/api.ts`

Add encounter methods:

```typescript
// Encounters API
export const encountersApi = {
  async getCampaignEncounters(campaignId: number): Promise<Encounter[]> {
    return apiRequest<{ encounters: Encounter[] }>(
      `/campaigns/${campaignId}/encounters`
    ).then(r => r.encounters);
  },

  async getEncounter(campaignId: number, encounterId: number): Promise<Encounter> {
    return apiRequest(`/campaigns/${campaignId}/encounters/${encounterId}`);
  },

  async createEncounter(campaignId: number, encounter: Encounter): Promise<Encounter> {
    return apiRequest(`/campaigns/${campaignId}/encounters`, {
      method: 'POST',
      body: JSON.stringify({ encounter })
    });
  },

  async updateEncounter(campaignId: number, encounterId: number, encounter: Encounter): Promise<Encounter> {
    return apiRequest(`/campaigns/${campaignId}/encounters/${encounterId}`, {
      method: 'PUT',
      body: JSON.stringify({ encounter })
    });
  },

  async deleteEncounter(campaignId: number, encounterId: number): Promise<void> {
    return apiRequest(`/campaigns/${campaignId}/encounters/${encounterId}`, {
      method: 'DELETE'
    });
  }
};
```

### 2. Frontend Flow Changes

**Option A: Dual Storage (Recommended for Transition)**
1. Keep local storage for offline/quick access
2. Add sync button to push encounters to campaign
3. Auto-sync when creating encounters with campaign selected

**Option B: Server-Only Storage**
1. Remove local encounter storage
2. All encounter CRUD goes through API
3. Requires campaign selection for encounters

**Recommendation: Start with Option A for backward compatibility**

### 3. UI Changes Needed

1. **Campaign Selector** when creating encounters (if user is GM of campaigns)
2. **Sync Status Indicator** showing if encounter is local-only vs synced
3. **"Sync to Campaign"** button for existing local encounters
4. **Encounter List** should show both local and campaign encounters

## Access Control Matrix

| Action | Owner | Campaign GM | Campaign Player | Other User |
|--------|-------|-------------|-----------------|------------|
| List Encounters | ✅ | ✅ | ✅ (read) | ❌ |
| View Encounter | ✅ | ✅ | ✅ | ❌ |
| Create Encounter | ✅ | ✅ | ❌ | ❌ |
| Update Encounter | ✅ | ✅ | ❌ | ❌ |
| Delete Encounter | ✅ | ✅ | ❌ | ❌ |

## Implementation Phases

### Phase 1: Backend Infrastructure
1. Create migration `003_add_campaign_encounters.sql`
2. Create `encounters.repository.ts`
3. Create `encounter.logic.ts`
4. Create `encounter.routes.ts`
5. Register routes in app
6. Test API endpoints

### Phase 2: Frontend API Integration
1. Add `encountersApi` to `src/services/api.ts`
2. Create encounter context/hook for state management
3. Update encounter CRUD functions in `main.tsx`

### Phase 3: UI Integration
1. Add campaign selector to encounter creation
2. Add sync status indicators
3. Add "Sync to Campaign" functionality
4. Update encounter list to show source (local vs campaign)

### Phase 4: Migration & Polish
1. Create tool to migrate local encounters to campaigns
2. Add offline support (queue changes when offline)
3. Conflict resolution for concurrent edits

## Testing Plan

### Backend Tests
- [ ] Repository CRUD operations
- [ ] Logic layer access control
- [ ] API endpoint validation
- [ ] Campaign membership verification
- [ ] Soft delete functionality

### Frontend Tests
- [ ] API client methods
- [ ] Campaign selection workflow
- [ ] Sync state management
- [ ] Error handling

### Integration Tests
- [ ] Create encounter via API
- [ ] List encounters per campaign
- [ ] Update encounter access control
- [ ] Delete and soft delete

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Backend | 4-6 hours |
| Phase 2: Frontend API | 2-3 hours |
| Phase 3: UI | 4-6 hours |
| Phase 4: Migration | 2-4 hours |
| **Total** | **12-19 hours** |

## Future Considerations

1. **Real-time sync**: WebSocket updates when encounters change
2. **Encounter templates**: Reusable encounter patterns
3. **Version history**: Track encounter modifications
4. **Import/export**: Share encounters between campaigns
5. **Encounter running state**: Separate current state from template

## Files to Create/Modify

### New Files
- `db/migrations/003_add_campaign_encounters.sql`
- `server/data/encounters.repository.ts`
- `server/logic/encounter.logic.ts`
- `server/routes/encounter.routes.ts`

### Modified Files
- `server/app.ts` (or server entry point) - Register routes
- `src/services/api.ts` - Add encounter API methods
- `src/components/main/main.tsx` - Integrate server CRUD
- Encounter creation UI components - Add campaign selection
