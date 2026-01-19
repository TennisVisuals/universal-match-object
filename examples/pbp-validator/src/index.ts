#!/usr/bin/env node

/**
 * PBP Validator CLI
 * 
 * Usage:
 *   npm run validate <csv-file>
 *   node dist/index.js data/pbp_matches_atp_main_current.csv
 */

import pbp from './pbpValidator.js';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: npm run validate <csv-file>');
  console.log('Example: npm run validate data/pbp_matches_atp_main_current.csv');
  process.exit(1);
}

const csvFile = args[0];

try {
  console.log(`\nValidating: ${csvFile}\n`);
  const results = pbp.validateArchive(csvFile);
  
  // Show some error details if present
  const errors = results.filter(r => r.results.errors.length);
  if (errors.length > 0 && errors.length <= 10) {
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
