!function() {

   let pbp = function() {};
   var fs               = require('fs');
   var umo              = require('./matchObject');
   var d3Dsv            = require('d3-dsv');
   var chardet          = require('chardet');
   var removeDiacritics = require('diacritics').remove;
   var ProgressBar      = require('progress');

   pbp.validateArchive = function(archive_name) {
      let matches = d3Dsv.csvParse(pbp.loadFile(archive_name));
      let results = pbp.validateMatchArray(matches);
      let errors = results.filter(f=>f.results.errors.length);
      let valid = matches.length - errors.length;
      let pct_valid = (valid / matches.length).toFixed(2) * 100;
      console.log(`Valid Matches: ${valid} (${pct_valid}%), Invalid Matches: ${errors.length}`);
      return results;
   }

   pbp.loadFile = function(file_name) {
      var targetFile = file_name;
      var chard = chardet.detectFileSync(targetFile);
      var encoding = (chard.indexOf('ISO') >= 0 || chard == 'UTF-8' || chard == 'windows-1252') ? 'utf8' : 'utf16le';
      return fs.readFileSync(targetFile, encoding);
   }

   pbp.validateMatchArray = function(match_array) { 
      var results = [];
      var bar = new ProgressBar(':bar', { total: match_array.length });
      for (var i=0; i < match_array.length; i++) {
         results.push({ i, results: pbp.validateMatch(match_array[i]) });
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

   pbp.validateMatch = function(row) {
      let errors = [];
      var match = {};
      var winner = parseInt(row.winner) - 1;
      var player_array = [];
      player_array.push(removeDiacritics(row.server1));
      player_array.push(removeDiacritics(row.server2));

      var sets_won = [0, 0];
      var scores = row.score.split(' ');
      var score = [];
      for (var c=0; c < scores.length; c++) {
         var tiebreak_score = scores[c].indexOf('(') >= 0 ? scores[c].split('(')[1].split(')')[0] : undefined;
         if (winner == 0) {
            var player0_score = scores[c].split('-')[0];
            var player1_score = scores[c].split('-')[1].split('(')[0];
         } else {
            var player1_score = scores[c].split('-')[0];
            var player0_score = scores[c].split('-')[1].split('(')[0];
         }
         if (player0_score > player1_score) {
            sets_won[0] +=1;
         } else {
            sets_won[1] +=1;
         }
         score.push({ '0': parseInt(player0_score), '1': parseInt(player1_score), tiebreak: tiebreak_score ? parseInt(tiebreak_score) : undefined });
      }
   
      var valid_match = true;
      let points = row.pbp;    

      // first test individual sets
      var sets = points.split('.').filter(s => s);
      for (var s=0; s < sets.length; s++) {
         let format = (score[s][0] > 7 || score[s][1] > 7) ? 'longSetTo6by2' : 'AdSetsTo6tb7';

         // valid set is a complete set with no extra points
         var result = pbp.validSet(sets[s], format);
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

      return { errors, format: match_data.format, match_score: match_data.sets.map(m=>m.games), score, valid_score, points };
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
      for (var s=0; s < sets.length; s++) {
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
      return { rejected: result.rejected, sets: match.score().components.sets, format };
   }

   pbp.validSet = function(points, format) {
      points = points.split(';').join('').split('/').join('');
      let set = umo.Set({type: format});
      let result = set.addPoints(points);
      let valid = set.complete() && !result.rejected.length;
      return { valid, score: set.scoreboard() };
   }

   if (typeof define === "function" && define.amd) define(pbp); else if (typeof module === "object" && module.exports) module.exports = pbp;
   this.pbp = pbp;
 
}();
