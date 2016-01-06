### PBP File Analysis using UMO to validate point progressions

The "Universal Match Object" was used to analyze all point-by-point files: https://github.com/JeffSackmann/tennis_pointbypoint

**'Invalid Format'**        - Cannot parse complete sets, with or without game divider ';'

**'Game Division Errors'**  - Parses into complete sets when the divider ';' is removed.  Scores may not match.

**'Scoring Errors'**        - Parses into complete sets.  Score given in data file doesn't match the score calculated by the point progression.

**Validated matches**       - All sets parse properly resulting in scores matching those in the data file

```
pbp_matches_atp_main_current.csv
3   : 'Invalid Format'
1   : 'Scoring Errors'
19  : 'Game Division Errors'
2459: Validated matches of 2,553 (96%)

pbp_matches_atp_main_archive.csv
1294: 'Invalid Format'
9   : 'Scoring Errors'
55  : 'Game Division Errors'
8208:  Validated matches of 9,537 (86%)

pbp_matches_atp_qual_archive.csv
106 : 'Invalid Format'
3   : 'Scoring Errors'
14  : 'Game Division Errors'
2606:  Validated matches of 2,715 (96%)

pbp_matches_atp_qual_current.csv
41  : 'Invalid Format'
2   : 'Scoring Errors'
5   : 'Game Division Errors'
1602:  Validated matches of 1,645 (97%)

pbp_matches_wta_main_current.csv
74  : 'Invalid Format'
4   : 'Scoring Errors'
15  : 'Game Division Errors'
2526:  Validated matches of 2,604  (97%)

pbp_matches_wta_main_archive.csv
1097: 'Invalid Format'
12  : 'Scoring Errors'
36  : 'Game Division Errors'
7950:  Validated matches of 9,102 (87%)

pbp_matches_wta_qual_current.csv
18  : 'Invalid Format'
4   : 'Scoring Errors'
11  : 'Game Division Errors'
1462:  Validated matches of 1,484 (99%)

pbp_matches_wta_qual_archive.csv
70  : 'Invalid Format'
1   : 'Scoring Errors'
9   : 'Game Division Errors'
2636:  Validated matches of 2,707 (97%)

pbp_matches_fu_main_current.csv
5477: 'Invalid Format'
81  : 'Scoring Errors'
1589: 'Game Division Errors'
426 :  Validated matches of 5,984 (9%)

pbp_matches_fu_main_archive.csv
5416: 'Invalid Format'
79  : 'Scoring Errors'
1428: 'Game Division Errors'
3204:  Validated matches of 9,455 (34%)

pbp_matches_fu_qual_archive.csv
512 : 'Invalid Format'
13  : 'Scoring Errors'
133 : 'Game Division Errors'
50  :  Validated matches of 576 (9%)

pbp_matches_fu_qual_current.csv
861 : 'Invalid Format'
16  : 'Scoring Errors'
237 : 'Game Division Errors'
64  :  Validated matches of 941 (7%)

pbp_matches_ch_main_archive.csv
751 : 'Invalid Format'
18  : 'Scoring Errors'
61  : 'Game Division Errors'
13819  Validated matches of 15,515 (89%)

pbp_matches_ch_main_current.csv
51  : 'Invalid Format'
1   : 'Scoring Errors'
13  : 'Game Division Errors'
4642:  Validated matches of 4,694 (99%)

pbp_matches_ch_qual_archive.csv
38  : 'Invalid Format'
1   : 'Scoring Errors'
3   : 'Game Division Errors'
2334:  Validated matches of 2,373 (98%)

pbp_matches_ch_qual_current.csv
28  : 'Invalid Format'
1   : 'Scoring Errors'
8   : 'Game Division Errors'
2621:  Validated matches of 2,650 (99%)

pbp_matches_itf_main_archive.csv
7951: 'Invalid Format'
2042: 'Game Division Errors'
 120: 'Scoring Errors'
3352:  Validated matches of 12,150 (28%)

pbp_matches_itf_main_current.csv
5934: 'Invalid Format'
98  : 'Scoring Errors'
1588: 'Game Division Errors'
569 :  Validated matches of 6,602 (9%)

pbp_matches_itf_qual_archive.csv
1242: 'Invalid Format'
14  : 'Scoring Errors'
339 : 'Game Division Errors'
172 :  Validated matches of 1,428 (12%)

pbp_matches_itf_qual_current.csv
1658: 'Invalid Format'
22  : 'Scoring Errors'
424 : 'Game Division Errors'
131 :  Validated matches of 1,811 (72%)
```
