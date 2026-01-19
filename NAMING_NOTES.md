# Naming Inconsistencies to Address in Option B

## Issue: match.format vs matchUp.matchUpFormat

**Current State:**
```typescript
const matchUp = umo.matchUp({ matchUpFormat: 'SET3-S:6/TB7' });

// Inconsistent naming:
matchUp.format.values.code          // ❌ Should be matchUp.matchUpFormat.code
matchUp.format.values.formatStructure // ❌ Should be matchUp.matchUpFormat.structure
```

**Expected TODS-Consistent Naming:**
```typescript
const matchUp = umo.matchUp({ matchUpFormat: 'SET3-S:6/TB7' });

// Consistent naming:
matchUp.matchUpFormat.code
matchUp.matchUpFormat.structure
matchUp.matchUpFormat.bestOf
matchUp.matchUpFormat.setsToWin
```

## Why This Matters

1. **TODS Consistency**: We use `matchUpFormat` everywhere else, but the property is just `format`
2. **Clarity**: `match.format` could mean many things; `matchUp.matchUpFormat` is explicit
3. **API Coherence**: Method name matches property name

## Current Usage Patterns

### In UMO
```typescript
// Factory method
umo.matchUpFormat({ formatCode, formatStructure })

// But on match object:
match.format  // ❌ Not matchUpFormat
```

### In Mobile App
```typescript
// We pass matchUpFormat
const matchUp = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });

// But access via format
const code = matchUp.format.values.code;  // ❌ Inconsistent
```

## Proposed Fix (Option B)

### During Option B Refactor:
1. Rename `match.format` → `match.matchUpFormat`
2. Update all internal references
3. Add deprecated alias for backward compatibility:
   ```typescript
   match.format = match.matchUpFormat;  // Deprecated
   ```
4. Document deprecation, plan removal in next major version

### Benefits:
- ✅ TODS-consistent naming throughout
- ✅ Clear, unambiguous API
- ✅ Matches method naming pattern
- ✅ Backward compatible during transition

### Similar Patterns to Consider:
- `set.format` → `set.setFormat` ?
- `game.format` → `game.gameFormat` ?

## Timeline

- **Now**: Document issue
- **Option B Phase 5**: Implement rename during static object assembly
- **Testing**: Verify all 140 tests still pass with aliases
- **Documentation**: Update API docs with migration guide
- **Next Major**: Remove deprecated aliases

---

**Created**: 2026-01-18  
**Priority**: Medium (improves API consistency)  
**Part of**: Option B Refactor Plan
