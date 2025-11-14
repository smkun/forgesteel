# TASKS.md - Project Task Tracking

## Active Tasks

### ✅ Completed

- [x] Merge core.ts sourcebook into draachenmar.ts
- [x] Remove core.ts sourcebook from application loading
- [x] Remove orden.ts sourcebook to fix duplicate library entries
- [x] Fix lizardfolk integration with Ssar'uk language
- [x] Fix Null class signature ability selection bug
- [x] Integrate verminari ancestry with Szetch language
- [x] Fix build error from smart apostrophe in Ssar'uk language name
- [x] Fix white screen issue from orden sourcebook removal
- [x] Fix ancestry-data.ts import errors (duplicate devil import, missing dragon-knight file)
- [x] Integrate Plumari ancestries (Falcar, Strigara, Zefiri) with Aeryn language
- [x] Add Plumari ancestral culture to draachenmar sourcebook
- [x] Fix zefiri.ts AbilityDistanceType.Blast enum error
- [x] Fix draachenmar.ts isHomebrew property error (changed to type: SourcebookType.Homebrew)
- [x] Implement Prayer of Soldier's Skill with checkbox bonuses
  - Added "Has Light Armor" checkbox (+3 Stamina per echelon when wearing light armor)
  - Added "Has Light Weapon" checkbox (+1 damage bonus with weapon abilities and free strikes)
  - Uses createAbilityDamage with Weapon+Strike keywords for proper damage application
  - Proficiencies always granted, bonuses conditionally selected
  - Removed blessing item approach (items didn't appear in inventory UI)

## Pending Tasks

### Testing Required

1. **Test Plumari Ancestry Creation**
   - Create characters with each Plumari ancestry (Falcar, Strigara, Zefiri)
   - Verify size modifiers apply correctly (Medium, Large, Small)
   - Test shared and unique ancestry options display properly
   - Confirm Plumari culture selection works with Aeryn language

2. **Validate Plumari Abilities**
   - Test Wings ability (fly for Might rounds with damage weakness 5 at levels 1-3)
   - Verify Razor Draft (Zefiri signature) uses correct Burst distance type
   - Test movement-based damage bonuses (Stooping Dash, Storm Shoulders)
   - Confirm all trigger-based abilities activate correctly

## Backlog

### Bug Fixes

- Monitor for any issues related to core sourcebook removal
- Test all character creation flows with draachenmar sourcebook

### Feature Enhancements

- Consider adding more ancestral cultures
- Expand language options for custom ancestries

### Testing

- Verify all ancestries load correctly
- Test Null class signature ability selection with all classes
- Validate verminari features in character builder

---

## Campaign Project Tracking System

### Phase 1: Database & Backend ✅ Complete

#### Database Migration
- [x] Create `db/migrations/002_add_campaign_projects.sql`
  - campaign_projects table with all fields and constraints
  - campaign_project_history table for audit trail
  - Indexes for performance optimization
  - Rollback script for migration reversal
- [x] Test migration on production database
- [x] Verify all foreign key constraints work correctly
- [x] Test ON DELETE RESTRICT for character_id constraint

#### Backend Data Layer
- [x] Create `server/data/projects.repository.ts`
  - findById(id): Get single project
  - findByCampaign(campaignId, includeDeleted): Get all campaign projects
  - findByCharacter(characterId): Get all projects for character
  - create(data): Create new project
  - update(id, data): Update project details
  - updateProgress(id, currentPoints): Update progress
  - softDelete(id): Mark project as deleted
  - getProjectDepth(id): Calculate hierarchy depth
  - getDescendants(id): Get all child projects recursively
  - getAncestors(id): Get all parent projects
  - createHistoryEntry(data): Add history record
  - getHistory(projectId): Get project change history

#### Backend Business Logic
- [x] Create `server/logic/project.logic.ts`
  - getCampaignProjects(campaignId, options): Fetch with hierarchy
  - buildProjectTree(projects[]): Convert flat list to hierarchy
  - calculateAggregateProgress(projectId): Sum all descendant progress
  - validateProjectHierarchy(projectId, newParentId): Check circular refs, max depth
  - updateProjectProgress(projectId, userId, points, notes): Update with history
  - checkAutoComplete(projectId): Auto-complete when goal reached
  - **Permission checks**:
    - canUserCreateProject(userId, characterId, campaignId): Player/GM/Admin check
    - canUserEditProject(userId, projectId): Owner/GM/Admin check
    - canUserViewProject(userId, projectId): Campaign member check

#### Backend API Routes
- [x] Create `server/routes/project.routes.ts`
  - GET /api/campaigns/:campaignId/projects (query: includeDeleted, includeCompleted, flat)
  - GET /api/campaigns/:campaignId/projects/:projectId (query: includeHistory, includeChildren)
  - POST /api/campaigns/:campaignId/projects (body: CreateProjectRequest)
    - Validate characterId required
    - Check permission based on role (player/GM/admin)
    - Validate character in same campaign
  - PUT /api/campaigns/:campaignId/projects/:projectId (body: UpdateProjectRequest)
    - characterId NOT in request body (immutable)
  - PATCH /api/campaigns/:campaignId/projects/:projectId/progress (body: currentPoints or incrementBy)
  - POST /api/campaigns/:campaignId/projects/:projectId/complete (body: notes)
  - DELETE /api/campaigns/:campaignId/projects/:projectId (query: permanent for admin)
  - POST /api/campaigns/:campaignId/projects/:projectId/reorder (body: newOrder or moveAfter)

#### Validation & Error Handling
- [x] Add input validation for all project endpoints
  - Name: 1-255 characters
  - Goal points: positive integer
  - Current points: <= goal points
  - Character ID: exists and in campaign
  - Parent project ID: exists and in same campaign
- [x] Add permission validation middleware
  - Check user role (player/GM/admin)
  - Verify character ownership for players
  - Verify campaign membership
- [x] Add hierarchy validation
  - Prevent circular references
  - Enforce max depth (5 levels max)
- [x] Create error responses for common cases
  - 400: Invalid data, circular reference
  - 403: Permission denied
  - 404: Project or campaign not found
  - 409: Constraint violation

#### Testing
- [x] Test API endpoints respond correctly
- [ ] Write unit tests for project.logic.ts (deferred)
  - buildProjectTree with various hierarchies
  - calculateAggregateProgress with nested projects
  - validateProjectHierarchy with circular refs
  - Permission check functions
- [ ] Write integration tests for API endpoints (deferred)
  - CRUD operations for all roles (player/GM/admin)
  - Permission enforcement tests
  - Hierarchy validation tests
  - Progress update and completion flows
- [ ] Test database constraints (deferred)
  - ON DELETE RESTRICT for character_id
  - ON DELETE CASCADE for parent_project_id
  - Check constraint for progress <= goal

### Phase 2: Frontend Integration ⏳ In Progress

#### TypeScript Types
- [x] Create `src/models/campaign.ts` types
  - CampaignProject interface
  - CreateProjectRequest interface
  - UpdateProgressRequest interface
  - AggregateProgress interface
  - ProjectHistoryEntry interface
  - CompleteProjectRequest interface
  - UserSummary interface

#### API Service
- [x] Add project API functions to `src/services/api.ts`
  - getCampaignProjects(campaignId, options)
  - getCampaignProject(campaignId, projectId)
  - createCampaignProject(campaignId, data)
  - updateCampaignProject(campaignId, projectId, data)
  - updateProjectProgress(campaignId, projectId, data)
  - completeCampaignProject(campaignId, projectId, notes)
  - deleteCampaignProject(campaignId, projectId)
  - reorderCampaignProject(campaignId, projectId, newOrder)

#### UI Components
- [ ] Create `src/components/campaigns/projects/ProjectList.tsx`
  - Hierarchical tree view with expand/collapse
  - Progress bars for each project
  - Filter: show completed, show deleted (GM only)
  - Sort by display order
- [ ] Create `src/components/campaigns/projects/ProjectCard.tsx`
  - Project name, description
  - Character name display
  - Progress bar with percentage
  - Current/Goal points display
  - Edit/Delete buttons (permission-based)
  - Complete toggle
- [ ] Create `src/components/campaigns/projects/ProjectForm.tsx`
  - Name, description inputs
  - Goal points input (required, positive)
  - Current points input (optional, <= goal)
  - **Character selector dropdown** (REQUIRED)
    - Filtered by user role: players see own, GMs see all campaign
    - Shows character name only
    - Disabled in edit mode (immutable)
  - Parent project selector (optional, for sub-projects)
  - Display order input
  - Validation feedback
- [ ] Create `src/components/campaigns/projects/ProgressUpdateModal.tsx`
  - Current progress display
  - Input for new points or increment (+1, +5, +10, custom)
  - Notes field for history
  - Preview new percentage
  - Confirm/Cancel actions

#### Campaign Integration
- [ ] Add "Projects" tab to campaign detail view
- [ ] Implement drag-and-drop reordering (GM/Admin only)
- [ ] Add loading/error states for all API calls
- [ ] Add permission-based UI rendering
  - Show edit/delete only for own projects (players)
  - Show all controls for GMs/Admins
  - Hide reorder for players

### Phase 3: Testing & Polish 🧪 Pending

#### Integration Testing
- [ ] Test all API endpoints with real database
- [ ] Test permission enforcement across all roles
- [ ] Test hierarchy creation and navigation
- [ ] Test aggregate progress calculation accuracy
- [ ] Test character deletion prevention (ON DELETE RESTRICT)

#### E2E Testing (Playwright)
- [ ] Test player creating project for own character
- [ ] Test player unable to create for other character
- [ ] Test GM creating project for any character
- [ ] Test progress update flow
- [ ] Test project completion flow
- [ ] Test sub-project creation and aggregation
- [ ] Test hierarchy navigation (expand/collapse)

#### Performance Testing
- [ ] Test with 100+ projects in single campaign
- [ ] Test deep nesting (5+ levels)
- [ ] Measure aggregate progress calculation time
- [ ] Test concurrent progress updates

#### Edge Cases
- [ ] Test circular reference prevention
- [ ] Test max depth enforcement
- [ ] Test progress exceeding goal (should fail)
- [ ] Test deleting parent project (cascade to children)
- [ ] Test deleting character with projects (should fail)
- [ ] Test concurrent edits to same project

### Phase 4: Deployment 🚀 Pending

#### Database
- [ ] Run migration on production database
- [ ] Verify all indexes created correctly
- [ ] Test rollback script works
- [ ] Backup production database before migration

#### Backend Deployment
- [ ] Build backend with new project routes
- [ ] Deploy to production
- [ ] Verify project endpoints accessible
- [ ] Check Passenger logs for errors

#### Frontend Deployment
- [ ] Build frontend with project UI
- [ ] Deploy to production
- [ ] Test project creation/editing end-to-end
- [ ] Monitor browser console for errors

#### Post-Deployment Monitoring
- [ ] Monitor error logs for first 24 hours
- [ ] Test all permission scenarios in production
- [ ] Verify aggregate progress calculations
- [ ] Check database performance under load

---

## Notes

### Recent Changes (2025-11-11)

**Campaign Projects Feature:**
- Added comprehensive design specification in `DESIGN_CAMPAIGN_PROJECTS.md`
- Updated PLANNING.md with campaign projects section
- Created task breakdown for 4-phase implementation
- Key features:
  - Hierarchical project tracking with point goals
  - Character assignment (required, immutable)
  - Role-based permissions (Player/GM/Admin)
  - Aggregate progress calculation
  - Audit trail with history tracking

### Recent Changes (2025-11-04)

**Morning Session:**
- Removed core.ts and orden.ts sourcebook dependencies
- Fixed DamageModifier type errors in verminari.ts
- Corrected feature selection filtering logic in feature-config-panel.tsx
- Fixed smart apostrophe in Ssar'uk language name causing build failure
- Fixed library page showing duplicate Hakaan, Memonek, Time Raider entries
- Fixed white screen runtime error caused by undefined orden sourcebook references
  - Removed SourcebookData.orden from sourcebook-logic.ts getSourcebooks() method
  - Removed 'orden' from settingIDs in 9 example hero files
- Fixed ancestry-data.ts import errors
  - Removed duplicate devil import (line 10)
  - Removed missing dragon-knight import (line 11)
  - Removed dragonKnight static property reference (line 32)

**Afternoon Session (Plumari Integration):**
- Integrated three new Plumari ancestries: Falcar, Strigara, Zefiri
- Added Plumari ancestral culture (Wilderness, Communal, Martial)
- Added Aeryn language (wind-song harmonics and altitude-pitch shifting)
- Fixed zefiri.ts enum error: AbilityDistanceType.Blast → Burst
- Added default exports to all three Plumari ancestry files
- Updated ancestry-data.ts with imports and static properties
- Added all three ancestries to draachenmar.ts sourcebooks array
- Build verification: All changes compiled successfully (10.16s)

### Known Issues

None currently tracked.
