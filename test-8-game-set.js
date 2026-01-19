// Quick test for 8-game pro set
const umo = require('./dist/index.cjs');

const match = umo.Match({ matchUpFormat: 'SET1-S:8/TB7' });
match.metadata.definePlayer({ index: 0, firstName: 'Player', lastName: 'One' });
match.metadata.definePlayer({ index: 1, firstName: 'Player', lastName: 'Two' });

console.log('Format:', match.format.code);
console.log('Format structure:', JSON.stringify(match.format.structure, null, 2));
console.log('Child format structure:', JSON.stringify(match.format.childFormatStructure(), null, 2));
console.log('Deciding child format structure:', JSON.stringify(match.format.decidingChildFormatStructure(), null, 2));

// Play 6 games to player 0 (24 points)
for (let i = 0; i < 24; i++) {
  match.addPoint(0);
}

console.log('\nAfter 6 games (24 points):');
console.log('Score:', match.scoreboard());
console.log('Complete?', match.complete());

// Play 2 more games (8 points each = 16 points)
for (let i = 0; i < 16; i++) {
  match.addPoint(0);
}

console.log('\nAfter 8 games (40 points):');
console.log('Score:', match.scoreboard());
console.log('Complete?', match.complete());
console.log('Winner:', match.winner());
