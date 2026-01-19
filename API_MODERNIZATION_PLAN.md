# API Modernization Plan

**Branch**: `api-modernization`  
**Goal**: Simplify API by exposing parsed format JSON directly instead of wrapper methods

---

## Current Analysis

### Mobile App Usage (tennisvisuals-mobile)

**HEAVILY USED** (11 occurrences):
- `env.match.format.settings()` - Returns full format settings object
  - Used to get format code, name, description
  - Primary way app accesses format information

**LIGHTLY USED** (1 occurrence):
- `env.match.format.threshold()` - Returns threshold for match level
  - Used once in `displayUpdate.ts` line 37
  - Could be replaced with `settings().threshold`

**USED** (4 occurrences):
- `env.match.format.type(code)` - Changes format
- `env.match.format.doubles()` - Checks if doubles

**NOT USED**:
- `minDiff()` - Not found in mobile app
- `hasDecider()` - Not found in mobile app
- Child object getters (`set.format.threshold()`, `game.format.threshold()`) - Only used internally

---

## Current API Structure

### Format Object Methods

```typescript
// Match level
match.format.settings()   // Returns { code, name, description, threshold, min_diff, etc. }
match.format.threshold()  // Returns sets to win
match.format.minDiff()    // Returns min difference
match.format.hasDecider() // Returns boolean
match.format.type(code)   // Changes format
match.format.doubles()    // Returns boolean

// Set level (internal use only)
set.format.threshold()    // Returns games to win
set.format.minDiff()      // Returns min difference
set.format.hasDecider()   // Returns boolean

// Game level (internal use only)
game.format.threshold()   // Returns points to win
game.format.minDiff()     // Returns min difference
```

### What settings() Returns

```typescript
{
  code: 'SET3-S:6/TB7',
  name: 'SET3-S:6/TB7',
  description: 'Factory format: SET3-S:6/TB7',
  players: 2,
  threshold: 2,           // Sets to win
  has_decider: true,
  min_diff: 0,
  tiebreak: false
}
```

---

## Issues with Current Design

1. **Redundancy**: `settings()` returns `threshold`, but `threshold()` method also exists
2. **Inconsistency**: Why have getters when settings() returns everything?
3. **Child Complexity**: Set/Game format objects have methods that are only used internally
4. **String Parsing**: Some logic still checks strings (e.g., `indexOf('n_')` in viewManager.ts)
5. **Maintenance**: More code to maintain for duplicate functionality

---

## Proposed Simplification

### Option A: Expose Format Structure Directly

```typescript
// Direct access to parsed Factory JSON
match.format.structure  // { bestOf: 3, setFormat: {...}, finalSetFormat: {...} }

// Mobile app would use:
const bestOf = match.format.structure.bestOf;
const setsToWin = Math.ceil(bestOf / 2);
const setFormat = match.format.structure.setFormat;
```

**Pros**:
- Direct access to all format properties
- No wrapper methods to maintain
- Clear that it's the parsed Factory structure
- More flexible for future use cases

**Cons**:
- Breaking change
- Less abstraction (exposes Factory structure)
- Mobile app needs to calculate setsToWin

---

### Option B: Keep settings() Only, Remove Individual Getters

```typescript
// Keep settings() as the only accessor
match.format.settings()  // Returns comprehensive object

// Remove:
match.format.threshold()
match.format.minDiff()
match.format.hasDecider()

// Mobile app changes:
// Before: env.match.format.threshold()
// After:  env.match.format.settings().threshold
```

**Pros**:
- Minimal breaking change (only 1 line in mobile app)
- settings() already returns everything
- Cleaner API (one way to get info)

**Cons**:
- Still maintaining wrapper logic in settings()
- Doesn't fully simplify architecture

---

### Option C: Hybrid - Keep settings(), Add structure Property

```typescript
// Keep backward compatibility
match.format.settings()     // Returns settings object (existing)
match.format.structure      // NEW: Direct access to Factory JSON

// Keep essential methods
match.format.type(code)     // Change format
match.format.doubles()      // Check if doubles

// Remove redundant getters
// match.format.threshold()   ❌ Remove (use settings().threshold)
// match.format.minDiff()     ❌ Remove (not used)
// match.format.hasDecider()  ❌ Remove (not used)
```

**Pros**:
- Backward compatible (settings() unchanged)
- Adds flexibility (direct structure access)
- Removes unused methods
- Clean migration path

**Cons**:
- Still two ways to access format info
- Doesn't fully simplify

---

## Recommendation: Option C (Hybrid)

**Rationale**:
1. **Zero Breaking Changes**: settings() continues to work
2. **Progressive Enhancement**: Add `.structure` for direct access
3. **Remove Unused**: Drop minDiff(), hasDecider() (not used by mobile app)
4. **Minimal Mobile App Change**: Only 1 line (threshold() → settings().threshold)
5. **Future-Proof**: Direct structure access for advanced use cases

---

## Implementation Steps

### Phase 1: Add structure Property
1. Add `format.structure` getter that returns `formatStructure`
2. Update documentation
3. Test in mobile app

### Phase 2: Deprecate Redundant Methods
1. Add deprecation warnings to:
   - `threshold()` → "Use settings().threshold instead"
   - `minDiff()` → "Use settings().min_diff instead"
   - `hasDecider()` → "Use settings().has_decider instead"
2. Update mobile app to use settings()

### Phase 3: Remove Deprecated Methods (v3.0.0)
1. Remove threshold(), minDiff(), hasDecider()
2. Keep settings(), type(), doubles()
3. Document breaking changes

---

## Mobile App Migration

### Current Code (1 change needed):
```typescript
// displayUpdate.ts line 37
const threshold = env.match.format.threshold();
```

### Updated Code:
```typescript
// Option 1: Use settings()
const threshold = env.match.format.settings().threshold;

// Option 2: Use structure (advanced)
const setsToWin = Math.ceil(env.match.format.structure.bestOf / 2);
```

---

## Questions for Discussion

1. **Breaking Changes**: Should we maintain 100% backward compatibility?
2. **Child Objects**: Should set/game formats expose structure too?
3. **Internal Usage**: threshold() is used ~13 times internally - refactor?
4. **settings() vs structure**: Which should be the "preferred" API?
5. **Timeline**: Deprecation period before v3.0.0 removal?

---

## Next Steps

1. ✅ Create this plan
2. ⏳ Get approval on approach (Option C recommended)
3. ⏳ Implement Phase 1 (add structure property)
4. ⏳ Update mobile app
5. ⏳ Add deprecation warnings
6. ⏳ Plan v3.0.0 breaking changes

---

## Related Files

- `src/matchObject.ts` - Main UMO implementation
- Mobile app usage:
  - `src/transition/displayUpdate.ts` - Uses threshold()
  - `src/transition/changeFormat.ts` - Uses settings() heavily
  - `src/services/matchObject/storageAdapter.ts` - Uses settings(), doubles()
  - `src/transition/viewManager.ts` - String checks (should use structure)
