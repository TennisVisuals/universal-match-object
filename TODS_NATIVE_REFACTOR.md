# UMO TODS Native Refactor Plan

## Mission: Convert UMO to use TODS internally with focus on extensibility

### Current Architecture (Legacy Internal)
```
UMO Internal: { name, id, puid, team }
              ↓ (adapters)
TODS External: { participantId, participantName, participantType, person, ... }
```

### Target Architecture (TODS Native)
```
TODS Internal: { participantId, participantName, participantType, person, ... }
              ↓ (legacy adapter only for import)
Legacy: { name, id, puid, team } (backward compat only)
```

## Phase 1: Participant Storage (TODS Native)

### Changes:
- `common.players` → Store full TODS Participant[] internally
- `definePlayer()` → Accept/store TODS Participant
- `metadata.players()` → Return TODS Participant[]
- `playerTeam()` → Derive from sides structure
- Add `metadata.participant(id)` → Get by participantId

### Extensibility Goals:
- Easy to add new participant properties (contacts, rankings, etc.)
- Support for PAIR/TEAM participant types
- Rich person metadata (nationality, birthdate, etc.)

## Phase 2: Match Structure (TODS Native)

### Changes:
- Add internal `_todsMatchUp` object
- Store matchUpId, matchUpFormat, matchUpType natively
- Use TODS Side[] for participant assignments
- Sync TODS structure on every point

### Extensibility Goals:
- Direct access to TODS matchUp object
- Support for all TODS matchUp properties
- Extensions framework for custom data

## Phase 3: Score Structure (TODS Native)

### Changes:
- Align internal score with TODS Score structure
- Store sets as TODS Set[] with side1Score/side2Score
- Track tiebreak scores natively
- Generate scoreStrings in sync

### Extensibility Goals:
- Game-by-game tracking in TODS format
- Point-by-point as TODS extensions
- Support for different scoring systems

## Phase 4: API Modernization

### Changes:
- Expose TODS objects directly via getters
- Deprecate legacy accessors
- Modern property access (match.matchUp.sides)
- Chainable TODS-native methods

### Extensibility Goals:
- TODS-first API design
- Easy integration with Factory systems
- Plugin architecture for extensions

## Phase 5: Backward Compatibility

### Strategy:
- Keep legacy import via fromMatchUp() 
- Auto-convert old player objects on input
- Provide legacy getters (deprecated)
- Migration guide for consumers

## Testing Strategy:
- All 185 existing tests must pass
- Add TODS-native validation tests
- Round-trip testing (TODS → UMO → TODS)
- Performance benchmarks

## Success Criteria:
✅ All tests passing
✅ TODS objects stored internally
✅ No conversion overhead
✅ Extensibility framework in place
✅ Clean, modern API
✅ Backward compatible imports
