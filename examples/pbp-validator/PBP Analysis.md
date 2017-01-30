## PBP File Analysis

Version 2.0 of the "Universal Match Object" was used to analyze all point-by-point files available in the [GitHub Repository](https://github.com/JeffSackmann/tennis_pointbypoint) made available by Jeff Sackmann.

Matches which produce a valid score (equivalent to the 'official' score) but which have excess points are classified as invalid.

See the [PBP Validator](https://github.com/TennisVisuals/universal-match-object/tree/master/examples/pbp-validator) for examples of investigating the source of errors for each invalid match.

The WTA Main Archive has many matches which are missing a single point, often in the final game... an assumption could be made that there was an accidental truncation for many of these matches.

According to Jeff, the original data was sourced from XML files provided by a 3rd party.  Errors in the data were present in the source files.

**A fork of Jeff's repository with numerous fixes to player names is available [here](https://github.com/TennisVisuals/tennis_pointbypoint).*

```
pbp_matches_atp_main_current.csv
Valid Matches: 2466 (100%), Invalid Matches: 0

pbp_matches_atp_main_current.csv
Valid Matches: 2466 (100%), Invalid Matches: 0

pbp_matches_atp_qual_archive.csv
Valid Matches: 2603 (100%), Invalid Matches: 0

pbp_matches_atp_qual_current.csv
Valid Matches: 1613 (100%), Invalid Matches: 0

pbp_matches_wta_main_archive.csv
Valid Matches: 8001 (88%), Invalid Matches: 1098

pbp_matches_wta_main_current.csv
Valid Matches: 2535 (97%), Invalid Matches: 69

pbp_matches_wta_qual_archive.csv
Valid Matches: 2643 (98%), Invalid Matches: 64

pbp_matches_wta_qual_current.csv
Valid Matches: 1467 (99%), Invalid Matches: 17

pbp_matches_ch_main_archive.csv
Valid Matches: 14692 (95%), Invalid Matches: 823

pbp_matches_ch_main_current.csv
Valid Matches: 4642 (99%), Invalid Matches: 52

pbp_matches_ch_qual_archive.csv
Valid Matches: 2334 (98%), Invalid Matches: 39

pbp_matches_ch_qual_current.csv
Valid Matches: 2621 (99%), Invalid Matches: 29

pbp_matches_fu_main_archive.csv
Valid Matches: 3930 (42%), Invalid Matches: 5525

pbp_matches_fu_main_current.csv
Valid Matches: 421 (7%), Invalid Matches: 5563

pbp_matches_fu_qual_archive.csv
Valid Matches: 49 (9%), Invalid Matches: 527

pbp_matches_fu_qual_current.csv
Valid Matches: 62 (7%), Invalid Matches: 879

pbp_matches_itf_main_archive.csv
Valid Matches: 3973 (33%), Invalid Matches: 8177

pbp_matches_itf_main_current.csv
Valid Matches: 563 (9%), Invalid Matches: 6039

pbp_matches_itf_qual_archive.csv
Valid Matches: 172 (12%), Invalid Matches: 1256

pbp_matches_itf_qual_current.csv
Valid Matches: 129 (7%), Invalid Matches: 1682

pbp_matches_itf_qual_archive.csv
Valid Matches: 172 (12%), Invalid Matches: 1256
```
