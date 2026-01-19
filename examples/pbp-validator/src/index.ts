#!/usr/bin/env node

/**
 * PBP Validator CLI
 * 
 * Usage:
 *   npm run validate <csv-file> [--limit N] [--debug]
 *   node dist/index.js data/pbp_matches_atp_main_current.csv --limit 5 --debug
 */

import pbp from './pbpValidator.js';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: npm run validate <csv-file> [--limit N] [--debug]');
  console.log('Example: npm run validate data/pbp_matches_atp_main_current.csv');
  console.log('         npm run validate data/pbp_matches_atp_main_current.csv --limit 5 --debug');
  process.exit(1);
}

const csvFile = args[0];
let limit: number | undefined = undefined;
let debug = false;

// Parse command line arguments
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--debug') {
    debug = true;
  }
}

try {
  console.log(`\nValidating: ${csvFile}\n`);
  if (limit) {
    console.log(`Processing limit: ${limit} matches\n`);
  }
  
  const results = pbp.validateArchive(csvFile, { limit, debug });
  
  // Show some error details if present
  const errors = results.filter(r => r.results.errors.length);
  if (errors.length > 0 && errors.length <= 10 && !debug) {
    console.log('\n--- Sample Errors ---');
    errors.slice(0, 5).forEach(({ i, results }) => {
      console.log(`\nMatch ${i}:`);
      results.errors.forEach(err => console.log(`  - ${err}`));
    });
  }
  
  process.exit(errors.length > 0 ? 1 : 0);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
