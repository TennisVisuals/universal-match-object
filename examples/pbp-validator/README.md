## PBP Validator

Utilizes the "Universal Match Object" to analyze point-by-point files: https://github.com/JeffSackmann/tennis_pointbypoint

Exports new .csv files containing only validated matches.

According to Jeff, the original data was sourced from XML files provided by a 3rd party.  Errors in the data were present in the source files.

### Configure
Change into the package directory and install dependencies
```
node install
```
### Usage
Copy files from https://github.com/JeffSackmann/tennis_pointbypoint into project ```data``` directory

```
> node

> p = require("./pbp_validator")

> matches = p.validateArchive('./pbp_validator/data/pbp_matches_atp_main_current.csv');0
Valid Matches: 2466 (100%), Invalid Matches: 0

> matches = p.validateArchive('./pbp_validator/data/pbp_matches_itf_qual_archive.csv');0
Valid Matches: 172 (12%), Invalid Matches: 1256
```
In the second example above there were a large number of invalid matches.  Before processing this archive for statistics use ***writeValidArchive()*** to export only validated matches:
```
> p.writeValidArchive('./pbp_validator/data/pbp_matches_itf_qual_archive.csv', 'validated_matches.csv')
```
To investigate the source of errors:
```
invalid_matches = matches.filter(f=>f.results.errors.length);
> invalid_matches[0].results.errors
[ 'invalid set',
  'invalid set',
  'invalid score',
  'excess game points' ]
```
In this archive there are 44 matches which have valid scores but excess points:
```
with_excess_points = matches.filter(f=>f.results.valid_score && f.results.errors.length);
```
