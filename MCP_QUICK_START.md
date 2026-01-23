# MCP Validator Quick Start

Convert Match Charting Project CSV data to rich MatchUp JSON files for hive-eye-tracker visualization.

## Installation

```bash
cd universal-match-object
npm install
npm test -- mcpParser  # Verify 29 tests pass
npm test -- mcpValidator  # Verify 17 tests pass
```

## Usage

### Option 1: CLI Tool (Easiest)

```bash
# Convert MCP CSV to JSON files
node examples/mcp-to-json.js path/to/matches.csv ./output

# Example with test data
node examples/mcp-to-json.js test/v4/fixtures/mcp-data/testing.csv ./mcp-json
```

Output:

```text
═══════════════════════════════════════════════
   MCP to JSON Converter
═══════════════════════════════════════════════

Input CSV:   test/v4/fixtures/mcp-data/testing.csv
Output dir:  ./mcp-json

🔄 Processing MCP data...

✓ Processed 1 match(es)
✓ Processed 177 points

Statistics:
  Aces:             8
  Double Faults:    8
  Winners:          41
  Unforced Errors:  72
  Forced Errors:    24

📝 Generating JSON files...

✓ 1. Diego Sebastian Schwartzman vs Horacio Zeballos
   Score: 7-6(0), 4-6, 6-1
   Points: 177 (153 decorated)
   File: 20151120-M-Montevideo_CH-QF-Diego_Sebastian_Schwartzman-Horacio_Zeballos.json

═══════════════════════════════════════════════
✅ Conversion complete!
```

### Option 2: Programmatic Use

```typescript
import { readFileSync, writeFileSync } from 'fs';
import { mcpValidator, exportMatchUpJSON } from '@tennisvisuals/universal-match-object';

// Read MCP CSV
const csvData = readFileSync('matches.csv', 'utf-8');

// Validate and parse
const result = mcpValidator({ csvData });

if (result.valid) {
  // Export each match to JSON
  result.matchUps.forEach((matchUp, i) => {
    const json = exportMatchUpJSON(matchUp);
    const filename = `match-${i + 1}.json`;
    writeFileSync(filename, json);
  });
  
  console.log(`✓ Converted ${result.matchesProcessed} matches`);
  console.log(`✓ Total aces: ${result.totalAces}`);
  console.log(`✓ Total winners: ${result.totalWinners}`);
} else {
  console.error('Validation failed:', result.errors);
}
```

### Option 3: Single Match

```typescript
import { validateMCPMatch, exportMatchUpJSON, parseCSV, groupByMatch } from '@tennisvisuals/universal-match-object';

const csvData = readFileSync('match.csv', 'utf-8');
const points = parseCSV(csvData);
const matches = groupByMatch(points);

// Validate first match
const result = validateMCPMatch(matches[0], { debug: true });

if (result.valid) {
  const json = exportMatchUpJSON(result.matchUp);
  writeFileSync('match.json', json);
  
  console.log(`✓ ${result.pointsProcessed} points processed`);
  console.log(`✓ Aces: ${result.aces}`);
  console.log(`✓ Winners: ${result.winners}`);
}
```

## What You Get

Each JSON file contains a complete MatchUp with:

### Player Information

```json
{
  "sides": [
    {
      "sideNumber": 1,
      "participant": {
        "participantName": "Roger Federer",
        "participantType": "INDIVIDUAL"
      }
    }
  ]
}
```

### Score Tracking

```json
{
  "score": {
    "sets": [
      {
        "setNumber": 1,
        "side1Score": 7,
        "side2Score": 6,
        "side1TiebreakScore": 7,
        "side2TiebreakScore": 0
      }
    ]
  }
}
```

### Decorated Points

```json
{
  "history": {
    "points": [
      {
        "pointNumber": 1,
        "winner": 0,
        "server": 0,
        "result": "Ace",
        "serve": 1,
        "serveLocation": "Wide",
        "code": "4*|"
      },
      {
        "pointNumber": 2,
        "winner": 1,
        "server": 0,
        "result": "Unforced Error",
        "stroke": "Backhand",
        "hand": "Backhand",
        "serve": 2,
        "serveLocation": "T",
        "rally": [
          {
            "shotNumber": 1,
            "player": 0,
            "stroke": "Forehand",
            "direction": 2,
            "depth": "deep"
          },
          {
            "shotNumber": 2,
            "player": 1,
            "stroke": "Backhand",
            "direction": 3,
            "code": "b1n@"
          }
        ],
        "rallyLength": 5,
        "code": "4n|6b19f3b2b1n@"
      }
    ]
  }
}
```

## Point Decorations Reference

### Results

- `Ace`: Unreturnable serve
- `Winner`: Clean winner
- `Serve Winner`: Weak return forced by serve
- `Unforced Error`: Error without pressure
- `Forced Error`: Error under pressure
- `Double Fault`: Fault on 2nd serve

### Strokes

- `Forehand`, `Backhand`
- `Forehand Slice`, `Backhand Slice`
- `Forehand Volley`, `Backhand Volley`
- `Overhead Smash`
- `Forehand Drop Shot`, `Backhand Drop Shot`
- `Forehand Lob`, `Backhand Lob`
- And more...

### Serve Locations

- `Wide`: Pulled opponent wide
- `Body`: Into the body
- `T`: Down the center T

### Rally Details

- **Direction**: 1=FH side, 2=middle, 3=BH side
- **Depth**: shallow, deep, very deep
- **Position**: baseline, net, approach

## Loading in Hive-Eye-Tracker

1. Copy JSON files to hive-eye-tracker
2. Load via the file interface
3. All point decorations will be available for visualization
4. Statistics will be automatically calculated

## Troubleshooting

### Empty Results

**Problem**: No matches found  
**Solution**: Check CSV format matches MCP standard

### Missing Decorations

**Problem**: Points have no metadata  
**Solution**: Verify serve codes (4/5/6) and stroke codes (f/b/s/v) in CSV

### Invalid Scores

**Problem**: Score doesn't match point progression  
**Solution**: Check for missing or duplicate points in CSV

## Advanced Usage

### Filter Specific Match

```typescript
const result = mcpValidator({
  csvData,
  matchId: '20151122-M-Tour_Finals-F-Roger_Federer-Novak_Djokovic'
});
```

### Custom Format

```typescript
const result = validateMCPMatch(mcpMatch, {
  matchUpFormat: 'SET5-S:6/TB7',  // Best of 5
  debug: true  // Show detailed logging
});
```

### Parse Shot Sequences

```typescript
import { shotParser, analyzeSequence } from '@tennisvisuals/universal-match-object';

const serves = ['4*', '']; // Ace on wide serve
const result = shotParser(serves[0], 1);

console.log(result.winner);   // "S" (server)
console.log(result.result);   // "Ace"
console.log(result.serves);   // ["4*"]
```

## Examples

### Example 1: Batch Conversion

```bash
# Convert all MCP files in a directory
for file in mcp-data/*.csv; do
  node examples/mcp-to-json.js "$file" ./output
done
```

### Example 2: Statistics Summary

```typescript
const result = mcpValidator({ csvData });

console.log('Tournament Statistics:');
console.log(`Total matches: ${result.matchesProcessed}`);
console.log(`Total points: ${result.pointsProcessed}`);
console.log(`Ace rate: ${(result.totalAces / result.pointsProcessed * 100).toFixed(1)}%`);
console.log(`DF rate: ${(result.totalDoubleFaults / result.pointsProcessed * 100).toFixed(1)}%`);
console.log(`Winner rate: ${(result.totalWinners / result.pointsProcessed * 100).toFixed(1)}%`);
```

### Example 3: Point-by-Point Analysis

```typescript
const match = result.matchUps[0];
const points = match.history?.points || [];

points.forEach(point => {
  console.log(`Point ${point.pointNumber}: ${point.result}`);
  if (point.rally) {
    console.log(`  Rally: ${point.rally.map(s => s.stroke).join(' → ')}`);
  }
});
```

## Testing

Run the test suite:

```bash
npm test -- mcpParser      # 29 tests
npm test -- mcpValidator   # 17 tests
```

## Support

- Documentation: See `MCP_VALIDATOR_IMPLEMENTATION.md`
- Test Data: `test/v4/fixtures/mcp-data/testing.csv`
- Examples: `examples/mcp-to-json.js`

---

## Ready to Use

Now you can visualize professional tennis matches with complete point-by-point detail!
