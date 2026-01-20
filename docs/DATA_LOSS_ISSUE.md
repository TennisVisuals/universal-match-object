# Critical Data Loss Issue - Alpha Code Detail Not Captured

**Priority:** HIGH  
**Status:** Active data loss in production  
**Date Identified:** January 20, 2026

---

## Problem Statement

ATP/WTA point-by-point datasets contain **rich point detail** using alpha codes (S/R/A/D) that indicate HOW each point was won. This valuable information is **completely discarded** during conversion to the numeric format used by `pbpValidator`.

---

## What Data Is Being Lost

### ATP/WTA Dataset Format

The actual data from Jeff Sackmann's tennis_atp repository:

```csv
pbp: "SARSS;RSSSS;SAAS;SRSRSS;DSRSAS;..."
```

**Alpha Codes:**
- `S` = Server wins the point (normal rally)
- `R` = Receiver wins the point (normal rally)
- `A` = **ACE** - Server wins with unreturned serve
- `D` = **DOUBLE FAULT** - Server loses point with fault

### Current Conversion Process

**File:** `test-v4-pbp.js`, function `convertPBPToPoints()`

```javascript
// Current logic:
for (const code of game) {
  if (code === 'S' || code === 'A') {
    // Server won - could be normal point OR ace
    points += server;
  } else if (code === 'R' || code === 'D') {
    // Receiver won - could be normal point OR double fault
    points += (1 - server);
  }
}

// Result: "00001111000011..." 
// ALL ace and double fault information is LOST
```

### Example of Data Loss

**Original dataset point detail:**
```
Game 1: SAAS
- Point 1: S (server wins - normal)
- Point 2: A (ACE!) ← LOST
- Point 3: A (ACE!) ← LOST  
- Point 4: S (server wins - normal)
```

**After conversion:**
```
Game 1: "0000"
- Point 1: 0 (player 0 wins)
- Point 2: 0 (player 0 wins) ← Was an ace, now unknown
- Point 3: 0 (player 0 wins) ← Was an ace, now unknown
- Point 4: 0 (player 0 wins)
```

**Result:** We know player 0 won 4 points, but we've lost the information that 2 were aces.

---

## Impact on Analysis

### Statistics That Cannot Be Calculated

Without preserving ace/fault codes, we **cannot** calculate:

1. **Ace count** - How many aces did each player hit?
2. **Double fault count** - How many double faults occurred?
3. **First serve effectiveness** - What % of points won on serve were aces?
4. **Service dominance** - Ratio of aces to total service points
5. **Pressure moments** - Were break points saved with aces?
6. **Match flow** - Did momentum shift after double faults?

### Real-World Use Cases Lost

**Example 1: Serve Analysis**
```
Question: "How many aces did Federer hit?"
Current: IMPOSSIBLE - data was discarded
With metadata: COUNT(points where metadata.pointType === 'ace')
```

**Example 2: Clutch Performance**
```
Question: "Did player save break points with aces?"
Current: IMPOSSIBLE - we only know they won the point
With metadata: FILTER(breakPoints where metadata.pointType === 'ace')
```

**Example 3: Match Quality**
```
Question: "What % of points were decided by serves vs rallies?"
Current: IMPOSSIBLE - all points look the same
With metadata: RATIO(aces + doubleFaults / total points)
```

---

## Datasets Affected

### Current Impact

**2465 ATP matches** in test/data/pbp_matches_atp_main_current.csv

Each match has dozens to hundreds of aces and double faults that are **being discarded**.

**Estimated data loss:**
- Average match: ~10-20 aces per player
- Average match: ~3-5 double faults per player
- 2465 matches × 30 aces/faults = **~74,000 data points lost**

### Data Sources

1. **Jeff Sackmann's tennis_atp**
   - Repository: https://github.com/JeffSackmann/tennis_atp
   - Contains: Men's professional matches 1968-present
   - Format: Alpha codes (S/R/A/D)
   - **All point detail currently discarded**

2. **Jeff Sackmann's tennis_wta**
   - Repository: https://github.com/JeffSackmann/tennis_wta
   - Contains: Women's professional matches
   - Format: Alpha codes (S/R/A/D)
   - **All point detail currently discarded**

---

## Technical Details

### Current Data Flow

```
ATP Dataset (CSV)
  ↓
convertPBPToPoints() in test-v4-pbp.js
  ↓ [DATA LOSS HAPPENS HERE]
  ↓ S/A → 0/1 (detail discarded)
  ↓ R/D → 0/1 (detail discarded)
  ↓
pbpValidator({ points: "00110011..." })
  ↓
addPoint({ winner: 0 }) or addPoint({ winner: 1 })
  ↓
Point { winner: 0, pointNumber: 1, ... }
  ↓ [No metadata field exists]
  ↓
Match history with ONLY winner information
```

### Where Changes Are Needed

1. **Type Definition** (`src/v4/types.ts`)
   ```typescript
   export interface Point {
     // ... existing fields
     metadata?: {
       pointType?: 'ace' | 'doubleFault' | 'winner' | 'unforcedError';
       // ... other metadata
     };
   }
   ```

2. **Conversion Function** (`test-v4-pbp.js`)
   ```javascript
   // Instead of discarding:
   if (code === 'A') {
     points.push({
       winner: server,
       metadata: { pointType: 'ace', shotCount: 1 }
     });
   }
   ```

3. **pbpValidator** (`src/v4/validation/pbpValidator.ts`)
   ```typescript
   // Accept both formats:
   points: string | Array<{ winner: 0|1, metadata?: PointMetadata }>
   ```

4. **addPoint** (`src/v4/scoring/addPoint.ts`)
   ```typescript
   export interface AddPointOptions {
     winner: 0 | 1;
     server?: 0 | 1;
     metadata?: PointMetadata; // NEW
   }
   ```

---

## Proposed Solution

### Phase 1: Add Metadata Support (Backward Compatible)

1. Add optional `metadata` field to Point interface
2. Update AddPointOptions to accept metadata
3. Update addPoint() to store metadata if provided
4. **Backward compatible** - existing code works unchanged

### Phase 2: Enhance Conversion

1. Update convertPBPToPoints() to preserve alpha codes
2. Create new pbpValidator mode: `preserveDetail: true`
3. Parse S/R/A/D into appropriate metadata

### Phase 3: Enable Rich Analysis

1. Add query functions for statistics
2. Document alpha code semantics
3. Create examples for common analyses

---

## Workaround (Current)

**If you need ace/fault data NOW:**

1. Don't use the conversion function
2. Parse the CSV directly
3. Process alpha codes yourself
4. Store results externally (not in Point records)

**Example:**
```javascript
// Bypass UMO and parse directly
const aces = pbp.split('').filter(c => c === 'A').length;
const doubleFaults = pbp.split('').filter(c => c === 'D').length;

// Store separately - NOT in match history
stats = { aces, doubleFaults };
```

**Limitation:** Can't tie back to specific points in match flow.

---

## Priority Justification

**Why HIGH priority:**

1. **Data already exists** - no collection needed
2. **Irreversible loss** - once converted, can't recover
3. **Widespread impact** - affects all ATP/WTA datasets
4. **High value** - enables entire category of analysis
5. **Backward compatible** - won't break existing code

**Effort:** Medium (3-4 days)
- Add metadata field: 4 hours
- Update conversion: 8 hours
- Update pbpValidator: 8 hours  
- Testing & docs: 8 hours

**Value:** High
- Unlocks ace/fault statistics
- Enables serve quality analysis
- Adds minimal complexity
- Preserves valuable historical data

---

## Recommendation

**Implement in v4.1:**

1. Add metadata support to Point interface
2. Update conversion to preserve alpha codes
3. Enable rich statistical queries
4. Document in comprehensive examples

**This will unlock the full analytical value of ATP/WTA datasets.**

---

## References

- **Dataset:** https://github.com/JeffSackmann/tennis_atp
- **PBP Notation:** docs/PBP_NOTATION.md
- **Conversion code:** test-v4-pbp.js:87-150
- **Point interface:** src/v4/types.ts:114-136
