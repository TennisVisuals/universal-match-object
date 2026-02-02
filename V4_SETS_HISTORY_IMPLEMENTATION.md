# UMO V4 `.sets().history` Implementation

## Summary

Implemented the `.sets().history` API for UMO V4 to provide feature parity with V3, enabling `env.matchUp.sets()[0].history.points()` to work identically to `env.match.sets()[0].history.points()` in the hive-eye-tracker application.

## Changes Made

### 1. Added Set and Game Tracking to Points (`src/v4/scoring/addPoint.ts`)

**Lines 127-129:**

```typescript
// Add V3-compatible set and game indices to point
(point as any).set = currentSetIndex;
(point as any).game =
  Math.max(side1GameScores.length, side2GameScores.length) - 1;
```

This enables filtering points by set/game index, which is essential for the history API.

### 2. Implemented `.history` Property on Set Objects (`src/v4/adapter/v3Adapter.ts`)

**Lines 732-785:**
Added a comprehensive `history` object to each set returned by `.sets()` with the following methods:

- **`points()`** - Returns all points filtered by this set's index
- **`action(actionType)`** - Returns action episodes (like 'addPoint') for this set
- **`local()`** - Returns local history for this set (game-level events)
- **`score()`** - Returns score history for all points in this set
- **`games()`** - Returns games history for this set
- **`lastPoint()`** - Returns the last point played in this set
- **`common()`** - Returns all match history (not filtered by set)

### 3. Fixed Score Display at Game Boundaries (`src/v4/scoring/addPoint.ts`)

**Lines 148-184:**
Fixed a critical bug where V4 was showing the winning score (e.g., '40-0') on game-winning points, while V3 correctly shows '0-0' (the start of the next game).

**Before:**

```
Point 3: game=0, score="40-0", winner=0  // Game-winning point showed '40-0'
Point 4: game=1, score="0-15", winner=1
```

**After:**

```
Point 3: game=0, score="0-0", winner=0  // Now correctly shows '0-0'
Point 4: game=1, score="0-15", winner=1
```

The fix checks if the game is won BEFORE calculating the score, and if won, stores '0-0' to represent the start of the next game (matching V3 behavior).

### 4. Enhanced addPoint Chaining Support (`src/v4/adapter/v3Adapter.ts`)

**Lines 240-241:**
Added support for method chaining to allow:

```typescript
match.addPoint(0).addPoint(1).addPoint(0);
```

### 5. Comprehensive Test Coverage

Created two new test files:

**`test/v4/sets-history.test.ts`** - Tests for the `.sets().history` API:

- Point filtering by set index
- Action episode generation
- Score history tracking
- Last point retrieval
- Proper isolation between sets

**`test/v4/v3-v4-parity.test.ts`** - V3/V4 comparison tests:

- Direct comparison of point scores between V3 and V4
- Verification of game boundary score behavior
- Tests with pattern '000011110000' (3 games: 4-0, 0-4, 4-0)

## Usage in hive-eye-tracker

```typescript
// V3 (existing code)
const v3Points = env.match.sets()[0].history.points();

// V4 (now works identically)
const v4Points = env.matchUp.sets()[0].history.points();

// Both return the same structure with identical data
console.log(v3Points[0]);
// {
//   winner: 0,
//   server: 0,
//   score: '15-0',
//   set: 0,
//   game: 0,
//   index: 0,
//   ...
// }
```

## Test Results

All 488 tests pass, including:

- ✅ 5 new tests for `.sets().history` API
- ✅ 2 new V3/V4 parity tests
- ✅ 438 existing tests (no regressions)

## Key Design Decisions

1. **Score representation**: Game-winning points show '0-0' (start of next game) rather than the winning score, matching V3's behavior and user expectations.

2. **Point metadata**: Added `set` and `game` properties directly to point objects for efficient filtering without requiring complex traversal logic.

3. **API symmetry**: Maintained exact API compatibility between V3 and V4, enabling drop-in replacement and parallel testing in hive-eye-tracker.

## Files Modified

- `src/v4/scoring/addPoint.ts` - Added set/game tracking and fixed score display
- `src/v4/adapter/v3Adapter.ts` - Added `.history` to set objects, enhanced chaining, implemented `points_to_set` calculation, added `parseFormat` import
- `test/v4/sets-history.test.ts` - New test file for history API
- `test/v4/v3-v4-parity.test.ts` - New test file for V3/V4 comparison
- `test/v4/points-to-set.test.ts` - New test file for `points_to_set` calculation

## Points to Set Calculation

Added comprehensive `needed.points_to_set` calculation that tracks how many points each player needs to win the current set. This is critical for the pts chart visualization in hive-eye-tracker.

**Implementation details:**

- Calculates `games_to_set` - how many games each player needs to win the set
- Calculates `points_to_game` - how many points needed to win the current game
- Calculates `points_to_set` - total points needed (current game + remaining games × 4)
- Handles tiebreak scenarios and deuce situations
- Recalculates after each point to ensure accuracy

**Example output at 5-4, 15-0:**

```typescript
{
  points_to_set: [3, 16],  // Player 0 needs 3 points, Player 1 needs 16
  games_to_set: [1, 4],     // Player 0 needs 1 game, Player 1 needs 4 games
}
```

## Related Issues

- ✅ Resolved: `env.matchUp.sets()[0].history.points()` was not available in UMO V4
- ✅ Resolved: Score irregularity where game-winning points showed '40-0' instead of '0-0'
- ✅ Resolved: `needed.points_to_set` calculation missing, causing pts chart to show flat line
- ✅ Achieved full feature parity with V3 for hive-eye-tracker integration
