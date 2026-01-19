# Mobile App Migration Guide - TODS API Updates

## Overview
The Universal Match Object (UMO) has been modernized to use TODS (Tennis Open Data Standards) format throughout. This document outlines the changes needed in the mobile app.

## API Changes

### 1. `metadata.players()` - Return Format Changed

**OLD (Legacy Format):**
```javascript
const players = match.metadata.players();
// Returns: [{ name: 'Player One', id: 'p1', team: 0 }, ...]
console.log(players[0].name); // 'Player One'
console.log(players[0].id);   // 'p1'
```

**NEW (TODS Format):**
```javascript
const players = match.metadata.players();
// Returns: [{ participantId: 'p1', participantName: 'Player One', participantType: 'INDIVIDUAL' }, ...]
console.log(players[0].participantName); // 'Player One'
console.log(players[0].participantId);   // 'p1'
```

**Mobile App Update Required:**
- Change `player.name` → `player.participantName`
- Change `player.id` → `player.participantId`
- Remove references to `player.team` (deprecated)

### 2. `metadata.players(index)` - Return Format Changed

**OLD:**
```javascript
const player = match.metadata.players(0);
// Returns: { name: 'Player One', id: 'p1' }
```

**NEW:**
```javascript
const player = match.metadata.players(0);
// Returns: { participantId: 'p1', participantName: 'Player One', participantType: 'INDIVIDUAL' }
```

### 3. `metadata.definePlayer()` - Return Format Changed

**OLD:**
```javascript
const result = match.metadata.definePlayer({
  index: 0,
  name: 'Roger Federer',
  puid: 'rf1'
});
// Returns: { index: 0, player: { name: 'Roger Federer', id: 'rf1' } }
console.log(result.player.name); // 'Roger Federer'
```

**NEW:**
```javascript
const participant = match.metadata.definePlayer({
  index: 0,
  name: 'Roger Federer',
  puid: 'rf1'
});
// Returns TODS Participant directly:
// { participantId: 'rf1', participantName: 'Roger Federer', participantType: 'INDIVIDUAL', ... }
console.log(participant.participantName); // 'Roger Federer'
console.log(participant.participantId);   // 'rf1'
```

**Mobile App Update Required:**
- Old: `result.player.name` → New: `participant.participantName`
- Old: `result.player.id` → New: `participant.participantId`
- Return value is now the participant directly (no wrapper)

## TODS Participant Format

Full TODS Participant structure:
```typescript
{
  participantId: string;           // Unique ID (required)
  participantName: string;         // Display name (required)
  participantType: 'INDIVIDUAL' | 'PAIR' | 'TEAM';
  person?: {                       // Optional: person details
    standardGivenName?: string;
    standardFamilyName?: string;
    nationalityCode?: string;
  };
  extensions?: Array<{             // Optional: custom data
    name: string;
    value: any;
  }>;
}
```

## Migration Checklist

### Search and Replace in Mobile App:
- [ ] `player.name` → `player.participantName`
- [ ] `player.id` → `player.participantId`
- [ ] `result.player.name` → `participant.participantName`
- [ ] `result.player.id` → `participant.participantId`
- [ ] Remove references to `player.team`

### Test Cases to Update:
- [ ] Player display components
- [ ] Match creation/setup
- [ ] Player selection UI
- [ ] Statistics and history screens
- [ ] Any code calling `metadata.players()`
- [ ] Any code calling `metadata.definePlayer()`

## Backward Compatibility

### Data Loading
Old match data with legacy player format is still supported:
- Format converter automatically upgrades old data
- No manual migration of stored matches needed

### Input Format
`definePlayer()` still accepts legacy field names as input:
```javascript
// This still works (auto-converts):
match.metadata.definePlayer({
  index: 0,
  name: 'Player Name',  // Old field name
  puid: 'p1'            // Old field name
});
// But returns TODS format
```

## Benefits of TODS Format

1. **Standards Compliance**: Matches Tennis Open Data Standards
2. **Interoperability**: Compatible with TODS-compliant systems
3. **Extensibility**: Support for extensions and custom data
4. **Clarity**: Clear naming (`participantName` vs ambiguous `name`)
5. **Future-proof**: Aligned with tennis data industry standards

## Timeline

**Phase 1 (Current)**: UMO updated to TODS format
**Phase 2 (Next)**: Update mobile app to use new format
**Phase 3 (Optional)**: Remove legacy format converters

## Questions?

Contact: Charles Allen / CourtHive team
Documentation: See TODS specification at https://docs.usta.com/
