# V4 Adapter Parity Status

## Current Status: 8/12 tests passing (67%)

### ✅ Tests PASSING (8/12)

1. **Match Initialization - format code** - v3 and v4 create match with same format ✅
2. **Match Initialization - players** - v3 and v4 initialize with same players ✅  
3. **Point Scoring - first point** - Scores match after first point ✅
4. **Point Scoring - multiple points** - Scores match after sequence ✅
5. **Point Scoring - history tracking** - Points tracked in history ✅
6. **Statistics - aces calculation** - Aces calculated correctly ✅
7. **Events - addPoint callback** - Callback triggered correctly ✅
8. **Undo - point removal** - Undo removes last point correctly ✅

### ❌ Tests FAILING (4/12)

1. **Point Decoration** - hand/stroke not persisting after decoratePoint()
2. **Statistics - Forehand/Backhand counters** - Stroke tracking not working
3. **Events - undo callback count** - v3 triggers 3x, v4 triggers 1x
4. **Complete/Winner detection** - v3 says false, v4 says true (format mismatch)

## Issues Fixed

### Issue #1: Score Object Structure ✅
**Problem:** v4 returned `{scoreString: "0-0"}` but v3 returns `{points: "0-15", games: "0-0", sets: "0-0"}`
**Solution:** Removed scoreString, added v3-compatible structure with counters, points, games, sets

### Issue #2: decoratePoint Parameter Update ✅  
**Problem:** decoratePoint wasn't updating the point parameter
**Solution:** Added `Object.assign(point, metadata)` to update parameter directly

## Issues Still Broken

### Issue #3: decoratePoint Not Persisting ❌
**Problem:** After calling `decoratePoint(lastPoint, {hand, stroke})`, the hand/stroke fields don't appear in `history.points()[0]`

**Root Cause:** Unknown - needs investigation
- `history.points()` returns `matchUp.history.points` array
- `decoratePoint()` updates `matchUp.history.points[index]`  
- But mutations aren't visible when array is read back

**Next Steps:**
1. Add debug logging to see if matchUp.history.points is actually being mutated
2. Check if v4 scoring engine is resetting/recreating the points array
3. Consider storing decorated metadata separately and merging on read

### Issue #4: Forehand/Backhand Counters ❌
**Problem:** `counters.teams[1].Forehand` is undefined even after decorating points

**Root Cause:** Depends on Issue #3 - if decoratePoint doesn't persist, counters can't see hand field

**Next Steps:**
1. Fix Issue #3 first
2. Verify buildCounters() is checking for point.hand correctly
3. Ensure counters.ts hand tracking code is running

### Issue #5: Event Callback Count Mismatch ❌
**Problem:** v3 undo callback triggers 3 times, v4 triggers 1 time

**Root Cause:** Unknown - possibly v3 triggers callbacks during point replay?

**Next Steps:**
1. Test v3 undo with logging to see when callbacks fire
2. Check if v4 needs to trigger callbacks during point replay in undo()
3. Verify callback semantics match v3 behavior

### Issue #6: Match Completion Detection ❌
**Problem:** After 4 points in SET1-S:1 format, v3 says complete=false but v4 says complete=true

**Root Cause:** Format interpretation differs - v4 might be completing match early

**Next Steps:**
1. Test with known game completion (4-0 in points)
2. Check if v4 is using correct format rules
3. Verify SET1-S:1 means "1 set to 1 game" not "1 game total"

## Critical Path to Production

**MUST FIX for hive-eye:**
1. Issue #3 (decoratePoint) - **BLOCKS stroke stats**
2. Issue #4 (Forehand/Backhand) - **BLOCKS stroke stats display**

**SHOULD FIX for stability:**
3. Issue #5 (callbacks) - May cause UI reactivity issues
4. Issue #6 (completion) - May cause premature match ending

**Timeline Estimate:**
- Issue #3: 2-4 hours (complex debugging needed)
- Issue #4: 1 hour (depends on #3)
- Issue #5: 1-2 hours (need to understand v3 behavior)
- Issue #6: 1 hour (format parsing issue)

**Total:** 5-8 hours to achieve 100% parity

## Recommendation

Given the complexity of remaining issues and time required:

**Option A: Continue fixing v4** (5-8 hours)
- Pros: Clean architecture, future-proof
- Cons: Time investment, risk of more issues

**Option B: Enhance v3 with stroke tracking** (2-3 hours)
- Pros: Faster, lower risk, known working code
- Cons: Technical debt, two code paths to maintain

**Option C: Hybrid approach** (3-4 hours)
- Keep v3 for hive-eye
- Fix v4 incrementally
- Switch to v4 when 100% parity achieved
- Pros: No disruption, gradual migration
- Cons: Longer timeline to full v4

## Decision Point

Need to decide: Fix v4 completely now, or ship stroke stats with v3 enhancement?
