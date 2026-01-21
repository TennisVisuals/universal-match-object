import { createMatchUp, addPoint, getScore, getScoreboard } from './dist/v4/index.js';

console.log('=== Testing V4 Scoreboard ===\n');

let match = createMatchUp({ matchUpFormat: 'SET3-S:6/TB7' });
console.log('Initial format:', match.matchUpFormat);

// Add 3 points to player 2 (winner: 1)
match = addPoint(match, { winner: 1, server: 0 });
console.log('\nAfter 1st point:');
console.log('  getScore():', getScore(match));
console.log('  getScoreboard():', getScoreboard(match));

match = addPoint(match, { winner: 1, server: 0 });
console.log('\nAfter 2nd point:');
console.log('  getScore():', getScore(match));
console.log('  getScoreboard():', getScoreboard(match));

match = addPoint(match, { winner: 1, server: 0 });
console.log('\nAfter 3rd point:');
console.log('  getScore():', getScore(match));
console.log('  getScoreboard():', getScoreboard(match));

// Check score structure
console.log('\n=== Score Structure ===');
console.log('match.score.sets:', JSON.stringify(match.score.sets, null, 2));
