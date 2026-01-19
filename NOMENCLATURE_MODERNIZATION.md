# Nomenclature Modernization Plan

## Current State: Dual Nomenclature

### TODS (Modern, Explicit)
From parsed matchUpFormat structure:
```javascript
{
  bestOf: 3,              // Total sets in match
  setFormat: {
    setTo: 6,             // Games to win set
    tiebreakAt: 6,        // When tiebreak starts
    tiebreakFormat: {
      tiebreakTo: 7       // Points to win tiebreak
    },
    NoAD: true           // No-advantage scoring
  },
  finalSetFormat: {
    tiebreakSet: {
      tiebreakTo: 10      // Supertiebreak to 10
    }
  }
}
```

### UMO Legacy (Internal, Computed)
Getters that compute from TODS structure:
```javascript
format.threshold()    // Computed: bestOf→2, setTo→6, tiebreakTo→7, default→4
format.tiebreak()     // Computed: !!tiebreakTo
format.minDiff()      // Computed: NoAD→1, default→2
format.hasDecider()   // Computed: !!tiebreakAt or !!NoAD
```

## The Problem

**When formatStructure is undefined (regular games)**, we fall back to legacy defaults:
```javascript
threshold() {
  if (formatStructure) { /* compute from structure */ }
  return 4; // ❌ Legacy default
}
```

**This breaks TODS purity** - regular games should ALSO have explicit TODS structure.

## Proposed Solution

### Option 1: Always Provide formatStructure (Recommended)
Never pass `undefined`. Regular games get explicit structure:

```javascript
// In setFormat.ts
childFormatStructure = formatStructure.NoAD 
  ? { NoAD: true }           // No-AD game
  : { /* regular game */ };  // ✅ Explicit regular game structure

// What should regular game structure look like?
{
  // Option A: Empty object (use TODS defaults)
  // Option B: Explicit defaults
  pointsTo: 4,
  winBy: 2,
  scoring: 'tennis'  // vs 'numeric'
}
```

Then getters become simpler:
```javascript
threshold() {
  const fs = this.formatStructure;
  if (fs.bestOf) return Math.ceil(fs.bestOf / 2);
  if (fs.setTo) return fs.setTo;
  if (fs.tiebreakTo) return fs.tiebreakTo;
  if (fs.pointsTo) return fs.pointsTo;
  return 4; // Hard default if structure malformed
}
```

### Option 2: Remove Legacy Getters Entirely
**Breaking change** - expose only formatStructure:

```javascript
// Current (legacy)
game.format.threshold()  // 4
game.format.tiebreak()   // false

// Proposed (TODS-pure)
game.format.structure.pointsTo  // 4 (or undefined)
game.format.structure.tiebreakTo // undefined
```

But this would break ALL consuming code.

### Option 3: Deprecate Gradually
Keep legacy getters but add TODS accessors:

```javascript
// Legacy (deprecated but working)
format.threshold()  // Still works

// Modern (encouraged)
format.structure.setTo
format.structure.tiebreakTo
format.isTiebreak  // Boolean computed from structure
```

## Recommendation

**Option 1** - Always provide explicit formatStructure, even for regular games.

### Implementation Steps

1. ✅ Define TODS structure for regular games (what properties?)
2. Update setFormat to never pass undefined
3. Simplify getter fallbacks (structure should always exist)
4. Add validation: warn if formatStructure is malformed
5. Document TODS-first approach

### Open Questions

**What should regular game formatStructure look like in TODS?**

Currently parsed structure has NO game-level properties for regular games.

Options:
- A. Empty object `{}` (rely on hardcoded defaults)
- B. Explicit `{ pointsTo: 4, winBy: 2, scoring: 'tennis' }`
- C. Reference to parent `{ inheritsFrom: 'setFormat' }`

**Your input needed!**

