# Phase 1 Progress: Core Factories Extraction

## Current State
- Branch: feature/option-b-static-refactor
- Tests: 146/148 passing
- File size: matchObject.ts = 1786 lines

## Extraction Strategy (Revised for Incremental Safety)

### Step 1: Extract Independent Functions ✅ (Start Here)
**No dependencies, pure functions**
- defaultPointParser → src/scoring/pointParser.ts
- Helper functions (numbersArray, etc.)

### Step 2: Extract Event Management
**Minimal dependencies**
- addPoint_events, undo_events, reset_events → src/core/events.ts

### Step 3: Extract Format Factories  
**Depends on common (via parameter)**
- formatObject → src/formats/formatObject.ts
- gameFormat → src/formats/gameFormat.ts
- setFormat → src/formats/setFormat.ts
- matchUpFormat → src/formats/matchUpFormat.ts

### Step 4: Extract Common Factory
**Depends on metadata, events**
- common → src/core/common.ts

### Step 5: Extract StateObject with DI
**Circular dependency breaker**
- stateObject → src/core/stateObject.ts
- Pass Match/Set/Game constructors as parameters

### Step 6: Extract Match/Set/Game
**Depends on stateObject, formats**
- Match → src/core/Match.ts
- Set → src/core/Set.ts
- Game → src/core/Game.ts

## Test After Each Step
Run `pnpm test` and verify 146 tests still pass

## Current Step
**Starting Step 1: Extract pointParser**

---
**Last Updated**: Phase 1 start
**Time Estimate**: 2-3 hours total
