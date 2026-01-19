
# Phase 3: TODS Nomenclature Consistency (Future)

## Goal
Modernize API to use TODS nomenclature throughout:
- `match.*` → `matchUp.*`
- `Match()` → `MatchUp()` (with Match as alias)
- Internal references aligned with TODS terminology

## Current State
```javascript
// Current (legacy)
const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
match.addPoint(0);
match.score();
match.toMatchUp();
```

## Target State
```javascript
// Future (TODS-native)
const matchUp = umo.MatchUp({ matchUpFormat: 'SET3-S:6/TB7' });
matchUp.addPoint(0);
matchUp.score();
matchUp.export(); // or just the object itself

// Backward compatibility maintained
const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' }); // Still works
```

## Implementation Strategy

### 1. Internal Variable Renaming
- `match` → `matchUp` in factories
- `matchObj` → `matchUpObj`
- Keep external API backward compatible

### 2. Dual API Exports
```javascript
umo.MatchUp = umo.Match;  // Primary
umo.Match = umo.MatchUp;  // Alias for backward compat

export const { MatchUp, Match, Set, Game } = umo;
```

### 3. Documentation Updates
- Mark `Match()` as legacy (but supported)
- Encourage `MatchUp()` in examples
- Migration guide for apps

### 4. Mobile App Impact
- Update tennisvisuals-mobile to use `MatchUp()`
- No breaking changes (aliases work)
- Clearer TODS alignment

## Benefits
- ✅ Consistent with TODS terminology
- ✅ Clearer for new developers
- ✅ Better interop with tods-competition-factory
- ✅ No breaking changes (aliases)

## Timeline
After Option B refactor complete + mobile app tested.
