# Point-By-Point Match Validator v3.0

Utilizes **Universal Match Object v3** (TypeScript) to analyze the validity of [point-by-point files](https://github.com/JeffSackmann/tennis_pointbypoint).

**Features:**
- ✅ TypeScript with full type safety
- ✅ Modern UMO v3 with TODS format support
- ✅ ES modules throughout
- ✅ Exports validated matches only
- ✅ Exports expanded match formats
- ✅ Command-line interface

[PBP Analysis](https://github.com/TennisVisuals/universal-match-object/blob/master/examples/pbp-validator/PBP%20Analysis.md) provides an overview of the validation results for all files.

[PBP Expanded Matches](https://github.com/TennisVisuals/universal-match-object/blob/master/examples/pbp-validator/PBP%20Expanded%20Export.md) details how to use expanded match export.

According to [Jeff Sackmann](https://github.com/JeffSackmann), the original data was sourced from XML files provided by a 3rd party. Errors in the data were present in the source files.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Validate a CSV file
npm run validate data/pbp_matches_atp_main_current.csv
```

## 📋 Requirements

- Node.js 18+
- TypeScript 5.3+
- Universal Match Object v3

---

## 💻 Usage

### Command Line (Recommended)

```bash
# Validate matches from CSV
npm run validate data/pbp_matches_atp_main_current.csv

# Output:
# |████████████████████████████| 100%
# Valid Matches: 2466 (100%), Invalid Matches: 0
```

### Programmatic Usage

```typescript
import pbp from './pbpValidator.js';

// Validate all matches
const matches = pbp.validateArchive('data/pbp_matches_atp_main_current.csv');
// Output: Valid Matches: 2466 (100%), Invalid Matches: 0

// Example with errors
const results = pbp.validateArchive('data/pbp_matches_itf_qual_archive.csv');
// Output: Valid Matches: 172 (12%), Invalid Matches: 1256
```

### Export Valid Matches Only

When an archive contains invalid matches, export only validated ones:

```typescript
pbp.writeValidArchive(
  'data/pbp_matches_itf_qual_archive.csv', 
  'validated_matches.csv'
);
```

### Investigate Errors

```typescript
const matches = pbp.validateArchive('data/problematic_matches.csv');

// Filter invalid matches
const invalid = matches.filter(f => f.results.errors.length);

// Check errors for first invalid match
console.log(invalid[0].results.errors);
// Output:
// [ 'invalid set',
//   'invalid set', 
//   'invalid score',
//   'excess game points' ]

// Find matches with valid scores but excess points
const excessPoints = matches.filter(
  f => f.results.valid_score && f.results.errors.length
);
console.log(`Matches with excess points: ${excessPoints.length}`);
```

### Expanded Match Export

```typescript
// Get valid matches in expanded format
const expanded = pbp.expandedArchive('data/matches.csv');

// Write to CSV
pbp.writeExpandedArchive('data/matches.csv', 'expanded_output.csv');
```

---

## 🏗️ Architecture

**Modern Stack:**
- ✅ TypeScript for type safety
- ✅ ES Modules
- ✅ Latest UMO v3 with TODS format support
- ✅ Modern Match API with `matchUpFormat` constructor

**Project Structure:**
```
pbp-validator/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── pbpValidator.ts    # Core validation logic
│   └── types.d.ts         # Type declarations
├── dist/                  # Compiled output
├── data/                  # Sample CSV files
├── package.json
└── tsconfig.json
```

---

## 🆚 What's New in v3.0

**Removed:**
- ❌ Old copied matchObject.js (1,419 lines)
- ❌ CommonJS require() syntax
- ❌ Legacy format.type() API

**Added:**
- ✅ TypeScript with full type safety
- ✅ Modern UMO v3 package dependency
- ✅ ES modules throughout
- ✅ Modern Match({ matchUpFormat }) API
- ✅ CLI entry point for easy usage

**Migration from v2.0:**
```javascript
// OLD (v2.0)
let p = require("./pbp_validator")
match.format.type('SET3-S:6/TB7');

// NEW (v3.0)
import pbp from './pbpValidator.js';
const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
```

---

## 📂 Data Sources

Copy files from [Jeff Sackmann's GitHub Repository](https://github.com/JeffSackmann/tennis_pointbypoint) into the `data` directory.

Sample file included: `pbp_matches_atp_main_current.csv`

---

## 📚 Related Documentation

- [Universal Match Object](../../README.md)
- [TODS Competition Factory](https://github.com/CourtHive/tods-competition-factory)
- [Jeff Sackmann's Match Charting](https://github.com/JeffSackmann/tennis_MatchChartingProject)

---

## 📄 License

Part of the Universal Match Object project. See main repository for license information.
