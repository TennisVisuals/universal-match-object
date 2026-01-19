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
  console.log('Usage: npm run validate <csv-file> [options]');
  console.log('');
  console.log('Options:');
  console.log('  --limit N           Process only first N matches');
  console.log('  --debug             Show detailed validation steps');
  console.log('  --indices N,M,...   Validate only specific match indices (0-based)');
  console.log('  --index N           Validate only a single match index (0-based)');
  console.log('');
  console.log('Examples:');
  console.log('  npm run validate data/pbp_matches.csv');
  console.log('  npm run validate data/pbp_matches.csv --limit 5 --debug');
  console.log('  npm run validate data/pbp_matches.csv --indices 0,5,10 --debug');
  console.log('  npm run validate data/pbp_matches.csv --index 1234 --debug');
  process.exit(1);
}

const csvFile = args[0];
let limit: number | undefined = undefined;
let debug = false;
let indices: number[] | undefined = undefined;

// Parse command line arguments
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--debug') {
    debug = true;
  } else if ((args[i] === '--indices' || args[i] === '--index') && args[i + 1]) {
    // Parse comma-separated indices or single index
    const indexStr = args[i + 1];
    indices = indexStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    i++;
  }
}

try {
  console.log(`\nValidating: ${csvFile}\n`);
  if (limit) {
    console.log(`Processing limit: ${limit} matches\n`);
  }
  if (indices) {
    console.log(`Processing specific indices: ${indices.join(', ')}\n`);
  }
  
  const results = pbp.validateArchive(csvFile, { limit, debug, indices });
  
  // Show error details
  const errors = results.filter(r => r.results.errors.length);
  
  if (errors.length > 0) {
    if (indices || errors.length <= 20) {
      // Show all errors when using --indices or if there are few errors
      console.log('\n--- Failed Matches ---');
      errors.forEach(({ i, results }) => {
        console.log(`\nMatch index ${i}:`);
        results.errors.forEach(err => console.log(`  - ${err}`));
      });
    } else if (!debug) {
      // Show sample when many errors
      console.log('\n--- Sample Errors (first 10) ---');
      errors.slice(0, 10).forEach(({ i, results }) => {
        console.log(`\nMatch index ${i}:`);
        results.errors.forEach(err => console.log(`  - ${err}`));
      });
      console.log(`\n... and ${errors.length - 10} more failures`);
      console.log('\nTo see all failing indices, run without --limit');
      console.log('To debug specific matches, use: --indices ${indices} --debug');
    }
    
    // Show list of all failing indices for easy copy-paste
    if (errors.length > 0 && errors.length <= 50 && !indices) {
      console.log(`\nFailing match indices: ${errors.map(e => e.i).join(',')}`);
      console.log(`\nTo debug these matches, run:`);
      console.log(`  node dist/index.js ${csvFile} --indices ${errors.map(e => e.i).join(',')} --debug`);
    }
  }
  
  process.exit(errors.length > 0 ? 1 : 0);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
