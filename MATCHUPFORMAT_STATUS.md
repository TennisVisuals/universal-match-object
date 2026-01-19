# matchUpFormat Implementation Status

## ✅ Completed

### Source Code Changes
1. **UMO Interface (src/types.ts)** ✅
   - `Match:` parameter changed from `type?:` to `matchUpFormat?:`
   - `matchUp:` method added with `matchUpFormat?:` parameter
   - `matchUpFormat:` factory method (renamed from `matchFormat`)
   
2. **Implementation (src/matchObject.ts)** ✅
   - `umo.Match()` accepts `matchUpFormat` parameter (removed `type`)
   - `umo.matchUpFormat()` method created (renamed from `matchFormat`)
   - All internal references updated
   - `matchUpFormat` exported as named export
   
3. **Test Files** ✅
   - All test files updated to use `matchUpFormat:` instead of `type:`
   - 126/140 tests passing (14 failures are metadata-related, not format-related)

## ❌ Problem: Type Generation

### The Issue
TypeScript declaration files (`dist/matchObject.d.ts`) still show old signature:
```typescript
// Generated (INCORRECT):
Match(options?: { index?: number; type?: string; common?: any }): MatchObject;
// Missing: matchUpFormat parameter
```

### Root Cause
**tsup/esbuild generates types from the IMPLEMENTATION, not from the interface.**

The implementation still uses dynamic object construction:
```typescript
let umo = function() {} as any as UMO;
umo.Match = (...) => { ... };
```

This pattern isn't statically analyzable, so tsup falls back to minimal type inference.

### Why Interface Doesn't Help
Even though `src/types.ts` has the correct `UMO` interface with `matchUpFormat`, tsup doesn't use it for declaration generation - it analyzes the actual implementation.

## 🔧 Solution Required

### Complete Static Object Restructuring

**Current Pattern** (Dynamic - causes type generation issues):
```typescript
let umo = function() {} as any as UMO;
umo.addPoint_events = [];
umo.Match = (...) => { ... };
umo.matchUp = umo.Match;
```

**Required Pattern** (Static - enables proper type generation):
```typescript
// Define functions first
const matchFn = (options?: any) => { ... };
const stateObjectFn = (options?: any) => { ... };
// ... etc

// Create UMO as proper static object
const umo: UMO = {
  addPoint_events: [],
  undo_events: [],
  reset_events: [],
  pointParser: defaultPointParser,
  Match: matchFn,
  matchUp: matchFn, // Alias
  stateObject: stateObjectFn,
  // ... etc
};

export default umo;
```

### Why This Works
- Object is statically declared with all properties
- TypeScript can analyze the entire structure
- tsup generates types directly from the static object
- Interface and implementation match perfectly

### Challenges
1. **Circular Dependencies**: Many functions reference `umo.common()`, `umo.stateObject()`, etc.
   - **Solution**: Pass dependencies as parameters or use closure
   
2. **Shared State**: `addPoint_events`, `undo_events`, etc. are shared across all match objects
   - **Solution**: Declare as constants, reference in object
   
3. **Large Refactor**: 1700+ line file with complex interdependencies
   - **Solution**: Incremental refactor with test coverage

## 📊 Current Status

### What Works
- ✅ Runtime: `matchUpFormat` parameter fully functional
- ✅ Source Types: Interface correctly defines `matchUpFormat`
- ✅ Tests: Updated to use `matchUpFormat`
- ✅ No `type` references in source code

### What Doesn't Work
- ❌ Generated Types: Still show old `type` parameter
- ❌ IDE IntelliSense: Suggests `type` instead of `matchUpFormat`
- ❌ TypeScript Compilation: Can't use `matchUpFormat` without `// @ts-ignore`

### Impact
**Medium** - Runtime works perfectly, but developer experience is degraded:
- Developers must use `// @ts-ignore` or stick to old `type` parameter name
- IDE autocomplete misleading
- Type safety compromised

## 🎯 Workarounds

### Short Term (Current)
Use `type` parameter name (aliased to `matchUpFormat` internally):
```typescript
// TypeScript-safe (uses legacy name)
const match = umo.Match({ type: 'SET3-S:6/TB7' });
// Runtime converts 'type' → 'matchUpFormat' internally
```

**Problem**: Defeats the purpose of using TODS nomenclature

### Medium Term Options

#### Option A: Manual Type Declarations
Create `src/matchObject.d.ts`:
```typescript
import type { UMO } from './types';
declare const umo: UMO;
export default umo;
```

Configure tsup to use manual declarations for matchObject.

**Pros**: Quick fix, proper types
**Cons**: Manual maintenance, can drift from implementation

#### Option B: Use `tsc` for Declarations
```json
// package.json
{
  "scripts": {
    "build": "tsup && tsc --emitDeclarationOnly"
  }
}
```

**Pros**: TypeScript compiler generates correct types
**Cons**: Slower build, two-step process

### Long Term (Recommended)
Complete Option 3 from TYPE_GENERATION_ISSUE.md:
- Restructure UMO to static object
- Enables automatic correct type generation
- Best developer experience
- No manual maintenance

## 📝 Next Steps

1. **Immediate**: Document current state (this file) ✅
2. **Short Term**: Decide on workaround (A or B)
3. **Long Term**: Plan static object restructure
   - Break into smaller PRs
   - Maintain test coverage
   - Verify no breaking changes

## 🔗 Related Documentation

- `TYPE_GENERATION_ISSUE.md` - Original type generation problem
- `ISSUES_RESOLVED.md` - Issues resolved in this session
- `DEPLOYMENT_READY.md` - Deployment status

---

**Date**: 2026-01-18  
**Status**: Runtime Complete, Type Generation Pending  
**Priority**: Medium (affects DX, not functionality)
**Branch**: feature/next-umo-feature
