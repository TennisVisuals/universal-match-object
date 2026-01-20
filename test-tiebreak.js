const { createMatchUp, addPoint, getScore } = require('./dist/v4/index.cjs');

// Simulate 6-6 then tiebreak
let m = createMatchUp({ matchUpFormat: 'SET3-S:6/TB7' });

// Play to 6-6 (12 games * 4 points)
console.log('Playing to 6-6...');
for (let g = 0; g < 12; g++) {
  const winner = g % 2;
  for (let p = 0; p < 4; p++) {
    m = addPoint(m, { winner });
  }
}

const scoreAt66 = getScore(m);
console.log('At 6-6:', scoreAt66.scoreString);
console.log('Set 0:', JSON.stringify(scoreAt66.sets[0], null, 2));
console.log('');

// Now play tiebreak points
console.log('Playing tiebreak...');
for (let i = 0; i < 24; i++) {
  const winner = i < 13 ? 1 : 0; // Player 1 wins 13-11
  m = addPoint(m, { winner });
  const score = getScore(m);
  const set0 = score.sets[0];
  
  console.log(`TB point ${i+1}: winner=${winner} → games=${set0.side1Score}-${set0.side2Score}, TB=${set0.side1TiebreakScore || '?'}-${set0.side2TiebreakScore || '?'}`);
  
  if (set0.winningSide) {
    console.log('SET COMPLETE! Winner:', set0.winningSide);
    break;
  }
}

console.log('');
console.log('Final score:', getScore(m).scoreString);
