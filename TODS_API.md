# TODS-Native API Reference

## Modern TODS API (Recommended)

### matchObject.matchUp()

Create a match using TODS nomenclature:

```typescript
import matchObject from '@tennisvisuals/universal-match-object';

// Modern TODS API
const matchUp = matchObject.matchUp({
  matchFormat: 'SET3-S:6/TB7',      // TODS: matchFormat (not 'type')
  matchUpId: 'match-123',           // TODS: matchUpId (not 'id')
  participants: [                    // TODS: Participant[]
    {
      participantId: 'p1',
      participantName: 'Player One',
      participantType: 'INDIVIDUAL'
    },
    {
      participantId: 'p2',
      participantName: 'Player Two',
      participantType: 'INDIVIDUAL'
    }
  ]
});
```

### Direct TODS Access (Zero Conversion)

```typescript
// Get TODS Participants directly (no conversion!)
const participants = matchUp.todsParticipants();
// → Participant[] in native TODS format

// Get TODS Sides directly
const sides = matchUp.todsSides();
// → Side[] with sideNumber, participantId, participant

// Get TODS MatchUp structure
const todsMatchUp = matchUp.todsMatchUp();
// → Partial<MatchUp> with internal TODS data
```

### TODS Extensibility

```typescript
// Add custom metadata via TODS extensions
matchUp.metadata.definePlayer({
  index: 0,
  name: 'Player One',
  puid: 'p1',
  hand: 'R',      // Stored in TODS extensions
  seed: 1,        // Stored in TODS extensions  
  rank: 5         // Stored in TODS extensions
});

const participants = matchUp.todsParticipants();
const extensions = participants[0].extensions;
// → [{ name: 'UMO_LEGACY_METADATA', value: { hand: 'R', seed: 1, rank: 5 } }]
```

## Legacy API (Backward Compatible)

### matchObject.Match()

The legacy API still works and accepts both old and new nomenclature:

```typescript
// Legacy API - still works
const match = matchObject.Match({
  type: 'SET3-S:6/TB7',     // Old: 'type'
  id: 'match-123',           // Old: 'id'
  participants: [...]
});

// Or mix old and new (new takes precedence)
const match = matchObject.Match({
  type: 'SET3-S:6/TB7',
  matchFormat: 'SET5-S:6/TB7',  // This overrides 'type'
  id: 'match-123',
  matchUpId: 'match-456',        // This overrides 'id'
  participants: [...]
});
```

## Parameter Mapping

| Legacy | TODS | Description |
|--------|------|-------------|
| `type` | `matchFormat` | Match format code (e.g., 'SET3-S:6/TB7') |
| `id` | `matchUpId` | Match identifier |
| `match` | `matchUp` | Variable naming convention |

## Benefits of TODS API

### 1. Zero Conversion Overhead
```typescript
// Internal TODS = External TODS (no conversion!)
const participants = matchUp.todsParticipants();
// Returns same objects stored internally
```

### 2. Extensibility
```typescript
// Easy to add new TODS properties
// Use TODS extensions[] for custom data
```

### 3. Standards-Based
```typescript
// Compatible with tods-competition-factory
// Direct integration with Factory systems
```

### 4. Type Safety
```typescript
// Full TypeScript support
import type { Participant, Side, MatchUp } from '@tennisvisuals/universal-match-object';
```

## Migration Guide

### From Legacy to TODS

**Before (Legacy):**
```typescript
const match = matchObject.Match({
  type: 'SET3-S:6/TB7',
  id: 'match-123'
});

match.metadata.definePlayer({ index: 0, name: 'Player', puid: 'p1' });
const players = match.metadata.players();
```

**After (TODS):**
```typescript
const matchUp = matchObject.matchUp({
  matchFormat: 'SET3-S:6/TB7',
  matchUpId: 'match-123'
});

matchUp.metadata.definePlayer({ index: 0, name: 'Player', puid: 'p1' });
const participants = matchUp.todsParticipants();  // Native TODS!
```

### Key Changes
1. **Factory method:** `Match()` → `matchUp()`
2. **Format parameter:** `type` → `matchFormat`
3. **ID parameter:** `id` → `matchUpId`
4. **Variable naming:** `match` → `matchUp`
5. **Data access:** Legacy getters → Direct TODS access

## Complete Example

```typescript
import matchObject from '@tennisvisuals/universal-match-object';

// Create matchUp with TODS API
const matchUp = matchObject.matchUp({
  matchFormat: 'SET3-S:6/TB7',
  matchUpId: 'wimbledon-2024-final',
  participants: [
    {
      participantId: 'djokovic',
      participantName: 'Novak Djokovic',
      participantType: 'INDIVIDUAL',
      person: {
        nationalityCode: 'SRB'
      }
    },
    {
      participantId: 'alcaraz',
      participantName: 'Carlos Alcaraz',
      participantType: 'INDIVIDUAL',
      person: {
        nationalityCode: 'ESP'
      }
    }
  ]
});

// Play points
matchUp.addPoint('S');  // Djokovic serves, wins point
matchUp.addPoint('R');  // Djokovic serves, Alcaraz wins point

// Access TODS structures directly (zero conversion)
const participants = matchUp.todsParticipants();
const sides = matchUp.todsSides();
const todsMatchUp = matchUp.todsMatchUp();

// Export to full TODS MatchUp format
const fullMatchUp = matchUp.toMatchUp();
```

## API Status

- ✅ **TODS-Native:** Internal storage in TODS format
- ✅ **Modern API:** matchUp() with TODS nomenclature
- ✅ **Backward Compatible:** Match() still works
- ✅ **Zero Conversion:** Direct TODS access
- ✅ **Extensible:** TODS extensions framework
- ✅ **Type Safe:** Full TypeScript support
- ✅ **Tested:** 140/140 tests passing

