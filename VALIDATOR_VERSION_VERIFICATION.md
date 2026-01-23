# Validator Version Verification

## ✅ BOTH VALIDATORS USE UMO V4

### File Structure

```text
src/
├── matchObject.ts              ← V3 (legacy)
├── v4/                         ← V4 (current)
│   ├── validation/
│   │   ├── pbpValidator.ts    ← V4 ✅
│   │   ├── mcpValidator.ts    ← V4 ✅
│   │   └── mcpParser.ts       ← V4 ✅
│   ├── core/
│   │   └── createMatchUp.ts   ← V4 function
│   ├── scoring/
│   │   └── addPoint.ts        ← V4 function
│   ├── query/
│   │   ├── getScore.ts        ← V4 function
│   │   └── deduceMatchUpFormat.ts ← V4 function
│   └── types.ts               ← V4 types
```

### pbpValidator.ts - Uses V4

**Location:** `src/v4/validation/pbpValidator.ts`

**Imports:**

```typescript
import { createMatchUp } from "../core/createMatchUp";        // → src/v4/core/createMatchUp ✅
import { addPoint } from "../scoring/addPoint";                // → src/v4/scoring/addPoint ✅
import { getScore } from "../query/getScore";                  // → src/v4/query/getScore ✅
import { deduceMatchUpFormat } from "../query/deduceMatchUpFormat"; // → src/v4/query/deduceMatchUpFormat ✅
```

**No V3 imports!** ✅

### mcpValidator.ts - Uses V4

**Location:** `src/v4/validation/mcpValidator.ts`

**Imports:**

```typescript
import { createMatchUp } from "../core/createMatchUp";        // → src/v4/core/createMatchUp ✅
import { addPoint } from "../scoring/addPoint";                // → src/v4/scoring/addPoint ✅
import { getScore } from "../query/getScore";                  // → src/v4/query/getScore ✅
import { deduceMatchUpFormat } from "../query/deduceMatchUpFormat"; // → src/v4/query/deduceMatchUpFormat ✅
import type { MatchUp, AddPointOptions } from "../types";      // → src/v4/types ✅
```

**No V3 imports!** ✅

### mcpParser.ts - Uses V4

**Location:** `src/v4/validation/mcpParser.ts`

**Imports:**

```typescript
import type {
  PointResult,
  StrokeType,
  ServeLocation,
  RallyShot,
} from "../types";                                             // → src/v4/types ✅
```

**No V3 imports!** ✅

## Import Path Resolution

Since all validators are in `src/v4/validation/`, the `..` prefix resolves to `src/v4/`:

| Import Statement | Resolves To | Version |
| ---------------- | ----------- | ------- |
| `../core/createMatchUp` | `src/v4/core/createMatchUp` | V4 ✅ |
| `../scoring/addPoint` | `src/v4/scoring/addPoint` | V4 ✅ |
| `../query/getScore` | `src/v4/query/getScore` | V4 ✅ |
| `../query/deduceMatchUpFormat` | `src/v4/query/deduceMatchUpFormat` | V4 ✅ |
| `../types` | `src/v4/types` | V4 ✅ |

**V3 matchObject** is at `src/matchObject.ts` and would require:

- Import path: `../../matchObject` (from `src/v4/validation/`)
- **Neither validator uses this path!** ✅

## V4 API Usage Verification

### createMatchUp (V4)

Both validators call:

```typescript
let matchUp = createMatchUp({ matchUpFormat });
```

This is the **V4 functional API** that returns a pure TODS MatchUp object.

**V3 equivalent** would be:

```typescript
const match = new matchObject();  // ❌ Not used
match.options({ match: { format } });
```

### addPoint (V4)

Both validators call:

```typescript
matchUp = addPoint(matchUp, { winner: 0 | 1 });
```

This is the **V4 functional API** that:

- Takes an immutable MatchUp
- Returns a new MatchUp
- Pure functional (no mutation)

**V3 equivalent** would be:

```typescript
match.push({ winner: 0 | 1 });  // ❌ Not used
```

### getScore (V4)

Both validators call:

```typescript
const score = getScore(matchUp);
console.log(score.scoreString);
```

This is the **V4 query API** that returns TODS-compliant score structure.

**V3 equivalent** would be:

```typescript
const score = match.score();  // ❌ Not used
```

## Type Usage Verification

### V4 Types Used

```typescript
import type { MatchUp, AddPointOptions } from "../types";

// V4 TODS-compliant types
interface MatchUp {
  matchUpId: string;
  matchUpFormat: string;
  matchUpStatus: MatchUpStatus;
  sides: Side[];
  score: Score;
  history?: MatchUpHistory;
  // ... TODS structure
}
```

### V3 Types (Not Used)

```typescript
// V3 would use:
// const match: any;  // No strong typing
// Or custom V3 interfaces (not TODS-compliant)
```

## Tests Confirm V4 Usage

### pbpValidator Tests

```typescript
// test/v4/pbpValidator.test.ts
import { pbpValidator } from "../../src/v4/validation/pbpValidator";

it("should validate simple match", () => {
  const result = pbpValidator({
    points: "001100110011",
    expectedScore: "6-4"
  });

  expect(result.valid).toBe(true);
  // Result uses V4 MatchUp structure ✅
});
```

### mcpValidator Tests

```typescript
// test/v4/mcpValidator.test.ts
import { mcpValidator, validateMCPMatch } from "../../src/v4/validation/mcpValidator";

it("should validate MCP match", () => {
  const result = validateMCPMatch(mcpMatch);

  expect(result.matchUp.matchUpFormat).toBeDefined();  // V4 property ✅
  expect(result.matchUp.sides).toHaveLength(2);        // V4 structure ✅
});
```

## Exports Confirm V4 Location

**src/v4/index.ts:**

```typescript
// PBP Validator - Main API
export { pbpValidator } from "./validation/pbpValidator";

// MCP Validator - Match Charting Project parser
export {
  mcpValidator,
  validateMCPMatch,
  exportMatchUpJSON,
} from "./validation/mcpValidator";
```

Both validators are exported from the **V4 module**, not V3.

## Consumer Usage

When consumers import these validators:

```typescript
// ✅ Correct - V4 imports
import { pbpValidator } from "@tennisvisuals/universal-match-object/v4";
import { mcpValidator } from "@tennisvisuals/universal-match-object/v4";

// ❌ Wrong - would be V3
import matchObject from "@tennisvisuals/universal-match-object";
```

## Conclusion

### Verification Complete

✅ **Both pbpValidator and mcpValidator use UMO V4 exclusively**

**Evidence:**

1. ✅ File location: `src/v4/validation/`
2. ✅ Import paths: All resolve to `src/v4/*`
3. ✅ API usage: V4 functional API (`createMatchUp`, `addPoint`, `getScore`)
4. ✅ Types: TODS-compliant V4 types
5. ✅ No V3 imports: Zero references to `../../matchObject`
6. ✅ Tests: Located in `test/v4/` and test V4 structures
7. ✅ Exports: Exported from `src/v4/index.ts`

**No action needed.** Both validators are correctly implemented using UMO V4.
