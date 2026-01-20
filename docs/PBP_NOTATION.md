# Point-by-Point (PBP) Notation Guide

**Universal Match Object v4.0**  
**Last Updated:** January 20, 2026

---

## Overview

Point-by-point (PBP) notation is a compact way to represent the sequence of points in a tennis match as a string. This document describes how the notation works and how it's translated into the UMO data model.

---

## Basic Notation: Numeric Winner Format

### Format
The most common PBP format uses a string of digits where each character represents who won that point:

```
"0011001100110011..."
```

### Translation to UMO

**Character → Winner Value:**
- `'0'` → `winner: 0` (side 1 / first player wins the point)
- `'1'` → `winner: 1` (side 2 / second player wins the point)

**Important:** These are **player indices** (0-based), NOT TODS sideNumbers (1-based).

### Example

```typescript
const points = "001100";  // 6 points

// Translates to:
// Point 1: winner: 0 (side 1)
// Point 2: winner: 0 (side 1)  
// Point 3: winner: 1 (side 2)
// Point 4: winner: 1 (side 2)
// Point 5: winner: 0 (side 1)
// Point 6: winner: 0 (side 1)

// This produces a 40-30 game score with side 1 leading
```

---

## Extended Notation: Alpha Codes (Future)

### Status: NOT CURRENTLY IMPLEMENTED

Some advanced tennis datasets include additional metadata about each point using alphabetic codes. These are typically appended or interspersed with the numeric winner codes.

### Common Alpha Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `A` | Ace | Server wins point with unreturned serve |
| `D` | Double Fault | Server loses point with second serve fault |
| `W` | Winner | Clean winner (not forced error) |
| `U` | Unforced Error | Player makes unforced error |
| `F` | Forced Error | Player makes error under pressure |
| `@` | Net Point | Point finished at the net |
| `*` | Break Point | This point is a break point |
| `!` | Set Point | This point is a set point |

### Example Format (Not Yet Supported)

```
"0A 1D 0W 1U 0"
```

This would mean:
- Point 1: Side 1 wins with an ace
- Point 2: Side 2 wins (side 1 double fault)
- Point 3: Side 1 wins with a winner
- Point 4: Side 2 wins (side 1 unforced error)
- Point 5: Side 1 wins (normal point)

### Implementation Notes

**Current Behavior:**
- pbpValidator only accepts numeric characters `'0'` and `'1'`
- Any other character is treated as invalid and filtered out

**Future Enhancement:**
If alpha codes are needed, the implementation would:
1. Parse combined notation (e.g., "0A" → winner: 0, metadata: {ace: true})
2. Store metadata in Point.metadata field (would need to be added)
3. Extend AddPointOptions to accept metadata

**Example Future API:**
```typescript
addPoint(matchUp, {
  winner: 0,
  server: 0,
  metadata: {
    ace: true,
    duration: 2.5,
    shotCount: 1
  }
});
```

---

## ATP/WTA Dataset Format

### Column: `pbp`

The ATP/WTA point-by-point datasets (e.g., from Jeff Sackmann's tennis_atp repo) use **alpha code notation** with rich point detail:

```csv
date,server1,server2,winner,pbp,score
05 Jan 15,Gilles Muller,Edouard Roger-Vasselin,1,SARSS;RSSSS;SAAS;...,6-7(11) 6-1 7-6(3)
```

### **IMPORTANT: Point Detail Currently Not Captured**

The dataset contains detailed point information that is **currently discarded** during conversion to numeric format:

**Alpha Codes in Dataset:**
- `S` = Server wins the point
- `R` = Receiver wins the point  
- `A` = Ace (unreturned serve)
- `D` = Double fault

**Additional Detail (also discarded):**
- `;` = Game boundary (server rotation)
- `.` = Set boundary
- `/` = Tiebreak server rotation (every 2 points)

**Current Behavior:**
The `convertPBPToPoints()` function (in test-v4-pbp.js) **converts all alpha codes to simple 0/1**:
- `S` or `A` (server wins) → `0` or `1` (depending on who's serving)
- `R` or `D` (receiver wins) → opposite player
- All detail about **how** the point was won is **lost**

**Example of Lost Detail:**
```
Dataset:  "SARSS;RSSSS;SAAS"
          ↓ (conversion)
Stored:   "000011011100000..."

Lost information:
- Point 1: Server won (S)
- Point 2: Ace (A) ← LOST
- Point 3: Receiver won (R)
- Point 12: Ace (A) ← LOST
```

### Characteristics
- **Format:** Alpha codes (S/R/A/D) with structural markers (;/.)
- **Winner representation:** '1' = server1 wins, '2' = server2 wins
- **Perspective:** From server1's perspective
- **Rich metadata:** Ace/fault codes included BUT currently discarded
- **Current limitation:** Only winner (0/1) is captured, not HOW they won

### Translation in pbpValidator

The `pbpValidator` function handles the perspective transformation:

1. **Input:** Points string from dataset (winner's perspective)
2. **Check:** If `winner` field indicates loser won the match
3. **Transform:** Swap all 0↔1 if needed to align with player[0] vs player[1]
4. **Output:** Points in player[0] vs player[1] perspective

```typescript
// Example from pbpValidator.ts
const pointArray = points.split("").map(p => {
  const winner = Number.parseInt(p, 10);
  if (Number.isNaN(winner) || (winner !== 0 && winner !== 1)) {
    return null; // Invalid character
  }
  return winner;
}).filter(p => p !== null);
```

---

## Player Index vs TODS SideNumber

### Key Distinction

**Player Index (0-based)** - Used in PBP notation and addPoint():
- `0` = side 1 (first player/team)
- `1` = side 2 (second player/team)

**TODS SideNumber (1-based)** - Used in TODS spec:
- `sideNumber: 1` = first side
- `sideNumber: 2` = second side

### Why the Difference?

1. **Historical:** Point-by-point datasets use 0/1 notation
2. **Simplicity:** 0/1 maps directly to array indices
3. **Compatibility:** Matches common programming conventions

### Internal Handling

The `addPoint` function uses player indices directly:

```typescript
// From addPoint.ts line 110
if (winner === 0) {
  side1Points++;  // Increment side 1
} else {
  side2Points++;  // Increment side 2
}
```

The mapping to TODS structure happens at the matchUp level:
- Player index 0 → `sides[0]` → `sideNumber: 1`
- Player index 1 → `sides[1]` → `sideNumber: 2`

---

## Validation Rules

### Valid Point Strings

```typescript
"0011001100"           // ✅ All numeric
"001 110 011 00"       // ✅ Spaces allowed (filtered out)
"0,0,1,1,0,0,1,1,0,0" // ✅ Commas allowed (filtered out)
```

### Invalid Point Strings

```typescript
"0021001100"           // ❌ Contains '2'
"00A1001100"           // ❌ Contains 'A' (not supported yet)
"winner,loser,winner"  // ❌ Non-numeric
""                     // ❌ Empty string
```

### pbpValidator Behavior

```typescript
const result = pbpValidator({
  points: "00a11b0c0", // Contains invalid chars
  expectedScore: "6-4"
});

// Result:
// - 'a', 'b', 'c' are filtered out
// - Processes: "0011100"
// - May not match expected score if points are missing
```

---

## Examples

### Example 1: Simple Game

```typescript
const { createMatchUp, addPoint } = require('universal-match-object/v4');

const matchUp = createMatchUp({
  matchUpFormat: 'SET3-S:6/TB7'
});

// Play a 40-30 game
const points = "001100"; // 0,0,1,1,0,0

let m = matchUp;
for (const p of points) {
  const winner = parseInt(p);
  m = addPoint(m, { winner });
}

console.log(getScore(m));
// Output: { scoreString: "0-0", currentGame: "40-30" }
```

### Example 2: pbpValidator with Dataset

```typescript
const { pbpValidator } = require('universal-match-object/v4');

// From ATP dataset
const result = pbpValidator({
  points: "001100110011001100110011", // 24 points = 6 games
  expectedScore: "6-0",
  matchUpFormat: "SET3-S:6/TB7"
});

console.log(result.valid);      // true
console.log(result.actualScore); // "6-0"
console.log(result.pointsProcessed); // 24
```

---

## Future Enhancements

### 1. **Alpha Code Support - CRITICAL DATA LOSS ISSUE**

**Priority:** HIGH  
**Status:** Currently losing valuable data from ATP/WTA datasets

**Problem:**
ATP/WTA datasets contain rich point detail (ace, double fault, winner, error codes) that is **completely discarded** during conversion to numeric format. This is a significant loss of analytical capability.

**Example:**
```typescript
// Dataset has: "SARSS;RDSA"
// Point 2 is an ACE (A)
// Point 6 is a DOUBLE FAULT (D)

// Current conversion → "00011011"
// ALL detail about aces and faults is LOST
```

**Solution:**
Parse alpha codes and store in Point.metadata:
```typescript
const result = pbpValidator({
  points: "SARSS;RDSA",
  alphaNotation: true, // Enable rich parsing
  preserveDetail: true
});

// Would produce:
// Point 1: { winner: 0, metadata: { pointType: 'normal' } }
// Point 2: { winner: 0, metadata: { pointType: 'ace' } } ← PRESERVED!
// Point 3: { winner: 1, metadata: { pointType: 'normal' } }
// Point 6: { winner: 0, metadata: { pointType: 'doubleFault' } } ← PRESERVED!
```

**Impact:**
- Enables ace/double fault statistics
- Enables winner/error analysis  
- Unlocks full value of ATP/WTA datasets
- Currently: All this data exists but is thrown away

### 2. Server Tracking

**Priority:** High  
**Status:** Planned

Current limitation: Server not tracked in basic notation.

Enhancement options:
1. Infer from point number (even/odd)
2. Accept separate server string: `servers: "00001111..."`
3. Use extended notation: `"0s 1 0 1s"` where 's' indicates server

### 3. Timestamp Support

**Priority:** Low  
**Status:** Future

Would enable time-series analysis:
```typescript
const result = pbpValidator({
  points: "001100",
  timestamps: ["12:00:00", "12:00:15", ...],
});
```

---

## References

### Data Sources
- [tennis_atp](https://github.com/JeffSackmann/tennis_atp) - Jeff Sackmann's ATP dataset
- [tennis_wta](https://github.com/JeffSackmann/tennis_wta) - Jeff Sackmann's WTA dataset

### Related Documentation
- [TODS Specification](https://github.com/tennisdatastandards/tods)
- [UMO v4 Types](../src/v4/types.ts)
- [pbpValidator API](../src/v4/validation/pbpValidator.ts)

---

## Questions?

For issues or feature requests related to PBP notation, please open an issue on the GitHub repository.
