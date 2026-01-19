# Mobile App Format Usage Audit

**Goal**: Identify all format-related code in tennisvisuals-mobile that needs Factory-first refactoring

---

## Files Using Format API (27 files)

### 🔴 CRITICAL - Must Fix First

**1. transition/viewManager.ts** (Line 108)
```typescript
// CURRENT - BAD: String parsing
const noAd = env.match.format.settings().code.indexOf('n_') >= 0;

// TARGET - GOOD: Factory structure
const noAd = env.match.format.structure.setFormat.NoAD || false;
```
**Why Critical**: Anti-pattern, demonstrates old thinking

---

**2. transition/changeFormat.ts** (Heavy usage)
```typescript
// CURRENT - Multiple settings() calls
const code = env.match.format.settings().code;
const name = env.match.format.settings().name;
env.match.format.type(selectedFormat);

// TARGET - Modern accessors
const code = env.match.format.code;
const description = env.match.format.description;
env.match.format.changeFormat(selectedFormat);
```
**Why Critical**: Core format change functionality

---

**3. services/matchObject/storageAdapter.ts** (Lines 74, 240, 250)
```typescript
// CURRENT
matchUpFormat: env.match.format.settings().code,
const isDoubles = env.match.format.doubles();

// TARGET
matchUpFormat: env.match.format.code,
const isDoubles = env.match.format.isDoubles;
```
**Why Critical**: Data persistence

---

### 🟡 MODERATE - Update After Critical

**4. transition/displayUpdate.ts** (Line 37)
```typescript
// CURRENT
const threshold = env.match.format.threshold();
const max_games = threshold == 1 ? 0 : threshold > 2 ? 4 : 2;

// TARGET
const setsToWin = env.match.format.setsToWin;
const max_games = setsToWin == 1 ? 0 : setsToWin > 2 ? 4 : 2;
```

---

**5. transition/displayFormats.ts** (Line 7)
```typescript
// CURRENT
const current = env.match.format.settings().code;

// TARGET
const current = env.match.format.code;
```

---

**6. transition/loadMatch.ts** (Line 37)
```typescript
// CURRENT
env.match.format.settings(match_data.format);

// TARGET
env.match.format.changeFormat(match_data.format.code);
```

---

**7. transition/coms.ts** (Line 77)
```typescript
// CURRENT
format: env.match.format.settings(),

// TARGET - Send structure instead
format: {
  code: env.match.format.code,
  structure: env.match.format.structure
}
```

---

**8. services/matchObject/factoryMatchUpLoader.ts** (Line 47)
```typescript
// CURRENT
const result = env.match.format.settings({ code: formatCode });

// TARGET
env.match.format.changeFormat(formatCode);
```

---

### 🟢 LOW - Simple Updates

**Remaining 19 files** - Likely simple accessor changes:
- transition/clickActions.ts
- transition/env.ts
- transition/updateMatchDetails.ts
- transition/events.ts
- transition/strokeAction.ts
- transition/configureViz.ts
- transition/classAction.ts
- transition/groupGames.ts
- transition/updateStats.ts
- transition/editPoint.ts
- transition/broadcastScore.ts
- transition/displayMatchArchive.ts
- transition/ptsChart.ts
- transition/editPlayer.ts
- transition/updatePlayer.ts
- transition/displayPointHistory.ts
- transition/formatChangePossible.ts
- transition/checkMatchEnd.ts
- transition/updateTournamentDetails.ts
- transition/modalShare.ts

---

## Legacy Format Migration System

**Already exists in mobile app!** 📁

### Files:
- `services/matchObject/formatMigration.ts` (250 lines)
- `services/matchObject/formatMigration.test.ts` (220 lines)

### Current Approach:
```typescript
// Mobile app has its own migration
export const LEGACY_TO_FACTORY = {
  '3_6a_7': 'SET3-S:6/TB7',
  '3_6n_7': 'SET3-S:6NOAD/TB7',
  // ... etc
};

export function migrateFormat(legacyCode: string): string {
  if (legacyCode in LEGACY_TO_FACTORY) {
    return LEGACY_TO_FACTORY[legacyCode];
  }
  return legacyCode;
}
```

### Action:
✅ **KEEP** - This is mobile app's data migration layer  
⚠️ **BUT** - Should use UMO's converter as source of truth  
✅ **AND** - All new code should use Factory codes only

---

## Refactoring Strategy

### Step 1: Update UMO v3.0 API ✅
```typescript
// New UMO API (in api-modernization branch)
match.format.structure      // Factory JSON
match.format.code           // Format code
match.format.setsToWin      // Computed
match.format.bestOf         // From structure
match.format.isDoubles      // Boolean
match.format.changeFormat() // Replace type()
```

### Step 2: Mobile App - Critical Files (Week 1)
1. **viewManager.ts** - Remove string checking
2. **changeFormat.ts** - Use modern accessors
3. **storageAdapter.ts** - Update persistence

### Step 3: Mobile App - Moderate Files (Week 2)
4. **displayUpdate.ts** - Use setsToWin
5. **displayFormats.ts** - Use code accessor
6. **loadMatch.ts** - Use changeFormat
7. **coms.ts** - Send structure
8. **factoryMatchUpLoader.ts** - Use changeFormat

### Step 4: Mobile App - Remaining Files (Week 3)
- Update 19 remaining files
- Test all features
- Performance check

---

## Anti-Patterns to Eliminate

### ❌ Pattern 1: String Checking
```typescript
// BAD
code.indexOf('n_') >= 0
code.indexOf('NOAD') >= 0

// GOOD
structure.setFormat.NoAD
```

### ❌ Pattern 2: Multiple settings() Calls
```typescript
// BAD
const code = format.settings().code;
const name = format.settings().name;
const threshold = format.settings().threshold;

// GOOD
const { code, setsToWin, bestOf } = format;
// OR access structure directly
const { setFormat } = format.structure;
```

### ❌ Pattern 3: type() for Changes
```typescript
// BAD
format.type(newCode);

// GOOD
format.changeFormat(newCode);
```

### ❌ Pattern 4: Method Calls for Properties
```typescript
// BAD
const isDoubles = format.doubles();
const threshold = format.threshold();

// GOOD
const isDoubles = format.isDoubles;
const setsToWin = format.setsToWin;
```

---

## Testing Checklist

### UMO Tests
- [ ] structure property returns Factory JSON
- [ ] code accessor returns format code
- [ ] setsToWin computed correctly
- [ ] isDoubles property works
- [ ] changeFormat() updates format
- [ ] All 95 existing tests pass

### Mobile App Tests
- [ ] Format change works
- [ ] NoAD detection via structure
- [ ] Match loading/saving
- [ ] Score display
- [ ] Format display
- [ ] Storage adapter
- [ ] All features functional

---

## Migration Timeline

### Week 1: UMO v3.0
- Days 1-2: Implement new accessors
- Days 3-4: Update internal UMO code
- Day 5: Testing and documentation

### Week 2: Mobile Critical Files
- Days 1-2: viewManager.ts, changeFormat.ts
- Days 3-4: storageAdapter.ts, displayUpdate.ts
- Day 5: Testing critical path

### Week 3: Mobile Remaining Files
- Days 1-3: Update 23 remaining files
- Days 4-5: Full testing and QA

### Week 4: Polish and Release
- Days 1-2: Remove legacy UMO APIs
- Days 3-4: Documentation
- Day 5: Release UMO v3.0

---

## Success Metrics

- [ ] Zero string-based format checks in mobile app
- [ ] Zero legacy format codes in new matches
- [ ] All format access via Factory structure
- [ ] Performance maintained or improved
- [ ] All tests passing
- [ ] Clean, maintainable codebase
