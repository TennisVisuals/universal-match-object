import * as fs from 'fs';
import matchObject from '@tennisvisuals/universal-match-object';
import * as d3Dsv from 'd3-dsv';
import chardet from 'chardet';
import { remove as removeDiacritics } from 'diacritics';
import ProgressBar from 'progress';

interface CSVRow {
  winner: string;
  server1: string;
  server2: string;
  pbp: string;
  tny_name?: string;
  match_id?: string;
  [key: string]: any;
}

interface ValidationResult {
  errors: string[];
  match?: any;
  expanded?: any;
}

interface MatchResult {
  i: number;
  results: ValidationResult;
}

interface ValidationOptions {
  limit?: number;
  debug?: boolean;
}

const pbp = {
  validateArchive(archiveName: string, options: ValidationOptions = {}): MatchResult[] {
    const matches = d3Dsv.csvParse(this.loadFile(archiveName)) as unknown as CSVRow[];
    const matchesToProcess = options.limit ? matches.slice(0, options.limit) : matches;
    console.log(`Validating ${matchesToProcess.length} matches${options.limit ? ` (of ${matches.length} total)` : ''}`);
    const results = this.validateMatchArray(matchesToProcess, false, options);
    const errors = results.filter(f => f.results.errors.length);
    const valid = matchesToProcess.length - errors.length;
    const pctValid = ((valid / matchesToProcess.length) * 100).toFixed(2);
    console.log(`Valid Matches: ${valid} (${pctValid}%), Invalid Matches: ${errors.length}`);
    return results;
  },

  expandedArchive(archiveName: string): any[] {
    const matches = d3Dsv.csvParse(this.loadFile(archiveName)) as unknown as CSVRow[];
    console.log(`Validating ${matches.length} matches`);
    const results = this.validateMatchArray(matches, true);
    const valid = results.filter(f => !f.results.errors.length).map(m => m.results);
    return valid;
  },

  writeExpandedArchive(archiveName: string, destination: string): void {
    const valid = this.expandedArchive(archiveName);
    console.log('Generating CSV');
    const csv = valid.map((match, i) => {
      return this.expandedCSV(match, i === 0);
    }).join('\r\n');
    fs.writeFileSync(destination, csv);
  },

  loadFile(fileName: string): string {
    const targetFile = fileName;
    const chard = chardet.detectFileSync(targetFile) || 'UTF-8';
    const encoding = (chard.indexOf('ISO') >= 0 || chard === 'UTF-8' || chard === 'windows-1252') ? 'utf8' : 'utf16le';
    return fs.readFileSync(targetFile, encoding as BufferEncoding);
  },

  validateMatchArray(matchArray: CSVRow[], expand = false, options: ValidationOptions = {}): MatchResult[] {
    const results: MatchResult[] = [];
    const bar = options.debug ? null : new ProgressBar(':bar', { total: matchArray.length });
    for (let i = 0; i < matchArray.length; i++) {
      if (options.debug) {
        console.log(`\n=== Match ${i + 1} ===`);
      }
      results.push({ i, results: this.validateMatch(matchArray[i], expand, options) });
      if (bar) bar.tick();
    }
    return results;
  },

  writeValidArchive(source: string, destination: string): boolean {
    const matches = d3Dsv.csvParse(this.loadFile(source)) as unknown as CSVRow[];
    const errors = this.validateMatchArray(matches);
    const invalidMatches = errors.map(m => m.i);
    const validRows = matches.filter((m, i) => invalidMatches.indexOf(i) < 0);
    if (validRows.length) {
      const keys = Object.keys(validRows[0]);
      const header = keys.join(',');
      const rows = validRows.map(row => keys.map(k => row[k]).join(','));
      const data = [header, ...rows].join('\r\n');
      fs.writeFileSync(destination, data);
      return true;
    }
    return false;
  },

  validateMatch(row: CSVRow, expand = false, options: ValidationOptions = {}): ValidationResult {
    const errors: string[] = [];
    const winner = parseInt(row.winner) - 1;
    const playerArray: string[] = [];
    playerArray.push(removeDiacritics(row.server1));
    playerArray.push(removeDiacritics(row.server2));

    const setsWon = [0, 0];
    const scores = row.score.split(' ');
    const score: Array<{ 0: number; 1: number; tiebreak?: number }> = [];
    
    // Parse official score from CSV
    for (let c = 0; c < scores.length; c++) {
      const tiebreakScore = scores[c].indexOf('(') >= 0 
        ? scores[c].split('(')[1].split(')')[0] 
        : undefined;
      const playerScores: string[] = [];
      
      if (winner === 0) {
        playerScores[0] = scores[c].split('-')[0];
        playerScores[1] = scores[c].split('-')[1].split('(')[0];
      } else {
        playerScores[1] = scores[c].split('-')[0];
        playerScores[0] = scores[c].split('-')[1].split('(')[0];
      }
      
      if (parseInt(playerScores[0]) > parseInt(playerScores[1])) {
        setsWon[0] += 1;
      } else {
        setsWon[1] += 1;
      }
      
      score.push({ 
        0: parseInt(playerScores[0]), 
        1: parseInt(playerScores[1]), 
        tiebreak: tiebreakScore ? parseInt(tiebreakScore) : undefined 
      });
    }

    const points = row.pbp;
    const sets = points.split('.').filter((s: string) => s);

    // Validate individual sets
    for (let s = 0; s < sets.length; s++) {
      const format = (score[s][0] > 7 || score[s][1] > 7) 
        ? 'longSetTo6by2' 
        : 'AdSetsTo6tb7';
      
      if (options.debug) {
        console.log(`Set ${s + 1}: "${sets[s]}" format:${format}`);
      }
      const result = this.validSet(sets[s], format, options);
      if (!result.valid) {
        errors.push('invalid set');
        if (options.debug) {
          console.log(`  → Set ${s + 1} INVALID`);
        }
      } else if (options.debug) {
        console.log(`  → Set ${s + 1} VALID`);
      }
    }

    const gamesData = this.processGames(points);
    const matchData = this.processMatch(sets, setsWon, score);
    
    if (options.debug) {
      console.log(`Games data: valid=${gamesData.valid_games}, excess=${gamesData.excess_points}, missing=${gamesData.missing_points}`);
      console.log(`Match data rejected: ${matchData.rejected.length}`);
    }
    
    if (matchData.rejected.length) errors.push('excess points');
    
    const validScore = this.validScore(matchData.sets, score, options);
    if (options.debug) {
      console.log(`Valid score check: ${validScore}`);
      console.log(`Total errors: ${errors.length > 0 ? errors.join(', ') : 'none'}`);
    }
    
    if (!validScore) {
      errors.push('invalid score');
      if (gamesData.missing_points) errors.push('games missing points');
      if (gamesData.excess_points) errors.push('excess game points');
    }

    if (expand) {
      return { 
        errors, 
        match: { 
          points: matchData.history, 
          format: matchData.format, 
          metadata: row 
        } 
      };
    }
    
    return { 
      errors 
    };
  },

  validSet(set: string, format: string, options: any = {}): { valid: boolean } {
    const games = set.split(';');
    let valid = true;

    for (let i = 0; i < games.length; i++) {
      const g = games[i];
      
      // Skip empty game strings
      if (!g || g.trim().length === 0) continue;
      
      // Create new game for each game string
      let game: any;
      let pts: string;
      
      if (g.indexOf('/') > 0) {
        // Tiebreak game - use formatStructure
        game = matchObject.Game({ 
          formatStructure: { tiebreakTo: 7 } as any 
        });
        pts = g.split('/').join('');
      } else {
        // Regular game
        game = matchObject.Game();
        pts = g;
      }
      
      // Skip if no points to add
      if (!pts || pts.length === 0) {
        valid = false;
        if (options.debug) {
          console.log(`      Game ${i + 1}: Empty points - INVALID`);
        }
        continue;
      }
      
      try {
        const result = game.addPoints(pts);
        const gameValid = game.complete() && (!result.rejected || result.rejected.length === 0);
        
        if (options.debug && i < 3) { // Only log first 3 games
          console.log(`      Game ${i + 1}: "${g}" -> points:"${pts}" complete:${game.complete()} rejected:${result.rejected?.length || 0} - ${gameValid ? 'VALID' : 'INVALID'}`);
        }
        
        if (!gameValid) {
          valid = false;
        }
      } catch (error) {
        valid = false;
        if (options.debug) {
          console.log(`      Game ${i + 1}: "${g}" - ERROR: ${error}`);
        }
      }
    }

    return { valid };
  },

  validScore(
    matchScore: Array<{ games: number[]; tiebreak?: number[] }>, 
    score: Array<{ 0: number; 1: number; tiebreak?: number }>,
    options: ValidationOptions = {}
  ): boolean {
    if (options.debug) {
      console.log(`  Comparing matchScore.length=${matchScore.length} to score.length=${score.length}`);
      matchScore.forEach((s, i) => {
        console.log(`  Set ${i + 1}: matchScore games=[${s.games}] tiebreak=[${s.tiebreak}] vs score={0:${score[i]?.[0]}, 1:${score[i]?.[1]}, tb:${score[i]?.tiebreak}}`);
      });
    }
    
    if (matchScore.length !== score.length) {
      if (options.debug) console.log(`  → FAIL: matchScore.length !== score.length`);
      return false;
    }
    
    const valid = score.map((setScore, i) => {
      const gamesEqual = setScore[0] === matchScore[i].games[0] && 
                        setScore[1] === matchScore[i].games[1];
      let tbEqual = true;
      
      if (setScore.tiebreak !== undefined) {
        if (!matchScore[i].tiebreak) {
          tbEqual = false;
        } else {
          tbEqual = matchScore[i].tiebreak.indexOf(setScore.tiebreak) >= 0;
        }
      }
      
      const result = gamesEqual && tbEqual;
      if (options.debug && !result) {
        console.log(`  → FAIL Set ${i + 1}: gamesEqual=${gamesEqual}, tbEqual=${tbEqual}`);
      }
      return result;
    });
    
    return valid.filter(f => !f).length === 0;
  },

  processGames(points: string): { 
    valid_games: number; 
    excess_points: number; 
    missing_points: number 
  } {
    const games = points.split('.').join(';').split(';');
    let validGames = 0;
    let excessPoints = 0;
    let missingPoints = 0;

    games.forEach(g => {
      // Skip empty game strings
      if (!g || g.trim().length === 0) return;
      
      // Create new game for each game string
      let game: any;
      let pts: string;
      
      if (g.indexOf('/') > 0) {
        // Tiebreak game - use formatStructure
        game = matchObject.Game({ 
          formatStructure: { tiebreakTo: 7 } as any 
        });
        pts = g.split('/').join('');
      } else {
        // Regular game
        game = matchObject.Game();
        pts = g;
      }
      
      // Skip if no points to add
      if (!pts || pts.length === 0) {
        missingPoints += 1;
        return;
      }
      
      try {
        const result = game.addPoints(pts);
        if (game.complete()) {
          if (!result.rejected || result.rejected.length === 0) {
            validGames += 1;
          } else {
            excessPoints += 1;
          }
        } else {
          missingPoints += 1;
        }
      } catch (error) {
        // If addPoints fails, count as invalid
        excessPoints += 1;
      }
    });

    return { 
      valid_games: validGames, 
      excess_points: excessPoints, 
      missing_points: missingPoints 
    };
  },

  processMatch(
    sets: string[], 
    setsWon: number[], 
    score: Array<{ 0: number; 1: number; tiebreak?: number }>
  ): { 
    sets: Array<{ games: number[]; tiebreak?: number[] }>; 
    rejected: any[]; 
    history: any[]; 
    format: string 
  } {
    // Detect if 5-set format
    const fiveSets = Math.max(...setsWon) > 2;
    let supertiebreak = false;
    let finalSetLong = false;

    // Detect supertiebreak vs long final set
    for (let s = 0; s < sets.length; s++) {
      const numPoints = sets[s].split(';').join('').split('/').join('').length;
      
      if (score[s][0] > 7 || score[s][1] > 7) {
        if (Math.abs(score[s][0] - score[s][1]) === 2 && numPoints > 50) {
          finalSetLong = true;
        } else {
          supertiebreak = true;
        }
      }
    }

    // Determine format code
    let formatCode = fiveSets ? 'SET5-S:6/TB7' : 'SET3-S:6/TB7';
    if (supertiebreak) {
      formatCode = fiveSets ? 'SET5-S:6/TB7-F:TB10' : 'SET3-S:6/TB7-F:TB10';
    } else if (finalSetLong) {
      formatCode = fiveSets ? 'SET5-S:6/TB7-F:T8' : 'SET3-S:6/TB7-F:T8';
    }

    // Create match and replay all points
    const mo = matchObject.Match({ matchUpFormat: formatCode });
    const allPoints = sets.join('.').split('.').join('').split(';').join('').split('/').join('');
    const result = mo.addPoints(allPoints);

    // Extract set scores
    const matchSets = mo.sets().map((set: any) => {
      const setScore = set.score();
      const games = setScore.games ? setScore.games.split('-').map(Number) : [0, 0];
      
      // Check for tiebreaks
      const tiebreakGames = set.games().filter((g: any) => 
        g.format.tiebreak && typeof g.format.tiebreak === 'function' && g.format.tiebreak()
      );
      
      const tiebreak = tiebreakGames.length > 0
        ? tiebreakGames.map((g: any) => {
            const tbScore = g.score();
            return tbScore.points ? tbScore.points.split('-').map(Number) : [];
          }).flat()
        : undefined;

      return { games, tiebreak };
    });

    return {
      sets: matchSets,
      rejected: result.rejected || [],
      history: allPoints.split('').map((p, i) => ({ point: i + 1, winner: p })),
      format: formatCode
    };
  },

  expandMatch(mo: any, row: CSVRow): any {
    return {
      tournament: row.tny_name || '',
      matchId: row.match_id || '',
      score: mo.score(),
      sets: mo.sets().map((set: any) => ({
        score: set.score(),
        games: set.games().map((game: any) => ({
          score: game.score(),
          points: game.points()
        }))
      }))
    };
  },

  expandedCSV(match: ValidationResult, includeHeader = false): string {
    // Generate expanded CSV format
    const rows: string[] = [];
    if (includeHeader) {
      rows.push('tournament,matchId,set,game,point,score');
    }
    // Simplified - would need full implementation
    return rows.join('\r\n');
  }
};

export default pbp;
