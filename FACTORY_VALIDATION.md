# Factory Validation Integration

## Overview

UMO now integrates battle-tested score validation from `tods-competition-factory` to catch invalid scores and prevent bugs.

## Accessing Factory Validators Directly

Validators are available via Factory's `scoreGovernor` (as used by TMX):

```typescript
import { scoreGovernor } from 'tods-competition-factory';
const { validateMatchUpScore, validateSetScore } = scoreGovernor;
```

For convenience, UMO also provides these validators with proper imports configured.

## Usage

### Validate a Complete Match

```typescript
import matchObject, { validateUMOScore } from '@tennisvisuals/universal-match-object';

const match = matchObject.Match({type: 'SET3-S:6/TB7-F:TB10'});

// ... play match ...

const validation = validateUMOScore(match);
if (!validation.isValid) {
  console.error('Invalid score:', validation.error);
}
```

### Validate Individual Sets

```typescript
import { validateUMOSetScore } from '@tennisvisuals/universal-match-object';

const set = match.sets()[0];
const validation = validateUMOSetScore(
  set, 
  'SET3-S:6/TB7',
  false,  // isDecidingSet
  false   // allowIncomplete
);
```

### Direct Factory Validator Access

```typescript
import { validateMatchUpScore } from '@tennisvisuals/universal-match-object';

const sets = [
  { side1Score: 6, side2Score: 4, winningSide: 1 },
  { side1Score: 3, side2Score: 6, winningSide: 2 },
  { 
    side1Score: 0, 
    side2Score: 0, 
    side1TiebreakScore: 10, 
    side2TiebreakScore: 12, 
    winningSide: 2 
  }
];

const result = validateMatchUpScore(sets, 'SET3-S:6/TB7-F:TB10');
```

## What Gets Validated

### Set-Level Validation

- **Threshold**: Winner reached required game count (e.g., 6 for standard sets)
- **Margin**: Minimum game difference met (2 games for standard, 1 for tiebreak sets)
- **Tiebreaks**: Proper tiebreak scores when applicable
- **Tiebreak-only sets**: Supertiebreaks validate with 2-point margin at threshold 10

### Match-Level Validation

- **Set count**: Doesn't exceed bestOf value
- **Completion**: Winning side has won majority of sets
- **Format compatibility**: All sets follow the matchUpFormat rules

### Special Cases

- **Irregular endings**: Allows incomplete scores for RETIRED, WALKOVER, DEFAULTED
- **In-progress matches**: Validates partial scores when matchUpStatus is undefined
- **Deciding sets**: Applies finalSetFormat rules to last set

## Benefits

1. **Bug Prevention**: Catches invalid scores before they corrupt data
2. **Battle-Tested**: Uses Factory's validators that power https://courthive.com
3. **Format Awareness**: Understands all Factory format codes (NoAD, Fast4, supertiebreaks, etc.)
4. **User Feedback**: Provides clear error messages for debugging

## Source

The validators are copied from `tods-competition-factory` (CourtHive/factory repository) with proper attribution. See:
- `src/validators/validateMatchUpScore.ts`
- `src/scoreValidator.ts`

## Testing

See `test/validation/factory-validator.test.ts` for comprehensive examples.
