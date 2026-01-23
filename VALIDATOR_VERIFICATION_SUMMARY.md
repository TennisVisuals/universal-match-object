# Validator Version Verification - Executive Summary

## Question

Are pbpValidator and mcpValidator using UMO V4 or V3?

## Answer

✅ **CONFIRMED: Both validators use UMO V4 exclusively**

## Quick Verification

### 1. File Locations

```text
src/matchObject.ts              ← V3 (not used by validators)
src/v4/validation/
  ├── pbpValidator.ts          ← V4 ✅
  ├── mcpValidator.ts          ← V4 ✅
  └── mcpParser.ts             ← V4 ✅
```

### 2. Import Analysis

**No V3 imports found:**

```bash
grep -r "matchObject" src/v4/validation/
# ✅ No results - confirms no V3 usage
```

**All validators import from V4:**

```typescript
// pbpValidator.ts, mcpValidator.ts
import { createMatchUp } from "../core/createMatchUp";        // V4 ✅
import { addPoint } from "../scoring/addPoint";                // V4 ✅
import { getScore } from "../query/getScore";                  // V4 ✅
import { deduceMatchUpFormat } from "../query/deduceMatchUpFormat"; // V4 ✅
```

These resolve to:

- `../` from `src/v4/validation/` → `src/v4/`
- Therefore: `src/v4/core/createMatchUp` etc. ✅

### 3. API Pattern Comparison

| Operation | V3 Pattern (NOT used) | V4 Pattern (USED) |
| --------- | --------------------- | ----------------- |
| Create | `new matchObject()` | `createMatchUp({ format })` ✅ |
| Add Point | `match.push({ winner })` | `addPoint(matchUp, { winner })` ✅ |
| Get Score | `match.score()` | `getScore(matchUp)` ✅ |
| Mutability | Mutable object | Immutable (pure functions) ✅ |

### 4. Type Signatures

**V4 TODS Types (used):**

```typescript
import type { MatchUp, AddPointOptions } from "../types";  // V4 ✅

interface MatchUp {
  matchUpId: string;
  matchUpFormat: string;
  matchUpStatus: MatchUpStatus;
  sides: Side[];
  score: Score;
  history?: MatchUpHistory;
}
```

**V3 (not used):**

```typescript
// Would be: any or loosely-typed object
// Not TODS-compliant
```

## Evidence Summary

1. ✅ **File location**: Both in `src/v4/validation/`
2. ✅ **Import paths**: All resolve to `src/v4/*` modules
3. ✅ **No V3 imports**: Zero references to `matchObject.ts`
4. ✅ **V4 API**: Uses `createMatchUp`, `addPoint`, `getScore` (functional)
5. ✅ **V4 Types**: TODS-compliant types from `src/v4/types.ts`
6. ✅ **Test location**: Tests in `test/v4/` directory
7. ✅ **Export location**: Exported from `src/v4/index.ts`

## Detailed Documentation

For complete verification details, see:

- `VALIDATOR_VERSION_VERIFICATION.md` - Full analysis with code examples

## Conclusion

**No action needed.** Both pbpValidator and mcpValidator are correctly implemented using UMO V4 exclusively. There is no V3 usage in either validator.
