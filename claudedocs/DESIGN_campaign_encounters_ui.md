# Design: Campaign Encounters UI Integration

## Overview

This document designs the UI integration for viewing and managing encounters within campaign details, building on the backend API already implemented in `server/routes/encounter.routes.ts`.

## Current State Analysis

### What Already Exists

1. **Backend API** (Complete):
   - `GET /api/campaigns/:campaignId/encounters` - List encounters
   - `POST /api/campaigns/:campaignId/encounters` - Create encounter
   - `PUT /api/campaigns/:campaignId/encounters/:id` - Update encounter
   - `DELETE /api/campaigns/:campaignId/encounters/:id` - Soft delete
   - Database table: `campaign_encounters`

2. **Frontend API Client** (Complete):
   - `getCampaignEncounters()`, `createCampaignEncounter()`, etc. in `src/services/api.ts`

3. **Sync Modal** (Complete):
   - `SyncEncounterModal` in `src/components/modals/sync-encounter/`
   - Allows syncing encounters from Playbook to campaigns

4. **Campaign Details Page** (Partial):
   - Has tabs: Details, Members, Characters, Projects
   - **Missing**: Encounters tab

5. **Campaign Editing** (Complete):
   - Name and description editing already works (lines 116-148 in campaign-details-page.tsx)
   - `updateCampaign()` API already exists

### What's Missing

1. **Encounters Tab** in campaign details page
2. **Encounter List Component** for displaying campaign encounters
3. **Integration with Playbook** - view synced encounters within campaign context

---

## Design: Encounters Tab in Campaign Details

### UI Flow

```
Campaign Details Page
├── Details Tab (existing)
├── Members Tab (existing)
├── Characters Tab (existing)
├── Projects Tab (existing)
└── Encounters Tab (NEW)
    ├── Header: "Encounters (count)"
    ├── Actions (GM only):
    │   └── Button: "Sync Encounter" → Opens SyncEncounterModal
    ├── Encounter List:
    │   └── EncounterCard for each encounter
    │       ├── Name
    │       ├── Creator
    │       ├── Created/Updated dates
    │       ├── Actions (if GM):
    │       │   ├── "Run in Session" → navigates to /session with encounter loaded
    │       │   ├── "Edit" → navigates to encounter editor
    │       │   └── "Remove" → soft deletes from campaign
    │       └── onClick → expands to show encounter preview/summary
    └── Empty state when no encounters
```

### Component Structure

```
src/components/pages/campaigns/campaign-details-page.tsx (modify)
├── Add encounters state
├── Add loadEncounters() function
├── Add Encounters tab to Tabs component
└── Import EncounterList component

src/components/campaigns/encounters/ (NEW directory)
├── EncounterList.tsx - List of campaign encounters
├── EncounterCard.tsx - Individual encounter display card
└── EncounterList.scss - Styling
```

### State Changes in campaign-details-page.tsx

```typescript
// Add to existing state
const [encounters, setEncounters] = useState<CampaignEncounterResponse[]>([]);
const [loadingEncounters, setLoadingEncounters] = useState<boolean>(false);
const [syncEncounterModalOpen, setSyncEncounterModalOpen] = useState<boolean>(false);

// Add loadEncounters function
const loadEncounters = async () => {
  if (!campaign) return;
  setLoadingEncounters(true);
  try {
    const result = await api.getCampaignEncounters(campaign.id);
    setEncounters(result.encounters);
  } catch (error) {
    console.error('Failed to load encounters:', error);
  } finally {
    setLoadingEncounters(false);
  }
};

// Call in useEffect when campaign loads
useEffect(() => {
  if (campaign) {
    loadEncounters();
  }
}, [campaign]);
```

### Encounters Tab JSX

```typescript
{
  key: 'encounters',
  label: `Encounters (${encounters.length})`,
  children: (
    <div>
      {isGM && (
        <div style={{ marginBottom: '20px' }}>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => setSyncEncounterModalOpen(true)}
          >
            Sync Encounter from Playbook
          </Button>
        </div>
      )}
      <EncounterList
        encounters={encounters}
        loading={loadingEncounters}
        isGM={isGM}
        onRemove={handleRemoveEncounter}
        onRunInSession={handleRunEncounterInSession}
      />
    </div>
  )
}
```

---

## Implementation Tasks

### Phase 1: Basic Encounters Tab (2-3 hours)

1. **Create EncounterList component**
   - File: `src/components/campaigns/encounters/EncounterList.tsx`
   - Props: encounters, loading, isGM, onRemove, onRunInSession
   - Display: Grid of encounter cards with basic info

2. **Create EncounterCard component**
   - File: `src/components/campaigns/encounters/EncounterCard.tsx`
   - Display: Name, creator, dates, action buttons
   - GM actions: Remove, Run in Session

3. **Add Encounters tab to campaign-details-page.tsx**
   - Add state for encounters
   - Add loadEncounters() function
   - Add tab to Tabs component
   - Add handleRemoveEncounter() function

4. **Styling**
   - File: `src/components/campaigns/encounters/EncounterList.scss`
   - Match existing campaigns styling

### Phase 2: Session Integration (1-2 hours)

1. **Run in Session functionality**
   - Navigate to `/session` with encounter pre-loaded
   - Pass encounter data via navigation state or URL param

2. **Encounter preview expansion**
   - Expandable card showing encounter summary
   - Monster list, difficulty indicators

### Phase 3: Bidirectional Sync (2-3 hours)

1. **Sync back to Playbook**
   - If encounter is modified in Session, offer to sync changes back
   - Update encounter_storage.ts to handle bidirectional sync

2. **Conflict resolution**
   - Handle case where local and server versions differ
   - Simple strategy: server wins with user confirmation

---

## Campaign Editing (Already Complete)

**Status**: ✅ Already implemented

The campaign editing functionality is already complete in `campaign-details-page.tsx`:
- Lines 116-148: `handleSaveCampaign()` function
- Lines 463-479: Name and Description input fields
- Line 447-450: Save button in header

No additional work needed for campaign name/description editing.

---

## Merge Tool Protection

### Current Gap

The following Draachenmar-specific files are NOT in `ALWAYS_KEEP`:

1. **Campaign Pages**:
   - `src/components/pages/campaigns/` - Campaign list and details pages

2. **Campaign Components**:
   - `src/components/campaigns/` - Projects components (and future encounters)

3. **Campaign Models**:
   - `src/models/campaign.ts` - Campaign TypeScript interfaces

### Recommended Additions to merge-tool.sh

```bash
ALWAYS_KEEP=(
    # ... existing entries ...

    # Campaign system (Draachenmar-specific)
    "src/components/pages/campaigns/"         # Campaign list and details pages
    "src/components/campaigns/"               # Campaign sub-components (projects, encounters)
    "src/models/campaign.ts"                  # Campaign TypeScript models
)
```

---

## Files to Create/Modify

### New Files
```
src/components/campaigns/encounters/EncounterList.tsx
src/components/campaigns/encounters/EncounterCard.tsx
src/components/campaigns/encounters/EncounterList.scss
```

### Modified Files
```
src/components/pages/campaigns/campaign-details-page.tsx
tools/merge-tool.sh
```

---

## Access Control Summary

| Action | GM | Player | Creator | Admin |
|--------|-----|--------|---------|-------|
| View encounters tab | ✅ | ✅ | ✅ | ✅ |
| View encounter details | ✅ | ✅ | ✅ | ✅ |
| Sync encounter to campaign | ✅ | ❌ | ❌ | ✅ |
| Remove encounter from campaign | ✅ | ❌ | ✅ | ✅ |
| Run encounter in session | ✅ | ✅ | ✅ | ✅ |

---

## Estimated Total Effort

| Phase | Description | Hours |
|-------|-------------|-------|
| 1 | Basic Encounters Tab | 2-3 |
| 2 | Session Integration | 1-2 |
| 3 | Bidirectional Sync | 2-3 |
| **Total** | | **5-8 hours** |

---

## Next Steps

1. Update merge-tool.sh with campaign protection
2. Create EncounterList and EncounterCard components
3. Add Encounters tab to campaign-details-page.tsx
4. Test with existing synced encounters (after running DB migration)
