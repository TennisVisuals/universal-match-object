# UMO v4 Statistics Implementation Progress

**Start Date:** January 20, 2026  
**Status:** Phase 1 Complete ✅, Phase 2 In Progress ⚙️

---

## Progress Overview

### ✅ Phase 1: Point Decoration Logging (COMPLETE)

**Goal:** Capture all point metadata that hive-eye submits to UMO

**Completed:**
1. ✅ Created `pointLogger` service in hive-eye
2. ✅ Integrated logging in 3 key locations:
   - `classAction.ts` - Live point entry
   - `clickActions.ts` - Redo actions
   - `loadMatch.ts` - Skip during load (avoid noise)
3. ✅ Browser console API:
   - `window.exportPointLogs()` - Export and download
   - `window.pointLogger.clear()` - Clear logs
   - `window.pointLogger.enable/disable()` - Toggle logging
4. ✅ Created comprehensive logging guide (`POINT_LOGGING_GUIDE.md`)

**Commits:**
- `774cc46` - feat: add point decoration logger for statistics analysis
- `3bd540b` - docs: add point logging guide for statistics capture

**Next Action Required:** 🎾 **USER MUST PLAY MATCH AND EXPORT LOGS**

---

### ⚙️ Phase 2: Statistics Module Structure (IN PROGRESS)

**Goal:** Design TypeScript interfaces and module architecture

**Completed:**
1. ✅ Created `src/v4/statistics/` directory structure
2. ✅ Defined TypeScript types (`types.ts`):
   - `PointWithMetadata` - Complete point decoration interface
   - `StatCounters` - Episode grouping structure
   - `CalculatedStat` - Computed statistic result
   - `MatchStatistics` - Complete statistics package
3. ✅ Created module entry point (`index.ts`)

**In Progress:**
- ⏳ Counter builder implementation
- ⏳ Calculator implementation
- ⏳ Standalone API

**Files Created:**
```
src/v4/statistics/
├── index.ts               ✅ Module exports
├── types.ts               ✅ TypeScript definitions
├── counters.ts            ⏳ Counter builder (next)
├── calculator.ts          ⏳ Stat calculator (next)
├── standalone.ts          ⏳ Standalone API (next)
└── __tests__/
    └── statistics.test.ts ⏳ Tests (later)
```

---

## What's Next

### Immediate: Wait for Point Decoration Data

**User Action Required:**
1. Build and run hive-eye: `cd hive-eye-tracker && pnpm build && pnpm start`
2. Open browser console
3. Play through a complete match hitting all point types (see POINT_LOGGING_GUIDE.md)
4. Run: `window.exportPointLogs()`
5. Share `point-decorations.json`

**Why This Matters:**
- Real data informs interface design
- Ensures we capture all fields hive-eye uses
- Validates our type definitions
- Provides test data

### Once We Have Data:

#### Step 1: Analyze Point Decorations
- Review `point-decorations.json`
- Validate/update `PointWithMetadata` interface
- Document field usage patterns
- Identify required vs optional fields

#### Step 2: Implement Counter Builder
**File:** `src/v4/statistics/counters.ts`

**Purpose:** Group points by statistics category

```typescript
export function buildCounters(
  points: PointWithMetadata[],
  options?: StatisticsOptions
): StatCounters {
  // Group points by:
  // - aces, doubleFaults
  // - winners, unforcedErrors, forcedErrors  
  // - serves1stIn, serves2ndIn
  // - servesWon, servesLost
  // - pointsWon, pointsServed
  // - breakpointsFaced, breakpointsSaved
  // - gamesWon
  // - Forehand/Backhand episodes
}
```

**Estimate:** 4-6 hours

#### Step 3: Implement Stat Calculator
**File:** `src/v4/statistics/calculator.ts`

**Purpose:** Calculate statistics from counters

```typescript
export function calculateStats(
  counters: StatCounters
): CalculatedStat[] {
  // Calculate all v3 stats:
  // - Aces, Double Faults
  // - Winners, Unforced/Forced Errors
  // - First Serve %, Points Won 1st/2nd
  // - Receiving %, Breakpoints Saved/Converted
  // - Max Points/Games in a Row
  // - Aggressive Margin
}
```

**Estimate:** 6-8 hours

#### Step 4: Standalone API
**File:** `src/v4/statistics/standalone.ts`

**Purpose:** Use statistics without PointsEngine

```typescript
export function calculateMatchStatistics(
  matchUp: MatchUp,
  points: PointWithMetadata[],
  options?: StatisticsOptions
): MatchStatistics {
  const counters = buildCounters(points, options);
  const calculated = calculateStats(counters);
  return { counters, calculated };
}
```

**Estimate:** 2-3 hours

#### Step 5: Integrate with v3 Adapter
**File:** `src/v4/adapter/v3Adapter.ts`

**Changes:**
- Store `pointHistory: PointWithMetadata[]`
- Parse v3-style addPoint input
- Implement `stats.counters(setFilter)`
- Implement `stats.calculated(setFilter)`

**Estimate:** 4-6 hours

#### Step 6: Comprehensive Testing
**Files:** `src/v4/statistics/__tests__/*.test.ts`

**Coverage:**
- Unit tests for each stat calculation
- Counter building logic
- Set filtering
- Edge cases
- v3 API compatibility
- Real match validation

**Estimate:** 6-8 hours

#### Step 7: Documentation & Examples
**Files:**
- `V4_STATISTICS.md` - API reference
- `examples/statistics-example.ts`

**Estimate:** 3-4 hours

---

## Architecture Decisions

### 1. Metadata Storage: In Adapter Layer ✅
- **Rationale:** Keeps v4 core pure (scoring only)
- Statistics is opt-in via adapter
- PointsEngine can optionally track metadata

### 2. Dual API: Integrated + Standalone ✅
- **Integrated:** Easy for v3 adapter (`match.stats.calculated()`)
- **Standalone:** Flexible external use (`calculateMatchStatistics(matchUp, points)`)

### 3. Point Format: Superset of v3 ✅
- **Rationale:** Maximum compatibility
- Easy migration path
- Can add v4-specific fields later

### 4. Lazy Calculation ✅
- **Rationale:** Don't compute if not needed
- Matches v3 behavior
- Good performance

---

## Estimated Timeline

**Remaining Work:** ~25-35 hours

| Phase | Task | Estimate | Depends On |
|-------|------|----------|------------|
| 2 | Analyze decorations | 1-2h | User captures data |
| 2 | Counter builder | 4-6h | Analysis |
| 2 | Stat calculator | 6-8h | Counter builder |
| 2 | Standalone API | 2-3h | Calculator |
| 3 | v3 Adapter integration | 4-6h | Standalone API |
| 4 | Unit tests | 4-6h | All implementation |
| 4 | Integration tests | 2-3h | v3 Adapter |
| 5 | Documentation | 3-4h | All complete |

**Best Case:** 3 days (8h/day)  
**Realistic:** 4-5 days (interruptions, debugging, iteration)

---

## Success Criteria

- ✅ Point logger captures real data
- ⏳ All v3 statistics match exactly in v4 adapter
- ⏳ Point metadata fully captured and stored
- ⏳ Statistics work with PointsEngine (optional)
- ⏳ Statistics work standalone (required)
- ⏳ Set filtering works correctly
- ⏳ All tests passing (>95% coverage)
- ⏳ Hive-eye stats page shows all statistics correctly
- ⏳ Performance acceptable (<100ms for typical match)

---

## Current Blockers

### 🔴 BLOCKER: Need Point Decoration Data

**Impact:** Cannot proceed with implementation until we understand the data structure

**Resolution:** User must:
1. Run hive-eye in browser
2. Play through match
3. Export logs with `window.exportPointLogs()`
4. Share `point-decorations.json`

**ETA:** User-dependent (could be today!)

---

## Repository Status

### UMO (`hive-eye-update` branch)
- ✅ v4-umo adapter (scoring complete)
- ✅ Statistics types defined
- ⏳ Statistics implementation pending

### Hive-Eye (`feature/umo-4.0` branch)
- ✅ Point logger integrated
- ✅ Logging guide documented
- ⏳ Waiting for user to capture data

---

## Next Commits (Planned)

1. **Analyze decorations** - Document findings from user's JSON
2. **Implement counters** - Counter builder with tests
3. **Implement calculator** - All stat calculations
4. **Standalone API** - External statistics API
5. **v3 Adapter stats** - Integrate with adapter
6. **Comprehensive tests** - Full test suite
7. **Documentation** - API docs and examples

---

## Questions for User

1. **When can you capture the point decorations?**
   - Need this to proceed with implementation

2. **Are there any special point types we should ensure are captured?**
   - Penalties?
   - Let calls?
   - Code violations?

3. **Do you want stroke-specific statistics?**
   - Forehand winners vs backhand winners?
   - Stroke-by-stroke breakdown?

4. **Performance requirements?**
   - Is <100ms for full match statistics acceptable?
   - Or do we need streaming/incremental calculation?

---

## Communication

**Status Updates:**
- Phase 1: ✅ Complete (2 hours)
- Phase 2: ⚙️ In Progress (structure only)
- Phase 3-5: ⏸️ Blocked on data

**Ready to Continue:**
Once point decoration data is available, implementation can proceed rapidly. All infrastructure is in place!

🎾📊 **Next: User captures match data, then we implement the statistics engine!**
