# universal-match-object
### Create / Validate Tennis Match Scores

The Universal Match Object (UMO) is a javascript object for client (browser) or server (node) that 'understands' the structure of tennis matches;
it can be used to create new matches and to validate existing point progressions.

Node Usage:
```
m = require('./matchObject');
match = m.matchObject();
```

Browser Usage:
```
<script src="./matchObject.js"></script>
<script>
  match = mo.matchObject();
</script>
```

Examples:
```
match.push(0)                     // add a point won by player 0
match.push(1)                     // add a point won by player 1
match.push([0,1,0,0,1])           // add a sequence of points

match.points([0,1])               // replace existing points  
match.points()                    // view all points
[ { winner: 0, point: '15-0', server: 0, game: 0 },
  { winner: 1, point: '15-15', server: 0, game: 0 } ]

match.pop()                       // pop last point from point array
  { winner: 1, point: '15-15', server: 0, game: 0 }

match.players('Novak Djokovic', 'Serena Williams')
match.players()                   // view player names
[ 'Novak Djokovic', 'Serena Williams' ]

match.reset()                     // clear point data
match.push(['0-15', '15-15'])     // push point scores

match.push({winner: 0, point: '30-15'})
{ result: true }

match.push('40-40')               // checks point validity
{ result: false, error: 'invalid point' }

match.score()                     // display current match score
{ sets:
   [ { score: '0-0',
       point: '30-15',
       legend: 'Djokovic/Williams',
       leader: undefined,
       games: [Object],
       complete: false } ],
  match_score: '',
  winner: '',
  loser: '' }
```
Here is a quick overview of some of the accessors for the UMO:
- **options()** returns (and can be used to set) match format
- **points()** returns an array of all points in a match
- **winProgression()** and **gameProgression()** provide compact match representations which are used by various visualization components.  An entire match can be recreated from a Win Progression.
- **push()** was used by the parser to create points
- **pop()** will alter the match by removing the last point.
- **players()** returns the names of the players
- **score()** returns detail about scores for each set and for the match
- **reset()** will destroy the match / empty the UMO
- **sets()** accessor for individual set objects
- **pointIndex(*set*, *game*, *score*)** search for a specific point; returns index
- **findPoint(*set*, *game*, *score*)** search for a specific point

### Validate Point-by-Point data published by Jeff Sackmann
The UMO supports the notation used in tennis_pointbypoint files:
https://github.com/JeffSackmann/tennis_pointbypoint
```
match.push('A')                   // add a single point (Ace)
match.push(['S','A','D','R'])     // add an array of points
match.push('SSDRSS'.split(''))    // add array from string
```
The UMO can be used to validate point-by-point sequences using the following convenience functions:
```
m.validGames('SSDRSS')            // sequence is a complete game
m.validGames('SSSS;RRRR')         // sequence consists of complete games

// because UMO understands match structure, delimiters are optional
m.validTiebreak('S/SS/SR/RR/RR/RS/SR/RS/SS/SS/SS/SS/R')
m.validTiebreak('SSSSRRRRRRSSRRSSSSSSSSSR')

m.validSet('')                    // validate an entire set sequence
```
### The UMO is configurable:
 - number of games in a match
 - number of sets in a game
 - advantages at deuce
 - final set tiebreak
 - tiebreaks to 7 or 10

```
match.options()                   // output all configurable options
match.options({match: {sets: 5}}) // change the number of sets (1 to 5)
```
### Origins
The UMO is derived from the Points-to-Set component at TennisVisuals.com, which dynamically updates whenever points are added to or removed from the UMO:
http://tennisvisuals.com/examples/pointsToSet.html

As TennisVisuals matures more visualizations will utilize the UMO and it's functions will expand to include layering of more point detail, often derived from disparate sources.

### Vision
Eventually TennisVisuals will deliver real-time visualizations of in-process Tennis Matches, regardless of source.

### Collaboration
If you'd like to contribute to the development of TennisVisuals.com please contact me:
```
info -at- tennisvisuals.com
```
