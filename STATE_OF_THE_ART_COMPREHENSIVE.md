# Universal Match Object v4.0 - State of the Art

## Hive-Eye Migration: Parallel V3/V4 Testing Architecture

**Date**: January 21, 2026  
**Session Summary**: Controlled parallel testing setup complete  
**Status**: ✅ **READY FOR INCREMENTAL V4 MIGRATION**

---

## Executive Summary

Successfully implemented a controlled parallel testing architecture that allows incremental V4 API migration in hive-eye-tracker. Both V3 and V4 UMO instances run side-by-side with V3 driving the UI while V4 shadows every call for testing. Comprehensive logging system tracks all API calls with clear prefixes.

**Key Achievement**: Can now add V4 calls one at a time alongside V3 calls to identify exactly where V4 breaks, fix it, and continue until full migration is complete.

---

## Repository States

### Universal Match Object (`working-in-ui-when-not-using-v4` branch)

**Latest Commit**: `63ad6ec - fix: add missing [UMO-V3] addPoint log`

**Logging Implemented**:

- ✅ `[UMO-V3]` prefix for all v3 Match, addPoint, decoratePoint
- ✅ `[UMO-V4]` prefix for all v4 adapter calls
- ✅ Verbose counters.ts logs disabled for cleaner output

**Key Files**:

- `src/matchObject.ts` (line 58): V3 Match creation log
- `src/state/stateObject.ts` (line 262): V3 addPoint log
- `src/state/stateObject.ts` (line 342): V3 decoratePoint log
- `src/v4/adapter/v3Adapter.ts`: All V4 adapter logs with `[UMO-V4]` prefix
- `src/v4/statistics/counters.ts`: Verbose logs commented out

---

### Hive-Eye Tracker (`feature/umo-4.0` branch)

**Latest Commit**: `adf82ba - fix: load points into both env.match (v3) and env.matchUp (v4)`

**Architecture**: Controlled Parallel Testing

```typescript
// env.ts - Single point of V3 and V4 creation
import matchObjectV3 from "@tennisvisuals/universal-match-object";
import { Match as MatchV4 } from "@tennisvisuals/universal-match-object/v4-umo";

// V3 Match - drives UI via env.match
const matchV3 = matchObjectV3.Match({ matchUpFormat: "SET3-S:6/TB7" });

// V4 Match - shadow for testing via env.matchUp
const matchV4 = MatchV4({ matchUpFormat: "SET3-S:6/TB7" });

export const env = {
  match: matchV3, // V3 UMO (drives all UI)
  matchUp: matchV4, // V4 UMO (parallel testing only, no UI)
  // ... other properties
};
```

**Naming Convention** (ENFORCED):

- `env.match` = V3 UMO (drives all UI interactions)
- `env.matchUp` = V4 UMO (parallel testing only)
- Standalone exports commented out to force this pattern

**Logging Implemented**:

- ✅ `[HVE]` prefix for all hive-eye app logs
- ✅ PointLogger disabled for cleaner output during testing
- ✅ Startup, match creation, loading logs

**Parallel V4 Calls Implemented**:

1. **classAction.ts** (line 152-160):

```typescript
// V3 addPoint - drives UI
const what = env.match.addPoint(point);

// V4 addPoint - parallel testing (no UI interaction)
try {
  env.matchUp.addPoint(point);
  console.log("[HVE] V4 addPoint shadow call succeeded");
} catch (e) {
  console.error("[HVE] V4 addPoint shadow call FAILED:", e);
}
```

2. **strokeAction.ts** (line 17-25):

```typescript
// V3 decoratePoint - drives UI
env.match.decoratePoint(last_point, { hand, stroke });

// V4 decoratePoint - parallel testing (no UI interaction)
try {
  env.matchUp.decoratePoint(last_point, { hand, stroke });
  console.log("[HVE] V4 decoratePoint shadow call succeeded");
} catch (e) {
  console.error("[HVE] V4 decoratePoint shadow call FAILED:", e);
}
```

3. **loadMatch.ts** (line 145-155):

```typescript
todsPoints.forEach((point: any, index: number) => {
  // V3 addPoint - drives UI
  env.match.addPoint(point);

  // V4 addPoint - parallel testing (keep in sync)
  try {
    env.matchUp.addPoint(point);
  } catch (e) {
    console.error(
      "[HVE] V4 addPoint during load failed at index",
      index,
      ":",
      e,
    );
  }
});
```

**Key Files Modified**:

- `src/transition/env.ts`: Parallel match creation
- `src/transition/classAction.ts`: Parallel addPoint
- `src/transition/strokeAction.ts`: Parallel decoratePoint
- `src/transition/loadMatch.ts`: Parallel point loading
- `src/services/pointLogger.ts`: Disabled for testing

**V4 Imports Removed From** (now only use V3):

- `displayMatchArchive.ts`
- `loadMatch.ts`
- `changeFormat.ts`

---

## Console Log Flow

### Startup Sequence

```
[UMO-V4] Adapter loaded - BUILD: 2026-01-21T13:11:17.530Z
[HVE] Creating default matches - env.match (v3) + env.matchUp (v4)
[UMO-V3] Match created with options: {matchUpFormat: 'SET3-S:6/TB7', ...}
[UMO-V4] Match created with options: {matchUpFormat: 'SET3-S:6/TB7'}
[UMO-V4] matchUp created with format: SET3-S:6/TB7
[HVE] Default matches created - env.match (v3) and env.matchUp (v4) ready
```

### Match Load Sequence

```
[HVE] loadMatch creating new v3 match with format: SET3-S:6/TB7
[UMO-V3] Match created with options: {matchUpFormat: 'SET3-S:6/TB7', ...}
[HVE] Loading 36 points into both v3 and v4
[UMO-V3] addPoint called with: {...}
[UMO-V4] addPoint returning: {...}
... (repeated 36 times)
[HVE] Finished loading points into v3 and v4
```

### Adding a Point

```
[UMO-V3] addPoint called with: {winner: 1, result: 'Winner'}
[UMO-V4] addPoint returning: {hasPoint: true, pointResult: 'Winner', ...}
[HVE] V4 addPoint shadow call succeeded
```

### Decorating a Point

```
[HVE] strokeAction called: <div class="strokeAction backhand" ...>
[HVE] strokeAction attributes: {hand: 'Backhand', stroke: 'Drive Volley'}
[HVE] strokeAction last_point: {winner: 1, result: 'Winner', ...}
[UMO-V3] decoratePoint called with: {index: 37, attributes: {...}}
[UMO-V4] decoratePoint called with: {index: 37, metadata: {...}}
[UMO-V4]   Point before decoration: {...}
[UMO-V4]   Point after decoration: {...}
[HVE] V4 decoratePoint shadow call succeeded
```

---

## Critical Lessons Learned

### 1. Module Imports Load V4 Adapter Immediately

**Problem**: Multiple files importing `@tennisvisuals/universal-match-object/v4-umo` caused v4 adapter to load at module initialization, even if not used.

**Solution**: Only `env.ts` imports v4. All other files use v3 only.

**Files That Had Unintended V4 Imports**:

- `displayMatchArchive.ts` - created `matchObject = { Match }` from v4
- `loadMatch.ts` - created `testObject = { Match }` from v4
- `changeFormat.ts` - created `testObject = { Match }` from v4
- `factoryMatchUpLoader.ts` - actually uses v4 (kept)

### 2. env.match vs Exported match

**Problem**: Old code had `env.match = matchUp` pointing to the matchUp variable. After refactor, `env.match` was pointing to undefined variable name.

**Solution**:

```typescript
const { matchV3, matchV4 } = createDefaultMatches();
export const env = {
  match: matchV3, // Must point to actual variable
  matchUp: matchV4, // Must point to actual variable
};
```

### 3. V3 and V4 Must Stay Synchronized

**Problem**: When loading saved matches, points were only added to v3. This caused v4 decoratePoint to fail (point doesn't exist).

**Solution**: Add parallel v4 calls during match load to keep both instances in sync.

### 4. Creation Order Matters

**Problem**: V4 was being created before V3, causing confusion in logs.

**Solution**: Always create V3 first (it drives UI), then V4 immediately after.

---

## Next Steps: Incremental V4 Migration Plan

### Phase 1: Add Parallel V4 Calls (CURRENT)

✅ **Completed**:

- env.ts: Both matches created
- classAction.ts: addPoint parallel call
- strokeAction.ts: decoratePoint parallel call
- loadMatch.ts: point loading parallel calls

📋 **Remaining**:

- clickActions.ts: addPoint parallel call
- Any other places that create/modify matches

### Phase 2: Add Remaining Method Calls

Add parallel v4 calls for:

- ✅ `addPoint()` - DONE
- ✅ `decoratePoint()` - DONE
- 📋 `score()`
- 📋 `scoreboard()`
- 📋 `history.points()`
- 📋 `history.lastPoint()`
- 📋 `metadata.definePlayer()`
- 📋 `metadata.defineMatch()`
- 📋 `format.code`
- 📋 `stats.counters()`
- 📋 `stats.calculated()`
- 📋 `undo()`
- 📋 `reset()` / `changeFormat()`

### Phase 3: Monitor for Failures

Watch console for:

```
[HVE] V4 {method} shadow call FAILED: {error}
```

When a failure occurs:

1. Note the exact method and parameters
2. Fix the v4 adapter to handle that case
3. Rebuild UMO
4. Test again
5. Move to next method

### Phase 4: Switch to V4

Once all parallel calls succeed:

1. Swap: `env.match = matchV4` (v4 drives UI)
2. Keep: `env.matchUp = matchV3` (v3 for comparison)
3. Test thoroughly
4. Remove v3 when confident

### Phase 5: Production

1. Remove try-catch wrappers
2. Remove parallel v3 calls
3. Remove logging (or reduce to errors only)
4. Update documentation
5. Deploy

---

## Testing Strategy

### Current Test Pattern

```typescript
// Pattern for adding parallel V4 calls:

// 1. Find v3 call
const result = env.match.someMethod(params);

// 2. Add v4 call immediately after
try {
  env.matchUp.someMethod(params);
  console.log("[HVE] V4 someMethod shadow call succeeded");
} catch (e) {
  console.error("[HVE] V4 someMethod shadow call FAILED:", e);
}

// 3. Monitor console for failures
```

### Error Detection

- All v4 calls wrapped in try-catch
- Failures logged with method name and error
- V3 continues to drive UI (unaffected by v4 failures)
- Can identify exact breaking point

### Success Criteria

- ✅ All `[HVE] V4 {method} shadow call succeeded` messages
- ✅ No `[HVE] V4 {method} shadow call FAILED` messages
- ✅ UI remains stable and functional
- ✅ Scores match between v3 and v4

---

## Files Reference

### UMO Repository Key Files

```
src/
├── matchObject.ts              [UMO-V3] Match creation log (line 58)
├── state/
│   └── stateObject.ts          [UMO-V3] addPoint (262), decoratePoint (342)
└── v4/
    ├── adapter/
    │   └── v3Adapter.ts        All [UMO-V4] logs
    └── statistics/
        └── counters.ts         Verbose logs commented out
```

### Hive-Eye Repository Key Files

```
src/
├── transition/
│   ├── env.ts                  Parallel match creation (CRITICAL)
│   ├── classAction.ts          Parallel addPoint (152-160)
│   ├── strokeAction.ts         Parallel decoratePoint (17-25)
│   ├── loadMatch.ts            Parallel point loading (145-155)
│   ├── displayMatchArchive.ts  V4 import removed
│   └── changeFormat.ts         V4 import removed
└── services/
    └── pointLogger.ts          Disabled for testing
```

---

## Git Commit History

### UMO Repository (working-in-ui-when-not-using-v4)

```
63ad6ec - fix: add missing [UMO-V3] addPoint log
7236972 - chore: disable verbose counters.ts logging
10ddd9d - feat: add [UMO-V4] prefix to all v4 adapter logging
32e69a9 - feat: add [UMO-V3] logging for Match, addPoint, decoratePoint
```

### Hive-Eye Repository (feature/umo-4.0)

```
adf82ba - fix: load points into both env.match (v3) and env.matchUp (v4)
2a0b201 - feat: add parallel V4 calls for addPoint and decoratePoint
db5bd49 - refactor: enforce env.match (v3) and env.matchUp (v4) naming convention
8137f8e - fix: env.match must point to matchV3, not old matchUp variable
78b4fe8 - fix: remove all testObject references from loadMatch and changeFormat
f369080 - fix: remove testObject references causing errors
2f25c85 - fix: remove v4 imports from loadMatch and changeFormat
231de82 - feat: implement controlled V3/V4 parallel testing architecture
864b339 - chore: disable point decoration console logging
47f69c7 - chore: disable pointLogger for cleaner v3/v4 testing logs
be39de9 - feat: add [HVE] prefix to point decoration log
6e27f68 - feat: add [HVE] prefix to pointLogger
7793530 - feat: add [HVE] prefix to hive-eye transition logging
```

---

## Known Issues & Solutions

### Issue 1: V4 decoratePoint fails with "Could not find point"

**Cause**: env.matchUp not synchronized with env.match during match load  
**Status**: ✅ FIXED in commit `adf82ba`  
**Solution**: Add parallel v4 addPoint calls during match load

### Issue 2: Multiple V4 matches created at startup

**Cause**: Multiple files importing v4-umo causing module-level initialization  
**Status**: ✅ FIXED in commit `2f25c85`  
**Solution**: Only env.ts imports v4

### Issue 3: Score not displaying (15-30-40)

**Cause**: env.match pointing to undefined 'matchUp' variable name  
**Status**: ✅ FIXED in commit `8137f8e`  
**Solution**: env.match = matchV3 (actual variable)

### Issue 4: Duplicate UI on startup

**Cause**: Second v3 match being created during initialization  
**Status**: ✅ FIXED in commit `f369080`  
**Solution**: Removed testObject references

---

## Success Metrics

### Current Status

- ✅ Clean startup with controlled match creation
- ✅ V3 created before V4 every time
- ✅ Comprehensive logging with clear prefixes
- ✅ Parallel v4 calls for addPoint working
- ✅ Parallel v4 calls for decoratePoint working
- ✅ Match loading syncs both v3 and v4
- ✅ UI stable and functional
- ✅ Clear error reporting when v4 fails

### Ready For

- 📋 Adding more parallel v4 method calls
- 📋 Testing each method incrementally
- 📋 Identifying exact breaking points
- 📋 Fixing v4 adapter issues as found

---

## Conclusion

**The controlled parallel testing architecture is complete and working.**

We can now systematically add V4 API calls alongside every V3 call in hive-eye-tracker, one method at a time. The comprehensive logging shows exactly when and where each call happens. Try-catch wrappers ensure V3 continues to drive the UI even if V4 fails, allowing us to identify and fix issues incrementally.

**Next session**: Continue adding parallel v4 calls for remaining methods (score, scoreboard, history, metadata, stats, undo, reset) until all succeed, then switch to V4 as the primary driver.

---

**Document Version**: 1.0  
**Last Updated**: January 21, 2026  
**Authors**: Droid (Factory AI) + Charles Allen
