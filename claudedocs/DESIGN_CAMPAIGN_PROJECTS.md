# Campaign Project Tracking System - Design Specification

**Feature**: Track projects within campaigns with hierarchical goals and progress tracking
**Date**: 2025-11-11
**Status**: Design Phase
**Updated**: 2025-11-11 - Added character assignment (immutable, tracks who started project)

---

## 1. Requirements Analysis

### 1.1 Core Requirements

- **Project Goals**: Each project has a numeric goal (target points)
- **Progress Tracking**: Track current points toward the goal
- **Hierarchical Structure**: Large projects can contain sub-projects
  - Example: Large project (2000 points) = Sub-project 1 (500 points) + Sub-project 2 (250 points) + ... = 2000 total
  - Sub-project goals should sum to parent goal
- **Campaign Association**: Projects belong to specific campaigns
- **Aggregate Progress**: Parent project progress calculated from sum of all sub-project progress

### 1.2 User Stories

1. **As a GM**, I want to create a project for my campaign with a point goal
2. **As a GM**, I want to track progress on projects by adding points
3. **As a GM**, I want to create sub-projects under larger projects for complex goals
4. **As a GM/Player**, I want to see project completion percentage
5. **As a GM/Player**, I want to see the project hierarchy and progress at a glance
6. **As a GM**, I want to mark projects as completed or archived
7. **As a GM**, I want to reorder projects for display priority

### 1.3 Business Rules

- **Project Creation Permissions**:
  - **Players**: Can create projects for their own characters only
  - **GMs**: Can create projects for any character in the campaign
  - **Admins**: Can create projects for any character in any campaign
- **Project Management**: GMs and admins can edit/delete any projects; players can only edit/delete their own character's projects
- **Viewing**: All campaign members (GMs and players) can view all projects
- **Character assignment**: Every project MUST be assigned to a character who started it
  - Character must be in the same campaign
  - Character selection shown as dropdown:
    - **Players**: See only their own characters
    - **GMs/Admins**: See all campaign characters
  - **Required field**: Cannot create project without character
  - **Immutable**: Once set on creation, cannot be changed
- **Sub-project structure**: Sub-project goals should sum to parent goal
  - Example: Parent project 2000 points = Sub-project 1 (500 pts) + Sub-project 2 (250 pts) + Sub-project 3 (1250 pts) = 2000 total
  - Parent progress calculated as sum of all sub-project current points
- Projects can be nested multiple levels deep (recommend max 3 levels)
- Soft-delete for projects (preserve history)
- Progress cannot exceed goal (validation)

---

## 2. Database Schema Design

### 2.1 campaign_projects Table

```sql
CREATE TABLE IF NOT EXISTS `campaign_projects` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT UNSIGNED NOT NULL COMMENT 'Campaign this project belongs to',
  `parent_project_id` INT UNSIGNED NULL COMMENT 'Parent project ID for sub-projects',
  `character_id` INT UNSIGNED NOT NULL COMMENT 'Character who started/owns this project (required)',
  `name` VARCHAR(255) NOT NULL COMMENT 'Project name',
  `description` TEXT NULL COMMENT 'Project description/details',
  `goal_points` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Target points to complete',
  `current_points` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Current progress points',
  `display_order` INT NOT NULL DEFAULT 0 COMMENT 'Sort order for display',
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Manual completion flag',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  `created_by_user_id` INT UNSIGNED NOT NULL COMMENT 'User who created the project',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` DATETIME NULL COMMENT 'When project was marked complete',

  -- Foreign key constraints
  CONSTRAINT `fk_campaign_projects_campaign`
    FOREIGN KEY (`campaign_id`)
    REFERENCES `campaigns` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_campaign_projects_parent`
    FOREIGN KEY (`parent_project_id`)
    REFERENCES `campaign_projects` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_campaign_projects_character`
    FOREIGN KEY (`character_id`)
    REFERENCES `characters` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT `fk_campaign_projects_creator`
    FOREIGN KEY (`created_by_user_id`)
    REFERENCES `users` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  -- Constraints
  CONSTRAINT `chk_progress_not_exceed_goal`
    CHECK (`current_points` <= `goal_points`),

  CONSTRAINT `chk_no_self_parent`
    CHECK (`parent_project_id` != `id`),

  -- Indexes for performance
  INDEX `idx_campaign_id` (`campaign_id`),
  INDEX `idx_parent_project_id` (`parent_project_id`),
  INDEX `idx_character_id` (`character_id`),
  INDEX `idx_created_by` (`created_by_user_id`),
  INDEX `idx_is_deleted` (`is_deleted`),
  INDEX `idx_is_completed` (`is_completed`),
  INDEX `idx_display_order` (`display_order`),

  -- Composite indexes for common queries
  INDEX `idx_campaign_active` (`campaign_id`, `is_deleted`, `is_completed`),
  INDEX `idx_campaign_hierarchy` (`campaign_id`, `parent_project_id`, `display_order`),
  INDEX `idx_character_projects` (`character_id`, `is_deleted`, `is_completed`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 campaign_project_history Table (Optional - Audit Trail)

```sql
CREATE TABLE IF NOT EXISTS `campaign_project_history` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL COMMENT 'User who made the change',
  `action` ENUM('created', 'updated_progress', 'updated_goal', 'completed', 'deleted') NOT NULL,
  `previous_points` INT UNSIGNED NULL COMMENT 'Points before change',
  `new_points` INT UNSIGNED NULL COMMENT 'Points after change',
  `notes` TEXT NULL COMMENT 'Optional notes about the change',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  CONSTRAINT `fk_project_history_project`
    FOREIGN KEY (`project_id`)
    REFERENCES `campaign_projects` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT `fk_project_history_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Indexes
  INDEX `idx_project_id` (`project_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.3 Schema Relationships

```
campaigns (1) ──< (many) campaign_projects
    │
    └──< (many) campaign_members

characters (1) ──< (many) campaign_projects [REQUIRED]
    │
    └──> (1) campaigns (via campaign_id)

campaign_projects
    │
    ├── self-referential (parent_project_id)
    ├──< (many) campaign_project_history
    ├──> (1) users (created_by_user_id)
    └──> (1) characters (character_id) [REQUIRED, ON DELETE RESTRICT]
```

---

## 3. API Design

### 3.1 RESTful Endpoints

#### GET /api/campaigns/:campaignId/projects

**Purpose**: Get all projects for a campaign (with hierarchy)

**Authentication**: Required
**Authorization**: Campaign member (GM or player)

**Query Parameters**:

- `includeDeleted` (boolean) - Include soft-deleted projects (GM only)
- `includeCompleted` (boolean) - Include completed projects (default: true)
- `flat` (boolean) - Return flat list instead of hierarchical structure

**Response**:

```typescript
{
  count: number;
  projects: Project[]; // Hierarchical structure with nested children
}

interface Project {
  id: number;
  campaignId: number;
  parentProjectId: number | null;
  characterId: number | null; // Character who started/owns this project
  name: string;
  description: string | null;
  goalPoints: number;
  currentPoints: number;
  progressPercentage: number; // Calculated: (current / goal) * 100
  displayOrder: number;
  isCompleted: boolean;
  completedAt: string | null;
  createdBy: {
    id: number;
    email: string;
    displayName: string | null;
  };
  characterName: string; // Name of character who started the project
  createdAt: string;
  updatedAt: string;

  // Calculated fields
  children?: Project[]; // Sub-projects (if hierarchical response)
  aggregateProgress?: {
    totalGoalPoints: number;
    totalCurrentPoints: number;
    totalPercentage: number;
  };
}
```

---

#### POST /api/campaigns/:campaignId/projects

**Purpose**: Create a new project

**Authentication**: Required
**Authorization**:

- **Players**: Can create projects for their own characters only
- **GMs**: Can create projects for any character in campaign
- **Admins**: Can create projects for any character

**Request Body**:

```typescript
{
  name: string; // Required, max 255 chars
  description?: string | null;
  goalPoints: number; // Required, must be > 0
  currentPoints?: number; // Optional, default 0
  parentProjectId?: number | null; // Optional, for sub-projects
  characterId: number; // REQUIRED, character who started project
  displayOrder?: number; // Optional, default 0
}
```

**Validation**:

- `name`: Required, 1-255 characters
- `goalPoints`: Required, positive integer
- `currentPoints`: Optional, must be <= goalPoints
- `parentProjectId`: Must exist and belong to same campaign
- `characterId`: **REQUIRED**, must exist and belong to same campaign
- **Permission check**:
  - If player: `characterId` must be owned by requesting user
  - If GM: `characterId` must be in the campaign
  - If admin: no restriction
- Campaign must exist and user must be a member

**Response**: `201 Created` with created project object

---

#### GET /api/campaigns/:campaignId/projects/:projectId

**Purpose**: Get a specific project with full details

**Authentication**: Required
**Authorization**: Campaign member

**Query Parameters**:

- `includeHistory` (boolean) - Include change history (GM only)
- `includeChildren` (boolean) - Include all descendant projects recursively

**Response**: Project object with optional history array

---

#### PUT /api/campaigns/:campaignId/projects/:projectId

**Purpose**: Update project details

**Authentication**: Required
**Authorization**:

- **Players**: Can update only their own character's projects
- **GMs**: Can update any project in campaign
- **Admins**: Can update any project

**Request Body**:

```typescript
{
  name?: string;
  description?: string | null;
  goalPoints?: number;
  displayOrder?: number;
  parentProjectId?: number | null; // Can reparent projects
}
```

**Validation**:

- Cannot set `parentProjectId` to create circular reference
- Cannot exceed max nesting depth (recommend 3 levels)
- If changing `goalPoints`, cannot be less than `currentPoints`

**Note**: `characterId` is **immutable** - set on project creation, cannot be changed afterward

**Response**: `200 OK` with updated project

---

#### PATCH /api/campaigns/:campaignId/projects/:projectId/progress

**Purpose**: Update project progress

**Authentication**: Required
**Authorization**:

- **Players**: Can update progress for their own character's projects
- **GMs**: Can update progress for any project in campaign
- **Admins**: Can update progress for any project

**Request Body**:

```typescript
{
  currentPoints: number; // New current points value
  notes?: string; // Optional notes for history
  incrementBy?: number; // Alternative: increment instead of set
}
```

**Validation**:

- Must provide either `currentPoints` or `incrementBy`
- Result cannot exceed `goalPoints`
- Result cannot be negative

**Side Effects**:

- Creates entry in `campaign_project_history`
- Updates `updated_at` timestamp
- If `currentPoints` reaches `goalPoints`, optionally auto-complete

**Response**: `200 OK` with updated project and new progress percentage

---

#### POST /api/campaigns/:campaignId/projects/:projectId/complete

**Purpose**: Mark project as completed

**Authentication**: Required
**Authorization**:

- **Players**: Can complete their own character's projects
- **GMs**: Can complete any project in campaign
- **Admins**: Can complete any project

**Request Body**:

```typescript
{
  notes?: string; // Optional completion notes
}
```

**Side Effects**:

- Sets `isCompleted = true`
- Sets `completedAt = NOW()`
- Creates history entry with action='completed'

**Response**: `200 OK` with updated project

---

#### DELETE /api/campaigns/:campaignId/projects/:projectId

**Purpose**: Soft-delete a project

**Authentication**: Required
**Authorization**:

- **Players**: Can delete their own character's projects
- **GMs**: Can delete any project in campaign
- **Admins**: Can delete any project

**Query Parameters**:

- `permanent` (boolean) - Permanently delete (admin only)

**Side Effects**:

- Sets `is_deleted = true` (soft delete)
- Cascades to all child projects
- Creates history entry with action='deleted'

**Response**: `204 No Content`

---

#### POST /api/campaigns/:campaignId/projects/:projectId/reorder

**Purpose**: Update display order for projects

**Authentication**: Required
**Authorization**:

- **GMs**: Can reorder any project in campaign
- **Admins**: Can reorder any project
- **Players**: Cannot reorder (requires campaign-wide coordination)

**Request Body**:

```typescript
{
  newOrder: number; // New display_order value
  // OR
  moveAfter?: number | null; // Project ID to move after (null = first)
}
```

**Response**: `200 OK` with updated project list showing new order

---

### 3.2 Response Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH, or action |
| 201 | Created | Successful POST (project created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, invalid data |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not a campaign GM |
| 404 | Not Found | Campaign or project doesn't exist |
| 409 | Conflict | Circular reference, constraint violation |
| 500 | Internal Server Error | Server-side error |

---

## 4. Business Logic Layer

### 4.1 Core Functions (server/logic/project.logic.ts)

```typescript
// Get all projects for campaign with hierarchy
export async function getCampaignProjects(
  campaignId: number,
  options: {
    includeDeleted?: boolean;
    includeCompleted?: boolean;
    flat?: boolean;
  }
): Promise<Project[]>;

// Calculate aggregate progress for project with children
export async function calculateAggregateProgress(
  projectId: number
): Promise<AggregateProgress>;

// Validate project hierarchy (no circular refs, max depth)
export async function validateProjectHierarchy(
  projectId: number,
  newParentId: number | null
): Promise<boolean>;

// Build hierarchical tree from flat project list
export function buildProjectTree(projects: Project[]): Project[];

// Update project progress and create history
export async function updateProjectProgress(
  projectId: number,
  userId: number,
  currentPoints: number,
  notes?: string
): Promise<Project>;

// Auto-complete project when goal reached
export async function checkAutoComplete(
  projectId: number
): Promise<boolean>;
```

### 4.2 Data Access Layer (server/data/projects.repository.ts)

```typescript
export interface ProjectRow {
  id: number;
  campaign_id: number;
  parent_project_id: number | null;
  name: string;
  description: string | null;
  goal_points: number;
  current_points: number;
  display_order: number;
  is_completed: boolean;
  is_deleted: boolean;
  created_by_user_id: number;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

// CRUD operations
export async function findById(id: number): Promise<ProjectRow | null>;
export async function findByCampaign(campaignId: number, includeDeleted: boolean): Promise<ProjectRow[]>;
export async function findByParent(parentId: number | null, campaignId: number): Promise<ProjectRow[]>;
export async function create(data: CreateProjectData): Promise<ProjectRow>;
export async function update(id: number, data: Partial<ProjectRow>): Promise<ProjectRow>;
export async function softDelete(id: number): Promise<void>;
export async function updateProgress(id: number, currentPoints: number): Promise<ProjectRow>;

// Hierarchy queries
export async function getProjectDepth(id: number): Promise<number>;
export async function getDescendants(id: number): Promise<ProjectRow[]>;
export async function getAncestors(id: number): Promise<ProjectRow[]>;

// History
export async function createHistoryEntry(data: HistoryEntryData): Promise<void>;
export async function getHistory(projectId: number): Promise<HistoryRow[]>;
```

---

## 5. Frontend Integration

### 5.1 TypeScript Types (src/types/campaign.types.ts)

```typescript
export interface CampaignProject {
  id: number;
  campaignId: number;
  parentProjectId: number | null;
  characterId: number | null; // Character who started the project (immutable)
  name: string;
  description: string | null;
  goalPoints: number;
  currentPoints: number;
  progressPercentage: number;
  displayOrder: number;
  isCompleted: boolean;
  completedAt: string | null;
  createdBy: UserSummary;
  characterName: string; // Name of character who started the project
  createdAt: string;
  updatedAt: string;

  // Optional nested data
  children?: CampaignProject[];
  aggregateProgress?: {
    totalGoalPoints: number;
    totalCurrentPoints: number;
    totalPercentage: number;
  };
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  goalPoints: number;
  currentPoints?: number;
  parentProjectId?: number | null;
  characterId: number; // REQUIRED: Character who started project (set once, cannot change)
  displayOrder?: number;
}

export interface UpdateProgressRequest {
  currentPoints?: number;
  incrementBy?: number;
  notes?: string;
}
```

### 5.2 UI Components (Recommended)

**ProjectList Component**:

- Display hierarchical project tree
- Show progress bars with percentage
- Expand/collapse sub-projects
- Reorder via drag-and-drop
- Quick progress update buttons (+1, +5, +10, custom)

**ProjectCard Component**:

- Project name, description
- Progress bar (visual)
- Current/Goal points display
- Completion percentage
- Edit/Delete actions (GM only)
- Completion toggle

**ProjectForm Component**:

- Create/Edit project modal
- Parent project selector (dropdown with hierarchy)
- **Character selector** (dropdown with campaign characters only)
  - **REQUIRED field** (cannot create project without character)
  - Filtered based on user role:
    - **Players**: See only their own characters
    - **GMs/Admins**: See all characters in campaign
  - Shows character name only
  - **Immutable**: Disabled in edit mode (cannot be changed after creation)
- Name, description, goal points inputs
- Display order input
- Validation feedback

**ProgressUpdateModal**:

- Current progress display
- Input for new points or increment
- Notes field for history
- Preview of new percentage
- Confirm/Cancel actions

---

## 6. Data Flow Diagrams

### 6.1 Create Project Flow

```
User (Player/GM/Admin) → Frontend Form → API POST /campaigns/:id/projects
                                              ↓
                                  Validate permissions:
                                  - Player: characterId must be own character
                                  - GM: characterId must be in campaign
                                  - Admin: no restriction
                                              ↓
                                  Validate data (name, goal > 0, characterId required)
                                              ↓
                                  Validate parent exists (if sub-project)
                                              ↓
                                  Validate character exists and in campaign
                                              ↓
                                  Check hierarchy depth
                                              ↓
                                  Create DB record
                                              ↓
                                  Create history entry
                                              ↓
                                  Return created project → Frontend → Update UI
```

### 6.2 Update Progress Flow

```
User (Player/GM/Admin) → Frontend → API PATCH /projects/:id/progress
                                          ↓
                                  Validate permissions:
                                  - Player: project must be own character's
                                  - GM: project must be in campaign
                                  - Admin: no restriction
                                          ↓
                                  Validate points <= goal
                                          ↓
                                  Update current_points
                                          ↓
                                  Create history entry
                                          ↓
                                  Check auto-complete?
                                          ↓
                                  Calculate aggregate progress (parents)
                                          ↓
                                  Return updated project → Frontend → Update UI
```

### 6.3 Hierarchical Query Flow

```
API GET /campaigns/:id/projects → Fetch all campaign projects
                                        ↓
                                Include creator user data (JOIN)
                                        ↓
                                Filter by deleted/completed
                                        ↓
                                Build hierarchy tree (recursive)
                                        ↓
                                Calculate aggregate progress for each
                                        ↓
                                Return tree structure → Frontend → Render tree
```

---

## 7. Migration Strategy

### 7.1 Migration File: `002_add_campaign_projects.sql`

```sql
-- See Section 2.1 and 2.2 for full schema
-- Add migration metadata
-- Add rollback scripts
```

### 7.2 Migration Checklist

- [ ] Create migration SQL file
- [ ] Test migration on development database
- [ ] Verify indexes and foreign keys
- [ ] Test rollback script
- [ ] Run on production (after deployment)
- [ ] Verify no data corruption
- [ ] Monitor performance impact

---

## 8. Testing Strategy

### 8.1 Unit Tests

- Project CRUD operations
- Hierarchy validation (circular refs, max depth)
- Progress calculation logic
- Aggregate progress for nested projects
- Permission checks (GM vs player)

### 8.2 Integration Tests

- API endpoint responses
- Database constraint enforcement
- Foreign key cascades
- Soft delete behavior
- History entry creation

### 8.3 Edge Cases to Test

- Circular parent reference attempts
- Deep nesting (> 3 levels)
- Progress exceeding goal
- Negative progress values
- Reparenting projects
- Deleting parent project (cascade to children)
- Concurrent progress updates
- Auto-completion logic

---

## 9. Performance Considerations

### 9.1 Indexing Strategy

- Composite index on `(campaign_id, is_deleted, is_completed)` for filtering
- Index on `parent_project_id` for hierarchy queries
- Index on `display_order` for sorting
- Consider covering index for common SELECT patterns

### 9.2 Query Optimization

- Use recursive CTEs for deep hierarchy traversal
- Limit recursion depth (max 3-5 levels)
- Eager load related data (creator, parent) with JOINs
- Consider caching aggregate progress for parent projects
- Use pagination for large project lists (if needed)

### 9.3 Scalability

- History table will grow linearly with updates
- Consider archiving old history entries (> 1 year)
- Monitor query performance with > 100 projects per campaign
- Consider denormalizing aggregate progress if calculations are slow

---

## 10. Security Considerations

### 10.1 Access Control

- **Read**: Any campaign member (GM or player)
- **Create**:
  - **Players**: Can create projects for their own characters only
  - **GMs**: Can create projects for any character in campaign
  - **Admins**: Can create projects for any character
- **Update/Progress/Complete/Delete**:
  - **Players**: Can manage their own character's projects only
  - **GMs**: Can manage any project in campaign
  - **Admins**: Can manage any project
- **Reorder**: GMs and Admins only (requires campaign-wide coordination)
- **History**: GMs and Admins only (may contain sensitive notes)
- **Character Assignment**:
  - REQUIRED field (cannot create project without character)
  - Immutable (set on creation, cannot be changed)
  - Filtered dropdown: Players see own characters, GMs/Admins see all campaign characters
  - ON DELETE RESTRICT (cannot delete character with active projects)

### 10.2 Data Validation

- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize description, notes)
- Input length limits (name: 255, description: TEXT)
- Numeric range validation (points >= 0)
- Prevent resource exhaustion (limit project count per campaign)

### 10.3 Audit Trail

- History table tracks all changes
- Records user_id and timestamp
- Immutable history (INSERT only, no UPDATE/DELETE)
- Retention policy (archive after N months)

---

## 11. Future Enhancements (Out of Scope)

### 11.1 Potential Features

- **Project Templates**: Pre-defined project structures
- **Milestone Rewards**: Trigger events when goals reached
- **Progress Decay**: Auto-decrease points over time
- **Character Contributions**: Track which characters contributed points
- **Project Tags/Categories**: Organize projects by type
- **Progress Graphs**: Visual charts of progress over time
- **Deadline Tracking**: Due dates for projects
- **Project Sharing**: Share projects across campaigns

### 11.2 Advanced Hierarchy

- **Multi-parent Projects**: Project can contribute to multiple parents
- **Weighted Sub-projects**: Some sub-projects count more toward parent
- **Parallel Tracking**: Different point types (gold, XP, reputation)

---

## 12. Implementation Checklist

### 12.1 Database Layer

- [ ] Create migration file `002_add_campaign_projects.sql`
- [ ] Test migration on dev database
- [ ] Create rollback script
- [ ] Document schema in migration file

### 12.2 Backend Implementation

- [ ] Create `server/data/projects.repository.ts` (data access)
- [ ] Create `server/logic/project.logic.ts` (business logic)
- [ ] Create `server/routes/project.routes.ts` (API endpoints)
- [ ] Register routes in `server/index.ts`
- [ ] Write unit tests for business logic
- [ ] Write integration tests for API endpoints

### 12.3 Frontend Implementation

- [ ] Create TypeScript types in `src/types/campaign.types.ts`
- [ ] Create API service in `src/services/project.service.ts`
- [ ] Create UI components (ProjectList, ProjectCard, ProjectForm)
- [ ] Add project tab to campaign detail view
- [ ] Implement drag-and-drop reordering
- [ ] Add progress update UI
- [ ] Add project creation modal

### 12.4 Documentation

- [ ] Update API documentation
- [ ] Update user guide with project feature
- [ ] Create GM guide for project management
- [ ] Document hierarchy best practices

### 12.5 Deployment

- [ ] Build and test locally
- [ ] Deploy backend to production
- [ ] Run migration on production database
- [ ] Deploy frontend to production
- [ ] Verify functionality end-to-end
- [ ] Monitor for errors in first 24 hours

---

## 13. Open Questions

1. **Max Hierarchy Depth**: Recommend 3 levels. Enforce at DB or application layer?
2. **Auto-Complete**: Should reaching goal auto-mark complete, or manual action?
3. **Progress Decay**: Should old projects lose points over time?
4. **Bulk Operations**: Support bulk progress updates for multiple projects?
5. **Permissions**: Should players be able to propose progress updates (pending GM approval)?
6. **Notifications**: Notify campaign members when projects complete?
7. **Display**: Show projects in tree view, list view, or both?

---

## Appendices

### A. SQL Queries Reference

**Get all characters in campaign (for dropdown)**:

```sql
SELECT c.id, c.name
FROM characters c
WHERE c.campaign_id = ?
  AND c.is_deleted = 0
ORDER BY c.name;
```

**Get all top-level projects for campaign with character name**:

```sql
SELECT
  p.*,
  c.name as character_name
FROM campaign_projects p
LEFT JOIN characters c ON p.character_id = c.id
WHERE p.campaign_id = ?
  AND p.parent_project_id IS NULL
  AND p.is_deleted = 0
ORDER BY p.display_order;
```

**Get project with aggregate progress (recursive CTE)**:

```sql
WITH RECURSIVE project_tree AS (
  -- Base case: selected project
  SELECT id, parent_project_id, goal_points, current_points
  FROM campaign_projects
  WHERE id = ?

  UNION ALL

  -- Recursive case: all descendants
  SELECT p.id, p.parent_project_id, p.goal_points, p.current_points
  FROM campaign_projects p
  INNER JOIN project_tree pt ON p.parent_project_id = pt.id
)
SELECT
  SUM(goal_points) as total_goal,
  SUM(current_points) as total_current,
  (SUM(current_points) / SUM(goal_points) * 100) as total_percentage
FROM project_tree;
```

**Check for circular reference**:

```sql
WITH RECURSIVE ancestors AS (
  SELECT id, parent_project_id FROM campaign_projects WHERE id = ?
  UNION ALL
  SELECT p.id, p.parent_project_id
  FROM campaign_projects p
  INNER JOIN ancestors a ON p.id = a.parent_project_id
)
SELECT COUNT(*) as circular FROM ancestors WHERE id = ?; -- should be 0
```

---

**End of Design Specification**
