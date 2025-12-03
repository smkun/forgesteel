# Forgesteel-Draachenmar Merge Checklist

**Purpose**: Comprehensive checklist to protect Draachenmar-specific features and backend functionality during merges from upstream (forgesteel-andy).

---

## PRE-MERGE PREPARATION

### 1. Create Safety Backup
```bash
# Create timestamped backup branch
git checkout -b backup/pre-merge-$(date +%Y%m%d-%H%M%S)
git checkout main
```

### 2. Verify Current State Works
- [ ] `npm run build` passes with no errors
- [ ] `npm run dev` starts frontend successfully
- [ ] Backend server starts: `cd server && npm run dev`
- [ ] Can sign in/sign out (footer button works)
- [ ] Draachenmar sourcebook visible in character creation
- [ ] Admin tools accessible (if admin user)

---

## CRITICAL FILES - MUST PRESERVE (Never Accept Upstream)

### Authentication System
| File | Risk | What to Preserve |
|------|------|------------------|
| `src/contexts/AuthContext.tsx` | 🔴 HIGH | Entire file - Firebase auth integration |
| `src/services/firebase.ts` | 🔴 HIGH | Firebase config and initialization |
| `src/components/pages/auth/auth-page.tsx` | 🔴 HIGH | Login/signup UI |
| `src/hooks/use-navigation.ts` | 🟡 MED | `goToAuth()` method |

### Backend Server (Entire Directory)
| File | Risk | What to Preserve |
|------|------|------------------|
| `server/index.ts` | 🔴 HIGH | Server entry point |
| `server/routes/*.ts` | 🔴 HIGH | All API routes (auth, user, character, campaign, admin) |
| `server/logic/*.ts` | 🔴 HIGH | All business logic |
| `server/data/*.ts` | 🔴 HIGH | All repository files |
| `server/middleware/*.ts` | 🔴 HIGH | Auth middleware, error handler |
| `server/package.json` | 🔴 HIGH | Server dependencies |
| `server/.env*` | 🔴 HIGH | Server environment config |

### API & Data Sync
| File | Risk | What to Preserve |
|------|------|------------------|
| `src/services/api.ts` | 🔴 HIGH | API client with auth headers |
| `src/services/character-storage.ts` | 🔴 HIGH | Character sync logic |
| `src/hooks/use-sync-status.ts` | 🟡 MED | Sync status hook |
| `src/utils/data-service.ts` | 🟡 MED | Data service layer |
| `src/components/panels/sync-status/*` | 🟡 MED | Sync UI component |

### Draachenmar Sourcebook
| File | Risk | What to Preserve |
|------|------|------------------|
| `src/data/sourcebooks/draachenmar.ts` | 🔴 HIGH | Campaign sourcebook content |
| `src/logic/sourcebook-logic.ts` | 🔴 HIGH | Must include `SourcebookData.draachenmar` |
| `src/data/sourcebook-data.ts` | 🟡 MED | Import for draachenmar |
| `src/components/modals/sourcebooks/sourcebooks-modal.tsx` | 🔴 HIGH | `builtInHomebrewSourcebooks` filter + display in Homebrew tab |

### Admin Tools
| File | Risk | What to Preserve |
|------|------|------------------|
| `src/components/modals/admin-tools/*` | 🔴 HIGH | Admin modal |
| `src/components/pages/heroes/hero-list/hero-list-page.tsx` | 🟡 MED | Admin props and handlers |

---

## HIGH-CONFLICT FILES (Likely to Have Merge Conflicts)

These files exist in both upstream and Draachenmar with modifications:

### Entry Points & Routing
| File | Draachenmar Addition |
|------|---------------------|
| `src/index.tsx` | `AuthProvider` wrapper |
| `src/main.tsx` | Auth routes, campaign routes |
| `src/components/main/main-layout.tsx` | Auth integration |

### UI Components Modified
| File | Draachenmar Addition |
|------|---------------------|
| `src/components/panels/app-footer/app-footer.tsx` | Sign In/Out button, `useAuth`, **Playbook nav button** |
| `src/components/modals/settings/settings-modal.tsx` | Account section, `useAuth` |
| `src/components/pages/heroes/hero-list/hero-list-page.tsx` | Admin tools, refresh, scope toggle |
| `src/components/pages/heroes/hero-edit/hero-edit-page.tsx` | Possible sync integration |

### Configuration Files
| File | Draachenmar Addition |
|------|---------------------|
| `package.json` | Backend scripts, firebase deps |
| `vite.config.ts` | Proxy config for API |
| `tsconfig.json` | Server paths |
| `.env*` files | `VITE_API_BASE_URL`, Firebase keys |

---

## DRAACHENMAR-ONLY FILES (Won't Conflict - Just Verify Present)

### Custom Sourcebooks
- [ ] `src/data/sourcebooks/draachenmar.ts`
- [ ] `src/data/sourcebooks/community.ts`
- [ ] `src/data/sourcebooks/magazine-blacksmith.ts`
- [ ] `src/data/sourcebooks/magazine-ratcatcher.ts`
- [ ] `src/data/sourcebooks/triglav.ts`

### Custom Ancestries
- [ ] `src/data/ancestries/verminari.ts`
- [ ] `src/data/ancestries/dryad.ts`

### Custom Models
- [ ] `src/models/connection-settings.ts`
- [ ] `src/models/campaign.ts`
- [ ] `src/models/session.ts`
- [ ] `src/models/retainer.ts`

### Campaign Components
- [ ] `src/components/pages/campaigns/*`
- [ ] `src/components/campaigns/projects/*`
- [ ] `src/components/modals/assign-campaign/*`
- [ ] `src/components/modals/assign-gm/*`

### Custom Logic
- [ ] `src/logic/session-logic.ts`
- [ ] `src/logic/library-logic.ts`
- [ ] `src/logic/retainer-logic.ts`
- [ ] `src/logic/update/session-update-logic.ts`
- [ ] `src/logic/update/connection-settings-update-logic.ts`

### Database
- [ ] `db/schema.sql`
- [ ] `db/migrations/*`

---

## POST-MERGE VERIFICATION CHECKLIST

### 1. Build Verification
```bash
# Must pass with 0 errors
npm run build
```
- [ ] No TypeScript errors
- [ ] No missing imports
- [ ] Build completes successfully

### 2. Frontend Functionality
```bash
npm run dev
```
- [ ] App loads without console errors
- [ ] Navigation works (Heroes, Library, Session tabs)
- [ ] Footer displays correctly

### 3. Authentication Flow
- [ ] Sign In button visible in footer
- [ ] Clicking Sign In navigates to `/auth`
- [ ] Can log in with existing account
- [ ] After login, shows "Sign Out (username)" in footer
- [ ] Sign Out works and returns to Welcome page
- [ ] Settings modal shows Account section

### 4. Backend Server
```bash
cd server && npm run dev
```
- [ ] Server starts on port 3001
- [ ] No connection errors
- [ ] API endpoints respond:
  ```bash
  curl http://localhost:3001/api/health
  ```

### 5. Draachenmar Sourcebook
- [ ] Create new character
- [ ] Draachenmar appears under Homebrew sourcebooks
- [ ] Can select Draachenmar ancestries/cultures
- [ ] Character saves successfully

### 6. Admin Tools (if admin user)
- [ ] Admin Tools button visible in hero list
- [ ] Can toggle admin scope
- [ ] Refresh heroes works

### 7. Data Sync
- [ ] Characters sync to server when logged in
- [ ] Sync status indicator shows in footer
- [ ] Changes persist after refresh

---

## COMMON MERGE ISSUES & FIXES

### Issue: AuthProvider Missing from index.tsx
**Symptom**: `useAuth` hook errors, auth context undefined
**Fix**: Ensure `index.tsx` wraps app with `<AuthProvider>`
```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

### Issue: Draachenmar Not in Sourcebook List
**Symptom**: Can't see Draachenmar in character creation
**Fix**: Add to `sourcebook-logic.ts` in `getSourcebooks()`:
```typescript
SourcebookData.draachenmar,
```

### Issue: Sign In/Out Button Missing from Footer
**Symptom**: No auth button in footer
**Fix**: Restore `useAuth` integration in `app-footer.tsx`

### Issue: API Calls Fail
**Symptom**: 401 errors, network failures
**Fix**: Check `VITE_API_BASE_URL` in `.env` files

### Issue: Missing goToAuth Navigation
**Symptom**: Can't navigate to auth page
**Fix**: Add to `use-navigation.ts`:
```typescript
goToAuth: () => navigate('/auth'),
```

---

## MERGE COMMAND REFERENCE

### Safe Merge Strategy
```bash
# Fetch upstream changes
git fetch upstream

# Create merge branch
git checkout -b merge/upstream-$(date +%Y%m%d)

# Merge with no auto-commit to review
git merge upstream/main --no-commit --no-ff

# Review conflicts
git status

# For each conflict, carefully merge keeping Draachenmar additions
# Then test before committing
npm run build
npm run dev

# If all good, commit
git add .
git commit -m "Merge upstream changes, preserve Draachenmar features"
```

### Abort If Things Go Wrong
```bash
git merge --abort
# or
git reset --hard HEAD
```

---

## FILE COUNT SUMMARY

| Category | File Count | Risk Level |
|----------|------------|------------|
| Backend/Server | 31 | 🔴 HIGH |
| Authentication | 7 | 🔴 HIGH |
| API/Sync | 8 | 🔴 HIGH |
| Admin Tools | 7 | 🔴 HIGH |
| Draachenmar Content | 8 | 🟡 MED |
| Campaign/Session | 20 | 🟡 MED |
| Custom Hooks | 8 | 🟡 MED |
| Config Files | 6 | 🟡 MED |
| Database | 3 | 🔴 HIGH |
| **Total Critical** | **~130+** | |

---

## EMERGENCY RECOVERY

If merge goes badly:
```bash
# Option 1: Abort merge in progress
git merge --abort

# Option 2: Reset to before merge
git reset --hard backup/pre-merge-YYYYMMDD-HHMMSS

# Option 3: Cherry-pick specific commits
git cherry-pick <commit-hash>
```

---

*Last Updated: December 3, 2024*
