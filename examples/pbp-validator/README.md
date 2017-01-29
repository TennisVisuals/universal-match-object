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

```
> node

> p = require("./pbp_validator")

> r = p.validateArchive('./pbp_validator/data/pbp_matches_atp_main_current.csv');0
Valid Matches: 2257 (92%), Invalid Matches: 209

> p.writeValidArchive('./pbp_validator/data/pbp_matches_atp_main_current.csv', 'validated_matches.csv')
```
