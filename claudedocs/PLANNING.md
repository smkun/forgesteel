# PLANNING.md - Backend Character Storage Implementation

## Vision

Transform Forgesteel from a localStorage-based PWA into a multi-user authenticated system where players manage their own characters, GMs see characters they oversee, and an admin can view all characters. Firebase Authentication will verify users, an SQL database on iFastNet will store character JSON (matching the existing `.ds-hero` format), and role-based visibility will enforce proper access control server-side.

---

## Tech Stack

### Frontend (Existing)
- **React**: 19.2.0 - UI framework
- **TypeScript**: 5.9.3 - Type safety
- **Vite**: 7.1.12 - Build tool
- **LocalForage**: 1.10.0 - Currently used for localStorage (will be replaced by API calls)
- **React Router**: 7.9.4 - Client routing

### Backend (New)
- **Node.js**: 20.19+ (recommended) - Runtime environment
- **Express**: 4.x - API server framework
- **Firebase Admin SDK**: 12.x - Server-side auth token verification
- **mysql2**: 3.x - MySQL client for Node.js
- **dotenv**: 16.x - Environment variable management

### Database
- **MySQL/MariaDB** on iFastNet - Character and user storage
- **JSON** field type (if MySQL ≥ 5.7) or **LONGTEXT** - Character data storage

### Authentication
- **Firebase Authentication** - Client-side user login
- **Firebase ID Tokens** - Passed to backend via Authorization header

### Development Tools
- **SQLTools** (VS Code extension) - Database connection and schema exploration
- **ESLint**: 9.38.0 - Code quality (existing)
- **Vitest**: 4.0.3 - Testing (existing)

---

## Components and Boundaries

### Frontend Components (src/components/)

**New/Modified Components:**

1. **Auth Components** (new: `src/components/auth/`)
   - `LoginPage` - Firebase email/password login UI
   - `AuthProvider` - Context wrapper for authentication state
   - `PrivateRoute` - Route guard requiring authentication
   - Boundary: Client-side only, no business logic

2. **Character List Updates** (`src/components/pages/heroes/hero-list/`)
   - `hero-list-page.tsx` - Replace localStorage with API calls
   - Add scope filter UI: "My Characters" | "GM Characters" | "All Characters" (admin)
   - Add loading/error states
   - Boundary: Presentation layer, calls backend via API client

3. **Character Editor Updates** (`src/components/pages/heroes/hero-edit/`)
   - `hero-edit-page.tsx` - Save/update via POST/PUT to `/api/characters`
   - Add GM assignment field (email input)
   - Boundary: Delegates save operations to API

4. **Admin Toggle** (new: `src/components/controls/admin-toggle/`)
   - Conditional render based on `email === 'scottkunian@gmail.com'`
   - Controls scope parameter for character list API
   - Boundary: UI-only, backend validates scope

### Backend Components (new: `/server/`)

**API Layer** (`/server/routes/`)
- `auth.routes.ts` - `/api/me` endpoint
- `characters.routes.ts` - CRUD endpoints for characters
- Boundary: HTTP layer, validates requests, calls business logic

**Business Logic** (`/server/logic/`)
- `auth.logic.ts` - Firebase token verification, user creation/lookup
- `characters.logic.ts` - Character visibility filtering, ownership checks
- Boundary: Pure business rules, no HTTP concerns

**Data Access** (`/server/data/`)
- `users.repository.ts` - User CRUD operations
- `characters.repository.ts` - Character CRUD operations
- Boundary: SQL query execution, returns plain objects

**Middleware** (`/server/middleware/`)
- `authMiddleware.ts` - Verifies Firebase token, attaches user to request
- `errorHandler.ts` - Centralized error response formatting
- Boundary: Cross-cutting concerns

### Database Schema (`/db/schema.sql`)

**Tables:**
- `users` - Firebase UID, email, display name
- `characters` - Owner FK, GM FK, name cache, JSON blob, soft-delete flag
- Boundary: Persistent storage, accessed only via repositories

---

## External Services and Data Flow

### External Services

1. **Firebase Authentication**
   - Service: Firebase Auth (Google Cloud)
   - Usage: Client login, ID token generation
   - Backend: Firebase Admin SDK verifies tokens
   - Config: Firebase project credentials in `.env.local` (`PRD.md:268-270`)

2. **iFastNet MySQL Database**
   - Service: Hosted MySQL database
   - Connection: Direct TCP connection from Node.js backend
   - Config: `DATABASE_URL` in `.env.local` (`PRD.md:267`)
   - Schema: `db/schema.sql` (`PRD.md:259-263`)

### Data Flow

**Character Save Flow:**
```
User → HeroEditPage → API Client → POST /api/characters
                                   ↓
                         authMiddleware (verify token)
                                   ↓
                         characters.logic (check ownership)
                                   ↓
                         characters.repository (SQL INSERT/UPDATE)
                                   ↓
                         Response (updated character) → Update UI state
```

**Character List Flow:**
```
User → HeroListPage → API Client → GET /api/characters?scope=mine
                                   ↓
                         authMiddleware (verify token, extract user)
                                   ↓
                         characters.logic (filter by owner_user_id OR gm_user_id)
                                   ↓
                         characters.repository (SQL SELECT with WHERE)
                                   ↓
                         Response (array of characters) → Render list
```

**Admin All Characters Flow:**
```
Admin → Toggle "All" → API Client → GET /api/characters?scope=all
                                   ↓
                         authMiddleware (verify token)
                                   ↓
                         characters.logic (check email === scottkunian@gmail.com)
                                   ↓
                         characters.repository (SQL SELECT * without filter)
                                   ↓
                         Response (all characters) → Render list
```

**Authentication Flow:**
```
User → LoginPage → Firebase Client SDK → Firebase Auth Service
                                          ↓
                         ID Token ← Firebase Auth Service
                                          ↓
                         Store token in memory/sessionStorage
                                          ↓
                         GET /api/me (with Authorization: Bearer <token>)
                                          ↓
                         Firebase Admin SDK verifies token
                                          ↓
                         Create/update user in SQL (`users` table)
                                          ↓
                         Response { firebase_uid, email, isAdmin }
```

---

## Key Technical Decisions

### 1. **Firebase for Authentication**
**Rationale:** Firebase Auth provides production-ready user management, token generation, and verification without building custom auth infrastructure. Firebase Admin SDK enables server-side token validation, ensuring client claims can't be spoofed. (`PRD.md:58-63`)

**Trade-off:** Vendor lock-in to Firebase, but acceptable given free tier and existing ecosystem.

### 2. **JSON Column for Character Storage**
**Rationale:** Character data is already exported as `.ds-hero` JSON (`PRD.md:19-20`). Storing as JSON preserves structure without schema migrations for game mechanics changes. MySQL 5.7+ supports native JSON type with indexing and query capabilities. (`PRD.md:66-72`)

**Trade-off:** Less queryable than normalized tables, but character searches are rare (users filter by owner/GM, not character attributes).

### 3. **Soft Delete for Characters**
**Rationale:** Enables recovery from accidental deletion and maintains referential integrity. Storage cost is negligible, and users expect "undo" capability. (`PRD.md:117-120`)

**Trade-off:** Queries must always filter `is_deleted = 0`, but this is a standard pattern.

### 4. **Server-Side Role Validation**
**Rationale:** All access control is enforced server-side to prevent client manipulation. Admin role is derived from email comparison (`scottkunian@gmail.com`), not a database flag, simplifying initial implementation. (`PRD.md:280-284`)

**Trade-off:** Email-based admin check is not scalable for multiple admins, but sufficient for current requirements. Can be migrated to `users.is_admin` flag later.

### 5. **Express Backend in Same Repo**
**Rationale:** Monorepo keeps frontend and backend synchronized, simplifies deployment, and allows code sharing (e.g., TypeScript types for character JSON). Vite can proxy API calls in development. (`PRD.md:210-220`)

**Trade-off:** Larger repo, but avoids complexity of multi-repo orchestration.

### 6. **GM Assignment by Email**
**Rationale:** Users know GMs by email, not database IDs. Backend looks up user by email or creates placeholder. (`PRD.md:99, 203-206`)

**Trade-off:** Requires user lookup on each save, but character saves are infrequent.

### 7. **No Offline-First Sync**
**Rationale:** Out of scope for this PRD (`PRD.md:290`). Simplifies implementation by removing conflict resolution logic. Users must be online to save.

**Trade-off:** Loss of PWA offline-edit capability, but acceptable for initial release.

### 8. **iFastNet Passenger Deployment Architecture** ⚠️ CRITICAL
**Rationale:** Based on production experience with iFastNet shared hosting (CloudLinux + Phusion Passenger), we MUST use the Passenger mount directory pattern instead of reverse proxy attempts. (`PASSENGER_DEPLOYMENT_GUIDE.md`)

**Key Requirements:**
1. **Passenger Mount Directory**: Create `/public_html/forgesteel/api/` with `.htaccess` containing Passenger directives
2. **No Reverse Proxy**: Do NOT attempt Apache reverse proxy to localhost:3000 - Passenger is an application server, not a process manager
3. **Path Normalization**: Passenger sets `PASSENGER_BASE_URI` but doesn't strip it automatically - must normalize in server code
4. **No PORT in .env**: Port conflicts with Passenger's port management - let code handle port selection based on environment detection
5. **Entry Point Wrapper**: Create `server/app.js` that requires actual server file (Passenger expects `app.js` by default)

**Critical Pitfalls to Avoid:**
- ❌ Using `RewriteRule ^api/(.*)$ http://127.0.0.1:3000/$1 [P,L]` (reverse proxy fails)
- ❌ Setting `PORT=3000` in `.env` (conflicts with Passenger port management)
- ❌ Putting Passenger directives in SPA `.htaccess` (confuses which app to serve)
- ❌ Forgetting path normalization (routes never match because paths include base URI)
- ❌ Manual `nohup` background processes (no auto-restart, no Passenger management)

**Implementation Details:**
```javascript
// Detect Passenger environment
const isPassenger = !!(
  process.env.PASSENGER_BASE_URI ||
  process.env.PASSENGER_APP_ENV
);

// Intelligent port selection
const PORT = isPassenger
  ? Number(process.env.PORT || 3000)
  : Number(process.env.PORT || 4000);

// Strip PASSENGER_BASE_URI from request paths
const baseUri = process.env.PASSENGER_BASE_URI || '';
if (baseUri && urlPath.startsWith(baseUri)) {
  urlPath = urlPath.slice(baseUri.length) || '/';
}
```

**Deployment Structure:**
```
/public_html/forgesteel/
├── index.html                 # React SPA
├── assets/                    # Frontend bundles
├── api/                       # ⭐ PASSENGER MOUNT DIRECTORY
│   └── .htaccess             # PassengerAppRoot, PassengerBaseURI
└── .htaccess                 # SPA routing (MUST exclude /api)

/nodejs/forgesteel-api/
├── app.js                    # ⭐ Passenger entry wrapper
├── server/                   # Actual backend code
│   └── index.ts             # Express server
├── package.json              # Production deps only
└── .env                      # NO PORT variable!
```

**Trade-off:** iFastNet-specific deployment complexity vs managed Passenger auto-restart and process lifecycle.

**Reference:** `PASSENGER_DEPLOYMENT_GUIDE.md` - Complete architecture based on production Star Wars d6 API deployment

---

## Open Questions and Risks

### Open Questions

1. **MySQL Version on iFastNet?**
   - **Question:** Does iFastNet support MySQL 5.7+ with native JSON type?
   - **Impact:** Determines whether to use `JSON` or `LONGTEXT` for `character_json` column.
   - **Next Step:** Check iFastNet MySQL version via phpMyAdmin or SQL query `SELECT VERSION();`

2. **Character JSON Size Limits?**
   - **Question:** Sample file includes base64 images. What's max JSON size? (`PRD.md:135`)
   - **Impact:** May need `MEDIUMTEXT` (16MB) or `LONGTEXT` (4GB) instead of `TEXT` (64KB).
   - **Next Step:** Test with sample file size, measure against MySQL column limits.

3. **Firebase Project Already Exists?**
   - **Question:** Do we create a new Firebase project or use an existing one?
   - **Impact:** Affects setup time and configuration.
   - **Next Step:** Confirm Firebase project credentials availability.

4. **How to Handle GM Email Not Found?**
   - **Question:** If GM email doesn't exist, create placeholder user or leave `gm_user_id` NULL? (`PRD.md:203-206`)
   - **Impact:** Affects user lookup logic and future GM visibility.
   - **Next Step:** Decide on Option A (NULL) vs Option B (placeholder user). Recommend Option B for consistency.

5. **Migration Strategy for Existing LocalStorage Data?**
   - **Question:** Should we auto-migrate localStorage characters on first login? (`PRD.md:223-228`)
   - **Impact:** User experience for existing users.
   - **Next Step:** Implement banner: "Import your local characters" with manual upload button.

6. **API Hosting Location?**
   - **Question:** Will Express server run on iFastNet or separate hosting (e.g., Vercel, Railway)?
   - **Impact:** Deployment strategy, CORS configuration.
   - **Next Step:** Determine hosting platform and configure CORS accordingly.

### Risks and Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Firebase token verification fails** | Low | High | Use Firebase Admin SDK best practices, add comprehensive error logging, implement fallback error messages |
| **SQL injection vulnerability** | Medium | High | Use parameterized queries exclusively (mysql2 library), add SQL injection tests |
| **Character JSON exceeds column size** | Medium | Medium | Test with largest sample file, use MEDIUMTEXT/LONGTEXT if needed, validate size on upload |
| **CORS issues with API calls** | Medium | Medium | Configure Express CORS middleware with proper origins, test from dev and prod URLs |
| **iFastNet MySQL connection limits** | Low | Medium | Implement connection pooling (mysql2 pool), add retry logic for transient failures |
| **Admin email hardcoded** | Low | Low | Document limitation, plan migration to `users.is_admin` flag in future release |
| **No offline support breaks PWA** | High | Low | Communicate change via banner, keep legacy localStorage import as fallback |
| **GM assignment creates orphan users** | Medium | Low | Accept trade-off for simplicity, add cleanup task in future (delete users with no characters/logins) |

### Next Steps

**Phase 1: Database & Backend Setup (Week 1)**
1. ✅ Verify iFastNet MySQL version and connection details
2. ✅ Create `db/schema.sql` with `users` and `characters` tables (`PRD.md:177-198`)
3. ✅ Set up Firebase project and obtain Admin SDK credentials
4. ✅ Initialize Express server in `/server/` directory
5. ✅ Implement `authMiddleware.ts` with Firebase token verification
6. ✅ Create `.env.local` template with required variables (`PRD.md:265-270`)

**Phase 2: API Implementation (Week 2)**
1. ✅ Implement `GET /api/me` endpoint (`PRD.md:143-146`)
2. ✅ Implement `GET /api/characters` with scope filtering (`PRD.md:148-155`)
3. ✅ Implement `POST /api/characters` for create/update (`PRD.md:157-169`)
4. ✅ Implement `DELETE /api/characters/:id` for soft delete (`PRD.md:170-172`)
5. ✅ Add error handling middleware and validation

**Phase 3: Frontend Integration (Week 3)**
1. ✅ Create `AuthProvider` context with Firebase client SDK
2. ✅ Build `LoginPage` component
3. ✅ Update `HeroListPage` to call `/api/characters` (`src/components/pages/heroes/hero-list/hero-list-page.tsx`)
4. ✅ Update `HeroEditPage` to POST/PUT characters (`src/components/pages/heroes/hero-edit/hero-edit-page.tsx`)
5. ✅ Add GM assignment field to character editor
6. ✅ Implement admin toggle for "All Characters" view

**Phase 4: VS Code & Documentation (Week 4)**
1. ✅ Create `.vscode/settings.json` with SQLTools connection (`PRD.md:238-257`)
2. ✅ Update `README.md` with setup instructions (`PRD.md:272-275`)
3. ✅ Test all acceptance criteria (`PRD.md:298-305`)
4. ✅ Deploy backend and update frontend to point to production API
5. ✅ Add migration banner for existing localStorage users

---

## Files to Create/Modify

### New Files
- `/server/index.ts` - Express server entry point
- `/server/routes/auth.routes.ts` - Authentication endpoints
- `/server/routes/characters.routes.ts` - Character CRUD endpoints
- `/server/middleware/authMiddleware.ts` - Firebase token verification
- `/server/middleware/errorHandler.ts` - Error response formatting
- `/server/logic/auth.logic.ts` - User creation/lookup logic
- `/server/logic/characters.logic.ts` - Character visibility and ownership
- `/server/data/users.repository.ts` - User database operations
- `/server/data/characters.repository.ts` - Character database operations
- `/db/schema.sql` - Database schema definition
- `/.env.local` - Environment variables (not committed)
- `/.vscode/settings.json` - SQLTools configuration
- `/src/components/auth/LoginPage.tsx` - Login UI
- `/src/components/auth/AuthProvider.tsx` - Auth context
- `/src/components/controls/admin-toggle/AdminToggle.tsx` - Admin UI toggle
- `/src/utils/api-client.ts` - Centralized API call wrapper

### Modified Files
- `/src/components/pages/heroes/hero-list/hero-list-page.tsx` - Replace localStorage with API
- `/src/components/pages/heroes/hero-edit/hero-edit-page.tsx` - Save via API
- `/src/components/main/main.tsx` - Add AuthProvider wrapper
- `/package.json` - Add backend dependencies (express, firebase-admin, mysql2)
- `/vite.config.ts` - Add API proxy for development
- `/README.md` - Add setup instructions
- `/.gitignore` - Add `.env.local`, `/server/dist/`

---

## Success Metrics

**Functional:**
- ✅ User can log in with Firebase (email/password)
- ✅ Character list shows only owned + GM-assigned characters
- ✅ Admin toggle reveals all characters to `scottkunian@gmail.com`
- ✅ Character save writes to SQL database (verified via phpMyAdmin/SQLTools)
- ✅ Character delete soft-deletes in database
- ✅ Character JSON matches `.ds-hero` format

**Technical:**
- ✅ All API calls verified server-side (no client trust)
- ✅ SQLTools connects to iFastNet database from VS Code
- ✅ Zero SQL injection vulnerabilities (parameterized queries only)
- ✅ Response times < 500ms for character list (< 100 characters)
- ✅ Firebase token verification succeeds 100% for valid tokens

**User Experience:**
- ✅ Migration banner guides existing users to import localStorage characters
- ✅ Error messages are clear and actionable
- ✅ Loading states prevent confusion during API calls
- ✅ No data loss during transition from localStorage to SQL

---

---

## Campaign Project Tracking System

### Vision

Add a hierarchical project tracking system to campaigns where GMs and players can create projects with point-based goals, track progress, and organize large projects into sub-projects. Players can create and manage projects for their own characters, while GMs can manage all projects in their campaigns.

### Feature Overview

**Core Capabilities:**
- **Project Goals**: Each project has a numeric target (goal points) and tracks current progress
- **Hierarchical Structure**: Large projects broken into sub-projects (e.g., 2000 point project = 500 + 250 + 1250 sub-projects)
- **Character Assignment**: Every project MUST be assigned to the character who started it (immutable, required field)
- **Role-Based Management**:
  - **Players**: Create/edit/delete projects for their own characters only
  - **GMs**: Create/edit/delete projects for any character in the campaign
  - **Admins**: Full access to all projects
- **Progress Tracking**: Manual point updates with history tracking
- **Aggregate Progress**: Parent project progress calculated from sum of all sub-project progress

### Database Schema

**New Table: `campaign_projects`**
```sql
CREATE TABLE IF NOT EXISTS `campaign_projects` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT UNSIGNED NOT NULL,
  `parent_project_id` INT UNSIGNED NULL,
  `character_id` INT UNSIGNED NOT NULL, -- REQUIRED, who started project
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `goal_points` INT UNSIGNED NOT NULL DEFAULT 0,
  `current_points` INT UNSIGNED NOT NULL DEFAULT 0,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by_user_id` INT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` DATETIME NULL,

  CONSTRAINT `fk_campaign_projects_character`
    FOREIGN KEY (`character_id`)
    REFERENCES `characters` (`id`)
    ON DELETE RESTRICT, -- Cannot delete character with projects

  -- Self-referential for hierarchy
  CONSTRAINT `fk_campaign_projects_parent`
    FOREIGN KEY (`parent_project_id`)
    REFERENCES `campaign_projects` (`id`)
    ON DELETE CASCADE
);
```

**Audit Table: `campaign_project_history` (Optional)**
- Tracks all changes to projects (progress updates, goal changes, completion)
- Records user_id, action type, previous/new values, notes

### API Endpoints

**Read Operations:**
- `GET /api/campaigns/:campaignId/projects` - Get all projects (hierarchical or flat)
- `GET /api/campaigns/:campaignId/projects/:projectId` - Get single project with details

**Write Operations (Permission-Based):**
- `POST /api/campaigns/:campaignId/projects` - Create project
  - Players: Can only create for own characters
  - GMs: Can create for any campaign character
  - Admins: Can create for any character
- `PUT /api/campaigns/:campaignId/projects/:projectId` - Update project details
- `PATCH /api/campaigns/:campaignId/projects/:projectId/progress` - Update progress
- `POST /api/campaigns/:campaignId/projects/:projectId/complete` - Mark complete
- `DELETE /api/campaigns/:campaignId/projects/:projectId` - Soft delete
- `POST /api/campaigns/:campaignId/projects/:projectId/reorder` - Update display order (GM/Admin only)

### Frontend Components

**New Components:**
1. **ProjectList** - Hierarchical project tree with progress bars
2. **ProjectCard** - Individual project display with progress visualization
3. **ProjectForm** - Create/edit modal with:
   - Character selector (dropdown filtered by role)
   - Parent project selector (for sub-projects)
   - Name, description, goal points inputs
   - Character field is REQUIRED and immutable after creation
4. **ProgressUpdateModal** - Quick progress update with notes

**UI Features:**
- Expand/collapse sub-projects
- Visual progress bars with percentage
- Quick progress buttons (+1, +5, +10, custom)
- Drag-and-drop reordering (GM/Admin only)
- Character name display (not full character details)

### Business Rules

1. **Character Assignment**:
   - REQUIRED field (cannot create without character)
   - Immutable (set once on creation, cannot change)
   - Character must be in same campaign
   - Dropdown filtered by user role:
     - Players: See only own characters
     - GMs/Admins: See all campaign characters
   - ON DELETE RESTRICT (cannot delete character with active projects)

2. **Sub-Project Structure**:
   - Sub-project goals should sum to parent goal
   - Example: Parent (2000 pts) = Sub1 (500) + Sub2 (250) + Sub3 (1250) = 2000 total
   - Parent progress = sum of all sub-project current points
   - Max 3 levels of nesting recommended

3. **Progress Updates**:
   - Cannot exceed goal points
   - History entry created for each update
   - Optional auto-complete when goal reached

4. **Permissions**:
   - Players: Manage own character's projects only
   - GMs: Manage all projects in campaign
   - Admins: Manage all projects
   - Viewing: All campaign members can view all projects

### Implementation Phases

**Phase 1: Database & Backend (Week 1)**
1. Create migration `002_add_campaign_projects.sql`
2. Implement `server/data/projects.repository.ts`
3. Implement `server/logic/project.logic.ts` with permission checks
4. Create `server/routes/project.routes.ts` with all endpoints
5. Add validation and error handling
6. Write unit tests for business logic

**Phase 2: Frontend Integration (Week 2)**
1. Create TypeScript types in `src/types/campaign.types.ts`
2. Create API service `src/services/project.service.ts`
3. Build UI components (ProjectList, ProjectCard, ProjectForm, ProgressUpdateModal)
4. Add project tab to campaign detail view
5. Implement drag-and-drop reordering
6. Add loading/error states

**Phase 3: Testing & Polish (Week 3)**
1. Integration testing for all API endpoints
2. Test permission enforcement (player vs GM vs admin)
3. Test hierarchy validation (circular refs, max depth)
4. Test aggregate progress calculation
5. E2E testing with Playwright
6. Performance testing with large project trees

**Phase 4: Deployment**
1. Run migration on production database
2. Deploy backend with new routes
3. Deploy frontend with project UI
4. Monitor for errors in first 24 hours

### Key Technical Decisions

**1. Character Name Only (Not Full Object)**
- **Rationale**: Only need to display who started the project, not all character details
- **Implementation**: JOIN with characters table to get name only
- **Trade-off**: Simpler data model, faster queries

**2. Immutable Character Assignment**
- **Rationale**: Track who initiated project, not current ownership
- **Implementation**: Set on creation, field disabled in edit mode
- **Trade-off**: Cannot reassign projects, but clearer accountability

**3. Required Character Assignment**
- **Rationale**: Every project must have an initiating character
- **Implementation**: NOT NULL constraint, validation on creation
- **Trade-off**: Cannot create "campaign-wide" projects without character

**4. Aggregate Progress Calculation**
- **Rationale**: Parent progress reflects all sub-project work
- **Implementation**: Recursive CTE to sum all descendant points
- **Trade-off**: More complex queries, but accurate hierarchy tracking

**5. ON DELETE RESTRICT for Characters**
- **Rationale**: Prevent data loss when deleting characters with projects
- **Implementation**: Foreign key constraint prevents character deletion
- **Trade-off**: Must reassign/delete projects before deleting character

### Open Questions

1. **Max Hierarchy Depth**: Enforce at DB or application layer? (Recommend: application with 3 levels)
2. **Auto-Complete**: Auto-mark complete when goal reached? (Recommend: manual for explicit confirmation)
3. **Bulk Operations**: Support bulk progress updates? (Defer to future release)
4. **Notifications**: Notify campaign when projects complete? (Defer to future release)

### Success Metrics

**Functional:**
- Players can create projects for own characters
- GMs can create projects for any campaign character
- Character dropdown shows correct characters based on role
- Sub-project progress aggregates to parent correctly
- Permission checks prevent unauthorized edits

**Technical:**
- All queries use parameterized statements (no SQL injection)
- Response times < 500ms for project list (< 100 projects)
- Aggregate progress calculations complete in < 200ms
- No circular reference bugs in hierarchy

**User Experience:**
- Character assignment is clear and intuitive
- Progress visualization is clear and helpful
- Hierarchy navigation is smooth (expand/collapse)
- Error messages guide users to fix issues

---

**References:**
- Design Specification: `claudedocs/DESIGN_CAMPAIGN_PROJECTS.md`
- Migration SQL: `db/migrations/002_add_campaign_projects.sql` (to be created)
- PRD: `/PRD.md`
- Current State: `src/components/main/main.tsx:252` (localStorage usage)
- Character Model: `src/models/hero.ts`
- Factory Logic: `src/logic/factory-logic.ts`
- Update Logic: `src/logic/update/hero-update-logic.ts`
