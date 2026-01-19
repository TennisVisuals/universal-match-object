# Type Generation Issue

## Problem

The UMO source code (`src/types.ts`) correctly defines the modern TODS API:

```typescript
export interface UMO {
  Match: (options?: { 
    index?: number; 
    type?: string; 
    matchFormat?: string;  // ✅ Added
    id?: string; 
    matchUpId?: string;    // ✅ Added
    common?: any 
  }) => MatchObject;
  matchUp: (options?: { // ✅ Added
    index?: number; 
    matchFormat?: string; 
    matchUpId?: string; 
    participants?: any[]; 
    isDoubles?: boolean; 
    common?: any 
  }) => MatchObject;
  // ... rest of interface
}
```

However, the generated type declarations (`dist/matchObject.d.ts`) don't include these updates:

```typescript
// Generated (incomplete):
interface UMO {
  Match(options?: { index?: number; type?: string; common?: any }): MatchObject;
  // ❌ Missing matchFormat, matchUpId parameters
  // ❌ Missing matchUp method entirely
}
```

## Root Cause

**tsup/esbuild's automatic type generation** doesn't properly handle:
1. Type annotations on dynamically constructed objects
2. Runtime type assignments (e.g., `umo.matchUp = umo.Match`)
3. Interface definitions that don't directly match the implementation

The issue is in `src/matchObject.ts`:

```typescript
// This creates a function, then casts it to UMO
let umo = function() {} as any as UMO;

// These are added at runtime
umo.Match = (...) => { /* ... */ };
umo.matchUp = umo.Match; // ✅ Runtime works
```

TypeScript's **declaration emit** (`tsc --declaration`) only generates types for statically analyzable code. Dynamic assignments aren't picked up.

## Runtime Behavior

**The runtime code works perfectly** - both at the implementation level and via the type cast:

```typescript
// ✅ Works at runtime
const matchUp = umo.Match({ matchFormat: 'SET3-S:6/TB7' });
const matchUp2 = umo.matchUp({ matchFormat: 'SET3-S:6/TB7' });

// ✅ matchFormat parameter is accepted and processed correctly
// See lines 506-516 in matchObject.ts
```

The issue is **purely in the generated .d.ts files**, not in the actual code behavior.

## Workaround (Current)

Using backward-compatible parameters in TypeScript code:

```typescript
// TypeScript-safe (uses legacy parameter name)
const matchUp = umo.Match({ type: 'SET3-S:6/TB7' });

// Runtime also accepts (but TypeScript complains):
const matchUp = umo.Match({ matchFormat: 'SET3-S:6/TB7' }); // ❌ TS error, ✅ runtime works
```

## Solutions

### Option 1: Manual Type Declarations (Quick Fix)

Create `src/matchObject.d.ts` alongside `matchObject.ts`:

```typescript
// src/matchObject.d.ts
import type { UMO as UMOInterface } from './types';

declare const umo: UMOInterface;
export default umo;
export const { Match, matchUp, Set, Game, gameFormat, setFormat, matchFormat } = umo;
```

Then exclude auto-generated types from that file in `tsup.config.ts`:

```typescript
export default defineConfig({
  // ...
  dts: {
    resolve: true,
    entry: {
      index: 'src/index.ts',
      matchObject: 'src/matchObject.d.ts', // Use manual declaration
    }
  }
});
```

### Option 2: Use tsc for Declaration Files (Better)

Replace tsup's type generation with TypeScript compiler:

```json
// tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

Update `package.json`:

```json
{
  "scripts": {
    "build": "tsup && tsc -p tsconfig.build.json"
  }
}
```

### Option 3: Restructure UMO Object (Most Complete)

Make the UMO object statically analyzable:

```typescript
// src/matchObject.ts
import type { UMO } from './types';

const matchFn = (options?: any) => { /* current Match implementation */ };

const umo: UMO = {
  addPoint_events: [],
  undo_events: [],
  reset_events: [],
  pointParser: defaultPointParser,
  Match: matchFn,
  matchUp: matchFn, // ✅ Statically assigned
  Set: (...) => { /* ... */ },
  Game: (...) => { /* ... */ },
  // ... rest of methods
};

export default umo;
```

This makes the entire structure statically analyzable, and tsup/tsc will generate correct types.

## Recommendation

**Option 3** (restructure) is the best long-term solution because:
- ✅ Type generation works automatically
- ✅ No manual maintenance of .d.ts files
- ✅ Better code clarity
- ✅ Easier to extend

However, it requires refactoring the UMO initialization pattern, which should be done carefully with full test coverage.

**For now**, using `type` parameter maintains full functionality while we decide on the proper fix.

## Status

- **Runtime**: ✅ Fully functional with new API
- **Types**: 🔄 Using backward-compatible parameters
- **Tests**: ✅ 140/140 passing
- **Mobile App**: ✅ Builds and runs successfully

## Impact

**Low** - The type issue doesn't affect functionality, only developer ergonomics. The runtime code fully supports the modern TODS API (`matchFormat`, `matchUpId`, `matchUp()`), and the backward-compatible API (`type`, `id`, `Match()`) works perfectly.

---

**Created**: 2026-01-18  
**Status**: Documented, workaround in place  
**Priority**: Medium (improves DX but doesn't block functionality)
