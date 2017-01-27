# universal-match-object
### Create / Validate Tennis Match Scores

The Universal Match Object (UMO) is a javascript object for client (browser) or server (node) that 'understands' the structure of tennis matches;
it can be used to create new matches and to validate existing point progressions.

Node Usage:
```
umo = require('./v2.x');
match = umo.Match();
```

Browser Usage:
```
<script src="./matchObject.js"></script>
<script>
  match = umo.Match();
</script>
```

Examples:
```
> match.addPoint(0)                     // add a point won by player 0
> match.addPoint(1)                     // add a point won by player 1
> match.addPoints([0,1,0,0,1])          // add a sequence of points

> match.undo()                          // pop last point from point array
{ winner: 1,
  server: 1,
  code: 'S',
  points: [ 0, 1 ],
  score: '15-0',
  number: 0,
  index: 6,
  game: 1,
  set: 0 }

> match.metadata.definePlayer({name: 'Roger Federer'})
{ index: 0, player: { name: 'Roger Federer' } }
> match.metadata.definePlayer({name: 'Rafael Nadal'})
{ index: 1, player: { name: 'Rafael Nadal' } }

> match.reset()                         // clear point data
> match.addPoints(['0-15', '15-15'])    // push point scores

> match.addPoint({winner: 0})
> match.addPoint('40-40')               // checks point validity
{ result: false }

> match.scoreboard()                    // current score
'0-0 (30-15)'

> match.score()
{ counters:
   { local: [ 0, 0 ],
     points: [ 2, 1 ],
     games: [ 0, 0 ],
     sets: [ 0, 0 ] },
  points: '30-15',
  games: '0-0',
  sets: '0-0',
  components: { sets: [ [Object] ] },
  display: {} }                         // ... future dev ...

```

### Supports the notation used in tennis_pointbypoint files:
https://github.com/JeffSackmann/tennis_pointbypoint
```
match.addPoint('A')                   // add a single point (Ace)
match.addPoint(['S','A','D','R'])     // add an array of points
match.addPoints('SSDRSS')             // add multiple from string
```

### The UMO is configurable:
 - match objects have sets as children
 - set objects have games as children
 - predefined 'types' are accessible via ```umo.format()```
 - see ```test``` file for dynamic configuration example

```
> match.format.settings()
{ name: 'best of 3 sets, Advantage, 6 games for set, Tiebreak to 7',
  code: '3_6a_7',
  players: 2,
  threshold: 2,
  has_decider: true,
  min_diff: 0,
  tiebreak: undefined }

> match.format.types()
[ '3_6a_7', '3_6n_7', '3_6n_10' ]

> match.format.children.settings()
{ name: 'Advantage, 6 games for set, Tiebreak to 7',
  code: 'AdSetsTo6tb7',
  players: 2,
  threshold: 6,
  has_decider: true,
  min_diff: 2,
  tiebreak: undefined }

> match.format.children.types()
[ 'AdSetsTo6tb7', 'NoAdSetsTo6tb7', 'supertiebreak', 'pro10a12' ]

> match.format.decidingChild.settings()
{ name: 'Advantage, 6 games for set, Tiebreak to 7',
  code: 'AdSetsTo6tb7',
  players: 2,
  threshold: 6,
  has_decider: true,
  min_diff: 2,
  tiebreak: undefined }
```

Here is a quick overview of some of the accessors for the UMO:
- **.format** as above, including setting for singles/doubles
- **.metadata** set or display players/match/tournament metadata, including service order, receiving order (for doubles), and doubles teams
- **set()** which player serves first and whether to display scores from the perspective of the current server
- **addPoint()** add an individual point
- **addPoints()** add an array of points
- **decoratePoint()** add detail to an existing point
- **undo(*num*)** undo last point (or *num* points)
- **complete()** boolean whether match is complete
- **score()** returns detail about scores for each set and for the match
- **nextService()** which player is serving next
- **reset(*format*)** remove all points; optionally change format
- **sets()** accessor for individual set objects
- **events()** and **notify()** for 'subscribing' to addPoint and undo events.  See ```test``` for example.
- **change** allows set/game/point score to be altered without adding points
- **history** enables access to various views of match progress

### Origins
The UMO was originally created for the Points-to-Set component at TennisVisuals.com and is now used by all visual components.

As TennisVisuals matures the UMO's functions will expand to include layering of more point detail, often derived from disparate sources.

### Vision
Eventually TennisVisuals will deliver real-time visualizations of in-process Tennis Matches, regardless of source.

### Collaboration
If you'd like to contribute to the development of TennisVisuals.com please contact me:
```
info -at- tennisvisuals.com
```
