const matchObject = require('./dist/matchObject.cjs').default;

const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });

const score = match.score();
console.log('V3 score() return:', JSON.stringify(score, null, 2));
console.log('Type:', typeof score.scoreString);
console.log('scoreString value:', score.scoreString);

const scoreboard = match.scoreboard();
console.log('\nV3 scoreboard():', scoreboard);
console.log('Type:', typeof scoreboard);
