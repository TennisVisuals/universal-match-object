# Point Decorations Analysis

**Source:** Real match data from hive-eye-tracker  
**Total Points:** 28  
**Date:** January 20, 2026

---

## Field Usage Summary

| Field | Count | Percentage | Notes |
|-------|-------|------------|-------|
| `timestamp` | 28 | 100% | Always present (added by logger) |
| `winner` | 23 | 82.1% | **Missing on some points!** |
| `result` | 21 | 75.0% | How point ended |
| `rally` | 17 | 60.7% | Rally length (number) |
| `code` | 5 | 17.9% | UMO point code (A, D, etc.) |
| `first_serve` | 5 | 17.9% | Serve information object |
| `location` | 1 | 3.6% | Shot location (rare) |

---

## Key Findings

### 1. ⚠️ Winner Not Always Present
- 5 out of 28 points (17.9%) have NO `winner` field
- These appear to be code-only points: `{ code: "A" }` or `{ code: "D" }`
- **Implication:** Must derive winner from code when not explicit

### 2. Three Point Input Patterns

#### Pattern A: Code Only (Aces/Double Faults)
```json
{ "code": "A" }
```
- Used for aces (code: "A") and double faults (code: "D")
- No explicit winner or result
- Must be parsed from code

#### Pattern B: Winner + Result + Rally
```json
{
  "winner": 0,
  "result": "Winner",
  "rally": 7
}
```
- Most common pattern (rally points)
- Clear outcome with rally length

#### Pattern C: Winner Only
```json
{ "winner": 1 }
```
- Minimal decoration
- No result or rally information

### 3. First Serve Information
```json
{
  "first_serve": {
    "error": "Error",
    "serves": ["0e"]
  },
  "code": "D"
}
```
- Appears on 2nd serve points (after 1st serve fault)
- Contains error info and serve codes
- Present on 17.9% of points

### 4. Rally as Number
- `rally` is a NUMBER (length), not an array of shots
- Example: `"rally": 7` means 7-shot rally
- Present on 60.7% of points (rally exchanges)

### 5. Location Rarely Used
- Only 1 point out of 28 has location data
- Example: `"location": "Net"`
- Not a primary field in current usage

---

## Point Result Types

From the data:
- `"Winner"` - 8 occurrences
- `"Unforced Error"` - 8 occurrences  
- `"Forced Error"` - 5 occurrences

**Missing from sample:**
- Aces (represented as code "A" without result field)
- Double Faults (represented as code "D" without result field)
- Serve Winners
- Other stroke-specific results

---

## Code Values

Found in data:
- `"A"` - Ace
- `"D"` - Double fault

**Expected but not in sample:**
- `"S"` - Server winner
- `"R"` - Receiver winner
- Others from v3 point parser

---

## Schema Observations

### What's Present
✅ Basic point outcomes (winner, result)
✅ Rally length tracking
✅ UMO point codes
✅ First serve fault information
⚠️ Location (minimal usage)

### What's Missing
❌ Stroke type (forehand, backhand, volley)
❌ Hand used (forehand/backhand hand)
❌ Breakpoint flags
❌ Serve number (1st or 2nd) as explicit field
❌ Rally as shot sequence
❌ Server information (must derive from match state)

---

## Implications for Statistics Engine

### 1. Must Handle Code-Only Points
```typescript
// Some points come as just { code: "A" }
// Must parse to extract:
// - winner (from code + server context)
// - result ("Ace" or "Double Fault")
```

### 2. Winner Derivation Logic
```typescript
if (!point.winner && point.code) {
  // Derive winner from code
  // "A" = server wins
  // "D" = receiver wins
  point.winner = deriveWinnerFromCode(point.code, serverIndex);
}
```

### 3. Result Inference
```typescript
if (!point.result && point.code) {
  // Map codes to results
  // "A" → "Ace"
  // "D" → "Double Fault"
  point.result = codeToResult(point.code);
}
```

### 4. Serve Number Inference
```typescript
// Presence of first_serve object indicates 2nd serve
if (point.first_serve) {
  point.serve = 2;
} else {
  point.serve = 1;
}
```

### 5. Limited Stroke Statistics
- Current data has NO stroke or hand information
- Cannot compute forehand/backhand breakdown
- May need UI changes to capture this data

---

## Recommended Type Updates

### Current PointWithMetadata interface needs adjustment:

```typescript
export interface PointWithMetadata {
  // Core - but now optional!
  winner?: 0 | 1;  // ⚠️ NOT always present
  server?: 0 | 1;  // Must derive from match state
  
  // Hive-eye provides
  result?: string;  // "Winner", "Unforced Error", "Forced Error"
  rally?: number;   // Rally LENGTH (not array)
  code?: string;    // "A", "D", "S", "R", etc.
  location?: string; // Rarely used
  first_serve?: {   // Present on 2nd serve
    error: string;
    serves: string[];
  };
  
  // Must derive/enrich
  index?: number;   // Add during processing
  set?: number;     // Add during processing
  game?: number;    // Add during processing
  serve?: 1 | 2;    // Derive from first_serve presence
  
  // NOT in current data (may need UI changes)
  stroke?: string;
  hand?: string;
  breakpoint?: boolean;
}
```

---

## Statistics Capabilities

### ✅ Can Implement
- Total points won
- Aces (from code "A")
- Double faults (from code "D")
- Winners (from result "Winner")
- Unforced errors (from result "Unforced Error")
- Forced errors (from result "Forced Error")
- Max points/games in a row
- Points per rally length
- 1st vs 2nd serve (from first_serve presence)

### ❌ Cannot Implement (Missing Data)
- Stroke breakdown (forehand/backhand)
- Hand usage (left/right)
- First serve percentage (no explicit serve in/out)
- Points won on 1st serve vs 2nd serve (need explicit serve tracking)
- Breakpoint statistics (no breakpoint flag)
- Serve location statistics (rarely captured)

### ⚠️ Needs Derivation
- Server (derive from match state)
- Serve number (derive from first_serve presence)
- Point index/set/game (add during processing)

---

## Next Steps

1. ✅ **Update Types** - Make winner optional, adjust based on real schema
2. ✅ **Add Code Parser** - Convert codes to winner/result
3. ✅ **Implement Counter Builder** - Handle all three input patterns
4. ⏳ **Consider UI Enhancement** - Add stroke/hand capture for full stats

---

## Test Data Quality

**Coverage:** Basic but functional
- ✅ Multiple result types
- ✅ Rally lengths
- ✅ Aces and double faults
- ⚠️ Limited stroke diversity
- ⚠️ No breakpoint scenarios
- ⚠️ Small sample size (28 points)

**Recommendation:** 
- Use this data for initial implementation
- Capture larger match (100+ points) for comprehensive testing
- Add stroke/hand decorations in UI for full statistics
