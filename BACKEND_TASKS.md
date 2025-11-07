# BACKEND_TASKS.md - Backend Character Storage Implementation Checklist

**Project Start Date:** 2025-11-07
**Target Completion:** 2025-12-05 (4 weeks)
**Last Updated:** 2025-11-07 (Infrastructure setup completed - 10/183 tasks, 5%)

---

## Milestone 1: Database & Infrastructure Setup (Week 1)

### Database Setup
- [x] Verify iFastNet MySQL version and connection details
  **Completed:** 2025-11-07

- [x] Create `db/schema.sql` with `users` table definition
  **Completed:** 2025-11-07

- [x] Create `db/schema.sql` with `characters` table definition
  **Completed:** 2025-11-07

- [x] Add foreign key constraints to schema
  **Completed:** 2025-11-07

- [x] Test schema creation on iFastNet database
  **Completed:** 2025-11-07

- [x] Verify JSON column support (or use LONGTEXT)
  **Completed:** 2025-11-07

### Firebase Setup
- [x] Create Firebase project for authentication
  **Completed:** 2025-11-07

- [x] Enable email/password authentication in Firebase Console
  **Completed:** 2025-11-07

- [x] Download Firebase Admin SDK credentials JSON
  **Completed:** 2025-11-07

- [x] Add Firebase config to `.env.local` template
  **Completed:** 2025-11-07

- [x] Test Firebase Admin SDK connection
  **Completed:** 2025-11-07

### Backend Project Setup
- [x] Initialize `/server/` directory structure
  **Completed:** 2025-11-07

- [x] Add backend dependencies to `package.json` (express, firebase-admin, mysql2, dotenv)
  **Completed:** 2025-11-07

- [x] Create `server/tsconfig.json` for backend TypeScript
  **Completed:** 2025-11-07

- [x] Create `server/index.ts` Express entry point
  **Completed:** 2025-11-07

- [x] Configure Express CORS middleware
  **Completed:** 2025-11-07

- [x] Set up mysql2 connection pool
  **Completed:** 2025-11-07

- [x] Add `.env.local` to `.gitignore`
  **Completed:** 2025-11-07

- [x] Create `.env.local.example` with placeholder values
  **Completed:** 2025-11-07

### Development Tools
- [x] Create `.vscode/settings.json` with SQLTools configuration
  **Completed:** 2025-11-07

- [ ] Test SQLTools connection to iFastNet database
  **Completed:** ___________

- [x] Update Vite config to proxy API calls to Express
  **Completed:** 2025-11-07

- [x] Add backend build scripts to `package.json`
  **Completed:** 2025-11-07

---

## Milestone 2: Authentication & Middleware (Week 2)

### Middleware Implementation
- [ ] Create `server/middleware/authMiddleware.ts` skeleton
  **Completed:** ___________

- [ ] Implement Firebase token extraction from Authorization header
  **Completed:** ___________

- [ ] Implement Firebase token verification using Admin SDK
  **Completed:** ___________

- [ ] Attach verified user to Express request object
  **Completed:** ___________

- [ ] Add error handling for invalid/expired tokens
  **Completed:** ___________

- [ ] Create `server/middleware/errorHandler.ts`
  **Completed:** ___________

- [ ] Implement centralized error response formatting
  **Completed:** ___________

### User Repository
- [ ] Create `server/data/users.repository.ts` skeleton
  **Completed:** ___________

- [ ] Implement `findByFirebaseUid(uid: string)` method
  **Completed:** ___________

- [ ] Implement `findByEmail(email: string)` method
  **Completed:** ___________

- [ ] Implement `create(userData)` method with parameterized query
  **Completed:** ___________

- [ ] Implement `update(id, userData)` method
  **Completed:** ___________

- [ ] Add SQL injection tests for user repository
  **Completed:** ___________

### Auth Logic & Routes
- [ ] Create `server/logic/auth.logic.ts` skeleton
  **Completed:** ___________

- [ ] Implement user creation/update on first login
  **Completed:** ___________

- [ ] Implement admin check (email === scottkunian@gmail.com)
  **Completed:** ___________

- [ ] Create `server/routes/auth.routes.ts`
  **Completed:** ___________

- [ ] Implement `GET /api/me` endpoint
  **Completed:** ___________

- [ ] Test `/api/me` with valid Firebase token
  **Completed:** ___________

- [ ] Test `/api/me` with invalid token returns 401
  **Completed:** ___________

- [ ] Test `/api/me` creates user in database on first call
  **Completed:** ___________

---

## Milestone 3: Character API Implementation (Week 2-3)

### Characters Repository
- [ ] Create `server/data/characters.repository.ts` skeleton
  **Completed:** ___________

- [ ] Implement `findByOwnerId(userId: number)` method
  **Completed:** ___________

- [ ] Implement `findByGmId(userId: number)` method
  **Completed:** ___________

- [ ] Implement `findAll()` method (admin only)
  **Completed:** ___________

- [ ] Implement `create(characterData)` method with JSON storage
  **Completed:** ___________

- [ ] Implement `update(id, characterData)` method
  **Completed:** ___________

- [ ] Implement `softDelete(id)` method (set is_deleted = 1)
  **Completed:** ___________

- [ ] Extract character name from JSON and cache in `name` column
  **Completed:** ___________

- [ ] Add SQL injection tests for character repository
  **Completed:** ___________

### Characters Logic
- [ ] Create `server/logic/characters.logic.ts` skeleton
  **Completed:** ___________

- [ ] Implement ownership check (owner_user_id matches current user)
  **Completed:** ___________

- [ ] Implement GM check (gm_user_id matches current user)
  **Completed:** ___________

- [ ] Implement admin check for `scope=all` queries
  **Completed:** ___________

- [ ] Implement GM lookup by email (create placeholder if needed)
  **Completed:** ___________

- [ ] Implement character visibility filtering logic
  **Completed:** ___________

- [ ] Validate character JSON size (prevent >16MB uploads)
  **Completed:** ___________

### Characters Routes
- [ ] Create `server/routes/characters.routes.ts` skeleton
  **Completed:** ___________

- [ ] Implement `GET /api/characters?scope=mine` endpoint
  **Completed:** ___________

- [ ] Implement `GET /api/characters?scope=gm` endpoint
  **Completed:** ___________

- [ ] Implement `GET /api/characters?scope=all` endpoint (admin only)
  **Completed:** ___________

- [ ] Implement `POST /api/characters` (create) endpoint
  **Completed:** ___________

- [ ] Implement `PUT /api/characters/:id` (update) endpoint
  **Completed:** ___________

- [ ] Implement `DELETE /api/characters/:id` endpoint
  **Completed:** ___________

- [ ] Add request validation for character JSON format
  **Completed:** ___________

### API Testing
- [ ] Test `GET /api/characters` returns only owned characters
  **Completed:** ___________

- [ ] Test `GET /api/characters?scope=gm` returns GM-assigned characters
  **Completed:** ___________

- [ ] Test `GET /api/characters?scope=all` works for admin email
  **Completed:** ___________

- [ ] Test `GET /api/characters?scope=all` returns 403 for non-admin
  **Completed:** ___________

- [ ] Test `POST /api/characters` creates character in database
  **Completed:** ___________

- [ ] Test `POST /api/characters` with gm_email assigns GM correctly
  **Completed:** ___________

- [ ] Test `PUT /api/characters/:id` updates existing character
  **Completed:** ___________

- [ ] Test `PUT /api/characters/:id` returns 403 for non-owner
  **Completed:** ___________

- [ ] Test `DELETE /api/characters/:id` soft-deletes character
  **Completed:** ___________

- [ ] Test `DELETE /api/characters/:id` returns 403 for GM (not owner)
  **Completed:** ___________

---

## Milestone 4: Frontend Integration (Week 3)

### API Client & Types
- [ ] Create `src/utils/api-client.ts` centralized API wrapper
  **Completed:** ___________

- [ ] Implement token injection in API client requests
  **Completed:** ___________

- [ ] Add error handling and retry logic to API client
  **Completed:** ___________

- [ ] Create TypeScript types for API requests/responses
  **Completed:** ___________

- [ ] Add loading state management utilities
  **Completed:** ___________

### Authentication Components
- [ ] Create `src/components/auth/AuthProvider.tsx` context
  **Completed:** ___________

- [ ] Initialize Firebase client SDK in AuthProvider
  **Completed:** ___________

- [ ] Implement login method with email/password
  **Completed:** ___________

- [ ] Implement logout method
  **Completed:** ___________

- [ ] Store Firebase ID token in memory/sessionStorage
  **Completed:** ___________

- [ ] Create `src/components/auth/LoginPage.tsx` UI
  **Completed:** ___________

- [ ] Add email and password input fields to LoginPage
  **Completed:** ___________

- [ ] Add login button with loading state
  **Completed:** ___________

- [ ] Display authentication errors to user
  **Completed:** ___________

- [ ] Create `src/components/auth/PrivateRoute.tsx` route guard
  **Completed:** ___________

- [ ] Redirect unauthenticated users to login page
  **Completed:** ___________

### Character List Updates
- [ ] Remove localStorage calls from `hero-list-page.tsx`
  **Completed:** ___________

- [ ] Replace with `GET /api/characters` API call
  **Completed:** ___________

- [ ] Add scope filter UI (My Characters | GM Characters | All)
  **Completed:** ___________

- [ ] Implement loading spinner during API call
  **Completed:** ___________

- [ ] Add error message display for failed API calls
  **Completed:** ___________

- [ ] Update character list rendering to use API data
  **Completed:** ___________

- [ ] Test character list with multiple users
  **Completed:** ___________

### Character Editor Updates
- [ ] Remove localStorage save from `hero-edit-page.tsx`
  **Completed:** ___________

- [ ] Replace with `POST /api/characters` for new characters
  **Completed:** ___________

- [ ] Replace with `PUT /api/characters/:id` for updates
  **Completed:** ___________

- [ ] Add GM assignment field (email input)
  **Completed:** ___________

- [ ] Validate GM email format before submission
  **Completed:** ___________

- [ ] Display save success message
  **Completed:** ___________

- [ ] Display save error messages
  **Completed:** ___________

- [ ] Test character creation flow end-to-end
  **Completed:** ___________

- [ ] Test character update flow end-to-end
  **Completed:** ___________

### Character Deletion Updates
- [ ] Remove localStorage delete from character list
  **Completed:** ___________

- [ ] Replace with `DELETE /api/characters/:id` API call
  **Completed:** ___________

- [ ] Add confirmation dialog before delete
  **Completed:** ___________

- [ ] Display delete success message
  **Completed:** ___________

- [ ] Display delete error messages
  **Completed:** ___________

- [ ] Test delete flow end-to-end
  **Completed:** ___________

### Admin Features
- [ ] Create `src/components/controls/admin-toggle/AdminToggle.tsx`
  **Completed:** ___________

- [ ] Show toggle only if email === scottkunian@gmail.com
  **Completed:** ___________

- [ ] Update scope parameter on toggle change
  **Completed:** ___________

- [ ] Refresh character list when toggle changes
  **Completed:** ___________

- [ ] Test admin toggle shows all characters
  **Completed:** ___________

- [ ] Test admin toggle hidden for non-admin users
  **Completed:** ___________

### App Routing Updates
- [ ] Wrap app in AuthProvider in `main.tsx`
  **Completed:** ___________

- [ ] Add login route to router
  **Completed:** ___________

- [ ] Protect existing routes with PrivateRoute guard
  **Completed:** ___________

- [ ] Test unauthenticated redirect to login
  **Completed:** ___________

- [ ] Test authenticated access to all routes
  **Completed:** ___________

---

## Milestone 5: Migration & Documentation (Week 4)

### Migration Features
- [ ] Create migration banner component
  **Completed:** ___________

- [ ] Add "Import from LocalStorage" button
  **Completed:** ___________

- [ ] Read characters from localStorage on import
  **Completed:** ___________

- [ ] Batch upload localStorage characters to API
  **Completed:** ___________

- [ ] Display import progress indicator
  **Completed:** ___________

- [ ] Clear localStorage after successful import
  **Completed:** ___________

- [ ] Test migration with sample localStorage data
  **Completed:** ___________

- [ ] Add dismissible banner after migration complete
  **Completed:** ___________

### Documentation
- [ ] Update `README.md` with Firebase setup instructions
  **Completed:** ___________

- [ ] Document `.env.local` configuration
  **Completed:** ___________

- [ ] Document SQLTools setup for VS Code
  **Completed:** ___________

- [ ] Document API endpoints and request/response formats
  **Completed:** ___________

- [ ] Add troubleshooting section to README
  **Completed:** ___________

- [ ] Create developer setup guide
  **Completed:** ___________

- [ ] Document GM assignment workflow
  **Completed:** ___________

- [ ] Document admin toggle usage
  **Completed:** ___________

### Testing & Quality
- [ ] Write unit tests for auth middleware
  **Completed:** ___________

- [ ] Write unit tests for character visibility logic
  **Completed:** ___________

- [ ] Write integration tests for all API endpoints
  **Completed:** ___________

- [ ] Test with large character JSON (base64 images)
  **Completed:** ___________

- [ ] Verify SQL injection protection in all queries
  **Completed:** ___________

- [ ] Test CORS configuration with frontend
  **Completed:** ___________

- [ ] Load test with 100+ characters per user
  **Completed:** ___________

- [ ] Test connection pool behavior under load
  **Completed:** ___________

### Deployment
- [ ] Choose API hosting platform (iFastNet, Vercel, Railway)
  **Completed:** ___________

- [ ] Configure production environment variables
  **Completed:** ___________

- [ ] Deploy backend to hosting platform
  **Completed:** ___________

- [ ] Update frontend API base URL for production
  **Completed:** ___________

- [ ] Test production deployment end-to-end
  **Completed:** ___________

- [ ] Configure production CORS origins
  **Completed:** ___________

- [ ] Set up SSL/HTTPS for API endpoints
  **Completed:** ___________

- [ ] Monitor backend logs for errors
  **Completed:** ___________

### Acceptance Criteria Validation
- [ ] Validate: User can log in with Firebase
  **Completed:** ___________

- [ ] Validate: GET /api/characters returns only user's and GM characters
  **Completed:** ___________

- [ ] Validate: Admin sees "All characters" toggle
  **Completed:** ___________

- [ ] Validate: Admin toggle lists all characters
  **Completed:** ___________

- [ ] Validate: Saving character writes to SQL database
  **Completed:** ___________

- [ ] Validate: Deleting character marks is_deleted=1
  **Completed:** ___________

- [ ] Validate: Character JSON matches .ds-hero format
  **Completed:** ___________

- [ ] Validate: SQLTools connects to iFastNet from VS Code
  **Completed:** ___________

---

## Newly Discovered Tasks

**Instructions:** Add tasks discovered during implementation here. Include date discovered and milestone assignment.

### Discovered 2025-11-07
- [ ] Investigate Firebase client SDK bundle size impact on PWA
  **Assigned to:** Milestone 4
  **Completed:** ___________

- [ ] Add Secret language type to LanguageType enum
  **Assigned to:** Language System Enhancement
  **Completed:** 2025-11-07

- [ ] Update language-select-modal to display Secret languages
  **Assigned to:** Language System Enhancement
  **Completed:** 2025-11-07

- [ ] Update reference-modal to filter Secret languages
  **Assigned to:** Language System Enhancement
  **Completed:** 2025-11-07

- [ ] Update sourcebook-panel dropdown to include Secret option
  **Assigned to:** Language System Enhancement
  **Completed:** 2025-11-07

- [ ] Add Thieves' Cant secret language to draachenmar.ts
  **Assigned to:** Language System Enhancement
  **Completed:** 2025-11-07

- [ ] Add Druidic secret language to draachenmar.ts
  **Assigned to:** Language System Enhancement
  **Completed:** 2025-11-07

- [ ] Fix Bargothian description typo (languange → language)
  **Assigned to:** Language System Enhancement
  **Completed:** 2025-11-07

---

## Next 5 Tasks to Run

**Priority order based on critical path:**

1. **Verify iFastNet MySQL version and connection details**
   *Milestone 1: Database & Infrastructure Setup*
   **Why:** Determines JSON vs LONGTEXT column type for schema design (already using LONGTEXT)
   **Blocking:** Database connection testing and schema deployment
   **Requires:** User to provide iFastNet MySQL credentials
   **Estimated Time:** 30 minutes

2. **Create Firebase project for authentication**
   *Milestone 1: Database & Infrastructure Setup*
   **Why:** Needed for Firebase Admin SDK setup and credentials
   **Blocking:** All authentication middleware and API testing
   **Requires:** User to create project in Firebase Console
   **Estimated Time:** 1 hour

3. **Set up mysql2 connection pool** (NEXT IMPLEMENTABLE TASK)
   *Milestone 1: Database & Infrastructure Setup*
   **Why:** Required for all database operations and repository implementation
   **Blocking:** User and character repository creation
   **Status:** Can implement skeleton, requires credentials for testing
   **Estimated Time:** 30 minutes

4. **Create `.vscode/settings.json` with SQLTools configuration** (INDEPENDENT TASK)
   *Milestone 1: Database & Infrastructure Setup*
   **Why:** Developer tooling for database exploration
   **Blocking:** None (quality-of-life improvement)
   **Status:** Can implement immediately with placeholder config
   **Estimated Time:** 15 minutes

5. **Update Vite config to proxy API calls to Express** (INDEPENDENT TASK)
   *Milestone 1: Database & Infrastructure Setup*
   **Why:** Frontend development convenience (avoid CORS in local dev)
   **Blocking:** None (CORS already configured as fallback)
   **Status:** Can implement immediately
   **Estimated Time:** 20 minutes

---

## Progress Summary

**Milestone Progress:**
- **Milestone 1:** 24/26 tasks complete (92%)
- **Milestone 2:** 0/28 tasks complete (0%)
- **Milestone 3:** 0/39 tasks complete (0%)
- **Milestone 4:** 0/50 tasks complete (0%)
- **Milestone 5:** 0/40 tasks complete (0%)
- **Total:** 24/183 tasks complete (13%)

**Newly Discovered Tasks:** 8 tasks (8 completed)

**Overall Project Status:** 🟢 In Progress (Milestone 1)
**Target Completion:** 2025-12-05 (4 weeks from 2025-11-07)
**Days Remaining:** 28 days

---

## Task Update Log

**2025-11-07:**
- Created BACKEND_TASKS.md with 183 atomic tasks across 5 milestones
- Added 8 newly discovered tasks for Secret language type implementation
- Marked 8 language system tasks as completed (100% of discovered tasks)
- **Backend Infrastructure Setup (Milestone 1 - 10 tasks completed):**
  - ✅ Created db/schema.sql with users and characters tables
  - ✅ Added foreign key constraints to schema
  - ✅ Initialized /server/ directory structure (index.ts, app.js, tsconfig.json)
  - ✅ Added backend dependencies to package.json (express, firebase-admin, mysql2, dotenv, cors)
  - ✅ Configured Express CORS middleware in server/index.ts
  - ✅ Implemented Passenger path normalization middleware
  - ✅ Added intelligent port selection (3000 Passenger, 4000 local)
  - ✅ Created .env.local.example with iFastNet deployment warnings
  - ✅ Updated .gitignore for backend artifacts and secrets
  - ✅ Committed all infrastructure files to repository
- **Milestone 1 Progress:** 38% complete (10/26 tasks)
- **Database Connection Pool Setup:**
  - ✅ Created server/data/db-connection.ts with mysql2 connection pool
  - ✅ Implemented testConnection() function for health checks
  - ✅ Configured pool for iFastNet shared hosting (10 connection limit)
  - ✅ Verified TypeScript compilation successful
- **Milestone 1 Progress:** 42% complete (11/26 tasks)
- **Developer Tooling Setup:**
  - ✅ Created .vscode/settings.json with SQLTools configuration
  - ✅ Configured iFastNet MySQL connection (with placeholders)
  - ✅ Configured local MySQL connection for development
  - ✅ Set askForPassword: true for security
- **Milestone 1 Progress:** 46% complete (12/26 tasks)
- **Frontend-Backend Integration:**
  - ✅ Updated vite.config.ts with API proxy configuration
  - ✅ Configured proxy to forward /api requests to localhost:4000
  - ✅ Added changeOrigin and error logging for debugging
  - ✅ Backend build scripts already added to package.json (server:dev, server:build, server:start)
- **Milestone 1 Progress:** 54% complete (14/26 tasks)
- **Database Deployment:**
  - ✅ Created test-connection.ts script
  - ✅ Verified MySQL 11.4.8-MariaDB connection successful
  - ✅ Created deploy-schema-simple.ts script
  - ✅ Deployed users and characters tables to gamers_forgesteel database
  - ✅ Confirmed LONGTEXT support and foreign key constraints
- **Milestone 1 Progress:** 73% complete (19/26 tasks)
- **Firebase Authentication Setup:**
  - ✅ User created Firebase project: forgesteel-6e968
  - ✅ User enabled email/password authentication in console
  - ✅ User downloaded firebase-service-account.json credentials
  - ✅ Created test-firebase.ts script
  - ✅ Verified Firebase Admin SDK connection successful
  - ✅ Updated .env.local with Firebase credentials path
- **Milestone 1 Progress:** 92% complete (24/26 tasks)
