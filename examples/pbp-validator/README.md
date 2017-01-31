## PBP Validator

Utilizes the "Universal Match Object" to analyze the validity of [point-by-point files](https://github.com/JeffSackmann/tennis_pointbypoint).

- Exports new archives containing only validated matches.
- Exports expanded match formats for validated matches.

[PBP Analysis](https://github.com/TennisVisuals/universal-match-object/blob/master/examples/pbp-validator/PBP%20Analysis.md) provides an overview of the validation results for all files.

[PBP Expanded Matches](https://github.com/TennisVisuals/universal-match-object/blob/master/examples/pbp-validator/PBP%20Expanded%20Export.md) details how to use expanded match export.

According to [Jeff Sackmann](https://github.com/JeffSackmann), the original data was sourced from XML files provided by a 3rd party.  Errors in the data were present in the source files.

### Configure
Change into the package directory and install dependencies
```
node install
```
### Usage
Copy files from [Jeff Sackmann's GitHub Repository](https://github.com/JeffSackmann/tennis_pointbypoint) into project ```data``` directory

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
In this archive there are 44 matches which have valid scores but excess points. A score is valid when all calculated set scores match the 'official' score reported in the archive:
```
with_excess_points = matches.filter(f=>f.results.valid_score && f.results.errors.length);
```
