# Phase 2: State & Core Extraction Plan

## Goal
Extract remaining factories from matchObject.ts into modular structure.

## Current State
- matchObject.ts: 1,318 lines
- Target reduction: ~600 additional lines

## Extraction Order

### 1. Common Factory (~200 lines)
**Target**: `src/core/common.ts`

**What it contains**:
- Event management (addPoint_events, undo_events, reset_events)
- Metadata accessors
- Point parser assignment
- History management
- Stats system (live_stats, stat_points)
- Service order tracking

**Lines**: ~850-1050 in matchObject.ts

**Dependencies**: 
- TODSMetadata
- pointParser

### 2. State Object (~250 lines)
**Target**: `src/state/stateObject.ts`

**What it contains**:
- Core state management (counter, local_history, children)
- addPoint/addScore/addMultiple methods
- undo/reset methods
- change methods (points, games)
- score/scoreboard methods
- history accessors
- Child management (currentChild, newChild, lastChild)

**Lines**: ~35-285 in matchObject.ts

**Dependencies**:
- common factory
- Format objects

### 3. Match Factory (~50 lines)
**Target**: `src/core/match.ts`

**What it does**:
- Wraps stateObject with Match-specific logic
- Adds participants() method
- Adds toMatchUp() export
- Match-specific metadata

**Lines**: ~506-565 in matchObject.ts

**Dependencies**:
- stateObject
- matchUpFormat
- common

### 4. Set Factory (~50 lines)  
**Target**: `src/core/set.ts`

**What it does**:
- Wraps stateObject with Set-specific logic
- pointsNeeded() calculation
- Set-specific accessors

**Lines**: ~641-695 in matchObject.ts

**Dependencies**:
- stateObject
- setFormat
- common

### 5. Game Factory (~50 lines)
**Target**: `src/core/game.ts`

**What it does**:
- Wraps stateObject with Game-specific logic
- pointsToGame() calculation
- Game-specific accessors

**Lines**: ~761-810 in matchObject.ts

**Dependencies**:
- stateObject
- gameFormat
- common

## After Extraction

### Final matchObject.ts (~700 lines)
- Import all modules
- Assign to umo object
- Export API
- Version method
- fromMatchUp method
- Type definitions

### Directory Structure
```
src/
├── core/
│   ├── common.ts       (200 lines) ✅ TO CREATE
│   ├── match.ts        (50 lines)  ✅ TO CREATE
│   ├── set.ts          (50 lines)  ✅ TO CREATE
│   └── game.ts         (50 lines)  ✅ TO CREATE
├── state/
│   └── stateObject.ts  (250 lines) ✅ TO CREATE
├── formats/
│   ├── formatObject.ts (280 lines) ✅ DONE
│   ├── matchUpFormat.ts (36 lines) ✅ DONE
│   ├── setFormat.ts    (41 lines)  ✅ DONE
│   └── gameFormat.ts   (22 lines)  ✅ DONE
├── scoring/
│   └── pointParser.ts  (120 lines) ✅ DONE
└── matchObject.ts      (~700 lines)
```

## Implementation Strategy

1. **Extract common first** (least dependencies)
2. **Extract stateObject** (depends on common)
3. **Extract Match/Set/Game** (depend on stateObject)
4. **Update matchObject.ts** (import and assign)
5. **Test after each extraction**

## Risk Mitigation

- Extract one at a time
- Run tests after each
- Keep matchObject.ts working throughout
- No breaking API changes

## Success Criteria

- ✅ All 157 tests passing
- ✅ matchObject.ts < 800 lines
- ✅ Zero circular dependencies
- ✅ TypeScript types still working

