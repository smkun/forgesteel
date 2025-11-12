# Campaign 404 Fix - November 11, 2025

## Issue
`/api/campaigns` endpoint returned 404 in production after successful local build.

## Root Cause
The build system was changed to output `.cjs` files (CommonJS) instead of `.js` files due to `package.json` having `"type": "module"`. However, `app.js` (Passenger entry point) was still trying to load `./index.js` instead of `./index.cjs`.

## Timeline

### Why .cjs Extension?
- `package.json` has `"type": "module"` which makes Node.js treat `.js` files as ES modules
- Backend uses CommonJS syntax (`require()`, `module.exports`)
- To make Node.js treat compiled files as CommonJS, they must use `.cjs` extension
- Build process (commit `1baab189`) added automatic `.js` → `.cjs` renaming

### The Problem
1. Build script renames `index.js` → `index.cjs`
2. Build script updates all `require('./module')` → `require('./module.cjs')`
3. BUT `app.js` (entry point) was **not** in the build output
4. Production still had old `app.js` with `require('./index.js')`
5. Passenger loaded old `index.js` (if it existed) or failed silently
6. Campaign routes (new feature) were only in `index.cjs`, not loaded

### Evidence
- Production curl to `localhost:3000/api/campaigns` returned empty (no response)
- Production logs showed request arriving: `[REQUEST] GET /forgesteel/api/campaigns`
- But no response or error was logged after that
- This indicated the route handler was never registered

## Solution

### Changes Made

#### 1. Updated app.js Entry Point
**File**: [server/app.js](../server/app.js)

Changed line 9:
```javascript
// OLD:
require('./index.js');

// NEW:
require('./index.cjs');
```

#### 2. Updated Build Script
**File**: [package.json](../package.json) line 21

Added automatic copy of `app.js` to distribution:
```bash
"build:backend": "... && cp server/app.js distribution/backend/app.js"
```

Now the build process:
1. Compiles TypeScript → `.js` files
2. Renames all `.js` → `.cjs`
3. Updates all `require()` statements to use `.cjs`
4. **Copies `server/app.js` to `distribution/backend/app.js`** ← NEW

### Deployment Fix
On production:
1. Upload new `app.js` from `distribution/backend/app.js`
2. Restart Passenger: `touch ~/forgesteel-api/tmp/restart.txt`

## Verification
```bash
# Check app.js is correct
cat distribution/backend/app.js | grep require
# Should show: require('./index.cjs')

# Verify both files exist
ls -la distribution/backend/app.js
ls -la distribution/backend/index.cjs

# Test endpoint
curl https://32gamers.com/forgesteel/api/campaigns
# Should return 401 (auth required), not 404
```

## Documentation Updates
- [PRODUCTION_DEPLOYMENT_CHECKLIST.md](PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Added app.js critical info and troubleshooting
- [BACKEND_CLAUDE.md](BACKEND_CLAUDE.md) - Added build system section with .cjs convention explanation
- [package.json](../package.json) - Updated build:backend script

## Lessons Learned
1. **Entry point files must be version-controlled** - `app.js` should have been in distribution from the start
2. **Build scripts must be comprehensive** - When changing output format (.js → .cjs), all related files must be updated
3. **Testing is critical** - Should have tested production after build system change
4. **Documentation matters** - Build system changes need clear documentation

## Prevention
- Build script now automatically handles `app.js`
- Documentation clearly states app.js requirement
- Added verification steps to deployment checklist
