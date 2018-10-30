
var redis = require('redis')
var pub = redis.createClient();

var mtc = { 
   match: { muid: 'foo' }, 
   tournament: { name: 'tournament one' }, 
   status: '',
   // date: 1492507357458,
   date: undefined,
   players: [ { name: 'Player A' }, { name: 'Player B' } ], 
   // score: { components: { sets: [ { games: [ 0, 0] }, ] }, points: '0-0' }, 
   score: { components: { sets: [ { games: [ 0, 0] }, ] }, points: '30-40' }, 
   point: { },
   serving: 0, 
   complete: false, 
   winner: undefined, 
   geoposition: {
      latitude: 43.502381199999995,
      longitude: 16.4583805,
   }
}

var message = { type: 'score', data : mtc };

pub.publish('tournament', JSON.stringify(message))
