#!/usr/bin/env node

/**
 * Debug: Compare how v3 and v4 process the SAME points
 * Check if point conversion is identical
 */

import * as fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load v3 and v4
const umoV3 = require('./dist/matchObject.cjs').default;
const { pbpValidator } = require('./dist/v4/index.cjs');

// Parse CSV
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue);
    
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim() || '');
    return obj;
  });
}

// Convert PBP to points (same as test-v4-pbp.js)
function convertPBPToPoints(pbp, winner) {
  const codes = pbp.replace(/[;/.]/g, '');
  let points = '';
  let server = 0;
  
  for (const code of codes) {
    if (code === 'S') {
      points += server.toString();
    } else if (code === 'R') {
      points += (1 - server).toString();
    } else if (code === 'A') {
      points += server.toString();
    } else if (code === 'D') {
      points += (1 - server).toString();
    }
  }
  
  return points;
}

// Test match index
const matchIndex = parseInt(process.argv[2] || '0', 10);

// Load CSV
const csvFile = 'examples/pbp-validator/data/pbp_matches_atp_main_current.csv';
const csvContent = fs.readFileSync(csvFile, 'utf-8');
const matches = parseCSV(csvContent);
const match = matches[matchIndex];

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`DEBUGGING MATCH INDEX ${matchIndex}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`Players: ${match.server1} vs ${match.server2}`);
console.log(`Expected Score: ${match.score}`);
console.log(`Winner: ${match.winner}`);
console.log(`\nPBP Raw (first 100 chars):\n${match.pbp.substring(0, 100)}...\n`);

// Convert to points
const pointString = convertPBPToPoints(match.pbp, match.winner);
console.log(`Converted to points (first 100):\n${pointString.substring(0, 100)}...\n`);
console.log(`Total points: ${pointString.length}\n`);

// Test with v3 using code-based entry
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('v3 PROCESSING (using raw PBP codes)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const v3Match = umoV3.Match();
const pbpCodes = match.pbp.replace(/[;/.]/g, '');
const result = v3Match.addPoints(pbpCodes);

const v3Score = v3Match.score();
console.log(`v3 Score: ${v3Score}`);
console.log(`v3 Points rejected: ${result.rejected?.length || 0}`);
console.log(`v3 Complete: ${v3Match.complete()}`);
console.log(`v3 Scoreboard:`, v3Match.scoreboard());

// Test with v4 using converted points
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('v4 PROCESSING (using converted 0/1 points)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const v4Result = pbpValidator({
  points: pointString,
  expectedScore: match.score,
  debug: true,
});

console.log(`v4 Score: ${v4Result.actualScore}`);
console.log(`v4 Points processed: ${v4Result.pointsProcessed}`);
console.log(`v4 Points rejected: ${v4Result.pointsRejected.length}`);
console.log(`v4 Valid: ${v4Result.valid}`);

// Compare
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('COMPARISON');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const v3ScoreStr = v3Match.score();

console.log(`Expected:       ${match.score}`);
console.log(`v3 Result:      ${v3ScoreStr}`);
console.log(`v4 Result:      ${v4Result.actualScore}`);

if (v3ScoreStr !== v4Result.actualScore) {
  console.log('\n⚠️  MISMATCH: v3 and v4 produce DIFFERENT scores!');
  console.log('\nThis means either:');
  console.log('1. Point conversion is wrong (S/R/A/D → 0/1)');
  console.log('2. v4 core logic is broken');
  console.log('3. Service rotation tracking differs');
} else {
  console.log('\n✅ v3 and v4 produce SAME score');
  if (v3ScoreStr !== match.score) {
    console.log('   (but both differ from expected - data issue)');
  }
}
