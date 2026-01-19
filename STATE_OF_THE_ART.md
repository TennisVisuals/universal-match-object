# Universal Match Object - State of the Art

**Last Updated:** 2026-01-19  
**Current Version:** v2.1.0  
**Status:** Production-ready with TODS-native architecture

---

## 🎯 Current Status

### ✅ Completed Major Achievements

#### 1. TODS-Native Internal Architecture
The UMO has been fully converted to use TODS (Tennis Open Data Standards) format internally:

- **Native TODS Storage**: All participant/player data stored in TODS `Participant` format
- **Zero Conversion Overhead**: No mapping between internal and external formats
- **TODSMetadata Class**: 291-line implementation providing Map-based O(1) lookups
- **Direct TODS Access**: Methods like `todsParticipants()`, `todsSides()`, `todsMatchUp()`
- **Extensibility Framework**: TODS `extensions[]` array for custom metadata
- **Full Backward Compatibility**: Legacy APIs still work via auto-conversion

**Branch:** `feature/next-umo-feature` (merged to dev)  
**Tests:** 140/140 passing  
**Build:** Clean

#### 2. Modern TODS API (Runtime)
Modern nomenclature implemented at runtime:

```typescript
// Modern API (runtime functional)
const matchUp = matchObject.matchUp({ 
  matchFormat: 'SET3-S:6/TB7',
  matchUpId: 'match-123',
  participants: [...]
});

// Direct TODS access
const participants = matchUp.todsParticipants();  // Zero conversion!
const sides = matchUp.todsSides();
```

**Note:** TypeScript declaration files need manual update (see Known Issues below).

#### 3. Factory Format Support
Full integration with tods-competition-factory format codes:

- **Format Parser**: Converts Factory format codes to internal structures
- **Format Adapter**: Bidirectional conversion between UMO and Factory
- **Validation**: Battle-tested validators from tods-competition-factory
- **Coverage**: Supports all Factory format codes (NoAD, Fast4, supertiebreaks, etc.)

#### 4. Testing & Quality
- **272 tests** across 19 test suites
- **Comprehensive coverage**: Core functionality, TODS adapters, format conversion
- **Type Safety**: Full TypeScript support
- **Build Tooling**: Modern stack (tsup 8.5.1, TypeScript 5.9.3, Vitest 4.0.17)
- **Code Quality**: ESLint + SonarJS configured and passing

---

## 🔄 Known Issues & Incomplete Work

### 1. TypeScript Declaration Generation ⚠️

**Problem:** Runtime code fully supports modern TODS API, but auto-generated type declarations don't reflect this.

**Impact:** Medium (DX issue, not functionality)

**Details:**
```typescript
// ✅ Runtime - works perfectly
const matchUp = umo.Match({ matchFormat: 'SET3-S:6/TB7' });

// ❌ TypeScript thinks signature is still:
// Match(options?: { type?: string }): MatchObject
```

**Root Cause:** tsup/esbuild type generation doesn't handle dynamic object construction patterns.

**Current Workaround:** Use backward-compatible parameter names (`type` instead of `matchFormat`).

**Long-term Solutions:**
1. **Manual `.d.ts` files** - Quick fix, requires maintenance
2. **Use `tsc` for declarations** - More robust, slower build
3. **Restructure UMO object** - Best solution, requires refactoring (~1700 lines)

**Recommendation:** Implement option 3 (static object restructure) in v3.0.0.

**Tracking:** See archived `TYPE_GENERATION_ISSUE.md` for full analysis.

---

### 2. Mobile App TODS Migration 🚧

**Status:** Partially complete (env.ts converted, 22 files remaining)

**Branch:** `dev` (partial work merged)

**What's Done:**
- ✅ `env.ts` converted to use TODS-native UMO
- ✅ Storage adapter supports `_tods_native` flag
- ✅ Auto-migration handles legacy formats
- ✅ App builds and runs successfully

**What Remains:**
- 22 files still use legacy UMO APIs
- String-based format checking needs modernization
- Full testing with TODS API throughout app

**Files Requiring Updates:**
```
src/transition/viewManager.ts       ⚠️ HIGH PRIORITY (string parsing)
src/transition/changeFormat.ts      ⚠️ CRITICAL (format management)
src/transition/displayUpdate.ts
src/services/matchObject/storageAdapter.ts
src/services/matchObject/factoryMatchUpLoader.ts
... and 17 more files
```

**Migration Pattern:**
```typescript
// OLD (legacy)
const players = match.metadata.players();
const name = players[0].name;
const id = players[0].id;

// NEW (TODS)
const participants = match.metadata.players();
const name = participants[0].participantName;
const id = participants[0].participantId;
```

**Priority:** Medium (app works, but incomplete migration)

---

## 🚀 Aspirational / Future Enhancements

### 1. API Modernization - "Factory-First" (v3.0)

**Vision:** Expose Factory's parsed format structures directly, eliminate legacy wrappers.

**Current State:**
```typescript
// Current (v2.x)
const settings = match.format.settings();
const threshold = match.format.threshold();
const code = settings.code;
```

**Proposed (v3.0):**
```typescript
// Direct Factory structure access
const structure = match.format.structure;
// Returns: { bestOf: 3, setFormat: {...}, finalSetFormat: {...} }

// Modern computed accessors
const setsToWin = match.format.setsToWin;  // Math.ceil(bestOf/2)
const code = match.format.code;
const isDoubles = match.format.isDoubles;

// REMOVED:
// match.format.settings() ❌
// match.format.threshold() ❌
// match.format.types() ❌
```

**Benefits:**
- **No String Parsing**: Never check format strings (e.g., `indexOf('n_')`)
- **Direct Factory Access**: Use parsed JSON structures
- **Simpler Codebase**: Less wrapper code to maintain
- **Better Types**: TypeScript can infer from structures

**Blockers:**
- Breaking changes (v3.0.0 major version bump required)
- Mobile app must be fully updated first
- Comprehensive migration guide needed

**Estimated Effort:** 4 weeks (1 week UMO, 2-3 weeks mobile app)

**Tracking:** See archived `FACTORY_FIRST_REFACTOR.md`, `API_MODERNIZATION_PLAN.md`

---

### 2. Static Object Restructure

**Vision:** Transform UMO from factory-based to static object for automatic TypeScript type generation.

**Problem:** Current closure-based pattern prevents proper type inference:
```typescript
// Current (dynamic)
let umo = function() {} as any as UMO;
umo.Match = (...) => { ... };
umo.matchUp = umo.Match;
```

**Solution:** Static object with explicit structure:
```typescript
// Proposed (static)
const matchFn = (options?: any) => { ... };

const umo: UMO = {
  addPoint_events: [],
  Match: matchFn,
  matchUp: matchFn,
  Set: createSet,
  Game: createGame,
  // ... all properties statically defined
};
```

**Benefits:**
- ✅ Automatic type generation works
- ✅ No circular dependency issues
- ✅ Tree-shakeable exports
- ✅ Easier to test (import individual factories)
- ✅ Better IDE support

**Challenges:**
- Circular dependencies between functions
- Shared state management (`addPoint_events`, etc.)
- Large refactor (~1700 lines with complex interdependencies)

**Approach:** 5-phase incremental refactor with test coverage at each step:
1. Extract core factories (stateObject, common, events)
2. Extract format factories (matchUpFormat, setFormat, gameFormat)
3. Extract entity factories (Match, Set, Game)
4. Extract state management (history, statistics, scoreboard)
5. Assemble static UMO object

**Estimated Effort:** 7-11 hours focused work

**Tracking:** See archived `REFACTOR_PLAN.md` for detailed 5-phase plan

---

### 3. Explicit Game Structure

**Vision:** Provide explicit TODS structure for regular games (not just tiebreaks).

**Current State:**
```javascript
// Tiebreak games have explicit structure
{ tiebreakFormat: { tiebreakTo: 7 } }

// Regular games get undefined (rely on hardcoded defaults)
undefined → falls back to threshold: 4, minDiff: 2
```

**Proposed:**
```javascript
// Regular game - explicit structure
{
  setFormat: {
    setTo: 6,
    gameFormat: {
      // Empty object = use tennis defaults
      // Or explicit: { pointsTo: 4, winBy: 2, scoring: 'tennis' }
    }
  }
}

// No-AD game - only specify difference
{
  setFormat: {
    setTo: 6,
    NoAD: true,
    gameFormat: {
      NoAD: true  // Inherited from set level
    }
  }
}
```

**Benefits:**
- No reliance on hardcoded defaults
- TODS-pure at all levels
- Clearer format structure
- Easier format introspection

**Open Questions:**
- What properties should regular game structure include?
- Empty object `{}` or explicit `{ pointsTo: 4, winBy: 2 }`?
- Should structure inherit from parent levels?

**Priority:** Low (current approach works, this is architectural purity)

**Tracking:** See archived `EXPLICIT_GAME_STRUCTURE.md`, `NOMENCLATURE_MODERNIZATION.md`

---

### 4. Enhanced Validation

**Current:** Basic Factory validator integration

**Aspirational:**
- **Real-time Validation**: Validate points as they're added (optional mode)
- **Score Correction**: Suggest corrections for invalid scores
- **Format Inference**: Infer format from score patterns
- **PBP Analysis Tools**: Enhanced point-by-point validation and statistics

**Use Cases:**
- Score entry UIs with live validation
- Data cleaning pipelines
- Historical match analysis
- Tournament management systems

**Estimated Effort:** 2-3 weeks

---

### 5. Performance Optimizations

**Potential Areas:**
- **Lazy Scoring**: Only compute score components when accessed
- **Memoization**: Cache expensive calculations (history, statistics)
- **Efficient History**: Use immutable data structures for undo/redo
- **Streaming PBP**: Process large PBP files without loading all into memory

**Benchmarking Needed:**
- Current performance is acceptable for typical use cases
- Optimizations should be data-driven (measure first)

**Priority:** Low (optimize only if demonstrated need)

---

## 📚 Architecture Decisions

### Design Principles

1. **TODS-Native Throughout**: Internal storage matches external format
2. **Zero Conversion**: No mapping overhead between representations
3. **Factory Integration**: Use tods-competition-factory as single source of truth
4. **Backward Compatibility**: Legacy APIs continue working during transition
5. **Modern Tooling**: TypeScript, Vitest, tsup for developer experience

### Key Technical Decisions

#### TODSMetadata Class
- **Decision:** Use `Map<string, Participant>` for O(1) participant lookup
- **Rationale:** Performance critical for large matches, native TypeScript support
- **Trade-off:** Slightly more complex than array, better performance at scale

#### Direct TODS Access Methods
- **Decision:** Provide `todsParticipants()`, `todsSides()`, `todsMatchUp()` methods
- **Rationale:** Direct access without conversion for Factory integration
- **Trade-off:** More API surface, better interoperability

#### Backward Compatibility Layer
- **Decision:** Keep `Match()`, `definePlayer()` legacy APIs working
- **Rationale:** Don't break existing mobile app code
- **Trade-off:** Larger codebase, smoother migration path

#### Factory Format Codes
- **Decision:** Support Factory format codes exclusively (drop legacy 3_6a_7 format)
- **Rationale:** Industry standard, comprehensive, well-tested
- **Trade-off:** One-time migration cost, long-term maintainability gain

---

## 🎯 Recommended Priorities

### Immediate (Next Sprint)
1. **Complete Mobile App Migration** - Finish converting remaining 22 files to TODS API
2. **Testing** - Add integration tests for TODS workflows

### Short Term (Next Quarter)
3. **Type Generation Fix** - Implement manual `.d.ts` files or switch to `tsc` for declarations
4. **Documentation** - Update README with modern examples, create comprehensive API docs

### Medium Term (Next 6 Months)
5. **API Modernization (v3.0)** - Implement Factory-first API (breaking changes)
6. **Static Object Restructure** - Enable automatic type generation

### Long Term (Future Releases)
7. **Enhanced Validation** - Real-time validation, score correction
8. **Performance** - Optimize based on real-world usage data

---

## 📖 Reference

### Related Packages
- **tods-competition-factory**: v2.2.48 - Format parsing and validation
- **TMX**: Using modern TODS-native UMO successfully

### Key Files
- `src/metadata/todsMetadata.ts` - TODS-native metadata implementation (291 lines)
- `src/matchObject.ts` - Main UMO implementation (~1700 lines)
- `src/formatConverter.ts` - Factory format code support
- `src/validators/validateMatchUpScore.ts` - Factory validation integration

### Examples
- `examples/pbp-validator/` - Point-by-point file validation tool

### Build & Test
```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build package
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

---

## 🤝 Contributing

### Code Style
- TypeScript with strict mode
- ESLint + SonarJS for code quality
- Comprehensive test coverage for new features
- Document architectural decisions

### Testing Requirements
- All tests must pass (272/272)
- New features require tests
- Maintain backward compatibility unless v3.0+

### Documentation
- Update this file for architectural changes
- Maintain examples for common use cases
- Document breaking changes clearly

---

## 📝 Notes

### Why This Document?

This document consolidates insights from ~30 historical markdown files documenting the TODS-native refactor journey. Those files captured session progress, refactor plans, and technical decisions made over multiple development cycles. They've been archived as their information is now consolidated here.

### What's Changed?

The UMO has evolved from:
- **Legacy Format**: Internal `{ name, id, puid }` with conversion overhead
- **Wrapper APIs**: `settings()`, `threshold()`, string-based format checking

To:
- **TODS-Native**: Internal `{ participantId, participantName, participantType }` with zero conversion
- **Direct Access**: `todsParticipants()`, Factory structure exposure
- **Modern Nomenclature**: `matchFormat`, `matchUpId`, `matchUp()`

### What's Next?

Complete the transition:
1. Finish mobile app migration
2. Fix TypeScript declarations
3. Plan v3.0 breaking changes for full Factory-first API

---

**Maintained by:** Charles Allen / TennisVisuals  
**Documentation Style:** State-of-the-art snapshot (not historical session logs)  
**Update Frequency:** After major architectural changes or version releases
