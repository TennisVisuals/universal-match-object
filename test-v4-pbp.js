#!/usr/bin/env node

/**
 * Test v4 pbpValidator against actual CSV data
 * Mirrors the v3 pbp-validator CLI for comparison
 */

import * as fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { pbpValidator } = require('./dist/v4/index.cjs');

// Simple CSV parser (avoid d3-dsv dependency)
// Note: This is a basic parser - doesn't handle quoted commas properly
// but works for this specific CSV format
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    // Split on comma but be aware some fields might contain commas
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

const args = process.argv.slice(2);

// Default CSV file
const csvFile = args[0] || 'examples/pbp-validator/data/pbp_matches_atp_main_current.csv';
let limit = undefined;
let debug = false;
let indices = undefined;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--debug') {
    debug = true;
  } else if ((args[i] === '--indices' || args[i] === '--index') && args[i + 1]) {
    const indexStr = args[i + 1];
    indices = indexStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    i++;
  }
}

// Load CSV
console.log(`\nValidating: ${csvFile}\n`);

const csvContent = fs.readFileSync(csvFile, 'utf-8');
const matches = parseCSV(csvContent);

// Determine which matches to test
let matchesToTest;
if (indices && indices.length > 0) {
  matchesToTest = indices
    .filter(idx => idx >= 0 && idx < matches.length)
    .map(idx => ({ index: idx, match: matches[idx] }));
  console.log(`Testing ${matchesToTest.length} specific matches (indices: ${indices.join(', ')})\n`);
} else if (limit) {
  matchesToTest = matches.slice(0, limit).map((m, i) => ({ index: i, match: m }));
  console.log(`Testing first ${matchesToTest.length} matches (of ${matches.length} total)\n`);
} else {
  matchesToTest = matches.map((m, i) => ({ index: i, match: m }));
  console.log(`Testing ${matchesToTest.length} matches\n`);
}

// Convert pbp codes to point string
// v3 pbp format uses S/R/A/D codes, need to convert to 0/1
// Semicolons separate games and indicate server rotation
// Slashes indicate tiebreak server rotation (every 2 points after first point)
function convertPBPToPoints(pbp, winner) {
  // winner is 1-indexed (1 or 2), convert to 0-indexed
  const winnerIndex = parseInt(winner) - 1;
  const loserIndex = 1 - winnerIndex;
  
  // Split by sets (periods)
  const sets = pbp.split('.');
  
  let points = '';
  let server = 0; // Player 0 serves first game
  
  for (const set of sets) {
    if (!set) continue;
    
    // Split into games (semicolons)
    const games = set.split(';');
    
    for (const game of games) {
      if (!game) continue;
      
      // Check if this is a tiebreak game (contains slashes)
      const isTiebreak = game.includes('/');
      
      if (isTiebreak) {
        // Tiebreak: server changes every 2 points after first point
        // Slashes indicate server change points
        // Pattern: A serves once, then B twice, A twice, B twice, etc.
        const tbCodes = game.replace(/\//g, ''); // Remove slashes
        let tbPointNum = 0;
        
        for (const code of tbCodes) {
          tbPointNum++;
          
          // Determine server for this tiebreak point
          // Point 1: firstServer, Points 2-3: other, 4-5: first, 6-7: other, etc.
          let tbServer;
          if (tbPointNum === 1) {
            tbServer = server; // First point served by game's starting server
          } else {
            // After first point, rotate every 2 points
            const rotations = Math.floor(tbPointNum / 2);
            tbServer = rotations % 2 === 0 ? server : 1 - server;
          }
          
          // Convert code to winner
          if (code === 'S' || code === 'A') {
            points += tbServer.toString();
          } else if (code === 'R' || code === 'D') {
            points += (1 - tbServer).toString();
          }
        }
        
        // After tiebreak, server would rotate normally
        server = 1 - server;
      } else {
        // Regular game - server stays same for all points in game
        for (const code of game) {
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
        
        // Server rotates after each game
        server = 1 - server;
      }
    }
  }
  
  return points;
}

// Transform score from winner's perspective to player 0 vs player 1
// CSV score is always winner-first, but we need player[0] vs player[1]
function transformScoreByWinner(scoreStr, winner) {
  const sets = scoreStr.split(/\s+/);
  
  return sets.map(set => {
    // Extract game scores and tiebreak
    const hasTiebreak = set.includes('(');
    let games, tiebreak;
    
    if (hasTiebreak) {
      const parts = set.split('(');
      games = parts[0];
      tiebreak = parts[1].replace(')', '');
    } else {
      games = set;
    }
    
    const [winnerGames, loserGames] = games.split('-').map(n => parseInt(n));
    
    // Assign scores based on who won
    let player0Games, player1Games, player0TB, player1TB;
    
    if (winner === 0) {
      // Winner is player 0
      player0Games = winnerGames;
      player1Games = loserGames;
      if (hasTiebreak) {
        // If winner won 7-6, tiebreak is loser's score
        if (winnerGames > loserGames) {
          player0TB = null;
          player1TB = tiebreak;
        } else {
          player0TB = tiebreak;
          player1TB = null;
        }
      }
    } else {
      // Winner is player 1
      player0Games = loserGames;
      player1Games = winnerGames;
      if (hasTiebreak) {
        // If winner won 7-6, tiebreak is loser's score
        if (winnerGames > loserGames) {
          player0TB = tiebreak;
          player1TB = null;
        } else {
          player0TB = null;
          player1TB = tiebreak;
        }
      }
    }
    
    // Format: "player0-player1" or "player0-player1(tb)" or "player0(tb)-player1"
    // Tiebreak score goes in parentheses after the LOSER's score
    let result = `${player0Games}-${player1Games}`;
    if (hasTiebreak) {
      // The player with more games won, tiebreak score is loser's score
      if (player0Games > player1Games) {
        // Player 0 won, so player 1's tiebreak score shown
        result = `${player0Games}-${player1Games}(${tiebreak})`;
      } else {
        // Player 1 won, so player 0's tiebreak score shown
        result = `${player0Games}(${tiebreak})-${player1Games}`;
      }
    }
    
    return result;
  }).join(', ');
}

// Validate each match
const results = [];
const failures = [];

for (const { index, match } of matchesToTest) {
  if (debug) {
    console.log(`\n=== Match index ${index} ===`);
    console.log(`Players: ${match.server1} vs ${match.server2}`);
    console.log(`Score: ${match.score}`);
    console.log(`Winner: ${match.winner}`);
    console.log(`PBP (first 50 chars): ${match.pbp.substring(0, 50)}...`);
  }
  
  // Convert pbp codes to point string
  const points = convertPBPToPoints(match.pbp, match.winner);
  
  if (debug) {
    console.log(`Points (first 50): ${points.substring(0, 50)}...`);
  }
  
  // Transform expected score based on winner
  // CSV score is from winner's perspective, need to convert to player 0 vs player 1
  const winner = parseInt(match.winner) - 1; // 0-indexed
  const expectedScore = transformScoreByWinner(match.score, winner);
  
  if (debug) {
    console.log(`Expected score (CSV): ${match.score}`);
    console.log(`Expected score (transformed): ${expectedScore}`);
  }
  
  const result = pbpValidator({
    points,
    expectedScore,
    debug: debug,
  });
  
  results.push({ index, result });
  
  if (!result.valid) {
    failures.push({ index, result });
    
    if (debug) {
      console.log(`❌ FAILED`);
      result.errors.forEach(err => console.log(`  ${err}`));
    }
  } else if (debug) {
    console.log(`✅ PASSED`);
    console.log(`  Actual: ${result.actualScore}`);
    console.log(`  Points processed: ${result.pointsProcessed}`);
    if (result.pointsRejected.length > 0) {
      console.log(`  Points rejected: ${result.pointsRejected.length}`);
    }
  }
}

// Summary
const valid = results.length - failures.length;
const pctValid = ((valid / results.length) * 100).toFixed(2);

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Valid Matches: ${valid} (${pctValid}%), Invalid Matches: ${failures.length}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

// Show failures
if (failures.length > 0) {
  if (indices || failures.length <= 20) {
    console.log('--- Failed Matches ---');
    failures.forEach(({ index, result }) => {
      console.log(`\nMatch index ${index}:`);
      console.log(`  Expected: ${result.expectedScore}`);
      console.log(`  Actual: ${result.actualScore}`);
      result.errors.forEach(err => console.log(`  - ${err}`));
    });
  } else {
    console.log('--- Sample Failures (first 10) ---');
    failures.slice(0, 10).forEach(({ index, result }) => {
      console.log(`\nMatch index ${index}:`);
      console.log(`  Expected: ${result.expectedScore}`);
      console.log(`  Actual: ${result.actualScore}`);
      result.errors.forEach(err => console.log(`  - ${err}`));
    });
    console.log(`\n... and ${failures.length - 10} more failures`);
  }
  
  if (failures.length > 0 && failures.length <= 50) {
    console.log(`\nFailing match indices: ${failures.map(f => f.index).join(',')}`);
    console.log(`\nTo debug these matches, run:`);
    console.log(`  ./test-pbp-validator.sh --indices ${failures.map(f => f.index).join(',')}`);
  }
}

process.exit(failures.length > 0 ? 1 : 0);
