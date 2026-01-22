# Development Plan: Server Tracking & Court Side Positioning

**Date:** 2026-01-22
**Status:** ASSESSMENT COMPLETE - Implementation Pending

---

## Executive Summary

V4 has **partial server tracking** implemented in the v3Adapter but lacks:
1. Core query functions for server/side prediction
2. Ad/Deuce court positioning logic
3. Override capabilities for incorrect server/side
4. Validation hooks for server rotation errors

This plan outlines requirements, existing implementation, and path forward.

---

## Requirements: Tennis Server & Side Rotation

### 1. **Server Rotation Rules**

#### Regular Games
- Server alternates **after each game**
- Player who served first in set = `firstService` (0 or 1)
- Current server = `(firstService + gamesCompleted) % 2`

#### Tiebreak Games
- First point: Player who would serve next regular game
- Thereafter: Alternate **every 2 points** (1-1, 2-3, 4-5, etc.)
- After tiebreak: Opponent of player who served first point serves next game

#### Set Boundaries
- Server from **end of previous set** serves **first game of next set**
- Exception: Some tournaments alternate first serve in new sets (override needed)

### 2. **Court Side Positioning (Ad/Deuce)**

#### Point Count Logic
```typescript
// Side alternates every point based on cumulative point count in game
const totalPointsInGame = side1Points + side2Points;
const servingSide = totalPointsInGame % 2 === 0 ? 'DEUCE' : 'AD';
```

#### Examples
- 0-0 → DEUCE side
- 15-0 → AD side
- 15-15 → DEUCE side
- 30-40 → AD side
- Deuce (40-40) → DEUCE side
- Advantage → AD side

#### Tiebreak Side Logic
Same as regular games - alternate every point based on cumulative count.

### 3. **Override Requirements**

Real-world scenarios requiring overrides:

#### A. Wrong Server
Players lose track and wrong player serves entire game:
```typescript
addPoint({ winner: 0, server: 1 }) // Override: Player 1 serving (wrong!)
// System should: Accept override, flag warning, continue with corrected state
```

#### B. Wrong Side (Ad/Deuce)
Players serve from wrong side of court:
```typescript
addPoint({ 
  winner: 0, 
  server: 0, 
  servingSide: 'AD'  // Override: Should be DEUCE but was AD
})
// System should: Accept override, track anomaly, allow correction
```

#### C. Mid-Match Corrections
Officials notice error several games later:
```typescript
decoratePoint(point, { 
  serverCorrected: true, 
  originalServer: 0, 
  correctedServer: 1 
})
// System should: Allow historical correction, maintain data integrity
```

---

## Current Implementation Status

### ✅ **Implemented in v3Adapter**

**Location:** `src/v4/adapter/v3Adapter.ts` (lines 50-165)

```typescript
let firstService = 0;
let currentServer = 0;

function updateServiceTracking() {
  const score = getScore(matchUp);
  
  // Tiebreak logic: Alternate every 2 points
  const currentSet = matchUp.score.sets[matchUp.score.sets.length - 1];
  if (currentSet) {
    const s1 = currentSet.side1Score || 0;
    const s2 = currentSet.side2Score || 0;
    
    // Check if in tiebreak (6-6)
    if (s1 === 6 && s2 === 6) {
      const tiebreakPoints =
        (currentSet.side1GameScores?.slice(-1)[0] || 0) +
        (currentSet.side2GameScores?.slice(-1)[0] || 0);
      // Alternate every 2 points in tiebreak
      currentServer = Math.floor(tiebreakPoints / 2) % 2;
      return;
    }
  }
  
  // Regular games: alternate server each game
  const gamesCompleted = score.sets
    .flatMap((set) => [set.side1Score || 0, set.side2Score || 0])
    .reduce((a, b) => a + b, 0);
  
  currentServer = (firstService + gamesCompleted) % 2;
}
```

**Capabilities:**
- ✅ Tracks `currentServer` and `firstService`
- ✅ Regular game alternation (every game)
- ✅ Tiebreak alternation (every 2 points)
- ✅ Updates after each point via `updateServiceTracking()`

**Limitations:**
- ❌ Only in adapter, not core V4
- ❌ No ad/deuce side calculation
- ❌ No override capability
- ❌ Not exported as query function

### ✅ **Implemented: pbpValidator**

**Location:** `src/v4/validation/pbpValidator.ts`

```typescript
export function pbpValidator(options: PBPValidationOptions): PBPValidationResult
```

**Capabilities:**
- ✅ Validates point sequences produce expected scores
- ✅ Accepts format string or deduces from score
- ✅ Detects excess points after match complete
- ✅ Returns detailed validation results

**Limitations:**
- ❌ Doesn't validate server rotation
- ❌ Doesn't detect incorrect server/side
- ❌ No anomaly flagging for violations

### ❌ **Not Implemented**

1. **Core Query Functions**
   ```typescript
   // Commented out in src/v4/index.ts:29
   // export { getNextServer } from './query/getNextServer';
   ```
   File doesn't exist yet.

2. **Ad/Deuce Side Positioning**
   - No logic for determining serving side
   - No tracking of ad/deuce in point metadata
   - No validation of side correctness

3. **Override Mechanisms**
   - Can't override server in `addPoint()`
   - Can't override serving side
   - No validation warnings for anomalies

4. **Server Rotation Validation**
   - No detection of incorrect server
   - No correction suggestions
   - No historical audit trail

---

## Development Plan: Phased Implementation

### **Phase 1: Core Server Tracking** (Priority: HIGH)

Move server tracking from adapter to core V4.

#### 1.1 Create `getNextServer` Query Function

**File:** `src/v4/query/getNextServer.ts`

```typescript
export interface NextServerResult {
  server: 0 | 1;
  servingSide: 'DEUCE' | 'AD';
  reason: 'FIRST_POINT' | 'GAME_ROTATION' | 'TIEBREAK_ROTATION';
  isInTiebreak: boolean;
}

/**
 * Determine next server based on current match state
 * 
 * @param matchUp - Current matchUp state
 * @param firstService - Player who served first (0 or 1)
 * @returns Next server, serving side, and metadata
 */
export function getNextServer(
  matchUp: MatchUp, 
  firstService: 0 | 1 = 0
): NextServerResult {
  // Implementation similar to v3Adapter.updateServiceTracking()
  // but returns structured result
}
```

**Export:** Add to `src/v4/index.ts`

#### 1.2 Update `addPoint` to Accept Server Override

**File:** `src/v4/scoring/addPoint.ts`

```typescript
export interface AddPointOptions {
  winner: 0 | 1;
  server?: 0 | 1;  // Optional - if not provided, derive from match state
  servingSide?: 'DEUCE' | 'AD';  // Optional override
  timestamp?: string;
  // ... existing fields
}
```

**Logic:**
```typescript
// In addPoint():
let server: 0 | 1;
if (options.server !== undefined) {
  // Override provided - use it
  server = options.server;
} else {
  // Derive from match state using getNextServer()
  const nextServer = getNextServer(matchUp, /* firstService */);
  server = nextServer.server;
}

// Store in point
const point: Point = {
  winner,
  server,  // Now always present
  servingSide: options.servingSide || calculateServingSide(matchUp, server),
  // ...
};
```

#### 1.3 Update Types

**File:** `src/v4/types/index.ts`

```typescript
export interface Point {
  winner: 0 | 1;
  server: 0 | 1;  // Make required
  servingSide?: 'DEUCE' | 'AD';  // Add optional
  // ... existing fields
}
```

---

### **Phase 2: Ad/Deuce Positioning** (Priority: MEDIUM)

#### 2.1 Create `calculateServingSide` Function

**File:** `src/v4/query/calculateServingSide.ts`

```typescript
/**
 * Calculate which side of court (AD or DEUCE) based on point count
 * 
 * Tennis rule: Side alternates every point
 * - Even total points (0, 2, 4, ...) → DEUCE
 * - Odd total points (1, 3, 5, ...) → AD
 */
export function calculateServingSide(
  matchUp: MatchUp,
  server: 0 | 1
): 'DEUCE' | 'AD' {
  const currentSet = matchUp.score.sets[matchUp.score.sets.length - 1];
  if (!currentSet) return 'DEUCE';
  
  // Get current game point scores
  const gameScores = currentSet.side1GameScores || [];
  const side2GameScores = currentSet.side2GameScores || [];
  
  const side1Points = gameScores[gameScores.length - 1] || 0;
  const side2Points = side2GameScores[side2GameScores.length - 1] || 0;
  
  const totalPoints = side1Points + side2Points;
  
  return totalPoints % 2 === 0 ? 'DEUCE' : 'AD';
}
```

#### 2.2 Integrate into `addPoint`

Store `servingSide` in every point for statistics and validation.

---

### **Phase 3: Validation & Warnings** (Priority: LOW)

#### 3.1 Create `validateServerRotation` Function

**File:** `src/v4/validation/serverValidator.ts`

```typescript
export interface ServerValidationResult {
  valid: boolean;
  warnings: string[];
  
  expectedServer: 0 | 1;
  actualServer: 0 | 1;
  
  expectedSide: 'DEUCE' | 'AD';
  actualSide?: 'DEUCE' | 'AD';
}

/**
 * Validate that server and side are correct for current state
 * 
 * Returns warnings if override differs from expected
 */
export function validateServerRotation(
  matchUp: MatchUp,
  point: AddPointOptions,
  firstService: 0 | 1
): ServerValidationResult {
  const expected = getNextServer(matchUp, firstService);
  const actual = point.server || expected.server;
  
  const warnings: string[] = [];
  
  if (point.server !== undefined && point.server !== expected.server) {
    warnings.push(
      `Server override: Expected player ${expected.server} but got ${point.server}`
    );
  }
  
  if (point.servingSide && point.servingSide !== expected.servingSide) {
    warnings.push(
      `Side override: Expected ${expected.servingSide} but got ${point.servingSide}`
    );
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
    expectedServer: expected.server,
    actualServer: actual,
    expectedSide: expected.servingSide,
    actualSide: point.servingSide,
  };
}
```

#### 3.2 Enhance `pbpValidator` with Server Checks

Add server validation to pbpValidator:
- Track expected vs actual server
- Flag anomalies in validation result
- Provide suggestions for corrections

---

### **Phase 4: Historical Corrections** (Priority: LOW)

#### 4.1 Add `correctPoint` Function

**File:** `src/v4/scoring/correctPoint.ts`

```typescript
/**
 * Correct historical point with new server/side information
 * 
 * Use case: Officials notice error several games later
 */
export function correctPoint(
  matchUp: MatchUp,
  pointIndex: number,
  corrections: {
    server?: 0 | 1;
    servingSide?: 'DEUCE' | 'AD';
  }
): MatchUp {
  // Clone matchUp
  // Find point at index
  // Apply corrections
  // Mark as corrected with metadata
  // Return updated matchUp
}
```

#### 4.2 Audit Trail

Add to point metadata:
```typescript
interface Point {
  // ... existing
  corrected?: boolean;
  originalServer?: 0 | 1;
  originalServingSide?: 'DEUCE' | 'AD';
  correctionTimestamp?: string;
}
```

---

## Integration with v3Adapter

Once core functions exist, refactor v3Adapter to use them:

```typescript
// BEFORE (current):
updateServiceTracking();
const server = currentServer;

// AFTER (using core):
import { getNextServer } from '../query/getNextServer';
const nextServer = getNextServer(matchUp, firstService);
const server = nextServer.server;
```

Benefits:
- ✅ Consistent logic across adapter and core
- ✅ Core V4 is self-sufficient
- ✅ Easier testing and validation

---

## Testing Requirements

### Unit Tests

1. **Server Rotation Tests**
   - Regular game rotation (every game)
   - Tiebreak rotation (every 2 points)
   - Set boundary transitions
   - Match tiebreak (10-point) rotation

2. **Side Positioning Tests**
   - Even/odd point count
   - Deuce games (40-40)
   - Advantage scenarios
   - Tiebreak side alternation

3. **Override Tests**
   - Accept server override
   - Accept side override
   - Validation warnings generated
   - State remains consistent

### Integration Tests

1. **pbpValidator with Server Tracking**
   - Validate complete match point sequences
   - Detect server rotation errors
   - Flag anomalies in validation result

2. **v3Adapter Migration**
   - All existing v3Adapter tests pass
   - Server tracking matches old behavior
   - No regressions in match loading

---

## Timeline Estimate

| Phase | Effort | Priority | Dependencies |
|-------|--------|----------|--------------|
| Phase 1: Core Server Tracking | 2-3 days | HIGH | None |
| Phase 2: Ad/Deuce Positioning | 1-2 days | MEDIUM | Phase 1 |
| Phase 3: Validation & Warnings | 1-2 days | LOW | Phase 1, 2 |
| Phase 4: Historical Corrections | 1 day | LOW | Phase 1, 2 |

**Total:** 5-8 days for complete implementation

---

## Immediate Action Items

1. ✅ **Document requirements** (this file)
2. ⏳ **Test V3 undo across boundaries** (next step)
3. ⏳ **Implement Phase 1.1** (getNextServer query)
4. ⏳ **Implement Phase 1.2** (server override in addPoint)
5. ⏳ **Write unit tests** for server rotation
6. ⏳ **Implement Phase 2** (ad/deuce positioning)

---

## Notes

- **V3 Compatibility:** All changes must maintain v3Adapter compatibility
- **TODS Alignment:** Point metadata should align with TODS schema where possible
- **Performance:** Server calculation is O(1) - no performance concerns
- **Override Philosophy:** Accept overrides without blocking, but generate warnings

---

## References

- TODS Schema: https://github.com/TennisVisuals/TODS-v1
- ITF Rules of Tennis: https://www.itftennis.com/en/about-us/governance/rules-and-regulations/
- v3Adapter Implementation: `src/v4/adapter/v3Adapter.ts`
- pbpValidator Implementation: `src/v4/validation/pbpValidator.ts`
