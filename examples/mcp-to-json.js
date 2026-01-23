#!/usr/bin/env node

/**
 * MCP to JSON Converter
 * 
 * Converts Match Charting Project CSV data to MatchUp JSON files
 * compatible with hive-eye-tracker visualization.
 * 
 * Usage:
 *   node examples/mcp-to-json.js <csv-file> [output-dir]
 * 
 * Example:
 *   node examples/mcp-to-json.js test/v4/fixtures/mcp-data/testing.csv ./output
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, basename } from 'path';
import { mcpValidator, exportMatchUpJSON } from '../dist/index.js';

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node mcp-to-json.js <csv-file> [output-dir]');
    console.error('');
    console.error('Example:');
    console.error('  node examples/mcp-to-json.js test/v4/fixtures/mcp-data/testing.csv ./output');
    process.exit(1);
  }

  const csvFile = resolve(args[0]);
  const outputDir = args[1] ? resolve(args[1]) : resolve('./mcp-json-output');

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('   MCP to JSON Converter');
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log(`Input CSV:   ${csvFile}`);
  console.log(`Output dir:  ${outputDir}`);
  console.log('');

  // Read CSV
  let csvData;
  try {
    csvData = readFileSync(csvFile, 'utf-8');
  } catch (error) {
    console.error(`❌ Error reading CSV file: ${error.message}`);
    process.exit(1);
  }

  // Validate and convert
  console.log('🔄 Processing MCP data...');
  console.log('');

  const result = mcpValidator({ csvData, debug: false });

  if (!result.valid) {
    console.error('❌ Validation failed:');
    result.errors.forEach((err) => console.error(`   - ${err}`));
    process.exit(1);
  }

  console.log(`✓ Processed ${result.matchesProcessed} match(es)`);
  console.log(`✓ Processed ${result.pointsProcessed} points`);
  console.log('');
  console.log('Statistics:');
  console.log(`  Aces:             ${result.totalAces}`);
  console.log(`  Double Faults:    ${result.totalDoubleFaults}`);
  console.log(`  Winners:          ${result.totalWinners}`);
  console.log(`  Unforced Errors:  ${result.totalUnforcedErrors}`);
  console.log(`  Forced Errors:    ${result.totalForcedErrors}`);
  console.log('');

  // Create output directory
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (error) {
    console.error(`❌ Error creating output directory: ${error.message}`);
    process.exit(1);
  }

  // Export each match
  console.log('📝 Generating JSON files...');
  console.log('');

  for (let i = 0; i < result.matchUps.length; i++) {
    const matchUp = result.matchUps[i];
    
    // Create filename from match ID
    const filename = `${matchUp.matchUpId}.json`;
    const filepath = resolve(outputDir, filename);

    // Export JSON
    const json = exportMatchUpJSON(matchUp);
    writeFileSync(filepath, json, 'utf-8');

    // Show match info
    const player1 = matchUp.sides[0].participant?.participantName || 'Player 1';
    const player2 = matchUp.sides[1].participant?.participantName || 'Player 2';
    const score = matchUp.score.scoreStringSide1 || 'In progress';
    const points = matchUp.history?.points.length || 0;
    const decoratedPoints = matchUp.history?.points.filter(
      p => p.result || p.stroke || p.serveLocation
    ).length || 0;

    console.log(`✓ ${i + 1}. ${player1} vs ${player2}`);
    console.log(`   Score: ${score}`);
    console.log(`   Points: ${points} (${decoratedPoints} decorated)`);
    console.log(`   File: ${basename(filepath)}`);
    console.log('');
  }

  console.log('═══════════════════════════════════════════════');
  console.log('✅ Conversion complete!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Copy JSON files to hive-eye-tracker');
  console.log('  2. Load them for visualization');
  console.log('═══════════════════════════════════════════════');
  console.log('');
}

main();
