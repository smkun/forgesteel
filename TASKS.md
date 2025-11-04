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

## Pending Tasks

None currently active.

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

- Removed core.ts and orden.ts sourcebook dependencies
- Fixed DamageModifier type errors in verminari.ts
- Corrected feature selection filtering logic in feature-config-panel.tsx
- Fixed smart apostrophe in Ssar'uk language name causing build failure
- Fixed library page showing duplicate Hakaan, Memonek, Time Raider entries
- Fixed white screen runtime error caused by undefined orden sourcebook references
  - Removed SourcebookData.orden from sourcebook-logic.ts getSourcebooks() method
  - Removed 'orden' from settingIDs in 9 example hero files

### Known Issues

None currently tracked.
