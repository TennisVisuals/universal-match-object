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

const pbp = {
  validateArchive(archiveName: string): MatchResult[] {
    const matches = d3Dsv.csvParse(this.loadFile(archiveName)) as unknown as CSVRow[];
    console.log(`Validating ${matches.length} matches`);
    const results = this.validateMatchArray(matches);
    const errors = results.filter(f => f.results.errors.length);
    const valid = matches.length - errors.length;
    const pctValid = ((valid / matches.length) * 100).toFixed(2);
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
    const chard = chardet.detectFileSync(targetFile);
    const encoding = (chard?.indexOf('ISO') >= 0 || chard === 'UTF-8' || chard === 'windows-1252') ? 'utf8' : 'utf16le';
    return fs.readFileSync(targetFile, encoding as BufferEncoding);
  },

  validateMatchArray(matchArray: CSVRow[], expand = false): MatchResult[] {
    const results: MatchResult[] = [];
    const bar = new ProgressBar(':bar', { total: matchArray.length });
    for (let i = 0; i < matchArray.length; i++) {
      results.push({ i, results: this.validateMatch(matchArray[i], expand) });
      bar.tick();
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

  validateMatch(row: CSVRow, expand = false): ValidationResult {
    const errors: string[] = [];
    const match: any = {};
    const winner = parseInt(row.winner) - 1;
    const playerArray: string[] = [];
    playerArray.push(removeDiacritics(row.server1));
    playerArray.push(removeDiacritics(row.server2));

    // Detect format from PBP
    const format = this.detectFormat(row.pbp);
    
    // Create match with modern API
    const mo = matchObject.Match({ matchUpFormat: format });
    
    // Define players
    mo.metadata.definePlayer({ index: 0, firstName: playerArray[0] });
    mo.metadata.definePlayer({ index: 1, firstName: playerArray[1] });

    // Parse and add points
    const pbpArray = row.pbp ? row.pbp.trim().split(/[;.]/).filter(p => p) : [];
    
    for (const point of pbpArray) {
      const pointData = this.parsePoint(point);
      if (pointData.error) {
        errors.push(pointData.error);
        break;
      }
      if (pointData.winner !== undefined) {
        mo.addPoint(pointData.winner);
      }
    }

    // Validate winner
    if (mo.complete()) {
      const matchWinner = mo.winner();
      if (matchWinner !== winner) {
        errors.push(`Winner mismatch: expected ${winner}, got ${matchWinner}`);
      }
    } else {
      errors.push('Match incomplete after processing all points');
    }

    const result: ValidationResult = { errors };
    if (expand && !errors.length) {
      result.match = mo;
      result.expanded = this.expandMatch(mo, row);
    }

    return result;
  },

  detectFormat(pbp: string): string {
    // Detect format from PBP structure
    // Default to best-of-3 sets
    return 'SET3-S:6/TB7';
  },

  parsePoint(point: string): { winner?: number; error?: string } {
    // Simple point parser: 'S' or 'R' = server (0), others = receiver (1)
    const trimmed = point.trim();
    if (!trimmed) return {};
    
    const serverWins = ['S', 'A'];  // Server wins (Serve winner, Ace)
    const receiverWins = ['R'];     // Receiver wins
    
    const firstChar = trimmed[0];
    if (serverWins.includes(firstChar)) {
      return { winner: 0 };
    } else if (receiverWins.includes(firstChar)) {
      return { winner: 1 };
    } else {
      // Default: assume it's a serve indicator or other code
      return { winner: 0 };
    }
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
