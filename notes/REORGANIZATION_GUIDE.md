# Code Reorganization Guide

**Purpose**: Split Draachenmar-specific code from community code for easier maintenance and merging.

---

## 🎯 Reorganization Strategy

### Option 1: Submodule Approach (Recommended)

Keep community code as a git submodule, extend with Draachenmar customizations in separate directories.

### Option 2: Plugin Architecture

Create a plugin system where Draachenmar content loads as an extension.

### Option 3: Configuration-Driven

Move all Draachenmar-specific data to config files that override defaults.

---

## 📁 Proposed Directory Structure

### Option 1: Submodule + Extensions

```
forgesteel-draachenmar/
├── core/                          # Git submodule → community repo
│   ├── src/
│   ├── package.json
│   └── ...
├── extensions/                    # Draachenmar customizations
│   ├── backend/                   # All server code
│   │   ├── server/
│   │   ├── db/
│   │   └── .env
│   ├── content/                   # Draachenmar content
│   │   ├── sourcebooks/
│   │   │   └── draachenmar.ts
│   │   ├── ancestries/
│   │   │   ├── angulotl.ts
│   │   │   ├── falcar.ts
│   │   │   └── ...
│   │   └── sample-characters/
│   ├── services/                  # Custom services
│   │   ├── api.ts
│   │   ├── firebase.ts
│   │   └── character-storage.ts
│   ├── components/                # Custom UI components
│   │   ├── auth-page.tsx
│   │   ├── admin-tools-modal.tsx
│   │   └── assign-gm-modal.tsx
│   └── contexts/
│       └── AuthContext.tsx
├── overrides/                     # Files that override core
│   ├── main.tsx                   # Modified main app
│   ├── index.tsx                  # Modified entry point
│   └── ancestry-data.ts           # Extended ancestry registry
├── config/
│   ├── build.config.js            # Build configuration
│   └── vite.config.draachenmar.ts # Custom vite config
├── package.json                   # Root package.json
├── merge-tool.sh                  # Smart merge tool
└── MERGE_GUIDE.md                 # Merge documentation
```

### Option 2: Plugin Architecture

```
forgesteel-draachenmar/
├── src/                           # Community code (updated via merge)
│   ├── components/
│   ├── data/
│   └── ...
├── plugins/
│   └── draachenmar/               # Draachenmar plugin
│       ├── plugin.config.ts       # Plugin manifest
│       ├── backend/               # Backend integration
│       ├── content/               # Custom content
│       │   ├── sourcebooks/
│       │   └── ancestries/
│       ├── services/              # API services
│       └── ui/                    # UI extensions
├── server/                        # Backend (separate)
└── package.json
```

### Option 3: Configuration Override

```
forgesteel-draachenmar/
├── src/                           # Community code
├── draachenmar/                   # All customizations
│   ├── config.ts                  # Configuration overrides
│   ├── sourcebooks/
│   ├── ancestries/
│   ├── backend/
│   └── ui-extensions/
├── server/                        # Backend (separate)
└── package.json
```

---

## 🔧 Implementation Plan

### Phase 1: Backend Separation (Immediate)

**Goal**: Backend is already separate, just needs isolation

**Current State**: ✅ Already separated

- `server/` directory
- `db/` directory
- Separate `server/package.json`

**Action Required**: None - already isolated

---

### Phase 2: Content Separation (Recommended)

**Goal**: Move Draachenmar content to dedicated directory

#### Step 1: Create Extensions Directory

```bash
mkdir -p extensions/content/{sourcebooks,ancestries,cultures,sample-characters}
```

#### Step 2: Move Draachenmar Content

```bash
# Move sourcebook
mv src/data/sourcebooks/draachenmar.ts extensions/content/sourcebooks/

# Move custom ancestries
mv src/data/ancestries/angulotl.ts extensions/content/ancestries/
mv src/data/ancestries/falcar.ts extensions/content/ancestries/
mv src/data/ancestries/lizardfolk.ts extensions/content/ancestries/
mv src/data/ancestries/stigara.ts extensions/content/ancestries/
mv src/data/ancestries/verminari.ts extensions/content/ancestries/
mv src/data/ancestries/zefiri.ts extensions/content/ancestries/

# Move sample characters
mv sample_characters/ extensions/content/sample-characters/
```

#### Step 3: Update Import Paths

Create `extensions/content/index.ts`:

```typescript
// Export all Draachenmar content
export { Draachenmar } from './sourcebooks/draachenmar';

// Export custom ancestries
export { Angulotl } from './ancestries/angulotl';
export { Falcar } from './ancestries/falcar';
export { Lizardfolk } from './ancestries/lizardfolk';
export { Stigara } from './ancestries/stigara';
export { Verminari } from './ancestries/verminari';
export { Zefiri } from './ancestries/zefiri';
```

Update `src/data/ancestry-data.ts`:

```typescript
import { Dwarf } from './ancestries/dwarf';
import { Elf } from './ancestries/elf';
// ... core ancestries

// Import Draachenmar ancestries from extensions
import {
    Angulotl,
    Falcar,
    Lizardfolk,
    Stigara,
    Verminari,
    Zefiri
} from '@extensions/content';

export const Ancestries: Ancestry[] = [
    // Core ancestries
    Dwarf,
    Elf,
    // ...

    // Draachenmar ancestries
    Angulotl,
    Falcar,
    Lizardfolk,
    Stigara,
    Verminari,
    Zefiri
];
```

#### Step 4: Update TypeScript Paths

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@extensions/*": ["./extensions/*"]
    }
  }
}
```

#### Step 5: Update Vite Config

Update `vite.config.ts`:

```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@extensions': path.resolve(__dirname, './extensions')
    }
  }
});
```

---

### Phase 3: Services Separation

**Goal**: Move custom services to extensions

```bash
mkdir -p extensions/services
mv src/services/api.ts extensions/services/
mv src/services/firebase.ts extensions/services/
mv src/services/character-storage.ts extensions/services/
```

Create `extensions/services/index.ts`:

```typescript
export * from './api';
export * from './firebase';
export * from './character-storage';
```

Update imports throughout codebase:

```typescript
// Old
import * as api from '@/services/api';

// New
import * as api from '@extensions/services';
```

---

### Phase 4: UI Components Separation

**Goal**: Move custom UI to extensions

```bash
mkdir -p extensions/components/{pages,modals,contexts}

# Move auth
mv src/components/pages/auth/ extensions/components/pages/

# Move modals
mv src/components/modals/admin-tools/ extensions/components/modals/
mv src/components/modals/assign-gm/ extensions/components/modals/

# Move contexts
mv src/contexts/AuthContext.tsx extensions/contexts/
```

---

### Phase 5: Override Management

**Goal**: Track modified core files separately

Create `overrides/` directory for files that modify core:

```bash
mkdir -p overrides

# Copy modified core files
cp src/components/main/main.tsx overrides/
cp src/index.tsx overrides/
cp src/data/ancestry-data.ts overrides/
cp src/components/pages/heroes/hero-view/hero-view-page.tsx overrides/
```

Document overrides in `overrides/README.md`:

```markdown
# Core File Overrides

These files override core functionality. When merging upstream:

1. Check if core file changed
2. Compare with override
3. Manually merge changes
4. Update override

## Files

- `main.tsx` - Added backend integration
- `index.tsx` - Added auth initialization
- `ancestry-data.ts` - Added Draachenmar ancestries
- `hero-view-page.tsx` - Added GM assignment UI
```

---

## 🔄 Updated Merge Workflow

With reorganization:

### When Merging Upstream Updates

1. **Update core code** (auto-merge safe):

   ```bash
   # Copy new/updated files from community repo
   rsync -av --exclude='extensions/' \
            --exclude='server/' \
            --exclude='db/' \
            --exclude='overrides/' \
            ../forgesteel-andy/ ./
   ```

2. **Review overrides** (manual merge):

   ```bash
   # Compare each override with new core version
   diff src/components/main/main.tsx ../forgesteel-andy/src/components/main/main.tsx

   # Merge changes into override
   # Update both src/ and overrides/ versions
   ```

3. **Test extensions**:

   ```bash
   npm install
   npm run build
   npm run server:build
   ```

4. **Commit**:

   ```bash
   git add .
   git commit -m "Merge community updates - $(date +%Y-%m-%d)"
   ```

---

## 📊 Benefits of Reorganization

### ✅ Easier Merging

- Clear separation between core and custom code
- Auto-merge safe for most files
- Only overrides need manual review

### ✅ Better Organization

- All Draachenmar content in one place
- Backend completely isolated
- Easy to find custom code

### ✅ Portability

- Extensions can be moved to other projects
- Backend can run independently
- Content can be packaged separately

### ✅ Maintainability

- Clear ownership of files
- Easier to track custom changes
- Simpler conflict resolution

---

## 🚀 Quick Start Reorganization

### Minimal Reorganization (Low Risk)

**Just separate backend and content**:

```bash
# Already done:
# - server/ directory (backend)
# - db/ directory (database)

# Move Draachenmar content:
mkdir -p draachenmar/content
mv src/data/sourcebooks/draachenmar.ts draachenmar/content/
mv src/data/ancestries/{angulotl,falcar,lizardfolk,stigara,verminari,zefiri}.ts draachenmar/content/

# Update imports in ancestry-data.ts to point to new location
```

### Full Reorganization (Better Long-term)

Run the reorganization script:

```bash
# Create reorganization script
./reorganize.sh

# Script will:
# 1. Create extensions/ directory
# 2. Move all custom code
# 3. Update import paths
# 4. Update tsconfig and vite config
# 5. Create overrides tracking
```

---

## 📋 Reorganization Checklist

### Pre-Reorganization

- [ ] Commit all changes
- [ ] Create backup branch
- [ ] Run tests to establish baseline
- [ ] Document current import paths

### During Reorganization

- [ ] Create directory structure
- [ ] Move files to extensions/
- [ ] Update TypeScript paths
- [ ] Update Vite config
- [ ] Update import statements
- [ ] Create override tracking

### Post-Reorganization

- [ ] Build frontend: `npm run build`
- [ ] Build backend: `npm run server:build`
- [ ] Run tests
- [ ] Verify all features work
- [ ] Update documentation
- [ ] Commit reorganization

---

## 🔍 Testing After Reorganization

```bash
# 1. Install dependencies
npm install

# 2. Build frontend
npm run build

# 3. Build backend
npm run server:build

# 4. Test character creation
# - Create new Draachenmar character
# - Verify custom ancestries available
# - Test save/load

# 5. Test backend features
# - Login/logout
# - Character API operations
# - GM assignment

# 6. Test merge workflow
# - Make small change in community repo
# - Run merge tool
# - Verify clean merge
```

---

**Last Updated**: 2025-11-09
**Status**: Planning / Not Yet Implemented
**Next Step**: Choose reorganization option and create reorganization script
