# UMO v4 Adapter - v3 API Coverage Checklist

**Date:** January 20, 2026  
**Purpose:** Ensure v4 adapter supports ALL methods that hive-eye uses

---

## Methods Used by Hive-Eye

### Core Methods

| Method | Status | Notes |
|--------|--------|-------|
| `addPoint()` | ✅ | Implemented |
| `score()` | ✅ | Implemented |
| `scoreboard()` | ✅ | Implemented |
| `complete()` | ✅ | Implemented |
| `winner()` | ✅ | Implemented |
| `undo()` | ✅ | Implemented |
| `reset()` | ❓ | Need to check |
| `doubles()` | ✅ | Implemented |
| `sets()` | ✅ | Implemented |

### Events API

| Method | Status | Notes |
|--------|--------|-------|
| `events.addPoint()` | ✅ | Implemented |
| `events.undo()` | ✅ | Implemented |
| `events.reset()` | ✅ | Implemented |
| `events.clearEvents()` | ✅ | Implemented |

### History API

| Method | Status | Notes |
|--------|--------|-------|
| `history.points()` | ✅ | Implemented |
| `history.action()` | ✅ | Implemented |
| `history.common()` | ❓ | Need to check |
| `history.lastPoint()` | ❓ | Need to check |

### Metadata API

| Method | Status | Notes |
|--------|--------|-------|
| `metadata.players()` | ✅ | Implemented |
| `metadata.definePlayer()` | ✅ | Implemented |
| `metadata.updateParticipant()` | ✅ | Just added |
| `metadata.defineMatch()` | ✅ | Implemented |
| `metadata.defineTournament()` | ✅ | Implemented |
| `metadata.timestamps()` | ✅ | Implemented |
| `metadata.resetStats()` | ✅ | Implemented |
| `metadata.tournament` | ❓ | Property access |

### Set API

| Method | Status | Notes |
|--------|--------|-------|
| `set.firstService()` | ✅ | Implemented |
| `set.liveStats()` | ❓ | Need to check |
| `set.perspectiveScore()` | ✅ | Implemented |

### Format API

| Method | Status | Notes |
|--------|--------|-------|
| `format.code` | ✅ | Property |
| `format.setsToWin` | ❓ | Property - need to check |
| `format.structure` | ❓ | Property - need to check |
| `format.settings()` | ❓ | Need to check |
| `format.changeFormat()` | ❓ | Need to check |

### Statistics API

| Method | Status | Notes |
|--------|--------|-------|
| `stats.calculated()` | ✅ | Just implemented |
| `stats.counters()` | ✅ | Just implemented |

### Other Methods/Properties

| Method | Status | Notes |
|--------|--------|-------|
| `nextTeamServing()` | ✅ | Implemented |
| `nextTeamReceiving()` | ✅ | Implemented |
| `toMatchUp()` | ❓ | Need to check |
| `status` | ❓ | Property setter |
| `decoratePoint()` | ❌ | NOT implemented |

---

## Summary Count

- ✅ **Verified Implemented:** 24
- ❓ **Need to Check:** 10
- ❌ **Missing:** 1 (decoratePoint)

---

## Missing/Unknown Methods to Investigate

1. ❓ `reset()` - Reset match to initial state
2. ❓ `history.common()` - Get common history
3. ❓ `history.lastPoint()` - Get last point
4. ❓ `metadata.tournament` - Tournament property (not method)
5. ❓ `set.liveStats()` - Live stats flag
6. ❓ `format.setsToWin` - Property
7. ❓ `format.structure` - Property
8. ❓ `format.settings()` - Format settings method
9. ❓ `format.changeFormat()` - Change format mid-match
10. ❓ `toMatchUp()` - Export as TODS matchUp
11. ❓ `status` - Match status property
12. ❌ `decoratePoint()` - Add metadata to existing point

---

## Next Steps

1. Check v3Adapter for each ❓ method
2. Implement any missing methods
3. Test each method in browser
4. Verify complete coverage before user testing
