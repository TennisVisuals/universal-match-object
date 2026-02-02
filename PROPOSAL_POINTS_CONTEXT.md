# Proposal: Add Point Context to PointsEngine

**Date**: February 1, 2026  
**Status**: PROPOSAL  
**Goal**: Move points_to_set calculation from v3Adapter into core PointsEngine

---

## Problem Statement

Currently, the rich point context (points_to_set, games_to_set, etc.) is **only available in v3Adapter**, which is:

1. ❌ Not exported from the v4 package
2. ❌ Only used for testing v3/v4 parity
3. ❌ Not accessible to consumers using PointsEngine directly

This forces consumers to:

- Either use the legacy v3 API (less performant, more complex)
- Or calculate context themselves (duplicating logic, potential inconsistencies)

---

## Current State

### PointsEngine (Minimal)

```typescript
const engine = new PointsEngine({ matchUpFormat: "SET3-S:6/TB7" });
engine.addPoint({ winner: 0, server: 0 });

const point = engine.getState().history.points[0];
// {
//   winner: 0,
//   server: 0,
//   score: "15-0",
//   // NO context about points needed!
// }
```

### v3Adapter (Rich Context)

```typescript
const umo = createV3Adapter(); // Not exported!
const match = umo.Match({ matchUpFormat: "SET3-S:6/TB7" });
match.addPoint(0);

const points = match.sets()[0].history.action("addPoint");
// {
//   point: { ... },
//   needed: {
//     points_to_game: [3, 4],
//     points_to_set: [23, 28],  // ← This is valuable!
//     games_to_set: [6, 7]
//   }
// }
```

---

## Proposed Solution

### Option 1: Add Context to Points (Recommended)

Add optional `context` property to each point in PointsEngine:

```typescript
export interface Point {
  winner: 0 | 1;
  server: 0 | 1;
  score: string;
  // ... existing fields ...

  // New: Optional context (calculated if enabled)
  context?: PointContext;
}

export interface PointContext {
  points_to_game: [number, number];
  points_to_set: [number, number];
  games_to_set: [number, number];
  is_breakpoint: boolean;
  game_complete: boolean;
  set_complete: boolean;
  match_complete: boolean;
}
```

**Usage**:

```typescript
const engine = new PointsEngine({
  matchUpFormat: "SET3-S:6/TB7",
  calculateContext: true, // Opt-in
});

engine.addPoint({ winner: 0, server: 0 });

const point = engine.getState().history.points[0];
console.log(point.context.points_to_set); // [23, 28]
```

**Pros**:

- ✅ Opt-in (no performance impact if not needed)
- ✅ Data travels with point (easy to serialize)
- ✅ Consistent across all consumers
- ✅ Single source of truth

**Cons**:

- ⚠️ Slightly larger point objects
- ⚠️ Needs careful calculation on each addPoint()

---

### Option 2: Add Context Calculator Utility

Export a separate utility function:

```typescript
import {
  PointsEngine,
  calculateContext,
} from "@tennisvisuals/universal-match-object/v4";

const engine = new PointsEngine({ matchUpFormat: "SET3-S:6/TB7" });
engine.addPoint({ winner: 0 });

const matchUp = engine.getState();
const enrichedPoints = calculateContext(matchUp);
// Each point now has .context
```

**Pros**:

- ✅ PointsEngine stays minimal
- ✅ Consumers choose when to calculate
- ✅ Can be called once at end vs. per point

**Cons**:

- ⚠️ Two-step process (create match, then enrich)
- ⚠️ Easy to forget to call
- ⚠️ May calculate stale data if match continues

---

### Option 3: Export v3Adapter

Simply export the v3Adapter as public API:

```typescript
// In src/v4/index.ts
export { createV3Adapter } from "./adapter/v3Adapter";
```

**Pros**:

- ✅ Already implemented
- ✅ Tested and working
- ✅ Feature-complete

**Cons**:

- ⚠️ Complex API surface
- ⚠️ Mixes v3 patterns with v4
- ⚠️ Harder to maintain two APIs

---

## Recommendation: Option 1

Add `calculateContext` option to PointsEngine.

### Implementation Plan

1. **Add PointContext type** (`src/v4/types.ts`)

   ```typescript
   export interface PointContext {
     points_to_game: [number, number];
     points_to_set: [number, number];
     games_to_set: [number, number];
     is_breakpoint: boolean;
     game_complete: boolean;
     set_complete: boolean;
     match_complete: boolean;
   }
   ```

2. **Add option to PointsEngine** (`src/v4/engine/PointsEngine.ts`)

   ```typescript
   export interface PointsEngineOptions {
     matchUpFormat?: string;
     matchUpId?: string;
     isDoubles?: boolean;
     calculateContext?: boolean; // New
   }
   ```

3. **Calculate context in addPoint** (`src/v4/scoring/addPoint.ts`)
   - Copy logic from v3Adapter (lines 150-195)
   - Calculate games_to_set from current score
   - Calculate points_to_game from current game state
   - Calculate points_to_set from games remaining
   - Attach to point as `point.context`

4. **Update Point type** (`src/v4/types.ts`)

   ```typescript
   export interface Point {
     // ... existing fields ...
     context?: PointContext; // Optional
   }
   ```

5. **Add tests** (`test/v4/point-context.test.ts`)
   - Test context calculation at various scores
   - Test opt-in behavior (context undefined when disabled)
   - Test performance impact
   - Test edge cases (deuce, tiebreak, etc.)

---

## Performance Considerations

### Calculation Cost

The context calculation is lightweight:

```typescript
// Pseudo-code
calculateContext(matchUp, point) {
  // O(1) operations
  const games_to_set = [6 - side1Games, 6 - side2Games];
  const points_to_game = [4 - side1Points, 4 - side2Points];
  const points_to_set = games_to_set.map(g => g * 4 + points_to_game);

  return { points_to_game, points_to_set, games_to_set };
}
```

**Estimated cost**: < 1ms per point

### Memory Impact

Each PointContext adds ~56 bytes per point:

```
points_to_game: [number, number]     = 16 bytes
points_to_set: [number, number]      = 16 bytes
games_to_set: [number, number]       = 16 bytes
is_breakpoint: boolean               = 1 byte
game_complete: boolean               = 1 byte
set_complete: boolean                = 1 byte
match_complete: boolean              = 1 byte
Object overhead                      ≈ 24 bytes
Total                                ≈ 76 bytes
```

**For 200-point match**: ~15KB (negligible)

---

## Migration Path

### Phase 1: Add to PointsEngine (v4.1.0)

- Add calculateContext option
- Add PointContext type
- Add context to Point type
- Add tests
- Update documentation

### Phase 2: Use in hive-eye-tracker (immediately after)

```typescript
// OLD (manual calculation)
const matchUp = generateMatch();
const episodes = matchUpToLegacyEpisodes(matchUp); // We calculate

// NEW (automatic)
const engine = new PointsEngine({
  matchUpFormat: "SET3-S:6/TB7",
  calculateContext: true,
});
// ... play points ...
const points = engine.getState().history.points;
// Each point has .context automatically!
```

### Phase 3: Deprecate Manual Calculations

- Remove adapter calculations in hive-eye-tracker
- Use PointEngine context directly
- Cleaner, more maintainable code

---

## Benefits

### For Library Consumers

- ✅ Don't need to calculate themselves
- ✅ Consistent calculations across all uses
- ✅ Single source of truth
- ✅ Easy to access rich context

### For Library Maintainers

- ✅ Logic in one place (easier to fix bugs)
- ✅ Better test coverage
- ✅ Clear API boundary
- ✅ Opt-in (no breaking changes)

### For Visualizations

- ✅ No adapter layer needed
- ✅ Direct access to points_to_set
- ✅ Simpler code
- ✅ Faster development

---

## Example Usage

### Before (Current)

```typescript
// In hive-eye-tracker/matchFixtures.ts
function matchUpToLegacyEpisodes(matchUp) {
  // 100+ lines of manual context calculation
  const points_to_set = /* complex calculation */;
  const games_to_set = /* more calculation */;
  // ... etc
}
```

### After (Proposed)

```typescript
// In hive-eye-tracker
import { PointsEngine } from "@tennisvisuals/universal-match-object/v4";

const engine = new PointsEngine({
  matchUpFormat: "SET3-S:6/TB7",
  calculateContext: true, // That's it!
});

engine.addPoint({ winner: 0 });

const points = engine.getState().history.points;
// points[0].context.points_to_set is already there!
```

**Reduction**: 100+ lines → 1 option flag

---

## Backward Compatibility

✅ **100% Backward Compatible**

- Default `calculateContext: false` (current behavior)
- No changes to existing API
- Optional property on Point type
- No performance impact unless enabled

---

## Timeline Estimate

- **Design/Review**: 1 hour (this document)
- **Implementation**: 4-6 hours
  - Add types and options: 1 hour
  - Port calculation logic: 2 hours
  - Add tests: 2-3 hours
- **Documentation**: 1 hour
- **Total**: 6-8 hours

---

## Next Steps

1. **Review this proposal** - Get feedback from maintainers
2. **Approve approach** - Confirm Option 1 is preferred
3. **Create issue** - Track in universal-match-object repo
4. **Implement** - Add calculateContext option
5. **Test** - Ensure all calculations correct
6. **Document** - Update README and examples
7. **Release** - Publish as v4.1.0
8. **Adopt** - Update hive-eye-tracker to use it

---

## Questions for Discussion

1. Should `calculateContext` be **default true** or **default false**?
   - Recommendation: **false** (opt-in, no breaking changes)

2. Should context be on Point object or separate?
   - Recommendation: **On Point** (easier to work with)

3. Should we calculate on every addPoint() or lazily?
   - Recommendation: **Every addPoint()** (simpler, always fresh)

4. Should we expose calculateContext() as standalone function too?
   - Recommendation: **Yes** (for flexibility)

---

## Conclusion

Adding point context to PointsEngine would:

- ✅ Eliminate duplicate calculation logic
- ✅ Provide single source of truth
- ✅ Make visualizations simpler
- ✅ Maintain backward compatibility
- ✅ Require minimal implementation effort

**Estimated ROI**: High (eliminates 100+ lines of duplicate code per consumer)

---

**Status**: PROPOSAL  
**Author**: AI Development Team  
**Date**: February 1, 2026  
**Next**: Review and approval
