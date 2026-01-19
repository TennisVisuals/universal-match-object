# Option B: Static Object Refactor Plan

## Goal
Transform UMO from factory-based to static object structure to enable automatic TypeScript type generation and eliminate circular dependencies.

## Current Issues
1. **Circular Dependencies**: Functions call each other in closure scope
2. **Type Generation**: TypeScript can't infer types from factory closures
3. **Manual Types**: Require hand-written `.d.ts` files (Option A workaround)
4. **Testing Difficulty**: Hard to test individual components in isolation
5. **Bundle Size**: Closures prevent tree-shaking

## Solution: 5-Phase Modular Extraction

### Phase 1: Extract Core Factories
**Goal**: Break foundational circular dependencies

**Files to Create**:
- `src/core/stateObject.ts` - State management factory
- `src/core/common.ts` - Common shared state factory
- `src/core/events.ts` - Event management

**Dependencies**:
```
stateObject ← common (via parameter)
common → TODSMetadata (already separate)
events → none
```

**Changes**:
- Export factory functions instead of attaching to `umo`
- Pass dependencies as parameters
- Import in matchObject.ts and assign to umo

**Test After**: Run full test suite, verify 146 tests pass

**Commit**: "refactor(phase1): Extract core factories to src/core"

---

### Phase 2: Extract Format Factories
**Goal**: Separate format logic from main file

**Files to Create**:
- `src/formats/matchUpFormat.ts`
- `src/formats/setFormat.ts`
- `src/formats/gameFormat.ts`
- `src/formats/formatObject.ts` (shared)

**Dependencies**:
```
matchUpFormat → formatObject, setFormat
setFormat → formatObject, gameFormat
gameFormat → formatObject
formatObject → common (via parameter)
```

**Test After**: Verify format parsing and application

**Commit**: "refactor(phase2): Extract format factories to src/formats"

---

### Phase 3: Extract Match/Set/Game Factories
**Goal**: Separate entity creation logic

**Files to Create**:
- `src/core/Match.ts`
- `src/core/Set.ts`
- `src/core/Game.ts`

**Dependencies**:
```
Match → stateObject, matchUpFormat, common, Set
Set → stateObject, setFormat, common, Game
Game → stateObject, gameFormat, common
```

**Test After**: Verify match creation and gameplay

**Commit**: "refactor(phase3): Extract Match/Set/Game to src/core"

---

### Phase 4: Extract State Management
**Goal**: Separate history, scoring, and stats

**Files to Create**:
- `src/state/history.ts`
- `src/state/statistics.ts`
- `src/scoring/scoreboard.ts`
- `src/scoring/pointParser.ts`

**Dependencies**:
```
history → common
statistics → common, metadata
scoreboard → stateObject, common
pointParser → none (pure function)
```

**Test After**: Verify score calculation and history

**Commit**: "refactor(phase4): Extract state/scoring to modules"

---

### Phase 5: Assemble Static UMO
**Goal**: Create static export object with automatic types

**File to Create**:
- `src/index.ts` (replace current)

**Structure**:
```typescript
import { createMatch } from './core/Match';
import { createSet } from './core/Set';
import { createGame } from './core/Game';
import { createMatchUpFormat } from './formats/matchUpFormat';
import { createCommon } from './core/common';
import { defaultPointParser } from './scoring/pointParser';

const umo = {
  Match: createMatch,
  Set: createSet,
  Game: createGame,
  matchUp: createMatch, // alias
  matchUpFormat: createMatchUpFormat,
  setFormat: createSetFormat,
  gameFormat: createGameFormat,
  common: createCommon,
  pointParser: defaultPointParser,
  version: '@VERSION@',
  
  // Events (module-level, not closures)
  addPoint_events: [],
  undo_events: [],
  reset_events: [],
};

export default umo;
export type { UMO, MatchObject, SetObject, GameObject } from './types';
```

**Benefits**:
- ✅ TypeScript auto-generates types from structure
- ✅ No circular dependencies
- ✅ Tree-shakeable exports
- ✅ Easier testing (import individual factories)
- ✅ Clear dependency graph

**Test After**: 
- Full test suite (all 146 tests)
- Mobile app build
- Type checking

**Commit**: "refactor(phase5): Assemble static UMO object"

---

## Testing Strategy

### At Each Phase:
1. Run `pnpm test` - verify no regressions
2. Run `pnpm build` - verify builds successfully
3. Check types with `tsc --noEmit`
4. Test specific functionality for that phase

### Final Verification:
1. All 146+ tests passing
2. Mobile app builds and runs
3. No TypeScript errors
4. Bundle size unchanged or smaller
5. Manual .d.ts files can be removed

---

## Rollback Strategy

Each phase is committed separately. If issues arise:
1. Identify failing phase
2. `git revert <phase-commit>`
3. Fix issues in separate branch
4. Re-apply when ready

---

## Timeline Estimate

- Phase 1: 2-3 hours (foundational, most complex)
- Phase 2: 1-2 hours (straightforward extraction)
- Phase 3: 2-3 hours (entity logic, careful testing)
- Phase 4: 1-2 hours (state logic)
- Phase 5: 1 hour (assembly, type verification)

**Total**: 7-11 hours of focused work

---

## Success Criteria

✅ All tests passing
✅ Mobile app builds successfully  
✅ No manual type declarations needed
✅ Clean module boundaries
✅ Automatic TypeScript inference
✅ Reduced coupling
✅ Better testability

---

**Status**: Ready to begin Phase 1
**Branch**: feature/option-b-static-refactor
**Current Tests**: 146/148 passing (2 unrelated failures)
