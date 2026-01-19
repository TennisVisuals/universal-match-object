# Factory-First Refactor - UMO v3.0 and Mobile App

**Goal**: Modernize UMO and mobile app to use Factory (TODS) as the standard everywhere, eliminate legacy APIs, maintain clean accessors for common operations.

**Approach**: Option C Hybrid with full Factory-first implementation

---

## Guiding Principles

1. **Factory is the Standard**: Tennis Open Data Standards (TODS) via tods-competition-factory is the reference implementation
2. **Direct Access**: Expose Factory's parsed format structures directly
3. **Modern Accessors**: Provide clean, typed accessors for common operations
4. **No String Parsing**: Never check format strings - use parsed JSON attributes
5. **Maintainability**: Simpler, more coherent codebase
6. **Zero Legacy**: Remove all legacy format support and APIs

---

## UMO v3.0 API Design

### Core Principle: Expose Factory Structures

```typescript
// DIRECT ACCESS to Factory-parsed format
match.format.structure  
// Returns: { 
//   bestOf: 3, 
//   setFormat: { setTo: 6, tiebreakAt: 6, tiebreakFormat: {...}, NoAD: false },
//   finalSetFormat: { tiebreakSet: true, tiebreakFormat: { tiebreakTo: 10 } }
// }

// MODERN ACCESSORS (computed from structure)
match.format.code          // 'SET3-S:6/TB7-F:TB10'
match.format.setsToWin     // Math.ceil(bestOf/2) → 2
match.format.isDoubles     // boolean
match.format.bestOf        // 3 (direct from structure)

// UTILITY METHODS
match.format.changeFormat(code)  // Replaces type()
match.format.stringify()         // Factory's stringify
match.format.parse(code)         // Factory's parse

// REMOVED (use structure instead):
// match.format.threshold() ❌
// match.format.minDiff() ❌
// match.format.hasDecider() ❌
// match.format.settings() ❌  (replaced by structure + accessors)
```

### Set and Game Formats

```typescript
// Set level - expose structure
set.format.structure  
// Returns: { setTo: 6, tiebreakAt: 6, tiebreakFormat: {...}, NoAD: false }

set.format.gamesTo      // 6 (from structure.setTo)
set.format.tiebreakAt   // 6 (from structure.tiebreakAt)
set.format.isNoAd       // false (from structure.NoAD)

// Game level - expose structure
game.format.structure
// Returns: { tiebreakTo: 7 } or standard game structure

game.format.pointsTo    // 7 for tiebreak, undefined for standard
game.format.isTiebreak  // boolean
```

---

## Mobile App Migration

### Current Code Patterns

**Pattern 1: String Checking (BAD)**
```typescript
// viewManager.ts line 108 - LEGACY ANTI-PATTERN
const noAd = env.match.format.settings().code.indexOf('n_') >= 0;

// MODERN FACTORY-FIRST
const noAd = env.match.format.structure.setFormat.NoAD;
```

**Pattern 2: settings() Wrapper**
```typescript
// changeFormat.ts - LEGACY
const code = env.match.format.settings().code;
const name = env.match.format.settings().name;

// MODERN FACTORY-FIRST
const code = env.match.format.code;
const description = env.match.format.structure.description || code;
```

**Pattern 3: threshold() Method**
```typescript
// displayUpdate.ts line 37 - LEGACY
const threshold = env.match.format.threshold();

// MODERN FACTORY-FIRST
const setsToWin = env.match.format.setsToWin;
```

**Pattern 4: doubles() Check**
```typescript
// storageAdapter.ts - LEGACY
const isDoubles = env.match.format.doubles();

// MODERN FACTORY-FIRST
const isDoubles = env.match.format.isDoubles;
```

---

## Files Requiring Changes

### UMO Package

**src/matchObject.ts**:
```typescript
// Add modern accessors to formatObject:
structure: () => fo.values.formatStructure,
code: () => fo.values.code,
setsToWin: () => {
  const fs = fo.values.formatStructure;
  return fs?.bestOf ? Math.ceil(fs.bestOf / 2) : undefined;
},
bestOf: () => fo.values.formatStructure?.bestOf,
isDoubles: () => common.doubles(),

// REMOVE:
// settings() ❌
// threshold() ❌
// minDiff() ❌
// hasDecider() ❌
// types() ❌
// type() ❌ (replace with changeFormat)
```

**src/types.ts**:
```typescript
// Add modern format interfaces
export interface ModernFormatAPI {
  structure: FormatStructure;
  code: string;
  setsToWin: number;
  bestOf: number;
  isDoubles: boolean;
  changeFormat: (code: string) => void;
  stringify: () => string;
  parse: (code: string) => FormatStructure | null;
}

export interface FormatStructure {
  bestOf: number;
  setFormat: SetFormatStructure;
  finalSetFormat?: SetFormatStructure;
}

export interface SetFormatStructure {
  setTo?: number;
  tiebreakAt?: number;
  tiebreakSet?: boolean;
  tiebreakFormat?: TiebreakFormatStructure;
  NoAD?: boolean;
}

export interface TiebreakFormatStructure {
  tiebreakTo: number;
  NoAD?: boolean;
}
```

---

### Mobile App (tennisvisuals-mobile)

**Files to Update** (17 files found):

1. **src/transition/viewManager.ts** ⚠️ HIGH PRIORITY
   - Line 108: String checking `indexOf('n_')` → use `structure.setFormat.NoAD`

2. **src/transition/displayUpdate.ts**
   - Line 37: `threshold()` → `setsToWin`

3. **src/transition/changeFormat.ts** ⚠️ CRITICAL
   - Multiple `settings()` calls → use modern accessors
   - Format type handling → use Factory codes directly

4. **src/services/matchObject/storageAdapter.ts**
   - `format.doubles()` → `format.isDoubles`
   - `format.settings().code` → `format.code`

5. **src/services/matchObject/factoryMatchUpLoader.ts**
   - Format handling modernization

6. **src/transition/displayFormats.ts**
   - Format code access

7. **src/transition/loadMatch.ts**
   - Format initialization

8. **src/transition/coms.ts**
   - Format data sending

**Additional Files** (from grep results):
- src/transition/env.ts
- src/transition/modalInfo.ts
- src/services/matchObject/initMatch.ts
- src/services/matchObject/matchHandlers.ts
- src/services/matchObject/matchStorage.ts
- src/services/matchObject/undoAddPoint.ts
- src/services/scoreboard/updateMatchScore.ts
- src/services/scoreboard/setCounter.ts
- src/services/helpers/setDev.ts

---

## Implementation Plan

### Phase 1: UMO v3.0 API (api-modernization branch)

**Week 1: Core API**
1. ✅ Create `api-modernization` branch
2. ⏳ Add modern accessors to formatObject:
   - `.structure` (direct Factory JSON)
   - `.code` (string)
   - `.setsToWin` (computed)
   - `.bestOf` (from structure)
   - `.isDoubles` (boolean)
3. ⏳ Add `.changeFormat(code)` to replace `.type()`
4. ⏳ Update internal UMO code to use structure
5. ⏳ Add TypeScript interfaces

**Week 1: Testing**
1. ⏳ Update all UMO tests
2. ⏳ Verify backward compatibility with legacy wrapper
3. ⏳ Add new tests for modern API

**Week 1: Documentation**
1. ⏳ Update API documentation
2. ⏳ Create migration guide
3. ⏳ Add TypeScript examples

---

### Phase 2: Mobile App Refactor (mobile-factory-first branch)

**Week 2: Audit and Plan**
1. ⏳ Create `mobile-factory-first` branch
2. ⏳ Audit all format usage (17 files)
3. ⏳ Create file-by-file migration checklist
4. ⏳ Identify breaking changes

**Week 2: High-Priority Files**
1. ⏳ Fix viewManager.ts (string checking)
2. ⏳ Fix changeFormat.ts (critical path)
3. ⏳ Fix storageAdapter.ts (data persistence)
4. ⏳ Test basic functionality

**Week 3: Remaining Files**
1. ⏳ Update all 17 files to modern API
2. ⏳ Remove all string-based format checks
3. ⏳ Test all features
4. ⏳ Performance testing

---

### Phase 3: Legacy Removal (Breaking Changes - v3.0.0)

**Week 4: Clean Slate**
1. ⏳ Remove deprecated methods from UMO:
   - `settings()` ❌
   - `threshold()` ❌
   - `minDiff()` ❌
   - `hasDecider()` ❌
   - `types()` ❌
   - `type()` ❌
2. ⏳ Remove legacy format conversion
3. ⏳ Update package.json to v3.0.0
4. ⏳ Final testing

**Week 4: Documentation**
1. ⏳ Update REFACTOR_SUMMARY.md
2. ⏳ Create MIGRATION_V2_TO_V3.md
3. ⏳ Update README.md
4. ⏳ Add BREAKING_CHANGES.md

---

## Breaking Changes Summary

### Removed from UMO v3.0

```typescript
// REMOVED METHODS:
match.format.settings()     ❌ Use .structure + accessors
match.format.threshold()    ❌ Use .setsToWin
match.format.minDiff()      ❌ Check structure.setFormat properties
match.format.hasDecider()   ❌ Check structure.finalSetFormat
match.format.types()        ❌ No longer needed
match.format.type(code)     ❌ Use .changeFormat(code)

// REMOVED FEATURES:
- Legacy format support (3_6a_7, etc.) ❌
- String-based format checking ❌
- Format wrapper objects ❌
```

### Added to UMO v3.0

```typescript
// NEW ACCESSORS:
match.format.structure      ✅ Direct Factory JSON
match.format.code           ✅ Format code string
match.format.setsToWin      ✅ Computed from bestOf
match.format.bestOf         ✅ From structure
match.format.isDoubles      ✅ Boolean
match.format.changeFormat() ✅ Update format
match.format.stringify()    ✅ Factory stringify
match.format.parse()        ✅ Factory parse

// Same for set/game levels
set.format.structure        ✅
set.format.gamesTo          ✅
set.format.tiebreakAt       ✅
set.format.isNoAd           ✅
```

---

## Migration Examples

### Example 1: Check No-Ad Format

```typescript
// BEFORE (v2.x - BAD)
const noAd = env.match.format.settings().code.indexOf('n_') >= 0;

// AFTER (v3.0 - GOOD)
const noAd = env.match.format.structure.setFormat.NoAD || false;
```

### Example 2: Get Sets to Win

```typescript
// BEFORE (v2.x)
const threshold = env.match.format.threshold();

// AFTER (v3.0)
const setsToWin = env.match.format.setsToWin;
```

### Example 3: Change Format

```typescript
// BEFORE (v2.x)
env.match.format.type('SET3-S:6/TB7');

// AFTER (v3.0)
env.match.format.changeFormat('SET3-S:6/TB7');
```

### Example 4: Check Doubles

```typescript
// BEFORE (v2.x)
const isDoubles = env.match.format.doubles();

// AFTER (v3.0)
const isDoubles = env.match.format.isDoubles;
```

### Example 5: Get Format Details

```typescript
// BEFORE (v2.x)
const settings = env.match.format.settings();
const code = settings.code;
const name = settings.name;
const threshold = settings.threshold;

// AFTER (v3.0)
const code = env.match.format.code;
const bestOf = env.match.format.bestOf;
const setsToWin = env.match.format.setsToWin;
const structure = env.match.format.structure; // Full Factory JSON
```

---

## Testing Strategy

### UMO Tests
1. ✅ Existing 95 tests should continue to pass
2. ⏳ Add tests for new accessors
3. ⏳ Add tests for structure exposure
4. ⏳ Test Factory integration

### Mobile App Tests
1. ⏳ Add tests for format checking (NoAD, etc.)
2. ⏳ Test format changes
3. ⏳ Test storage/loading with new format representation
4. ⏳ Integration tests

---

## Success Criteria

### UMO v3.0
- [ ] All new accessors working
- [ ] structure property exposes Factory JSON
- [ ] No string parsing in UMO code
- [ ] All tests passing (95+)
- [ ] TypeScript types complete
- [ ] Documentation updated

### Mobile App
- [ ] All 17 files updated to modern API
- [ ] Zero string-based format checking
- [ ] All features working
- [ ] Format changes working
- [ ] Storage/loading working
- [ ] Performance equivalent or better

---

## Timeline

- **Week 1**: UMO v3.0 API implementation
- **Week 2**: Mobile app high-priority files
- **Week 3**: Mobile app remaining files
- **Week 4**: Legacy removal, documentation, release

**Estimated**: 4 weeks for complete Factory-first refactor

---

## Next Steps

1. ⏳ Review and approve this plan
2. ⏳ Start UMO v3.0 API implementation
3. ⏳ Create mobile app migration checklist
4. ⏳ Begin refactoring

---

## Related Documents

- `API_MODERNIZATION_PLAN.md` - Initial analysis
- `REFACTOR_SUMMARY.md` - v2.x refactor summary
- `FACTORY_VALIDATION.md` - Validation integration
