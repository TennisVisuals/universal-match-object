const fs = require('fs');
const { createMatchUp, addPoint, getScore } = require('./dist/v4/index.cjs');

// Load match 21 PBP
const csv = fs.readFileSync('examples/pbp-validator/data/pbp_matches_atp_main_current.csv', 'utf-8');
const lines = csv.split('\n');
const match21 = lines[22].split(',');

console.log('Match 21:', match21[4], 'vs', match21[5]);
console.log('Expected:', match21[8]);
console.log('');

// Convert PBP to points (using our conversion function)
const pbp = match21[7];
const sets = pbp.split('.');
const set2 = sets[1];
const set2games = set2.split(';');

console.log('Set 2 has', set2games.length, 'games');
console.log('Last game (tiebreak):', set2games[set2games.length - 1]);
console.log('');

// Manually convert to points up to the tiebreak
let pointString = '';
let server = 0;

// Convert set 1
for (const game of sets[0].split(';')) {
  if (!game) continue;
  for (const code of game) {
    if (code === 'S' || code === 'A') pointString += server.toString();
    else if (code === 'R' || code === 'D') pointString += (1 - server).toString();
  }
  server = 1 - server;
}

console.log('After set 1:', pointString.length, 'points');

// Convert set 2 up to but not including tiebreak
for (let i = 0; i < set2games.length - 1; i++) {
  const game = set2games[i];
  if (!game) continue;
  for (const code of game) {
    if (code === 'S' || code === 'A') pointString += server.toString();
    else if (code === 'R' || code === 'D') pointString += (1 - server).toString();
  }
  server = 1 - server;
}

console.log('After set 2 to 6-6:', pointString.length, 'points');
console.log('Server going into tiebreak:', server);
console.log('');

// Now create matchUp and play to 6-6
let m = createMatchUp({ matchUpFormat: 'SET3-S:6/TB7' });

for (let i = 0; i < pointString.length; i++) {
  const winner = parseInt(pointString[i]);
  m = addPoint(m, { winner });
}

const scoreAt66 = getScore(m);
console.log('Score at 6-6:', scoreAt66.scoreString);
console.log('Set 2 details:', JSON.stringify(scoreAt66.sets[1], null, 2));
console.log('');

// Now manually process the tiebreak
const tbGame = set2games[set2games.length - 1];
console.log('Tiebreak game:', tbGame);

// Remove slashes and convert
const tbCodes = tbGame.replace(/\//g, '');
console.log('Tiebreak codes:', tbCodes);
console.log('Tiebreak length:', tbCodes.length, 'points');
console.log('');

// Convert tiebreak with proper rotation
let tbPointNum = 0;
const tbPoints = [];

for (const code of tbCodes) {
  tbPointNum++;
  
  // Determine server
  let tbServer;
  if (tbPointNum === 1) {
    tbServer = server;
  } else {
    const rotations = Math.floor(tbPointNum / 2);
    tbServer = rotations % 2 === 0 ? server : 1 - server;
  }
  
  // Determine winner
  let winner;
  if (code === 'S' || code === 'A') {
    winner = tbServer;
  } else if (code === 'R' || code === 'D') {
    winner = 1 - tbServer;
  }
  
  tbPoints.push(winner);
  
  console.log(`TB point ${tbPointNum}: code=${code}, server=${tbServer}, winner=${winner}`);
}

console.log('');
console.log('Now playing through tiebreak...');

// Play through tiebreak and log after each point
for (let i = 0; i < tbPoints.length; i++) {
  m = addPoint(m, { winner: tbPoints[i] });
  const score = getScore(m);
  const set2 = score.sets[1];
  
  console.log(`After TB point ${i+1}:`,
    `games=${set2.side1Score}-${set2.side2Score}`,
    `tb1=${set2.side1TiebreakScore}`,
    `tb2=${set2.side2TiebreakScore}`,
    `winner=${set2.winningSide || 'none'}`
  );
}

const final = getScore(m);
console.log('');
console.log('Final score:', final.scoreString);
console.log('');
console.log('Set 2 final:', JSON.stringify(final.sets[1], null, 2));
