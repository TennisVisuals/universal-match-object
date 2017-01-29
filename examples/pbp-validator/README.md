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

> r = p.validateArchive('./pbp_validator/data/pbp_matches_atp_main_current.csv');0
Valid Matches: 2466 (100%), Invalid Matches: 0

> r = p.validateArchive('./pbp_validator/data/pbp_matches_itf_qual_archive.csv');0
Valid Matches: 437 (31%), Invalid Matches: 991

> p.writeValidArchive('./pbp_validator/data/pbp_matches_itf_qual_archive.csv', 'validated_matches.csv')
```
