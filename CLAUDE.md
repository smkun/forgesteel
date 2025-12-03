# Forgesteel-Draachenmar Session Log

## Session Summary - December 3, 2024

### Changes Made

1. **Restored Footer Sign In/Sign Out Button** ([app-footer.tsx](src/components/panels/app-footer/app-footer.tsx))
   - Added `useAuth` hook integration for user authentication state
   - Added `handleAuthClick` function with proper loading state (`signingOut`)
   - Display shows user's display name or email when logged in
   - Recovered original implementation from git commit `ce5ab83a`

2. **Added Account Section to Settings Modal** ([settings-modal.tsx](src/components/modals/settings/settings-modal.tsx))
   - New expandable Account section showing logged-in user info
   - Sign Out button with navigation back to Welcome page
   - Added `useAuth` and `useNavigation` hook imports

3. **Added goToAuth Navigation Method** ([use-navigation.ts](src/hooks/use-navigation.ts))
   - New navigation method for routing to `/auth` page

4. **Fixed Missing Draachenmar Sourcebook** ([sourcebook-logic.ts](src/logic/sourcebook-logic.ts))
   - Added `SourcebookData.draachenmar` to `getSourcebooks()` return list
   - Sourcebook now appears in character creation under Homebrew section
   - Positioned after Core and Orden (official sources)

### New Tasks Identified

- [ ] Verify Draachenmar sourcebook content displays correctly in character creation
- [ ] Test Sign In/Sign Out flow end-to-end
- [ ] Confirm user profile display name syncs from Firebase

### Risks

1. **Authentication State Sync**: If Firebase auth state doesn't propagate correctly, user may see stale login status
2. **Sourcebook Load Order**: Draachenmar being in the default list means it loads for all users - may need conditional loading for campaign-specific content
3. **SyncStatus Component**: Referenced in footer but the hook `useSyncStatus` may have dependencies not fully tested post-merge

### Next 3 Tasks

1. **Test Authentication Flow**: Verify sign in, sign out, and session persistence work correctly across page refreshes
2. **Validate Draachenmar Content**: Create a test character using Draachenmar ancestries/cultures to ensure all content renders
3. **Run Full Build**: Execute `npm run build` to catch any TypeScript or bundling errors before deployment

---

## Session Summary - December 3, 2025 (Continued)

### Changes Made

5. **Fixed Draachenmar Not Showing in Sourcebooks Modal** ([sourcebooks-modal.tsx](src/components/modals/sourcebooks/sourcebooks-modal.tsx))
   - Added `builtInHomebrewSourcebooks` filter to extract homebrew sourcebooks from `officialSourcebooks` prop
   - Homebrew tab now displays both built-in homebrew (like Draachenmar) and user-created homebrew sourcebooks
   - Draachenmar now visible in Library → Sourcebooks → Homebrew

6. **Restored Playbook Navigation Button** ([app-footer.tsx](src/components/panels/app-footer/app-footer.tsx))
   - Added Playbook button back to footer navigation with `ReadOutlined` icon
   - Routes to `/playbook/adventure` on click
   - Button highlights when on playbook pages

7. **Fixed Encounter/Adventure/Montage/Negotiation/TacticalMap Creation** ([main.tsx](src/components/main/main.tsx))
   - **Root Cause**: `createLibraryElement` switch statement was missing cases for 5 element types
   - Added 5 new create functions (lines 714-822):
     - `createEncounter()` - Creates encounters and navigates to edit page
     - `createAdventure()` - Creates adventures
     - `createMontage()` - Creates montages
     - `createNegotiation()` - Creates negotiations
     - `createTacticalMap()` - Creates tactical maps
   - Added corresponding switch cases (lines 989-1003)
   - Clicking "Create" in Library now works for all element types

8. **Created Comprehensive Merge Checklist** ([MERGE_CHECKLIST.md](MERGE_CHECKLIST.md))
   - Documented 130+ critical files for merge protection
   - Organized by category: Authentication, Backend, API/Sync, Draachenmar, Admin Tools
   - Includes pre-merge and post-merge verification steps

### New Tasks Identified

- [x] ~~Fix Draachenmar not appearing in Sourcebooks modal~~ (COMPLETED)
- [x] ~~Restore Playbook navigation button~~ (COMPLETED)
- [x] ~~Fix encounter creation not working~~ (COMPLETED)
- [ ] Verify all Library element creation works (adventure, montage, negotiation, tactical-map)
- [ ] Test full encounter workflow: create → edit → save → run in session

### Risks

4. **Missing Switch Cases**: Similar pattern issues may exist in `deleteLibraryElement`, `moveLibraryElement`, or other switch statements for new element types
5. **Merge Regression**: The missing encounter/adventure cases suggest the merge may have dropped code - should audit other large functions

### Next 3 Tasks

1. **Audit Other Switch Statements**: Check `deleteLibraryElement` and `moveLibraryElement` for missing element type cases
2. **Test All Library Element Types**: Verify create/edit/delete works for encounters, adventures, montages, negotiations, tactical-maps
3. **Run Integration Test**: Create an encounter, add monsters, run it in Session mode to verify full workflow

---

## Session Summary - December 3, 2025 (Production Build Fix)

### Changes Made

9. **Created `.env.production` File** (NEW FILE)
   - Created production environment config with correct API URL
   - `VITE_API_BASE_URL=https://32gamers.com/forgesteel/api`
   - Firebase config vars for production frontend

10. **Fixed Vite Mode Override** ([vite.config.ts](vite.config.ts))
    - **Root Cause**: Config had `mode: process.env.NODE_ENV || 'development'` which prevented Vite from using production mode during builds
    - Removed the mode override to let Vite use its defaults (production for `vite build`)
    - Added comment explaining why mode should not be overridden

11. **Identified Shell Environment Override Issue**
    - **Discovery**: Shell environment had `VITE_API_BASE_URL=http://localhost:4000` set from running dev server
    - System environment variables override `.env` file values in Vite
    - **Solution**: Run `unset VITE_API_BASE_URL && npm run build` for production builds
    - Or start a fresh shell session without dev server env vars

### Production CORS Error Resolution

**Problem**: Production build at `https://32gamers.com` was calling `http://localhost:4000/api/...` causing CORS errors

**Root Causes Identified**:
1. No `.env.production` file existed - Vite fell back to `.env` which had no `VITE_API_BASE_URL`
2. `vite.config.ts` was overriding Vite's mode with `process.env.NODE_ENV`
3. Shell had `VITE_API_BASE_URL` env var set from dev server, which takes precedence over `.env` files

**Files Created/Modified**:
- `.env.production` (NEW) - Production frontend environment variables
- `vite.config.ts` - Removed mode override

### Build Process Notes

**Correct Production Build Command**:
```bash
unset VITE_API_BASE_URL && npm run build
```

**Vite Environment Variable Loading Order** (later wins):
1. `.env` - Base config
2. `.env.local` - Local overrides (gitignored)
3. `.env.[mode]` - Mode-specific (`.env.production` for builds)
4. `.env.[mode].local` - Local mode-specific (gitignored)
5. **System environment variables** - HIGHEST PRIORITY (can override all above!)

**Verification Command**:
```bash
grep -c '32gamers.com/forgesteel/api' distribution/frontend/main-*.js
# Should output: 1 (indicating production URL is in bundle)
```

### Risks

6. **Dev Server Env Pollution**: Running `npm run dev` sets shell env vars that persist and can pollute production builds
7. **Build Environment**: CI/CD systems should ensure clean environment or explicitly unset `VITE_*` vars before building

### Next 3 Tasks

1. **Deploy Production Build**: Upload `distribution/frontend` to 32gamers.com/forgesteel/
2. **Verify Production API Calls**: Test that auth and API endpoints work correctly in production
3. **Document Build Process**: Add build notes to README or CONTRIBUTING.md

---

## Session Summary - December 3, 2025 (Library Element CRUD Fix)

### Changes Made

12. **Fixed Library Element Delete/Save/Import for Playbook Types** ([main.tsx](src/components/main/main.tsx))
    - **Root Cause**: Switch statements in `deleteLibraryElement`, `saveLibraryElement`, and `importLibraryElement` were missing cases for 5 element types that were added in `createLibraryElement`
    - **Symptom**: Users could create encounters/adventures/etc but could not edit, save, or delete them

    **`deleteLibraryElement`** - Added 5 missing cases (lines ~1059-1073):
    ```typescript
    case 'encounter':
        sourcebook.encounters = sourcebook.encounters.filter(x => x.id !== element.id);
        break;
    case 'adventure':
        sourcebook.adventures = sourcebook.adventures.filter(x => x.id !== element.id);
        break;
    case 'montage':
        sourcebook.montages = sourcebook.montages.filter(x => x.id !== element.id);
        break;
    case 'negotiation':
        sourcebook.negotiations = sourcebook.negotiations.filter(x => x.id !== element.id);
        break;
    case 'tactical-map':
        sourcebook.tacticalMaps = sourcebook.tacticalMaps.filter(x => x.id !== element.id);
        break;
    ```

    **`saveLibraryElement`** - Added 5 missing cases (lines ~1115-1129):
    ```typescript
    case 'encounter':
        sourcebook.encounters = sourcebook.encounters.map(x => x.id === element.id ? element : x) as Encounter[];
        break;
    // ... similar for adventure, montage, negotiation, tactical-map
    ```

    **`importLibraryElement`** - Added 5 missing cases in two locations:
    - Elements array (lines ~1139-1143): Added flatMap entries for encounters, adventures, montages, negotiations, tacticalMaps
    - Switch statement (lines ~1216-1235): Added push and sort operations for each type

13. **Removed Playbook Button from Footer** ([app-footer.tsx](src/components/panels/app-footer/app-footer.tsx))
    - Removed Playbook navigation button to match upstream Forgesteel
    - Footer now shows: Home | Heroes | Library | Session

### Completed Tasks

- [x] ~~Audit Other Switch Statements~~ - Fixed all three missing functions
- [x] ~~Fix encounter delete not working~~ (COMPLETED)
- [x] ~~Fix encounter save not working~~ (COMPLETED)
- [x] ~~Fix encounter import not working~~ (COMPLETED)

### Technical Notes

**Pattern Issue**: When `createLibraryElement` was extended with new element types (encounter, adventure, montage, negotiation, tactical-map), the corresponding CRUD functions were not updated. This is a common maintenance issue with switch statements - all related switches must be updated together.

**Tool Used**: Serena MCP's `replace_symbol_body` was used to reliably replace function bodies, avoiding whitespace/tab matching issues that plagued the standard Edit tool.

### Risks

8. **Incomplete CRUD Pattern**: Other library operations may also be missing these element types - should audit `exportLibraryElement`, `moveLibraryElement`, etc.

### Next 3 Tasks

1. **Test Full Library CRUD**: Create, edit, save, delete an encounter in the Library to verify fix works
2. **Audit Remaining Switch Statements**: Check `exportLibraryElement` and any other functions with element type switches
3. **Test Import/Export**: Verify encounters can be exported to JSON and re-imported correctly

---

## Session Summary - December 3, 2025 (Backend Encounters Design)

### Design Document Created

14. **Created Backend Encounters Design Document** ([claudedocs/DESIGN_backend_encounters.md](claudedocs/DESIGN_backend_encounters.md))
    - Comprehensive design for adding encounters to the MySQL database
    - Enables GMs to access encounters from any PC via server-side storage
    - Campaign-based storage model (follows characters/projects pattern)

### Key Design Decisions

**Architecture Choice**: Campaign-Based Storage
- Encounters belong to campaigns (like characters and projects)
- All campaign GMs can access shared encounters
- Dual storage strategy: local + server sync for backward compatibility

**Database Schema**: New `campaign_encounters` table
```sql
CREATE TABLE campaign_encounters (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT UNSIGNED NOT NULL,
  encounter_uuid VARCHAR(36) NOT NULL,
  name VARCHAR(255) NULL,
  encounter_json LONGTEXT NOT NULL,
  created_by_user_id INT UNSIGNED NOT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  ...
);
```

**API Endpoints** (nested under campaigns):
- `GET /api/campaigns/:campaignId/encounters` - List all
- `POST /api/campaigns/:campaignId/encounters` - Create (GM only)
- `PUT /api/campaigns/:campaignId/encounters/:id` - Update (GM only)
- `DELETE /api/campaigns/:campaignId/encounters/:id` - Soft delete (GM only)

**Access Control**:
- Campaign GMs: Full CRUD
- Campaign Players: Read only
- Creator: Full access to own encounters

### Documentation Updated

15. **Updated PLANNING.md** ([claudedocs/PLANNING.md](claudedocs/PLANNING.md))
    - Added "Campaign Encounters Backend Sync System" section
    - Vision, feature overview, database schema
    - API endpoints, access control matrix
    - 4-phase implementation plan with effort estimates

16. **Updated TASKS.md** ([claudedocs/TASKS.md](claudedocs/TASKS.md))
    - Added detailed task breakdown for all 4 phases
    - Phase 1: Backend Infrastructure (migration, repository, logic, routes)
    - Phase 2: Frontend API Integration (api.ts, sync hook)
    - Phase 3: UI Integration (campaign selector, sync status)
    - Phase 4: Migration & Polish (local→server migration, offline support)

### Files Created/Modified

**New Files:**
- `claudedocs/DESIGN_backend_encounters.md` - Full design specification

**Modified Files:**
- `claudedocs/PLANNING.md` - Added encounters backend section
- `claudedocs/TASKS.md` - Added encounters implementation tasks
- `CLAUDE.md` - This session summary

### Implementation Phases (Estimated: 12-19 hours)

| Phase | Description | Effort |
|-------|-------------|--------|
| 1 | Backend Infrastructure | 4-6 hours |
| 2 | Frontend API Integration | 2-3 hours |
| 3 | UI Integration | 4-6 hours |
| 4 | Migration & Polish | 2-4 hours |

### Files to Create (Phase 1)

- `db/migrations/003_add_campaign_encounters.sql`
- `server/data/encounters.repository.ts`
- `server/logic/encounter.logic.ts`
- `server/routes/encounter.routes.ts`

### Next 3 Tasks

1. **Start Phase 1**: Create the database migration file `003_add_campaign_encounters.sql`
2. **Create Repository**: Implement `encounters.repository.ts` following character repository pattern
3. **Create Logic Layer**: Implement `encounter.logic.ts` with access control
