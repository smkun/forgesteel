# Merge Strategy Summary

# Quick Merge Guide

## 🔄 Basic Process

1. **Backup current branch**
1. **Auto-merge community files**:

- `src/data/sourcebooks/core.ts` (REQUIRED main system)
- `src/data/sourcebooks/playtest.ts` (optional)
- `src/data/sourcebooks/ratcatcher.ts` (third-party)
- Core ancestry files

1. **Manual merge if needed**:

- `src/data/ancestry-data.ts`
- `src/components/main/main.tsx`

1. **Test and verify**
1. **Commit changes**

## 🚦 Key Files

- 🟢 **Auto-merge**: Community sourcebooks, core ancestries
- 🟡 **Manual check**: Integration points, registry files
- 🔒 **Never merge**: Custom sourcebooks, backend, auth

## ⚡ Quick Commands

```bash
# Backup
git checkout -b backup-$(date +%Y%m%d)

# Auto merge tool
./merge-tool.sh

# Manual compare
code --diff src/file.ts ../upstream/src/file.ts

# Test
npm run build
npm run server:build
```

---

## 🎯 Architecture Overview

We use an **Additive Architecture** where:

- **Community code** = core sourcebook (main system, REQUIRED)
- **Custom code** = draachenmar sourcebook (extends core)
- **Heroes load both** = core + draachenmar
- **Optional content** = playtest + ratcatcher (third-party)

This eliminates most merge conflicts!

---

## 📁 File Categories

### 🟢 AUTO-MERGE (Accept Theirs Completely)

These files are NEVER modified, so upstream updates can be blindly accepted:

**Backend** (never in upstream):

- `server/` - Entire backend directory
- `db/` - Database schema
- `.htaccess` - Apache config

**Frontend Services** (never in upstream):

- `src/services/api.ts`
- `src/services/firebase.ts`
- `src/services/character-storage.ts`
- `src/contexts/AuthContext.tsx`

**Custom Content** (never in upstream):

- `src/data/sourcebooks/draachenmar.ts`
- `src/data/sourcebooks/draachenmar-extensions.ts`
- `src/data/ancestries/angulotl.ts`
- `src/data/ancestries/falcar.ts`
- `src/data/ancestries/lizardfolk.ts`
- `src/data/ancestries/stigara.ts`
- `src/data/ancestries/verminari.ts`
- `src/data/ancestries/zefiri.ts`
- (All other custom ancestries)

**Custom UI** (never in upstream):

- `src/components/pages/auth/`
- `src/components/modals/admin-tools/`
- `src/components/modals/assign-gm/`

**Documentation** (never in upstream):

- `claudedocs/` - All documentation
- `MERGE_GUIDE.md`
- `MERGE_SUMMARY.md`
- `ADDITIVE_ARCHITECTURE.md`
- `REORGANIZATION_GUIDE.md`
- `merge-tool.sh`

**Community Content** (accept theirs):

- `src/data/sourcebooks/core.ts` - Main system (REQUIRED)
- `src/data/sourcebooks/playtest.ts` - Optional official content
- `src/data/sourcebooks/ratcatcher.ts` - Third-party content
- `src/data/ancestries/dwarf.ts` - Community ancestry
- `src/data/ancestries/elf.ts` - Community ancestry
- (All other core ancestries)

### 🟡 MANUAL MERGE (Careful Review)

These files integrate community + custom, need manual attention:

**Core Integration**:

- `src/components/main/main.tsx` - Backend integration
  - Lines 81: Character storage import
  - Lines 156-185: Auth context
  - Lines 225-260: API persistence
  - Lines 356-367: Load playtest + draachenmar
  - Lines 378-389: Delete with API

- `src/index.tsx` - App initialization
  - Lines 81-110: Storage and auth setup

**Content Registry**:

- `src/data/ancestry-data.ts` - Combines community + custom ancestries
  - Community imports at top
  - Custom imports after
  - Both in Ancestries array

**Configuration**:

- `package.json` - Dependencies
  - Keep backend dependencies
  - Merge frontend updates

- `vite.config.ts` - Build config
  - Keep API proxy (lines 70-89)
  - Merge build changes

**Modified Components**:

- `src/components/pages/heroes/hero-view/hero-view-page.tsx`
  - Lines 34: Character storage
  - Lines 78-124: GM/owner loading
  - Lines 151-184: GM selector UI

- `src/components/pages/heroes/hero-list/hero-list-page.tsx`
  - Sync status indicator

---

## 🔧 Merge Tools

### 1. Smart Merge Tool (`merge-tool.sh`)

Automated merge with conflict detection:

```bash
./merge-tool.sh
```

**What it does**:

- ✅ Creates timestamped backup
- ✅ Auto-merges community files
- ✅ Protects custom files
- ✅ Identifies manual merge candidates
- ✅ Creates side-by-side comparisons
- ✅ Generates merge report

### 2. Manual Merge Workflow

For manual merge files:

```bash
# 1. Create backup
git checkout -b backup-$(date +%Y%m%d)
git checkout main

# 2. Compare specific file
diff src/components/main/main.tsx ../forgesteel-andy/src/components/main/main.tsx

# 3. Use 3-way merge tool
code --diff src/components/main/main.tsx ../forgesteel-andy/src/components/main/main.tsx

# 4. Keep our backend integration sections:
#    - Import storage service
#    - Auth context integration
#    - API persistence calls
#    - Load playtest + draachenmar sourcebooks
#    - Delete with API call

# 5. Accept their changes for:
#    - New features
#    - Bug fixes
#    - Refactoring
```

---

## 🚀 Quick Merge Procedure

### For Small Updates

```bash
# 1. Update community sourcebooks (auto-merge)
cp ../forgesteel-andy/src/data/sourcebooks/playtest.ts src/data/sourcebooks/

# 2. Check ancestry registry (manual)
diff src/data/ancestry-data.ts ../forgesteel-andy/src/data/ancestry-data.ts
# If they added ancestries, add to our registry (keep our custom ones)

# 3. Test
npm run build
npm run server:build

# 4. Commit
git add .
git commit -m "Merge community updates $(date +%Y-%m-%d)"
```

### For Large Updates

```bash
# 1. Run merge tool
./merge-tool.sh

# 2. Review merge report
cat merge-report-*.txt

# 3. Resolve conflicts in .merge-conflicts/
# Compare *.draachenmar vs *.andy files

# 4. Test thoroughly
npm install
npm run build
npm run server:build

# 5. Commit
git add .
git commit -m "Merge community updates $(date +%Y-%m-%d)"
```

---

## 📋 Merge Checklist

### Pre-Merge

- [ ] Commit all current changes
- [ ] Create backup branch
- [ ] Run current build to establish baseline
- [ ] Note current community repo commit hash

### During Merge

- [ ] Update core.ts (auto-merge - REQUIRED main system)
- [ ] Update playtest.ts (auto-merge - optional)
- [ ] Update ratcatcher.ts (auto-merge - third-party)
- [ ] Update core ancestries (auto-merge)
- [ ] Check ancestry-data.ts (manual merge if needed)
- [ ] Check main.tsx (manual merge if needed)
- [ ] Check package.json (manual merge dependencies)

### Post-Merge

- [ ] `npm install` - Update dependencies
- [ ] `npm run build:frontend` - Test frontend
- [ ] `npm run build:backend` - Test backend
- [ ] Create test character with both playtest + draachenmar content
- [ ] Test character save/load
- [ ] Test character delete
- [ ] Test GM assignment
- [ ] Commit changes

---

## 🎨 Key Sections to Preserve

### main.tsx

**Line 81** - Storage service import:

```typescript
import * as storage from '@/services/character-storage';
```

**Lines 156-185** - Auth context:

```typescript
const { user } = useAuth();
// ... auth integration
```

**Lines 225-260** - API persistence:

```typescript
const persistHeroes = async (heroes: Hero[]) => {
    // ... using storage.saveCharacter()
};
```

**Lines 356-367** - Sourcebook loading:

```typescript
const newHero = (folder: string) => {
    // Load Core (main system) + Draachenmar (custom)
    const hero = FactoryLogic.createHero([
        SourcebookData.core.id,
        SourcebookData.draachenmar.id
    ]);
    // ...
};
```

**Lines 378-389** - Delete with API:

```typescript
const deleteHero = async (hero: Hero) => {
    await storage.deleteCharacter(hero.id);
    // ...
};
```

### package.json

**Backend scripts**:

```json
"server:dev": "...",
"server:build": "...",
"server:start": "...",
```

**Backend dependencies**:

```json
"cors": "^2.8.5",
"dotenv": "^16.4.7",
"express": "^4.21.2",
"firebase-admin": "^13.0.1",
"mysql2": "^3.11.5"
```

### vite.config.ts

**API proxy** (lines 70-89):

```typescript
server: {
    proxy: {
        '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true
        }
    }
}
```

---

## 🔍 Testing After Merge

```bash
# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Build both frontend and backend
npm run build:frontend
npm run build:backend

# 3. Test app functionality
npm run start
# - Create new character
# - Verify playtest ancestries available
# - Verify draachenmar ancestries available
# - Save character
# - Load character
# - Delete character
# - Test GM assignment (if logged in)

# 4. Check console for errors
# - No import errors
# - No missing module errors
# - Character operations work

# 5. Deploy test
# Copy distribution/frontend/ to production
# Verify live site works
```

---

## 💡 Tips

1. **Use merge tool first** - Let automation handle what it can
2. **Compare, don't guess** - Always diff files before manual merge
3. **Test incrementally** - Build after each major file merge
4. **Keep backups** - Always have a working backup branch
5. **Document changes** - Note any tricky merges for future reference

---

## 🆘 Rollback Procedure

If merge goes wrong:

```bash
# Abort in-progress merge
git merge --abort

# OR reset to backup
git reset --hard backup-YYYYMMDD

# OR cherry-pick specific changes
git checkout backup-YYYYMMDD
git cherry-pick <commit-hash>
```

---

**Last Updated**: 2025-11-09
**Community Repo**: <https://github.com/andyaiken/forgesteel>
**Architecture**: Additive (core + draachenmar)
