# Missing v3 API Methods in v4 Adapter

**Critical:** Methods that hive-eye uses but v4 adapter doesn't implement

---

## Status Summary

### ✅ Implemented (30/40)
- addPoint, score, scoreboard, complete, winner, undo, reset, doubles, sets
- events.addPoint, events.undo, events.reset, events.clearEvents
- history.points, history.action
- metadata.players, metadata.definePlayer, metadata.updateParticipant
- metadata.defineMatch, metadata.defineTournament, metadata.timestamps, metadata.resetStats
- set.firstService, set.perspectiveScore
- nextTeamServing, nextTeamReceiving
- stats.calculated, stats.counters

### ❌ Missing (10/40)

1. **`history.common()`** - Used in formatChangePossible.ts
2. **`history.lastPoint()`** - Used in strokeAction.ts
3. **`decoratePoint(last_point, metadata)`** - Used in strokeAction.ts
4. **`toMatchUp()`** - Used in storageAdapter.ts (critical for save!)
5. **`status` (property setter)** - Used in displayUpdate.ts
6. **`set.liveStats()`** - Used in multiple places
7. **`format.setsToWin` (property)** - Used in displayUpdate.ts
8. **`format.structure` (property)** - Used in GameTreePage.ts, viewManager.ts
9. **`format.settings()`** - Used in loadMatch.ts, factoryMatchUpLoader.ts
10. **`format.changeFormat()`** - Used in changeFormat.ts
11. **`metadata.tournament` (property)** - Used in storageAdapter.ts

---

## Critical Priority (Breaks Core Functionality)

### 🔴 P0: `toMatchUp()` 
**Used in:** storageAdapter.ts:82  
**Purpose:** Export match as TODS matchUp for saving  
**Impact:** **Cannot save matches!**

```typescript
const matchUp = env.match.toMatchUp();
```

### 🔴 P0: `decoratePoint(point, metadata)`
**Used in:** strokeAction.ts:11  
**Purpose:** Add stroke/hand metadata to existing point  
**Impact:** Stroke tracking broken

```typescript
env.match.decoratePoint(last_point, { hand, stroke });
```

### 🔴 P0: `history.lastPoint()`
**Used in:** strokeAction.ts:10  
**Purpose:** Get last point for decoration  
**Impact:** Stroke tracking broken

```typescript
const last_point = env.match.history.lastPoint();
```

---

## High Priority (Important Features)

### 🟠 P1: `set.liveStats()`
**Used in:** 3 files  
**Purpose:** Enable/disable live statistics  
**Impact:** Statistics might not update correctly

### 🟠 P1: `format.settings()`
**Used in:** 2 files  
**Purpose:** Set format configuration  
**Impact:** Format changes broken

### 🟠 P1: `format.changeFormat()`
**Used in:** changeFormat.ts:22  
**Purpose:** Change format mid-match  
**Impact:** Format changes broken

### 🟠 P1: `format.setsToWin` (property)
**Used in:** displayUpdate.ts:39  
**Purpose:** Get sets needed to win  
**Impact:** Display logic broken

### 🟠 P1: `format.structure` (property)
**Used in:** 2 files  
**Purpose:** Get format structure details  
**Impact:** NoAD detection broken

---

## Medium Priority (Nice to Have)

### 🟡 P2: `history.common()`
**Used in:** formatChangePossible.ts:9  
**Purpose:** Get common history  
**Impact:** Format change validation

### 🟡 P2: `status` (property setter)
**Used in:** displayUpdate.ts:131  
**Purpose:** Set match status message  
**Impact:** Status display

### 🟡 P2: `metadata.tournament` (property)
**Used in:** storageAdapter.ts:88  
**Purpose:** Tournament property access  
**Impact:** Save might not preserve tournament

---

## Implementation Priority Order

1. **toMatchUp()** - Blocking saves
2. **history.lastPoint()** + **decoratePoint()** - Blocking stroke tracking
3. **set.liveStats()** - Needed for statistics
4. **format.setsToWin**, **format.structure** - Display issues
5. **format.settings()**, **format.changeFormat()** - Format management
6. **history.common()** - Format validation
7. **status** property - Display polish
8. **metadata.tournament** property - Save enhancement

---

## Estimated Implementation Time

| Method | Complexity | Time |
|--------|------------|------|
| toMatchUp() | High | 2-3h |
| history.lastPoint() | Low | 15min |
| decoratePoint() | Medium | 1-2h |
| set.liveStats() | Low | 15min |
| format.setsToWin | Low | 15min |
| format.structure | Medium | 30-60min |
| format.settings() | Medium | 1-2h |
| format.changeFormat() | High | 2-3h |
| history.common() | Low | 30min |
| status property | Low | 15min |
| metadata.tournament | Low | 15min |

**Total:** ~8-12 hours

---

## Recommendation

**Implement in order listed above.**

Critical path:
1. toMatchUp() - 2-3h
2. lastPoint() + decoratePoint() - 1.5-2.5h
3. set.liveStats() - 15min
4. Format properties - 1-2h

**After these 4 (5-7h total):** Core functionality should work

Remaining items can be added as needed.
