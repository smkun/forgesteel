# Additive Architecture Guide

**Purpose**: Structure custom content to extend community code instead of replacing it, making merges trivial.

---

## 🎯 Core Principle

**Community Code + Custom Extensions = Complete System**

Instead of:

- ❌ Replacing community files
- ❌ Modifying community content
- ❌ Duplicating community code

We do:

- ✅ Import community sourcebooks
- ✅ Add custom extensions
- ✅ Combine at runtime

---

## 📁 Current Architecture

### File Organization

```
src/data/
├── sourcebooks/
│   ├── playtest.ts              # Community (auto-mergeable)
│   ├── ratcatcher.ts            # Community (auto-mergeable)
│   ├── draachenmar.ts           # Custom (combines everything)
│   └── draachenmar-extensions.ts # Custom (only Draachenmar content)
│
├── ancestries/
│   ├── dwarf.ts                 # Community (auto-mergeable)
│   ├── elf.ts                   # Community (auto-mergeable)
│   ├── angulotl.ts              # Custom (never conflicts)
│   ├── falcar.ts                # Custom (never conflicts)
│   └── ...
│
└── ancestry-data.ts             # Registry (needs manual merge)
```

### How It Works

**1. Community Updates Flow**:

```
Community Repo → core.ts → Merge (automatic)
                         ↓
                     No conflicts!
```

**2. Custom Content Flow**:

```
draachenmar-extensions.ts → draachenmar.ts → App
         (never touched       (simple        (loads both
          by community)        combiner)      sourcebooks)
```

**3. Hero Creation**:

```typescript
// In main.tsx
const hero = FactoryLogic.createHero([
    SourcebookData.core.id,          // Community content (main system)
    SourcebookData.draachenmar.id    // Custom content
]);
```

---

## 🔧 Implementation

### Current Setup (main.tsx:356-367)

```typescript
const newHero = (folder: string) => {
    // Load Core (main system) + Draachenmar (custom content)
    // This additive approach makes merging upstream updates easier
    const hero = FactoryLogic.createHero([
        SourcebookData.core.id,
        SourcebookData.draachenmar.id
    ]);
    hero.folder = folder;

    setDrawer(null);
    persistHero(hero).then(() => navigation.goToHeroEdit(hero.id, 'start'));
};
```

### Benefits

1. **Zero Merge Conflicts** on community files
2. **Automatic Updates** - playtest.ts gets new content automatically
3. **Clear Separation** - easy to see what's custom vs community
4. **Maintainable** - each file has single responsibility

---

## 📦 File Responsibilities

### Community Files (Never Modify)

**`src/data/sourcebooks/core.ts`**

- Main system sourcebook (REQUIRED)
- Auto-updated from community repo
- **Merge Strategy**: Accept theirs completely

**`src/data/sourcebooks/playtest.ts`**

- Optional official playtest content
- Auto-updated from community repo
- **Merge Strategy**: Accept theirs completely

**`src/data/sourcebooks/ratcatcher.ts`**

- Third-party content
- Auto-updated from community repo
- **Merge Strategy**: Accept theirs completely

**`src/data/ancestries/*.ts`** (core ancestries)

- Community ancestry definitions
- Auto-updated from community repo
- **Merge Strategy**: Accept theirs completely

### Custom Files (Never Conflicts)

**`src/data/sourcebooks/draachenmar-extensions.ts`** (NEW)

- Exports arrays of custom content
- Only Draachenmar-specific items
- **Merge Strategy**: Always keep (never in upstream)

Content:

```typescript
export const draachenmarAncestries: Ancestry[] = [
    AncestryData.angulotl,
    AncestryData.falcar,
    // ... custom only
];

export const draachenmarCultures: Culture[] = [
    // Custom cultures
];

export const draachenmarLanguages: LanguageType[] = [
    // Custom languages
];
```

**`src/data/sourcebooks/draachenmar.ts`**

- Combines playtest + custom content
- Simple combiner logic
- **Merge Strategy**: Keep custom, apply structure changes if needed

**`src/data/ancestries/angulotl.ts`** (and other custom)

- Custom ancestry definitions
- Never in upstream
- **Merge Strategy**: Always keep

### Registry Files (Manual Merge)

**`src/data/ancestry-data.ts`**

- Imports ALL ancestries
- Combines community + custom
- **Merge Strategy**: Manual merge needed

```typescript
// Community ancestries
import { Dwarf } from './ancestries/dwarf';
import { Elf } from './ancestries/elf';
// ... more community

// Draachenmar custom ancestries
import { Angulotl } from './ancestries/angulotl';
import { Falcar } from './ancestries/falcar';
// ... more custom

export const Ancestries: Ancestry[] = [
    // Community
    Dwarf,
    Elf,
    // ... more community

    // Draachenmar
    Angulotl,
    Falcar,
    // ... more custom
];
```

---

## 🔄 Merge Workflow

### When Community Updates

**Step 1: Update community files** (auto-merge)

```bash
# These files can be blindly copied from upstream
cp ../forgesteel-andy/src/data/sourcebooks/core.ts src/data/sourcebooks/
cp ../forgesteel-andy/src/data/sourcebooks/playtest.ts src/data/sourcebooks/
cp ../forgesteel-andy/src/data/sourcebooks/ratcatcher.ts src/data/sourcebooks/
cp ../forgesteel-andy/src/data/ancestries/dwarf.ts src/data/ancestries/
cp ../forgesteel-andy/src/data/ancestries/elf.ts src/data/ancestries/
# ... etc for all community ancestries
```

**Step 2: Check registry files** (manual merge)

```bash
# Compare ancestry registry
diff src/data/ancestry-data.ts ../forgesteel-andy/src/data/ancestry-data.ts

# If community added new ancestries:
# 1. Add their imports to our file
# 2. Add their ancestries to our array
# 3. Keep our custom imports and ancestries
```

**Step 3: Test**

```bash
npm run build
# Verify both core and draachenmar content loads
```

---

## 🎨 Refactoring draachenmar.ts (Future)

### Current State

`draachenmar.ts` is a complete sourcebook containing:

- Custom ancestries (Angulotl, Falcar, etc.)
- Custom cultures
- Custom languages
- Loaded alongside core.ts for additive content

### Future Improvement (Optional)

If desired, draachenmar.ts could be refactored as a pure combiner:

```typescript
import { core } from './core';
import {
    draachenmarAncestries,
    draachenmarCultures,
    draachenmarLanguages
} from './draachenmar-extensions';

export const draachenmar: Sourcebook = {
    id: 'draachenmar',
    name: 'Draachenmar',
    description: '32Gamers homebrew world.',
    type: SourcebookType.Homebrew,

    // Combine core + custom (optional approach)
    ancestries: [
        ...core.ancestries,
        ...draachenmarAncestries
    ],

    cultures: [
        ...core.cultures,
        ...draachenmarCultures
    ],

    // Use core content as-is
    careers: core.careers,
    classes: core.classes,
    // ... etc
};
```

**Note**: Current approach of loading core + draachenmar separately is simpler and works well.

---

## 📊 Comparison: Before vs After

### Before (Replacement Approach)

```typescript
// main.tsx (OLD approach - replaced content)
const hero = FactoryLogic.createHero([
    SourcebookData.draachenmar.id  // Only Draachenmar
]);

// draachenmar.ts would duplicate ALL core content
ancestries: [
    Dwarf,      // Duplicated from core
    Elf,        // Duplicated from core
    Angulotl,   // Custom
    Falcar      // Custom
]
```

**Merge Issues with OLD Approach**:

- ❌ If core.ts adds new ancestry, draachenmar.ts doesn't get it
- ❌ If core.ts updates existing ancestry, must manually update draachenmar.ts
- ❌ Duplication causes merge conflicts

### After (Additive Approach)

```typescript
// main.tsx (CURRENT approach - additive loading)
const hero = FactoryLogic.createHero([
    SourcebookData.core.id,          // Community (main system)
    SourcebookData.draachenmar.id    // Custom (adds to core)
]);

// draachenmar.ts contains only custom content
ancestries: [
    Angulotl,   // Custom only
    Falcar,     // Custom only
    Lizardfolk, // Custom only
    // ... etc
];
```

**Merge Benefits with CURRENT Approach**:

- ✅ Core updates automatically available
- ✅ No duplication
- ✅ Zero conflicts on community files
- ✅ Clear separation of concerns
- ✅ Optionally load playtest.ts or ratcatcher.ts for additional content

---

## 🚀 Future Enhancements

### 1. Separate Custom Ancestry Files

Move to separate directory:

```
src/data/
├── ancestries/              # Community (auto-merge)
│   ├── dwarf.ts
│   ├── elf.ts
│   └── ...
└── ancestries-custom/       # Draachenmar (never conflicts)
    ├── angulotl.ts
    ├── falcar.ts
    └── ...
```

### 2. Configuration-Based Registry

Create `draachenmar-config.ts`:

```typescript
export const draachenmarConfig = {
    customAncestries: [
        'angulotl',
        'falcar',
        'lizardfolk',
        // ...
    ],

    customCultures: [
        'Angulotl',
        'Falcar',
        // ...
    ]
};

// Auto-generate imports from config
```

### 3. Plugin System

```typescript
// plugins/draachenmar/index.ts
export const DraachenmarPlugin = {
    id: 'draachenmar',
    extends: 'playtest',
    ancestries: [...],
    cultures: [...],
    // ...
};

// Core loads plugins automatically
```

---

## ✅ Migration Checklist

### Already Done

- [x] Updated `main.tsx` to load playtest + draachenmar
- [x] Created `draachenmar-extensions.ts` with custom content structure
- [x] Documented additive architecture

### Optional Future Steps

- [ ] Refactor `draachenmar.ts` to use spread operator from playtest
- [ ] Move custom ancestries to `ancestries-custom/` directory
- [ ] Create automated ancestry registry generator
- [ ] Implement plugin system for better modularity

---

## 📝 Developer Guidelines

### Adding New Custom Ancestry

1. Create file in `src/data/ancestries/my-new-ancestry.ts`
2. Add to `draachenmar-extensions.ts`:

   ```typescript
   export const draachenmarAncestries = [
       // ... existing
       AncestryData.myNewAncestry
   ];
   ```

3. Add to `ancestry-data.ts`:

   ```typescript
   import { MyNewAncestry } from './ancestries/my-new-ancestry';

   export const Ancestries = [
       // ... existing
       MyNewAncestry
   ];
   ```

### Adding New Custom Culture

Add to `draachenmar-extensions.ts`:

```typescript
export const draachenmarCultures = [
    // ... existing
    FactoryLogic.createCulture(
        'My Culture',
        'Description',
        CultureType.Ancestral,
        EnvironmentData.urban,
        OrganizationData.communal,
        UpbringingData.creative,
        'Language'
    )
];
```

Then ensure `draachenmar.ts` includes it in its cultures array.

### Merging Upstream Updates

**1. Community Files** - Replace completely:

```bash
./merge-tool.sh  # Will auto-handle
# OR manually:
cp -r ../forgesteel-andy/src/data/sourcebooks/*.ts src/data/sourcebooks/
# (except draachenmar.ts and draachenmar-extensions.ts)
```

**2. Registry Files** - Manual merge:

- Open side-by-side: our `ancestry-data.ts` and upstream
- Add any new community imports
- Add any new community ancestries to array
- Keep all custom imports and ancestries

**3. Test**:

```bash
npm run build
# Verify both playtest and custom content available
```

---

## 🎯 Key Takeaways

1. **Playtest = Community** - never modify, always accept upstream
2. **Draachenmar = Custom** - never conflicts, always keep
3. **Registries = Merge Point** - only place needing manual attention
4. **Additive = Maintainable** - easier to understand and update

---

**Last Updated**: 2025-11-09
**Status**: Implemented
**Next Step**: Consider refactoring draachenmar.ts to use spread operators
