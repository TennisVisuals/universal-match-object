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

## ✅ Recently Completed

### API Modernization - "Factory-First"

**Completed:** January 19, 2026

All internal code now uses modern property accessors instead of legacy method calls. 35+ method calls replaced with properties (`pointsTo`, `winBy`, `hasGoldenPoint`, `isTiebreak`). All 292 tests passing.

### TypeScript Declaration Generation

**Status:** Complete - Declarations are being generated correctly.

**Status:** Complete - Declarations are being generated correctly.

**Details:**
```bash
# Build output confirms working declaration generation:
DTS ⚡️ Build success in 942ms
DTS dist/index.d.ts            13.93 KB
DTS dist/formatConverter.d.ts  3.71 KB
DTS dist/matchObject.d.ts      8.83 KB
DTS dist/index.d.mts           13.93 KB
DTS dist/formatConverter.d.mts 3.71 KB
DTS dist/matchObject.d.mts     8.83 KB
```

**Configuration:**
- `tsup.config.ts` has `dts: true` enabled
- Generates both CommonJS (.d.ts) and ESM (.d.mts) declarations
- All entry points properly typed

**Note:** If runtime API differs from types, update source TypeScript annotations rather than manually maintaining separate `.d.ts` files.

### Mobile App TODS Migration

**Status:** Complete - hive-eye-tracker fully migrated to TODS properties.

**What Was Done:**
- ✅ All files updated to use TODS `participantName` property
- ✅ Removed all references to legacy `player.name`
- ✅ Storage adapter supports both TODS and legacy formats
- ✅ Auto-migration handles legacy stored matches
- ✅ App builds and runs successfully

**Verified:** Only remaining `player.name` reference is in legacy storage fallback comment.

---

## 🔄 Known Issues & Incomplete Work

(None currently - all major issues resolved)

## 🚀 Aspirational / Future Enhancements

### 1. API Modernization - "Factory-First" ✅ COMPLETE

**Status:** All legacy method calls replaced with modern property accessors

**Implementation:**
```typescript
// ✅ Modern property accessors fully implemented and in use
const structure = match.format.structure;
// Returns: { bestOf: 3, setFormat: {...}, finalSetFormat: {...} }

// High-level accessors
const setsToWin = match.format.setsToWin;  // Math.ceil(bestOf/2)
const code = match.format.code;
const bestOf = match.format.bestOf;
const isDoubles = match.format.isDoubles;

// Low-level accessors (replace legacy methods)
const pointsTo = game.format.pointsTo;       // replaces threshold()
const winBy = game.format.winBy;             // replaces minDiff()
const hasGoldenPoint = game.format.hasGoldenPoint; // replaces hasDecider()
const isTiebreak = game.format.isTiebreak;   // replaces tiebreak()
```

**Changes Made:**
- Added 4 new property accessors to `formatObject.ts`:
  - `pointsTo` - Points needed to win (threshold)
  - `winBy` - Minimum difference required
  - `hasGoldenPoint` - Whether golden/deciding point is used
  - `isTiebreak` - Whether format is a tiebreak

- Replaced **35+ legacy method calls** across codebase:
  - `stateObject.ts`: 9 replacements
  - `matchObject.ts`: 8 replacements  
  - `pointParser.ts`: 1 replacement
  - `formatObject.ts`: 4 replacements (in settings() method)

**Testing:**
- All 292 tests passing ✅
- No breaking changes to public API
- Legacy methods still exist for backward compatibility

**Benefits:**
- More idiomatic JavaScript (properties vs method calls)
- Better TypeScript inference
- Clearer intent (`pointsTo` vs `threshold`)
- Consistent with modern API patterns (`structure`, `code`, etc.)

**Status:**
- ✅ All internal code uses modern properties (42+ replacements total)
- ✅ Mobile app updated to use property accessors
- ⏸️  Deprecated methods still exist (used internally by property getters)
- ⏸️  Cannot remove methods - properties delegate to them for implementation

---

### 2. Static Object Restructure ⏸️ Not Needed

**Original Vision:** Transform UMO from factory-based to static object for automatic TypeScript type generation.

**Status:** NOT NEEDED - TypeScript declarations are already being generated correctly (dts: true in tsup.config.ts works perfectly).

**Original Problem:** Current closure-based pattern prevents proper type inference:
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

**Resolution:** 
- TypeScript declarations are being generated correctly (confirmed working)
- All 292 tests passing with proper types
- No type inference issues in practice
- Cost-benefit doesn't justify 7-11 hours of risky refactoring

**Conclusion:** 
This refactor was proposed to solve a problem that no longer exists. TypeScript type generation works correctly with current architecture. DEFERRED indefinitely.

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
1. ✅ ~~**Complete Mobile App Migration**~~ - **DONE!** All files now use TODS properties
2. **Type Generation Fix** - Implement manual `.d.ts` files or switch to `tsc` for declarations
3. **Documentation** - Update README with modern examples, create comprehensive API docs

### Short Term (Next Quarter)

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
