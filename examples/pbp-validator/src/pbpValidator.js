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
      let errors = pbp.validateMatchArray(matches);
      let valid = matches.length - errors.length;
      let pct_valid = (valid / matches.length).toFixed(2) * 100;
      console.log(`Valid Matches: ${valid} (${pct_valid}%), Invalid Matches: ${errors.length}`);
      return errors;
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
         results.push({ i, errors: pbp.validateMatch(match_array[i]).errors });
         bar.tick();
      }
      return results.filter(f=>f.errors.length);
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
         score.push({ '0': player0_score, '1': player1_score, tiebreak: tiebreak_score });
      }

   
      let format = 'AdSetsTo6tb7';
      var score_progression = [];
      var sets = row.pbp.split('.').filter(s => s);    // filter out empty sets
      var valid_match = true;

      for (var s=0; s < sets.length; s++) {
         if (sets[s] == '' || !score[s]) { continue; } // Blank Set; No Score
         if (score[s][0] > 7 || score[s][1] > 7) format = 'longSetTo6by2';
         var result = pbp.validSet(sets[s], format);
         if (!result.complete) {
            errors.push('incomplete set');
            valid_match = false;
         } else {
            score_progression.push(result.score);
         }
      }
      var validation = validateScore(score, winner, score_progression);
      if (valid_match) {
         if (validation.error) {
            errors.push(validation.error);
         }
      } else {
         errors.push('invalid match');
      }

      return { errors };
   }

   pbp.validSet = function(points, format) {
      points = points.split(';').join('').split('/').join('');
      let set = umo.Set({type: format});
      set.addPoints(points);
      return { complete: set.complete(), score: set.scoreboard() };
   }

   function validateScore(score, winner, score_progression) {
      if (score.length != score_progression.length) {
         return { error: 'Discrepancy in number of Sets', error_code: 0 };
      }
      for (var s=0; s < score.length; s++) {

         if (score[s].player0 > 7 || score[s].player1 > 7) {
            return { error: 'Erroneous Score', error_code: 5 };
         }

         var set_score = score_progression[s];
         if (!set_score) return { error: 'No Score', error_code: 1 };

         var tiebreak = undefined;
         var player0_score = set_score.split('-')[0];
         var player1_score = set_score.split('-')[1].split('(')[0].trim();
         if (set_score.indexOf('(') > 0) { tiebreak = set_score.split('(')[1].split(')')[0]; }

         if (tiebreak != score[s].tiebreak) { 
            return { error: 'Tiebreak Mismatch', error_code: 3 }; 
         }
         if (score[s].player0 == player0_score && score[s].player1 != player1_score) { return { error: 'Score mismatch', error_code: 4 }; }
         if (score[s].player1 == player1_score && score[s].player0 != player0_score) { return { error: 'Score mismatch', error_code: 4 }; }
         if (score[s].player0 == player1_score && score[s].player1 != player0_score) { return { error: 'Score mismatch', error_code: 4 }; }
         if (score[s].player1 == player0_score && score[s].player0 != player1_score) { return { error: 'Score mismatch', error_code: 4 }; }
      }
      return {};
   }

   if (typeof define === "function" && define.amd) define(pbp); else if (typeof module === "object" && module.exports) module.exports = pbp;
   this.pbp = pbp;
 
}();
