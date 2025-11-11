# Merge Conflict Avoidance Guide

**Purpose**: This document identifies all custom changes made for Draachenmar and backend integration to help merge upstream updates safely.

---

## 🎯 Change Categories

### 1. Backend Infrastructure (NEW - Not in upstream)

### 2. Draachenmar Content (CUSTOM - Modified from upstream)

### 3. Frontend Integration (MODIFIED - Integrates backend with existing UI)

### 4. Configuration (MODIFIED - Environment-specific)

---

## 🔧 Backend Infrastructure Files (NEW)

### Database & Server

**Location**: `server/`

- `server/index.ts` - Express server entry point
- `server/tsconfig.json` - Backend TypeScript config
- `server/package.json` - Backend dependencies

### Data Layer

- `server/data/db-connection.ts` - MySQL connection pool
- `server/data/characters.repository.ts` - Character CRUD operations
- `server/data/users.repository.ts` - User management

### Business Logic

- `server/logic/character.logic.ts` - Character business rules
  - ⚠️ **MODIFIED 2025-01-11**: Added campaign fields to `mapCharacterRecord` function (lines 488-489)
  - ⚠️ **CRITICAL**: This function maps database records to API responses - missing fields here break frontend
- `server/logic/campaign.logic.ts` - Campaign management and character assignment
- `server/logic/auth.logic.ts` - Authentication logic

### Middleware

- `server/middleware/authMiddleware.ts` - Firebase auth verification
- `server/middleware/errorHandler.ts` - Error handling

### API Routes

- `server/routes/character.routes.ts` - Character API endpoints
- `server/routes/auth.routes.ts` - Auth endpoints
- `server/routes/user.routes.ts` - User endpoints
- `server/routes/admin.routes.ts` - Admin endpoints

### Utilities

- `server/utils/loadEnv.ts` - Environment variable loader
- `server/deploy-schema.ts` - Database schema deployment
- `server/deploy-schema-simple.ts` - Simple schema deployment

### Test Files

- `server/test-*.ts` - All test files
- `server/test-api-endpoints.sh` - API testing script

### Database Schema

- `db/schema.sql` - MySQL database schema

**🔴 MERGE STRATEGY**: These are NEW files. Keep all changes. If upstream adds backend, carefully merge or keep separate.

---

## 🏰 Draachenmar Content Files (CUSTOM)

### Sourcebook

**PRIMARY FILE**: `src/data/sourcebooks/draachenmar.ts`

- Custom Draachenmar setting with all ancestries, cultures, languages
- **CONFLICT RISK**: 🔴 HIGH - If upstream modifies sourcebook structure

### Custom Ancestries

**Location**: `src/data/ancestries/`

- `angulotl.ts` ⭐ NEW
- `aurealgar.ts` ⭐ MODIFIED (enhanced from upstream)
- `aurkin.ts` ⭐ MODIFIED
- `aurven.ts` ⭐ MODIFIED
- `caprini.ts` ⭐ MODIFIED
- `cervari.ts` ⭐ MODIFIED
- `devil.ts` ⭐ MODIFIED
- `draconem.ts` ⭐ MODIFIED
- `elgari.ts` ⭐ MODIFIED
- `falcar.ts` ⭐ NEW (Plumari)
- `lizardfolk.ts` ⭐ NEW
- `memonek.ts` ⭐ MODIFIED
- `polder.ts` ⭐ MODIFIED
- `seraphite.ts` ⭐ MODIFIED
- `stigara.ts` ⭐ NEW (Plumari)
- `verminari.ts` ⭐ NEW
- `warforged.ts` ⭐ MODIFIED
- `zefiri.ts` ⭐ NEW (Plumari)

**Backup Folder**: `src/data/ancestries/backup/` - Contains original upstream versions

### Ancestry Registry

**File**: `src/data/ancestry-data.ts`

- Imports all Draachenmar ancestries
- **CONFLICT RISK**: 🟡 MEDIUM - If upstream adds/removes ancestries

### Sample Characters

**Location**: `sample_characters/`

- `*.ds-hero` files - Draachenmar test characters
- **CONFLICT RISK**: 🟢 LOW - Custom test data

### Modified Hero Data

**Location**: `src/data/heroes/`

- All `.ts` files updated to use Draachenmar ancestries
- **CONFLICT RISK**: 🟡 MEDIUM - If upstream changes hero structure

**🔴 MERGE STRATEGY**:

- Keep all Draachenmar ancestry files
- If upstream modifies ancestry structure, apply changes to Draachenmar ancestries
- Always preserve `draachenmar.ts` sourcebook

---

## 🔌 Frontend Integration Files (MODIFIED)

### Core App

**File**: `src/components/main/main.tsx`

- **Lines 81**: Import character storage service
- **Lines 156-185**: Firebase auth context integration
- **Lines 225-260**: Modified hero persistence to use API
- **Lines 378-389**: Modified deleteHero to call API
- **CONFLICT RISK**: 🔴 HIGH - Core app logic

### Authentication

**NEW FILE**: `src/contexts/AuthContext.tsx`

- Firebase authentication context provider
- **CONFLICT RISK**: 🟢 LOW - New file

**NEW FILE**: `src/components/pages/auth/auth-page.tsx`

- Login/signup page
- **CONFLICT RISK**: 🟢 LOW - New file

### Character Storage

**NEW FILE**: `src/services/character-storage.ts`

- Abstracts LocalForage vs API storage
- **CONFLICT RISK**: 🟢 LOW - New file

**NEW FILE**: `src/services/api.ts`

- API client for backend
- **CONFLICT RISK**: 🟢 LOW - New file

**NEW FILE**: `src/services/firebase.ts`

- Firebase client SDK initialization
- **CONFLICT RISK**: 🟢 LOW - New file

### UI Components

**NEW FILE**: `src/components/modals/admin-tools/admin-tools-modal.tsx`

- Admin panel for user/character management
- **CONFLICT RISK**: 🟢 LOW - New file

**NEW FILE**: `src/components/modals/assign-gm/assign-gm-modal.tsx`

- GM assignment modal (legacy feature)
- **CONFLICT RISK**: 🟢 LOW - New file

**NEW FILE**: `src/components/modals/assign-campaign/assign-campaign-modal.tsx`

- Campaign assignment modal (current feature)
- Allows assigning characters to campaigns
- **CONFLICT RISK**: 🟢 LOW - New file
- ⚠️ **Added 2025-01-11**: Replaces legacy GM assignment with campaign-based workflow

**MODIFIED**: `src/components/pages/heroes/hero-view/hero-view-page.tsx`

- **Lines 34**: Import character storage
- **Lines 78-124**: Load GM/owner info from API
- **Lines 136-192**: Load campaign info from API (added 2025-01-11)
- **Lines 194-243**: Refresh campaign info after assignment (added 2025-01-11)
- **Lines 245-279**: Campaign selector UI with owner display
- **Lines 435-442**: AssignCampaignModal integration
- **CONFLICT RISK**: 🔴 HIGH - Core hero view component with campaign integration
- ⚠️ **CRITICAL**: Campaign data flow depends on backend `mapCharacterRecord` including campaign fields

**MODIFIED**: `src/components/pages/heroes/hero-list/hero-list-page.tsx`

- Added sync status indicator
- **CONFLICT RISK**: 🟡 MEDIUM - UI enhancements

### Styling

**MODIFIED**: Various `.scss` files

- UI styling for new features
- **CONFLICT RISK**: 🟢 LOW - Additive changes

**🔴 MERGE STRATEGY**:

- Carefully merge `main.tsx` changes - watch for state management modifications
- Keep all NEW service files
- Review MODIFIED components for conflicts with upstream UI changes

---

## ⚙️ Configuration Files (MODIFIED)

### Build Configuration

**File**: `package.json`

- **Line 10**: Added `server:dev` script
- **Line 11**: Added `server:build` script
- **Line 12**: Added `server:start` script
- **Line 13**: Added `dev:api` script
- **Lines 30-40**: Added backend dependencies (cors, dotenv, express, firebase, mysql2)
- **CONFLICT RISK**: 🔴 HIGH - Dependency conflicts

**File**: `vite.config.ts`

- **Lines 70-89**: Added proxy configuration for API development
- **CONFLICT RISK**: 🟡 MEDIUM - Build tool configuration

### Environment

**File**: `.gitignore`

- **Lines 17-27**: Added environment and Firebase credential exclusions
- **CONFLICT RISK**: 🟢 LOW - Additive changes

**File**: `.htaccess` (NEW)

- Apache configuration for iFastNet deployment
- **CONFLICT RISK**: 🟢 LOW - New file

### TypeScript

**File**: `src/index.tsx`

- **Lines 81-110**: Initialize character storage and auth
- **CONFLICT RISK**: 🟡 MEDIUM - App initialization

**🔴 MERGE STRATEGY**:

- ALWAYS keep backend dependencies in `package.json`
- Keep proxy config in `vite.config.ts`
- Preserve `.gitignore` additions

---

## 📚 Documentation (CUSTOM)

### Claude Documentation

**Location**: `claudedocs/`

- All `.md` files are custom documentation
- **CONFLICT RISK**: 🟢 NONE - Custom docs

**Files**:

- `BACKEND_CLAUDE.md` - Backend architecture
- `BACKEND_TASKS.md` - Backend progress tracking
- `PRD.md` - Product requirements
- `PLANNING.md` - Implementation planning
- Various guides and analyses

**🔴 MERGE STRATEGY**: Keep all documentation, not in upstream.

---

## 🚨 High-Risk Merge Conflicts

### Critical Files (Manual Merge Required)

1. **`src/components/main/main.tsx`**
   - Risk: Core app logic modified
   - Strategy: Three-way merge, preserve backend integration
   - Key sections: Import storage service, hero persistence, deleteHero

2. **`src/data/sourcebooks/draachenmar.ts`**
   - Risk: Custom sourcebook structure
   - Strategy: Keep entire file, apply structural changes from upstream if needed

3. **`src/data/ancestry-data.ts`**
   - Risk: Ancestry registry modifications
   - Strategy: Keep Draachenmar imports, merge upstream additions carefully

4. **`package.json`**
   - Risk: Dependency conflicts
   - Strategy: Merge dependencies, keep backend packages, update frontend as needed

5. **`src/index.tsx`**
   - Risk: App initialization modified
   - Strategy: Preserve storage/auth initialization

### Medium-Risk Files (Review Required)

1. **`src/components/pages/heroes/hero-view/hero-view-page.tsx`**
   - Added campaign assignment UI (2025-01-11)
   - Added GM assignment UI (legacy)
   - Review: Check if upstream modifies hero view
   - ⚠️ **Data Dependency**: Requires backend campaign fields in API responses

2. **`src/data/ancestries/*.ts`** (modified files)
   - Enhanced with Draachenmar features
   - Review: Apply upstream ancestry structure changes

3. **`vite.config.ts`**
   - Added proxy configuration
   - Review: Merge build configuration changes

4. **`src/services/api.ts`**
   - Campaign assignment API endpoints (added 2025-01-11)
   - Character fetching with campaign data
   - Review: Ensure API response types match backend changes

---

## ⚠️ Critical Data Flow Dependencies (Frontend ↔ Backend)

### Campaign Assignment Feature (Added 2025-01-11)

**Frontend Components**:
- `src/components/pages/heroes/hero-view/hero-view-page.tsx` - Campaign button UI
- `src/components/modals/assign-campaign/assign-campaign-modal.tsx` - Assignment modal
- `src/services/api.ts` - API client methods

**Backend Components**:
- `server/logic/character.logic.ts` - `mapCharacterRecord` function (lines 488-489)
- `server/logic/campaign.logic.ts` - Campaign assignment business logic
- `server/routes/character.routes.ts` - `serializeCharacter` function

**Critical Mapping Chain**:
```
Database (MySQL)
  ↓ LEFT JOIN campaigns
Repository (characters.repository.ts)
  ↓ Returns Character with campaign_id/campaign_name
Logic Layer (character.logic.ts)
  ↓ mapCharacterRecord() MUST include campaign fields ← BUG WAS HERE
Routes (character.routes.ts)
  ↓ serializeCharacter() includes campaign fields
API Response (JSON)
  ↓
Frontend (hero-view-page.tsx)
  ↓ Displays campaign button
```

**⚠️ DANGER**: If upstream modifies character interfaces or data flow:
1. Verify `mapCharacterRecord` still includes campaign_id and campaign_name
2. Verify `serializeCharacter` still outputs campaign fields to API
3. Test campaign button displays campaign name after assignment
4. Missing fields = button shows "Assign to Campaign" instead of campaign name

---

## 📋 Pre-Merge Checklist

### Before Pulling Upstream Changes

- [ ] **Backup current state**: `git branch backup-draachenmar-$(date +%Y%m%d)`
- [ ] **Document custom changes**: Review this guide
- [ ] **Identify upstream changes**: Check upstream changelog
- [ ] **Plan merge strategy**: Determine which files need manual merge

### During Merge

- [ ] **Backend files**: Auto-accept ours (NEW files)
- [ ] **Draachenmar ancestries**: Auto-accept ours (CUSTOM content)
- [ ] **main.tsx**: Manual three-way merge
- [ ] **package.json**: Merge dependencies carefully
- [ ] **index.tsx**: Preserve initialization logic

### After Merge

- [ ] **Test backend**: `npm run server:dev`
- [ ] **Test frontend**: `npm run start`
- [ ] **Test character creation**: Create new Draachenmar character
- [ ] **Test API integration**: Save/load/delete character
- [ ] **Test authentication**: Login/logout flow
- [ ] **Run builds**: `npm run build`

---

## 🔍 Merge Command Strategy

### Recommended Approach

```bash
# 1. Create backup branch
git checkout -b backup-draachenmar-$(date +%Y%m%d)
git checkout main

# 2. Fetch upstream
git remote add upstream https://github.com/andyaiken/forgesteel.git
git fetch upstream

# 3. Identify conflicts before merging
git merge --no-commit --no-ff upstream/main
git status

# 4. Review conflicts
git diff --name-only --diff-filter=U

# 5. For each conflict:
#    - Backend files (server/): git checkout --ours <file>
#    - Draachenmar content: git checkout --ours <file>
#    - Main app files: Manual merge
#    - Config files: Careful merge

# 6. Abort if too complex
git merge --abort
# OR commit if successful
git commit -m "Merge upstream with Draachenmar and backend preservation"
```

### File-Specific Strategies

```bash
# Auto-accept ours for backend
git checkout --ours server/
git checkout --ours db/
git checkout --ours src/services/api.ts
git checkout --ours src/services/firebase.ts
git checkout --ours src/services/character-storage.ts
git checkout --ours src/contexts/AuthContext.tsx

# Auto-accept ours for Draachenmar
git checkout --ours src/data/sourcebooks/draachenmar.ts
git checkout --ours src/data/ancestries/angulotl.ts
git checkout --ours src/data/ancestries/falcar.ts
git checkout --ours src/data/ancestries/lizardfolk.ts
git checkout --ours src/data/ancestries/verminari.ts
git checkout --ours src/data/ancestries/stigara.ts
git checkout --ours src/data/ancestries/zefiri.ts

# Manual merge critical files
# main.tsx, package.json, index.tsx, ancestry-data.ts
```

---

## 🎯 Quick Reference: What to Preserve

### 100% Keep (Ours)

- `server/` (entire directory)
- `db/` (entire directory)
- `src/data/sourcebooks/draachenmar.ts`
- `src/services/api.ts`
- `src/services/firebase.ts`
- `src/services/character-storage.ts`
- `src/contexts/AuthContext.tsx`
- `claudedocs/` (entire directory)
- `.htaccess`

### Carefully Merge (Manual)

- `src/components/main/main.tsx`
- `src/index.tsx`
- `package.json`
- `src/data/ancestry-data.ts`
- `src/components/pages/heroes/hero-view/hero-view-page.tsx`
- `vite.config.ts`

### Accept Theirs with Caution

- Utility files (`src/utils/`)
- Logic files (`src/logic/`) - EXCEPT update logic
- UI controls (`src/components/controls/`)
- Panel components (EXCEPT hero-view-page)

---

## 📊 Change Summary Statistics

### Files Added (NEW)

- Backend: 25+ files
- Frontend Integration: 5 files
- Documentation: 20+ files
- **Total NEW**: ~50 files

### Files Modified (CUSTOM)

- Draachenmar Content: 20+ files
- Frontend Integration: 10+ files
- Configuration: 5 files
- **Total MODIFIED**: ~35 files

### Total Custom Changes: **~85 files**

---

## 🆘 Emergency Rollback

If merge goes wrong:

```bash
# Abort merge
git merge --abort

# OR reset to backup
git reset --hard backup-draachenmar-YYYYMMDD

# OR cherry-pick specific commits
git checkout backup-draachenmar-YYYYMMDD
git cherry-pick <upstream-commit>
```

---

**Last Updated**: 2025-01-11
**Maintainer**: Scott Kunian
**Upstream Repo**: <https://github.com/andyaiken/forgesteel>
**Custom Fork**: Draachenmar + Backend Integration

**Recent Changes**:
- 2025-01-11: Added campaign assignment feature documentation
- 2025-01-11: Documented critical data flow for frontend-backend integration
