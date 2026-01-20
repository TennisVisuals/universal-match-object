const fs = require('fs');
const { pbpValidator } = require('./dist/v4/index.cjs');

// Load match 21
const csv = fs.readFileSync('examples/pbp-validator/data/pbp_matches_atp_main_current.csv', 'utf-8');
const lines = csv.split('\n');
const match21 = lines[22].split(',');

console.log('Match 21:', match21[4], 'vs', match21[5]);
console.log('Expected:', match21[8]);
console.log('');

// Get PBP and winner
const pbp = match21[7];
const winner = match21[6];

// Convert PBP
const test_v4_pbp = require('./test-v4-pbp.js');

// We need to export the function - let me just inline it
function convertPBPToPoints(pbp, winner) {
  const sets = pbp.split('.');
  let points = '';
  let server = 0;
  
  for (const set of sets) {
    if (!set) continue;
    const games = set.split(';');
    
    for (const game of games) {
      if (!game) continue;
      const isTiebreak = game.includes('/');
      
      if (isTiebreak) {
        const tbCodes = game.replace(/\//g, '');
        let tbPointNum = 0;
        
        for (const code of tbCodes) {
          tbPointNum++;
          let tbServer;
          if (tbPointNum === 1) {
            tbServer = server;
          } else {
            const rotations = Math.floor(tbPointNum / 2);
            tbServer = rotations % 2 === 0 ? server : 1 - server;
          }
          
          if (code === 'S' || code === 'A') {
            points += tbServer.toString();
          } else if (code === 'R' || code === 'D') {
            points += (1 - tbServer).toString();
          }
        }
        server = 1 - server;
      } else {
        for (const code of game) {
          if (code === 'S' || code === 'A') points += server.toString();
          else if (code === 'R' || code === 'D') points += (1 - server).toString();
        }
        server = 1 - server;
      }
    }
  }
  
  return points;
}

const pointString = convertPBPToPoints(pbp, winner);

console.log('Total points:', pointString.length);

// Now validate
const result = pbpValidator({
  points: pointString,
  expectedScore: match21[8],
  debug: false,
});

console.log('v4 Result:', result.actualScore);
console.log('Valid:', result.valid);
console.log('');
console.log('Set details:');
result.sets.forEach((set, i) => {
  console.log(`Set ${i+1}:`, set);
});

// Now let me manually check by running through to point 147
const { createMatchUp, addPoint, getScore } = require('./dist/v4/index.cjs');

let m = createMatchUp({ matchUpFormat: result.matchUpFormat });

for (let i = 0; i < 147; i++) {
  const winner = parseInt(pointString[i]);
  m = addPoint(m, { winner });
}

const finalScore = getScore(m);
console.log('');
console.log('After 147 points:');
console.log('Score string:', finalScore.scoreString);
console.log('Sets:', JSON.stringify(finalScore.sets, null, 2));
