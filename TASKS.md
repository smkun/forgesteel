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

## Notes

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
