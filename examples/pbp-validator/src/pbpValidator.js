!function() {

   let pbp = function() {};
   let fs               = require('fs');
   let umo              = require('./matchObject');
   let d3Dsv            = require('d3-dsv');
   let chardet          = require('chardet');
   let removeDiacritics = require('diacritics').remove;
   let ProgressBar      = require('progress');

   pbp.validateArchive = function(archive_name) {
      let matches = d3Dsv.csvParse(pbp.loadFile(archive_name));
      console.log(`Validating ${matches.length} matches`);
      let results = pbp.validateMatchArray(matches);
      let errors = results.filter(f=>f.results.errors.length);
      let valid = matches.length - errors.length;
      let pct_valid = (valid / matches.length).toFixed(2) * 100;
      console.log(`Valid Matches: ${valid} (${pct_valid}%), Invalid Matches: ${errors.length}`);
      return results;
   }

   pbp.expandedArchive = function(archive_name) {
      let matches = d3Dsv.csvParse(pbp.loadFile(archive_name));
      console.log(`Validating ${matches.length} matches`);
      let results = pbp.validateMatchArray(matches, true);
      let valid = results.filter(f=>!f.results.errors.length).map(m=>m.results);
      return valid;
   }

   pbp.writeExpandedArchive = function(archive_name, destination) {
      let valid = pbp.expandedArchive(archive_name);
      console.log('Generating CSV');
      // let bar = new ProgressBar(':bar', { total: valid.length });
      let csv = valid.map((match, i) => {
         return pbp.expandedCSV(match, i == 0)
        //  bar.tick();
      }).join('\r\n');
      fs.writeFileSync(destination, csv);
      return;
   }

   pbp.loadFile = function(file_name) {
      let targetFile = file_name;
      let chard = chardet.detectFileSync(targetFile);
      let encoding = (chard.indexOf('ISO') >= 0 || chard == 'UTF-8' || chard == 'windows-1252') ? 'utf8' : 'utf16le';
      return fs.readFileSync(targetFile, encoding);
   }

   pbp.validateMatchArray = function(match_array, expand) { 
      let results = [];
      let bar = new ProgressBar(':bar', { total: match_array.length });
      for (let i=0; i < match_array.length; i++) {
         results.push({ i, results: pbp.validateMatch(match_array[i], expand) });
         bar.tick();
      }
      return results;
   }

   pbp.writeValidArchive = function(source, destination) {
      let matches = d3Dsv.csvParse(pbp.loadFile(source));
      let errors = pbp.validateMatchArray(matches);
      let invalid_matches = errors.map(m=>m.i);
      let valid_rows = matches.filter((m, i) => invalid_matches.indexOf(i) < 0);
      if (valid_rows.length) {
         let keys = Object.keys(valid_rows[0]);
         let header = keys.join(',');
         let rows = valid_rows.map(row => { return keys.map(k => row[k]).join(','); });
         let data = [].concat(header, ...rows).join('\r\n');
         fs.writeFileSync(destination, data);
         return true;
      }
      return false;
   }

   pbp.validateMatch = function(row, expand) {
      let errors = [];
      let match = {};
      let winner = parseInt(row.winner) - 1;
      let player_array = [];
      player_array.push(removeDiacritics(row.server1));
      player_array.push(removeDiacritics(row.server2));

      let sets_won = [0, 0];
      let scores = row.score.split(' ');
      let score = [];
      for (let c=0; c < scores.length; c++) {
         let tiebreak_score = scores[c].indexOf('(') >= 0 ? scores[c].split('(')[1].split(')')[0] : undefined;
         let player_scores = [];
         if (winner == 0) {
            player_scores[0] = scores[c].split('-')[0];
            player_scores[1] = scores[c].split('-')[1].split('(')[0];
         } else {
            player_scores[1] = scores[c].split('-')[0];
            player_scores[0] = scores[c].split('-')[1].split('(')[0];
         }
         if (player_scores[0] > player_scores[1]) {
            sets_won[0] +=1;
         } else {
            sets_won[1] +=1;
         }
         score.push({ '0': parseInt(player_scores[0]), '1': parseInt(player_scores[1]), tiebreak: tiebreak_score ? parseInt(tiebreak_score) : undefined });
      }
   
      let valid_match = true;
      let points = row.pbp;    

      // first test individual sets
      let sets = points.split('.').filter(s => s);
      for (let s=0; s < sets.length; s++) {
         let format = (score[s][0] > 7 || score[s][1] > 7) ? 'longSetTo6by2' : 'AdSetsTo6tb7';

         // valid set is a complete set with no extra points
         let result = pbp.validSet(sets[s], format);
         if (!result.valid) {
            errors.push('invalid set');
            valid_match = false;
         }
      }

      let games_data = pbp.processGames(points);
      let match_data = pbp.processMatch(sets, sets_won, score);
      if (match_data.rejected.length) errors.push('excess points');
      let valid_score = pbp.validScore(match_data.sets, score);
      if (!valid_score) {
         errors.push('invalid score');
         if (games_data.missing_points) errors.push('games missing points');
         if (games_data.excess_points) errors.push('excess game points');
      }

      if (expand) return { errors, points: match_data.history, format: match_data.format, metadata: row };
      return { errors, format: match_data.format, match_score: match_data.sets.map(m=>m.games), score, valid_score, points, };
   }

   pbp.validScore = function(match_score, score) {
      if (match_score.length != score.length) { return false; }
      let valid = score.map((set_score, i) => {
         let games_equal = set_score[0] == match_score[i].games[0] && set_score[1] == match_score[i].games[1]; 
         let tb_equal = true;
         if (set_score.tiebreak != undefined) {
            if (!match_score[i].tiebreak) {
               tb_equal = false;
            } else {
               tb_equal = match_score[i].tiebreak.indexOf(parseInt(set_score.tiebreak)) >= 0;
            }
         }
         return games_equal && tb_equal;
      });
      return valid.filter(f=>!f).length == 0;
   }

   pbp.processGames = function(points) {
      let game = umo.Game();
      let games = points.split('.').join(';').split(';');
      let valid_games = 0;
      let excess_points = 0;
      let missing_points = 0;

      games.forEach(g => {
         if (g.indexOf('/') > 0) {
            game.reset('tiebreak7a');
            test(g.split('/').join(''));
         } else {
            game.reset('advantage');
            test(g);
         }
      });

      return { valid_games, excess_points, missing_points };

      function test(pts) {
         let result = game.addPoints(pts);
         if (game.complete()) {
            if (!result.rejected.length) {
               valid_games += 1;
            } else {
               excess_points += 1;
            }
         } else {
            missing_points += 1;
         }
      }
   }

   pbp.processMatch = function(sets, sets_won, score) {
      // if either player won > 2 sets, then it must be 5-set format
      let five_sets = Math.max(...sets_won) > 2 ? true : false;
      let supertiebreak = false;
      let final_set_long = false;
      for (let s=0; s < sets.length; s++) {
         let num_points = sets[s].split(';').join('').split('/').join('').length;

         // differentiate between final set supertiebreak and long set
         if ((score[s][0] > 7 || score[s][1] > 7) && Math.abs(score[s][0] - score[s][1]) == 2) {
            if (num_points > 50) {
               final_set_long = true;
            } else {
               supertiebreak = true;
            }
         }
      }

      let format;
      if (five_sets) {
         format = final_set_long ? '5_6a_7_long' : '5_6a_7';
      } else {
         format = final_set_long ? '3_6a_7_long' : supertiebreak ? '3_6n_10' : '3_6a_7';
      }
      let match = umo.Match({type: format});
      match.set.perspectiveScore(false);
      let points = sets.join('').split(';').join('').split('/').join('');
      let result = match.addPoints(points);
      return { rejected: result.rejected, sets: match.score().components.sets, format, history: match.history.common() };
   }

   pbp.validSet = function(points, format) {
      points = points.split(';').join('').split('/').join('');
      let set = umo.Set({type: format});
      let result = set.addPoints(points);
      let valid = set.complete() && !result.rejected.length;
      return { valid, score: set.scoreboard() };
   }

   pbp.expandedCSV = function(valid_match, attach_header) {
      let meta = valid_match.metadata;
      let match_id = [meta.tny_name, meta.server1, meta.server2].join('').split('').filter(f=>isUpperCase(f)).join('');
      match_id = match_id + [meta.score, meta.date].join('').split('').filter(f=>f.match(/[0-9]/)).reduce((a, b) => (+a + +b));
      let header = 'match_id,date,tournament,point_idx,set_num,game_num,point_num,player0,player1,server,winner,score0,score1,tiebreak,points0,points1,games0,games1,sets0,sets1,pts0,pts1,total_points0,total_points1,best_of_sets,sets_to,tiebreaks_to,final_set_long';
      let total_points = [0, 0];
      let format = valid_match.format.split('').filter(f=>f.match(/[0-9]/));
      let rows = valid_match.points.map(data => {
         let point = data.point;
         let score = point.score.split('-');
         let points_to_set = data.needed && data.needed.points_to_set ? data.needed.points_to_set : ['', ''];
         total_points[point.winner] += 1;
         let row = [
            match_id,
            meta.date,
            meta.tny_name,
            point.index + 1,
            point.set + 1,
            point.game + 1,
            point.number + 1,
            meta.server1,
            meta.server2,
            point.server,
            point.winner,
            score[0],
            score[1],
            point.tiebreak ? true : false,
            point.points[0],
            point.points[1],
            data.game.games[0],
            data.game.games[1],
            data.set.sets[0],
            data.set.sets[1],
            points_to_set[0],
            points_to_set[1],
            total_points[0],
            total_points[1],
            format[0],
            format[1],
            format[2],
            valid_match.format.indexOf('long') > 0
         ];
         return row.join(',');
      });
      if (attach_header) rows.unshift(header);
      return rows.join('\r\n');
   }

   var isUpperCase = (letter) => (letter === letter.toUpperCase() && letter.match(/[A-Z]/));

   if (typeof define === "function" && define.amd) define(pbp); else if (typeof module === "object" && module.exports) module.exports = pbp;
   this.pbp = pbp;
 
}();
