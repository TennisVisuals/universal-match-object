## PBP Expanded matches

Point-by-point Archive files capture match detail on a single row of a CSV file. Often it is useful to have an 'expanded' view of a match where each point of every match is represented by a single row.

The [PBP Validator](https://github.com/TennisVisuals/universal-match-object/tree/master/examples/pbp-validator) includes an example demonstrating how to export PBP matches in an expanded format.

After launching ```node```

```
> p = require('./pbp_validator')

> p.writeExpandedArchive('./pbp_validator/data/pbp_matches_atp_main_current.csv', 'ex.csv')
```

For large archives this is a long process and generates a very large CSV file.

Alternatively, you can first create an in-memory array of validated matches and generate CSV for each match a-la-carte:

```
e = p.expandedArchive('./pbp_validator/data/pbp_matches_atp_main_current.csv')

csv = p.expandedCSV(e[0])
```

### Notes:

- The PBP validator infers the format of matches based on the 'official' score present in the original CSV file. This means that Grand Slam matches which do not have a long final set will not need the long-set format to validate properly. For example: The boolean value for 'final-set-long' will therefore be *false* for most Men's matches of the Australian Open.
