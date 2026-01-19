# Explicit TODS Structure for Regular Games (Option B)

## Current State

**Parsed matchUpFormat** has NO game-level properties:
```javascript
parseFormat('SET3-S:6/TB7').format
// Returns:
{
  bestOf: 3,
  setFormat: {
    setTo: 6,
    tiebreakAt: 6,
    tiebreakFormat: { tiebreakTo: 7 }
    // ❌ No gameFormat property!
  }
}
```

**Result**: Regular games get `undefined` formatStructure, rely on hardcoded defaults.

## Proposal: Add Explicit gameFormat

### What We Need to Represent

There are really only **2 dimensions** for game formats:

1. **Scoring Display**
   - Tennis: 0→15→30→40 (determined by NO tiebreakTo)
   - Numeric: 0→1→2→3 (determined by tiebreakTo)

2. **Deuce Handling** 
   - Standard: 40-40 → advantage → game (determined by NO NoAD)
   - No-AD: 40-40 → next point wins (determined by NoAD=true)

### Proposed Structure

**Regular Game** (standard tennis):
```javascript
{
  bestOf: 3,
  setFormat: {
    setTo: 6,
    tiebreakAt: 6,
    tiebreakFormat: { tiebreakTo: 7 },
    gameFormat: {        // ✅ NEW: Explicit game format
      // No tiebreakTo → use tennis scoring (15-30-40)
      // No NoAD → use standard deuce/advantage
    }
  }
}
```

**No-AD Game**:
```javascript
{
  setFormat: {
    setTo: 6,
    NoAD: true,          // At SET level
    gameFormat: {        // ✅ Game inherits NoAD
      NoAD: true         // Explicit at game level
    }
  }
}
```

**Tiebreak Game** (already working):
```javascript
{
  tiebreakFormat: {
    tiebreakTo: 7        // ✅ Already explicit
  }
}
```

## Implementation Options

### Option B1: Empty Object (Minimal)
```javascript
gameFormat: {}  // Presence indicates "regular game", defaults apply
```

**Pros**: Minimal change, clear signal "this is a game"
**Cons**: Still relies on hardcoded defaults

### Option B2: Explicit Minimal (Recommended)
```javascript
gameFormat: {
  // Only include non-default properties
  NoAD: true  // Only if No-AD scoring
}
```

**Pros**: Only specify what differs from defaults
**Cons**: Need to define what "defaults" are

### Option B3: Fully Explicit
```javascript
gameFormat: {
  pointsTo: 4,      // Always 4 for tennis
  winBy: 2,         // Always 2 (win by 2 points)
  NoAD: false,      // Explicitly false for standard
  tiebreakTo: null  // Explicitly null (not a tiebreak)
}
```

**Pros**: No ambiguity, no hardcoded defaults
**Cons**: Verbose, most values always the same

## Recommended: **Option B2** (Explicit Minimal)

**Default regular game** (empty or absent gameFormat):
```javascript
// Defaults when gameFormat is {} or absent
{
  pointsTo: 4,       // Implied by tennis rules
  winBy: 2,          // Implied by tennis rules
  NoAD: false        // Implied by absence of NoAD flag
}
```

**No-AD game** (only specify what differs):
```javascript
gameFormat: {
  NoAD: true  // The ONLY difference from default
}
```

**Tiebreak game** (already explicit):
```javascript
tiebreakFormat: {
  tiebreakTo: 7,
  winBy: 2  // Optional, defaults to 2
}
```

## Changes Required

### 1. Format Parser (formatConverter.ts)
Add gameFormat to parsed structure:
```javascript
export function parseFormat(code) {
  // ... existing parsing ...
  
  if (parsed.setFormat) {
    // Add explicit gameFormat
    parsed.setFormat.gameFormat = parsed.setFormat.NoAD 
      ? { NoAD: true }
      : {};  // Empty object signals "regular game"
  }
  
  return parsed;
}
```

### 2. setFormat Factory (setFormat.ts)
Always pass gameFormat, never undefined:
```javascript
childFormatStructure = formatStructure.gameFormat || {};
```

### 3. formatObject Getters (formatObject.ts)
Simplify - structure always exists:
```javascript
threshold() {
  const fs = this.formatStructure;
  // ... check bestOf, setTo, tiebreakTo ...
  
  // Regular game: always has structure now
  return 4;  // Only reached for gameFormat: {}
}
```

## Migration Path

**Phase 1**: Parser modification
- Add gameFormat to parseFormat output
- Backward compatible (gameFormat optional)

**Phase 2**: Factory updates
- setFormat always passes structure (never undefined)
- Test all game types

**Phase 3**: Getter simplification
- Remove "formatStructure is undefined" branches
- All paths assume structure exists

**Phase 4**: Validation
- Warn if formatStructure truly missing
- Log deprecation for undefined structures

