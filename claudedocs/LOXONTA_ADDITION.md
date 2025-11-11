# Loxonta Ancestry Addition - Session Notes

**Date**: 2025-01-11
**Task**: Add Loxonta ancestry (elephant-folk) to Draachenmar sourcebook with language and culture

---

## Specifications Provided

### Loxonta Ancestry
- **Concept**: Anthropomorphic elephants - road-keepers, archivists of markets, stewards of treaties
- **Size**: 1L (Large) - costs 1 ancestry point, leaving 2 points for options
- **Theme**: "The long road remembers who carried it" - nomadic caravan culture focused on memory, patience, and community

### Signature Traits (Always On, 0 Points)
1. **Big!**: Size 1L (+1 Stability bonus from large size)
2. **Massive Frame**: +1 additional Stability (total +2 Stability from signature traits)

### 1-Point Options
1. **Wide Gait**: +1 Disengage (long strides for withdrawing from danger)
2. **Sturdy Hide**: +3 Stamina per echelon (thick skin natural armor)
3. **Tusks**: Triggered 1/round - extra Might damage on melee strikes
4. **Road-Sense**: Ignore difficult terrain (rubble, underbrush, debris); edge on navigation/haul/camp tests
5. **Trunkcraft**: Prehensile trunk for simple Interact as free flourish (cannot wield weapons/shields)
6. **Trunk Wrestler**: Edge on Grapple/Escape vs. size-equal-or-smaller; Slide 1 on success
7. **Ledger Memory**: Edge on Recall (routes, prices, treaties); reproduce notes/maps from memory during respite

### 2-Point Options (Abilities)
1. **Thunder Stomp** (Main Action, Signature Cost)
   - Area burst 1, Might roll
   - Tier 1/2/3: 2/5/7 untyped damage; prone
   - Targets test Agility vs. Might: failure = damage + prone, success = half damage + no Opportunity Strikes

2. **Momentum Charge** (Maneuver)
   - Move Speed+2 in straight line
   - First adjacent enemy: Might vs. Might or Pushed 2 + Slowed (EoNT), success = Pushed 1

3. **Trunk Yank** (Main Action, Signature Cost, Prerequisite: Trunkcraft)
   - Melee 2, single target, Might roll
   - Tier 1/2/3: Pull 2; 2/5/7 damage; grabbed (EoNT)
   - Failure: Pull 1, half damage

4. **Rampart Step** (Trigger: ally would take weapon damage)
   - Interpose, become target, halve damage

### Language: Loxontic
- **Type**: Cultural language
- **Description**: Caravan oath-tongue of the Loxonta; resonant, drum-cadenced speech with long vowels and sonorant clusters; rich in ledger terms and treaty formulae; spoken along trade roads and waystations

### Culture: Loxonta
- **Type**: Ancestral culture
- **Description**: Nomadic, communal, labor — caravan oath-speakers who keep the long roads, stewarding treaties and trade routes with patient resolve
- **Environment**: Nomadic
- **Organization**: Communal
- **Upbringing**: Labor
- **Language**: Loxontic

---

## Implementation Approach

### Files Created/Modified

1. **`src/data/ancestries/loxonta.ts`** (NEW)
   - Full ancestry implementation following FactoryLogic patterns
   - Signature features with size and stability bonuses
   - Choice system with 7 one-point options and 4 two-point abilities
   - Total ancestry points: 2 (reduced from standard 3 due to size cost)

2. **`src/data/ancestry-data.ts`** (MODIFIED)
   - Added Loxonta import: `import { loxonta } from '@/data/ancestries/loxonta';`
   - Added to exports: `static loxonta = loxonta;`

3. **`src/data/sourcebooks/draachenmar.ts`** (MODIFIED)
   - Added `AncestryData.loxonta` to ancestries array (line 40)
   - Added Loxonta culture using `FactoryLogic.createCulture()` (lines 109-117)
   - Added Loxontic language to languages array (lines 317-323)

---

## Technical Patterns Learned

### Correct FactoryLogic Patterns

After initial errors, referenced [terrari.ts](src/data/ancestries/terrari.ts) and [dryad.ts](src/data/ancestries/dryad.ts) to understand correct implementation:

#### Size Feature
```typescript
FactoryLogic.feature.createSize({
    id: 'loxonta-signature-big',
    name: 'Big!',
    description: 'Your size is 1L.',
    sizeValue: 2  // 2 = 1L (Large)
})
```

#### Bonus Feature
```typescript
FactoryLogic.feature.createBonus({
    id: 'loxonta-option-sturdy-hide',
    name: 'Sturdy Hide',
    description: 'Your thick skin provides natural armor.',
    field: FeatureField.Stamina,
    valuePerEchelon: 3  // or just 'value: 1' for flat bonuses
})
```

#### Choice Feature
```typescript
FactoryLogic.feature.createChoice({
    id: 'loxonta-options',
    name: 'Loxonta Options',
    options: [
        {
            feature: FactoryLogic.feature.createBonus({...}),
            value: 1  // Point cost
        },
        {
            feature: FactoryLogic.feature.createAbility({...}),
            value: 2  // Point cost
        }
    ],
    count: 'ancestry'  // Uses ancestryPoints value
})
```

#### Ability Feature (Nested Structure)
```typescript
FactoryLogic.feature.createAbility({
    ability: FactoryLogic.createAbility({
        id: 'loxonta-option-thunder-stomp',
        name: 'Thunder Stomp',
        description: '...',
        type: FactoryLogic.type.createMain(),  // or createManeuver(), createTrigger()
        keywords: [ AbilityKeyword.Area, AbilityKeyword.Melee, AbilityKeyword.Weapon ],
        distance: [ FactoryLogic.distance.create({ type: AbilityDistanceType.Burst, value: 1 }) ],
        target: 'Enemies in burst',
        cost: 'signature',
        sections: [
            FactoryLogic.createAbilitySectionRoll(
                FactoryLogic.createPowerRoll({
                    characteristic: [ Characteristic.Might ],
                    tier1: '2 untyped damage; prone',
                    tier2: '5 untyped damage; prone',
                    tier3: '7 untyped damage; prone'
                })
            ),
            FactoryLogic.createAbilitySectionText(
                'Targets test Agility vs. your Might...'
            )
        ]
    })
})
```

### Critical Pattern Corrections

#### Keywords (NOT `AbilityKeyword.Attack`)
- Use `AbilityKeyword.Area` for burst/area attacks
- Use `AbilityKeyword.Melee`, `AbilityKeyword.Ranged`, `AbilityKeyword.Weapon`, `AbilityKeyword.Magic`
- `AbilityKeyword.Attack` does NOT exist

#### Distance Creation (NOT `createBurst()`)
- **WRONG**: `FactoryLogic.distance.createBurst(1)`
- **CORRECT**: `FactoryLogic.distance.create({ type: AbilityDistanceType.Burst, value: 1 })`
- Other distance helpers: `createMelee(n)`, `createRanged(n)`, `createSelf()`

#### Required Import for Burst Distance
```typescript
import { AbilityDistanceType } from '@/enums/abiity-distance-type';  // Note: typo 'abiity' is in source
```

---

## Errors Encountered and Fixes

### Error 1: Non-Existent Factory Functions (Initial Attempt)
**Problem**: Used `FeatureLogic.createSizeFeature()`, `createBonusFeature()`, `createChoiceFeature()` which don't exist

**Fix**: Corrected to use `FactoryLogic.feature.createSize()`, `createBonus()`, `createChoice()`

### Error 2: Unused Imports
**Problem**: Imported `HeroClass` which wasn't needed

**Fix**: Removed unused import

### Error 3: Wrong AbilityKeyword
**Problem**: `AbilityKeyword.Attack` doesn't exist (used in Thunder Stomp and Trunk Yank)

**Fix**: Changed to `AbilityKeyword.Area` for burst attacks, removed from single-target melee

### Error 4: Wrong Distance Creation
**Problem**: `FactoryLogic.distance.createBurst()` doesn't exist

**Fix**: Used `FactoryLogic.distance.create({ type: AbilityDistanceType.Burst, value: 1 })`

---

## Size and Point Budget Notes

**Standard Ancestries**: 3 ancestry points to spend on options

**Loxonta (Large Size)**:
- Size 1L costs 1 ancestry point
- Remaining points: 3 - 1 = 2 ancestry points
- Therefore: `ancestryPoints: 2` in the ancestry definition

**Signature vs Options**:
- Signature features are ALWAYS ON and cost 0 points
- Loxonta signature: Big! (size) + Massive Frame (+1 Stability)
- This gives Loxonta a total of +2 Stability from signature traits alone

---

## Testing Checklist

- [x] TypeScript compilation successful (no errors after fixes)
- [ ] Frontend build successful
- [ ] Loxonta appears in character creation ancestry selection
- [ ] Size 1L correctly applies stability and size mechanics
- [ ] All 1-point options are selectable
- [ ] All 2-point abilities have correct mechanics
- [ ] Loxontic language available for selection
- [ ] Loxonta culture available with correct environment/organization/upbringing

---

## Related Documentation

- **Merge Guide**: See [MERGE_GUIDE.md](../notes/MERGE_GUIDE.md) for custom ancestry preservation during upstream merges
- **Sourcebook Structure**: See [draachenmar.ts](../src/data/sourcebooks/draachenmar.ts) for all custom content
- **Ancestry Registry**: See [ancestry-data.ts](../src/data/ancestry-data.ts) for all available ancestries

---

## Design Notes

The Loxonta represent a unique mechanical challenge: a Large-sized ancestry in the standard point-buy system. The design balances this by:

1. **Reducing available options**: 2 points instead of 3 compensates for innate size advantage
2. **Doubling down on size fantasy**: +2 Stability total (size + Massive Frame) makes them exceptional defenders
3. **Trunk versatility**: Trunkcraft and Trunk Wrestler/Yank provide unique interaction patterns
4. **Memory and patience theme**: Road-Sense and Ledger Memory reinforce the caravan archivist concept
5. **Defensive power**: Thunder Stomp and Rampart Step emphasize protective, bastion-like combat role

The Loxonta fill a niche as Large protector/support characters with unique memory-based utility and trunk-based versatility.
