# V4 Adapter - Missing v3 API Methods

## Analysis Date: 2026-01-21

This document tracks ALL v3 API methods that hive-eye uses and which ones are missing from the v4 adapter.

## Methods Used by Hive-Eye (from grep analysis)

### Core Methods
- [ ] `env.match.undo()` - **MISSING**
- [ ] `env.match.reset()` - **MISSING**
- [x] `env.match.addPoint()` - EXISTS
- [ ] `env.match.complete()` - **MISSING**
- [ ] `env.match.winner()` - **MISSING**
- [ ] `env.match.score()` - **MISSING**
- [ ] `env.match.scoreboard()` - **MISSING**
- [ ] `env.match.sets()` - **MISSING**
- [ ] `env.match.nextTeamServing()` - **MISSING**
- [ ] `env.match.nextTeamReceiving()` - **MISSING**
- [ ] `env.match.status` (getter/setter) - **PARTIAL** (exists but may not work same way)

### History Methods
- [x] `env.match.history.points()` - EXISTS
- [x] `env.match.history.lastPoint()` - EXISTS
- [x] `env.match.history.action()` - EXISTS
- [ ] `env.match.history.common()` - **MISSING**

### Set Methods
- [ ] `env.match.set.firstService()` - **MISSING**
- [ ] `env.match.set.perspectiveScore()` - **MISSING**
- [ ] `env.match.set.liveStats()` - **MISSING**

### Format Methods
- [ ] `env.match.format.code` - **MISSING**
- [ ] `env.match.format.setsToWin` - **MISSING**
- [ ] `env.match.format.changeFormat()` - **MISSING**
- [ ] `env.match.format.settings()` - **MISSING**
- [ ] `env.match.format.structure` - **MISSING**

### Metadata Methods
- [x] `env.match.metadata.definePlayer()` - EXISTS
- [x] `env.match.metadata.updateParticipant()` - EXISTS
- [x] `env.match.metadata.players()` - EXISTS
- [x] `env.match.metadata.defineMatch()` - EXISTS
- [x] `env.match.metadata.defineTournament()` - EXISTS
- [x] `env.match.metadata.timestamps()` - EXISTS
- [ ] `env.match.metadata.resetStats()` - **MISSING**

### Events Methods
- [ ] `env.match.events.addPoint()` - **MISSING**
- [ ] `env.match.events.undo()` - **MISSING**
- [ ] `env.match.events.reset()` - **MISSING**
- [ ] `env.match.events.clearEvents()` - **MISSING**

### Stats Methods
- [x] `env.match.stats.calculated()` - EXISTS
- [x] `env.match.stats.counters()` - EXISTS

### Other Methods
- [x] `env.match.decoratePoint()` - EXISTS

## Summary

**Total methods used by hive-eye:** ~35
**Implemented in v4 adapter:** ~15 (43%)
**Missing from v4 adapter:** ~20 (57%)

## Critical Missing Methods for UI

These methods MUST be implemented for hive-eye UI to work:

1. **`undo()`** - Used by undo button
2. **`reset()`** - Used when loading matches
3. **`complete()`** - Check if match is complete
4. **`winner()`** - Get match winner
5. **`score()`** - Get current score
6. **`scoreboard()`** - Get full scoreboard
7. **`sets()`** - Get sets data
8. **`nextTeamServing/Receiving()`** - Server tracking
9. **`set.*` methods** - Set-level operations
10. **`format.*` methods** - Format operations
11. **`events.*` methods** - Event handling

## Implementation Plan

### Phase 1: Critical Methods (Must have for basic functionality)
1. `undo()` - Undo last point
2. `complete()` - Check completion
3. `winner()` - Get winner
4. `score()` - Get score string
5. `scoreboard()` - Get scoreboard
6. `nextTeamServing()` / `nextTeamReceiving()` - Server tracking

### Phase 2: Format Methods (Must have for match setup)
1. `format.code` - Get format code
2. `format.changeFormat()` - Change format
3. `format.setsToWin` - Get sets needed
4. `format.structure` - Get format structure

### Phase 3: Set Methods (Must have for set operations)
1. `set.firstService()` - Get/set first server
2. `set.perspectiveScore()` - Score perspective
3. `set.liveStats()` - Enable live stats

### Phase 4: Events (Must have for reactivity)
1. `events.addPoint()` - Point added callback
2. `events.undo()` - Undo callback
3. `events.reset()` - Reset callback
4. `events.clearEvents()` - Clear callbacks

### Phase 5: Additional Methods
1. `reset()` - Reset match
2. `sets()` - Get sets array
3. `history.common()` - Get common history
4. `metadata.resetStats()` - Reset stats

## Testing Strategy

After implementing each phase:
1. Run v4 unit tests
2. Switch hive-eye to v4-umo
3. Test specific features that use those methods
4. Fix issues
5. Move to next phase

## Notes

- The v4 adapter was originally created for TEST compatibility, not production use
- This explains why only ~43% of methods are implemented
- A full production adapter needs 100% coverage
- Must maintain exact v3 behavior for backward compatibility
