# UMO Functions

*These examples assume you have a UMO object 'match'*

**pointIndex(*set, game, [score]*)** Each match UMO can be queried to find specific points, given the set, game and score.

Sets and Games begin at 0, so the first point of the 7th Game of the 1st Set can be accessed using the function :
```
> match.pointIndex(0,6)
42
```
If you know the point score:
```
> match.pointIndex(0,6, '30-15')
44
```
**findPoint(*set, game, [score], [lazy (boolean)]*)** is similar to pointIndex() but returns point details.
```
> match.findPoint(0,6,'15-0')
{ serves: [ '4' ],
  rally: [ 'f29', 'f3*' ],
  terminator: '*',
  result: 'Winner',
  serve: 1,
  code: '4f29f3*|',
  winner: 0,
  score: '15-0',
  set: 0,
  server: 0,
  game: 6 }
```
You can use an optional final parameter to make the search 'lazy', which will search for '15-0' as well as '0-15'.
```
> match.findPoint(0,6,'15-0', true)
...
```
