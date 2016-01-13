if (!Array.prototype.last) { Array.prototype.last = function() { return this[this.length - 1]; }; }

!function() { 
   var mo = {};

   mo.matchObject = matchObject;
   function matchObject() {

      var options = {
    
          id: 0,
          players: { 0: 'player 1', 1: 'player 2'},
    
          match: {
             sets: 3,
             final_set_tiebreak: true,
             final_set_tiebreak_to: 7,
             first_service: 0
          },
    
          set: {
             games: 12,
             advantage: true,
             tiebreak: true,
             tiebreak_to: 7
          },
    
          points: {
             to_set: 24
          }
       }
    
       // programmatic
       var set_objects = [];

       // prepare sets
       for (var s=0; s < 5; s++) {
          var so = setObject();
          so.options({ id: s + 1 })
          set_objects.push(so);
       }
       set_objects[0].options( { set: {first_service: options.match.first_service }} );

       function match() {
       };

       // ACCESSORS
       match.options = function(values) {
           if (!arguments.length) return options;
           var vKeys = Object.keys(values);
           var oKeys = Object.keys(options);
           for (var k=0; k < vKeys.length; k++) {
              if (oKeys.indexOf(vKeys[k]) >= 0) {
                 if (typeof(options[vKeys[k]]) == 'object') {
                    var sKeys = Object.keys(values[vKeys[k]]);
                    var osKeys = Object.keys(options[vKeys[k]]);
                    for (var sk=0; sk < sKeys.length; sk++) {
                       if (osKeys.indexOf(sKeys[sk]) >= 0) {
                          options[vKeys[k]][sKeys[sk]] = values[vKeys[k]][sKeys[sk]];
                       }
                    }
                 } else {
                    options[vKeys[k]] = values[vKeys[k]];
                 }
              }
           }
           if (options.set.games % 2 != 0) options.set.games = 12;
           for (var s=0; s < 5; s++) {
              set_objects[s].options( { players: options.players, set: options.set, points: options.points } );
              if (s + 1 == options.match.sets) {
                 var opts = { set: { 
                    tiebreak: options.match.final_set_tiebreak,
                    tiebreak_to: options.match.final_set_tiebreak_to
                 } };
                set_objects[s].options(opts);
              }
           }
           return match;

       }

       match.points = function(values) {
          if (!arguments.length) { 
             var points = [];
             for (var s=0; s < options.match.sets; s++) {
               points = points.concat(set_objects[s].points());
             }
             return points; 
          }

          // add an array of values to the match
          var previous_set_games = 0;
          var previous_set_first_service = options.match.first_service;
          // iterate through sets
          for (var s=0; s < 5; s++) {
             if (values.length) {

                // set first_service for this set based on the first_service and
                // number of games in the previous set
                var opts = { set: { first_service: (previous_set_first_service + previous_set_games) % 2 } };
                set_objects[s].options(opts);

                // add values to the current set
                var result = set_objects[s].points(values);

                var previous_set_first_service = set_objects[s].set.first_service;
                var previous_set_games = set_objects[s].games();
                previous_set_games = previous_set_games ? previous_set_games.length : 0;

                if (result.result) {
                   // there was a final result; call update function, if present
                   if (typeof update === 'function') update();
                   // if there are additional (extra) values, discard them.
                   values = [];

                } else if (result.remnant) {
                   // there were extra values and the match is not complete
                   values = result.remnant;
                }

             } else {
                // if there are no (more) values, reset the current set
                set_objects[s].reset()
             }
          }
       }

       match.winProgression = function() {
          var points = match.points();
          var wp = '';
          points.forEach(p => wp += p.winner);
          return wp;
       }

       match.gameProgression = function() {
          var points = match.points();
          var gp = '';
          points.forEach(function(p) {
             if (p.point.indexOf('G') >= 0) gp += p.winner;
             if (p.point.indexOf('T')) {
                var tb_scores = p.point.split('T').join('').split('-');

                // check for last point of tiebreak
                if (Math.abs(tb_scores[0] - tb_scores[0]) >= 2 
                    && (tb_scores[0] >= options.set.tiebreak_to || tb_scores[1] >= options.set.tiebreak_to)) {
                       gp += p.winner;
                }
             }
          });
          return gp;
       }

       match.push = function(values) {
          var previous_set_games = 0;
          var previous_set_first_service = options.match.first_service;

          // iterate through all sets
          for (var s=0; s < options.match.sets; s++) {
             // add values to set, if possible
             var result = set_objects[s].push(values);

             // if there is an error, return
             if (result.error) return result;

             // if there was a final result; call update function, if present
             if (result.result) {
                if (typeof update === 'function') update();
                break;

             // if there are additional values, continue
             } else if (result.remnant) {
                values = result.remnant;
             }

             // check for end of match, one player has more than half fo the number of sets
             if (match.score().winner) { break; }

             // if the end of current set was reached
             if (result.status == 'eos') {
                previous_set_first_service = set_objects[s].options().set.first_service;
                previous_set_games = set_objects[s].games();
                previous_set_games = previous_set_games ? previous_set_games.length : 0;

                // update first_service of next set based on number of games played this set
                var opts = { set: { first_service: (previous_set_first_service + previous_set_games) % 2 } };
                if (set_objects[s + 1]) set_objects[s + 1].options(opts);

             }
          }
          return result;
       }

       match.pop = function() {
          var row = undefined;
          for (var s = options.match.sets - 1; s >= 0; s--) {
             row = set_objects[s].pop();
             if (row != undefined) break;
          }
          return row;
       }

       match.players = function(a, b) {
           if (!arguments.length) return [options.players[0], options.players[1]];
           if (typeof a == 'string') options.players[0] = a;
           if (typeof b == 'string') options.players[1] = b;
           if (typeof a == 'string' && typeof b == 'string') {
              set_objects.forEach(s => s.players(a, b));
           }
           return match;
       }

       match.score = function() {
          var scoreboards = [];
          var sets_won = [0, 0];
          for (var s=0; s < 5; s++) {
             var score = set_objects[s].score();
             if (score) {
                scoreboards.push(score);
                if (score.complete) sets_won[score.leader] += 1;
             }
          }

          var match_score = '';
          var match_winner = '';
          var match_loser = '';
          // check if there is a match winner
          // winner has won more than half of the sets for match format
          if (sets_won[0] > (options.match.sets / 2) || sets_won[1] > (match.options.sets / 2)) {
             var winner = sets_won[0] > sets_won[1] ? 0 : 1;
             match_winner = options.players[winner];
             match_loser = options.players[1 - winner];
             // build match score string
             for (var s=0; s < scoreboards.length; s++) {
                if (scoreboards[s].leader == winner) {
                   match_score += scoreboards[s].score;
                } else {
                   var score_split = scoreboards[s].score.split(' ');
                   var tbscore = score_split[0].split('(');
                   if (tbscore) {
                      match_score += tbscore[0].split('-').reverse().join('-');
                   } else {
                      match_score += score_split[0].split('-').reverse().join('-');
                   }
                   if (tbscore[1]) match_score += '(' + tbscore[1];
                   if (score_split[1]) match_score += score_split[1];
                }
                if (s < scoreboards.length - 1) match_score += ', ';
             }
          }
          return { sets: scoreboards, match_score: match_score, winner: match_winner, loser: match_loser };
       }

       match.reset = function() {
          for (var s=0; s < 5; s++) {
             set_objects[s].reset();
          }
       }

      return match;

      function setObject() {

          // options which should be accessible via ACCESSORS
          var points = [];              // representation of every point in set
          var player_data = [[], []]; // player specific data
          var game_data = [];         // game specific data

          var options = {

            id: 0,
            players: { 0: 'player one', 1: 'player two'},

            set: {
               games: 12,
               advantage: true,
               tiebreak: true,
               tiebreak_to: 7,
               first_service: undefined
            },

            points: {
               to_set: 24
            }
          }

          function set() {
          };

          // REUSABLE functions
          // ------------------

          function getScore(point_number) {
            if (!points[point_number]) return;

            var tiebreak;
            var point = points[point_number].point;

            if (points[point_number].point.indexOf('T') >= 0) {
               var tscore = points[point_number].point.split('-').map(function(m) { return parseInt(m.replace('T', '')); });
               if (Math.max.apply(null, tscore) >= options.set.tiebreak_to && Math.abs(tscore[0] - tscore[1]) > 1) {
                  var game = game_data[points[point_number].game];
                  point = '';
                  tiebreak = Number(Math.min.apply(null, tscore));

               } else {
                  var game = game_data[points[point_number].game - 1];
               }
            } else {
               if (points[point_number].point.indexOf('G') >= 0) {
                  var game = game_data[points[point_number].game];
                  point = '';
               } else {
                  var game = game_data[points[point_number].game - 1];
               }
            }
            var leader = game == undefined ? undefined : 
                         game.score[0] > game.score[1] ? 0 :
                         game.score[1] > game.score[0] ? 1 : undefined;
            var score  = game == undefined ? '0-0' :
                         leader == 0 ? game.score[0] + '-' + game.score[1] : 
                         game.score[1] + '-' + game.score[0];
            var legend = leader == undefined ? options.players[0].split(' ').last() + '/' + options.players[1].split(' ').last() :
                                               options.players[leader];

            if (tiebreak != undefined) score = score + '(' + tiebreak + ')';

            var complete = false;
            if (game) {
               if (game.score[0] == (options.set.games / 2) + 1 || game.score[1] == (options.set.games / 2) + 1) complete = true;
               if (game.score[0] == (options.set.games / 2) && game.score[1] < (options.set.games / 2) - 1) complete = true;
               if (game.score[1] == (options.set.games / 2) && game.score[0] < (options.set.games / 2) - 1) complete = true;
            } else {
               game = { score: [0, 0] };
            }

            return { score: score, point: point, legend: legend, leader: leader, games: game.score, tiebreak: tiebreak, complete: complete };
          }

          var get_key = function(d) { return d && d.key; };

          function add_index(d, i) {
             for (var v=0; v<d.length; v++) { d[v]['_i'] = i; }
             return d;
          }

          function tiebreakGame() {
             var score = getScore(points.length - 1);
             var tiebreak = score ? options.set.tiebreak && score.games[0] == (options.set.games / 2) && score.games[1] == (options.set.games / 2) : false;
             return tiebreak ? options.id : false;
          }

          function determineWinner(point) {
             var last_point = points.length ? points[points.length - 1].point : '0-0';
             last_point = last_point.indexOf('G') >= 0 ? '0-0' : last_point;
             if (point.indexOf('T') >= 0) {
                var ctv = validTiebreakScoreValue(point);
                // winner is the score that equals 1
                if (ctv && last_point == '0-0') return ctv[0] == 1 ? 0 : 1;
                var last_ctv = validTiebreakScoreValue(last_point);
                // winner is whichever score has changed
                return ctv[0] != last_ctv[0] ? 0 : 1;
             } else {
                return progression[last_point].indexOf(point);
             }
          }

          function determinePoint(winner) {
             var last_point = points.length ? points[points.length - 1].point : '0-0';
             last_point = last_point.indexOf('G') >= 0 ? '0-0' : last_point;
             var games = points.length ? points.map(function(m) { return m.point.indexOf('G') >= 0 ? 1 : 0; }).reduce(function(a, b){return a+b;}) : 0;
             if (games < options.set.games || !options.set.tiebreak) return progression[last_point][winner];
             if (last_point == '0-0') last_point = '0T-0T';
             var score = last_point.split('-');
             score[winner] = (parseInt(score[winner].replace('T','')) + 1) + 'T';
             return score.join('-');
          }

          function nextService() {
             var last_point = set.points().last();

             // if no points yet in set, return first_service value
             if (!last_point) return options.set.first_service;

             // determine which game of the set
             var game_number = last_point.game;
             if (last_point.point.indexOf('G') >= 0) game_number += 1;

             // check if last point was played in a tiebreak
             var tiebreak_game = (last_point.point.indexOf('T') >= 0) ? true : false;

             var server = (parseInt(options.set.first_service) + game_number) % 2;

             if (tiebreak_game) {
                var tb_scores = last_point.point.split('T').join('').split('-');
                var tiebreak_point = tb_scores.reduce((a, b) => parseInt(a) + parseInt(b));;
                var server = ((tiebreak_point + 1) % 4) < 2 ? server : 1 - server;

                // check for last point of tiebreak
                if (Math.abs(tb_scores[0] - tb_scores[0]) >= 2 
                    && (tb_scores[0] >= options.set.tiebreak_to || tb_scores[1] >= options.set.tiebreak_to)) {
                       console.log('Last Point of Tiebreak');
                       game_number = last_point.game + 1;
                       server = (parseInt(options.set.first_service) + game_number) % 2;
                }
             }
             return server;
          }

          function pushRow(value) {
             if (player_data[0].length && (player_data[0].last().pts == 0 || player_data[1].last().pts == 0)) {
                // set has been completed
                return { result: false, status: 'eos' };
             }

             if (['0', '1', 'S', 'A', 'D', 'R'].indexOf(String(value)) >= 0 ) {
                var server = nextService();

                if (['S', 'A'].indexOf(value) >= 0) { value = server; }
                if (['D', 'R'].indexOf(value) >= 0) { value = 1 - server; }

                var point = determinePoint(value);
                var row = { winner: parseInt(value), point: point };
                points.push(row);
                return { result: true, point: row };
             }

             if (typeof value == 'object' && (value.point || ["0", "1", "S", "A", "D", "R"].indexOf(String(value.winner)) >= 0)) {
                if (value.point) {
                   var sequence_point = checkSequence(value.point);
                   if (!sequence_point) return { result: false, error: 'sequence', point: value.point };
                   var winner = determineWinner(sequence_point);
                   if (value.winner && value.winner != winner) return { result: false, error: 'winner mismatch' };
                   value.winner = winner;
                   value.point = sequence_point;
                } else {
                   var server = nextService();
                   if (['S', 'A'].indexOf(value.winner) >= 0) { value.winner = server; }
                   if (['D', 'R'].indexOf(value.winner) >= 0) { value.winner = 1 - server; }
                   value.winner = parseInt(value.winner);
                   value.point = determinePoint(value.winner);
                }
                points.push(value);
                return { result: true, point: value };
             }

             var sequence_point = checkSequence(value);
             if (sequence_point) {
                var row = { winner: determineWinner(sequence_point), point: sequence_point };
                points.push(row);
                return { result: true, point: row };
             } 
             
             return { result: false, error: 'invalid point', point: value };
          }

          function checkSequence(point) {
             var last_row = points.length ? points[points.length - 1] : { point: '0-0' };
             var last_point = typeof last_row == 'object' ? last_row.point : last_row;
             last_point = last_point.indexOf('G') >= 0 ? '0-0' : last_point;

             var tiebreak_game = tiebreakGame();
             var valid_point = (progression[last_point] && progression[last_point].indexOf(point) >= 0);

             if (point.indexOf('T') >= 0 && options.set.tiebreak && set.games().length >= options.set.games) {
                return checkTiebreak(point) ? point : false;
             }

             // need to handle tiebreak_game && valid_point && final_set no tiebreak
             if (tiebreak_game && !valid_point) {
                // point score doesn't include 'T', but should be a tiebreak
                if (point.indexOf('G') >= 0) {
                   var scores = point.split('-');
                   var winner = scores.indexOf('G');
                   var last_value = last_point.split('-')[winner].replace('T', '');
                   scores[winner] = parseInt(last_value) + 1;
                   point = scores.join('-');
                }
                var tb_point = point.split('-').map(m => m + 'T').join('-');

                return checkTiebreak(tb_point) ? tb_point : false;
             }

             if ( last_point == undefined || last_point.indexOf('G') >= 0 || last_point.indexOf('T') >= 0) { last_point = '0-0'; }
             if ( progression[last_point] && progression[last_point].indexOf(point) >= 0 ) { return point; }
             return false;

             function checkTiebreak(tb_point) {
                if (last_point == '0-0' && ['1T-0T', '0T-1T'].indexOf(tb_point) >= 0) { return true; }
                var ctv = validTiebreakScoreValue(tb_point);
                var last_ctv = validTiebreakScoreValue(last_point);
                // insure the total of the new tiebreak score is one more than previous total

                if (!ctv || !last_ctv) {
                   return false;
                }

                var valid_score = (ctv.reduce(function(a, b){return a+b}) == last_ctv.reduce(function(a, b){return a+b}) + 1);
                // insure that at least one of the tiebreak scores hasn't changed
                return valid_score && (ctv[0] == last_ctv[0] || ctv[1] == last_ctv[1]);
             }
          }

          function validTiebreakScoreValue(point) {
             var score = point.split('-').map(function(m) { return m[m.length - 1] == 'T' ? 1 : 0 }).reduce(function(a, b){return a+b;});
             if (score == 2) return point.split('T').join('').split('-').map(function(m) { return parseInt(m); });
             return false;
          }

          function dataCalcs() {
             game_data = [];
             if (!points.length) return;
             var line0 = [{pts: options.points.to_set}];
             var line1 = [{pts: options.points.to_set}];
             var pw = undefined;                  // point winner
             var lpw = undefined;                 // last point winner
             var pc  = [0, 0];                    // points counted
             var gp  = [0, 0];                    // game points
             var gpc = [0, 0];                    // game points counted
             var game_number = 0;
             var match_game_number = 0;
             var game_first_point = 0;
             var game_count = [0, 0];
             var game_goal = 4;
             var tiebreak_game = false;

             for (var i=0; i < points.length; i++) {
                var neg = {0: 0, 1: 0};
                if (typeof points[i] == 'object') {
                   var pw = String(points[i].winner);
                } else {
                   var pw = String(points[i]);      // point winner
                }

                if (pw == '' || ["0", "1", "S", "A", "D", "R"].indexOf(pw) < 0) { continue; }

                // check for new game
                if (Math.abs(gpc[0] - gpc[1]) == game_goal) {        
                   if (lpw) {
                      game_count[lpw] += 1;
                   }
                   game_data.push({range: [game_first_point, i - 1], winner: lpw, score: game_count.slice(), tiebreak: tiebreak_game });
                   tiebreak_game = false;
                   game_first_point = i;
                   game_number += 1;
                   if (gp[0] >= game_goal && gp[0] > gp[1] + 1) { 
                      pc[0] += game_goal; 
                   }
                   if (gp[1] >= game_goal && gp[1] > gp[0] + 1) { 
                      pc[1] += game_goal; 
                   }
       
                   if (game_count[0] == ((options.set.games - 2) / 2) && game_count[0] == game_count[1]) { 
                      pc[0] -= game_goal;
                      pc[1] -= game_goal;
                   }
                   if (game_count[0] == (options.set.games / 2) && game_count[0] == game_count[1] && options.set.tiebreak) { 
                      tiebreak_game = true;
                      game_goal = options.set.tiebreak_to;
                      pc[0] -= 3;
                      pc[1] -= 3;
                   }
                   // final set no tiebreak
                   if (game_count[0] + game_count[1] >= options.set.games && !options.set.tiebreak) { 
                      if (game_count[0] == game_count[1]) { 
                         pc[0] -= game_goal;
                         pc[1] -= game_goal;
                      }
                   }
                   gp  = [0, 0]; 
                   gpc = [0, 0]; 
                }

                var server = (parseInt(options.set.first_service) + game_number) % 2;
                if (tiebreak_game) {
                   var tiebreak_point = i - game_first_point;
                   var server = ((tiebreak_point + 1) % 4) < 2 ? server : 1 - server;
                }

                // transform pw to 0/1 notation
                if (['S', 'A'].indexOf(pw) >= 0) { pw = server; }
                if (['D', 'R'].indexOf(pw) >= 0) { pw = 1 - server; }

                lpw = pw;

                gp[pw] += 1;

                if (Math.abs(gp[0] + gp[1] < (game_goal * 2 - 2))) {
                   // e.g. not yet to 3-3
                   gpc[0] = (gp[1] == game_goal) ? 0 : gp[0];
                   gpc[1] = (gp[0] == game_goal) ? 0 : gp[1];

                   if (options.set.advantage && gp[0] == game_goal - 1) {
                      neg[1] = 1;
                   } else if (options.set.advantage && gp[1] == game_goal - 1) {
                      neg[0] = 1;
                   }
                } else {
                   // e.g. deuce or beyond
                   if (gp[0] == gp[1]) {
                      // scores are equal
                      gpc[0] = game_goal - 2;
                      gpc[1] = game_goal - 2;
                   } else if (gp[0] > gp[1]) {
                      if (gp[0] == gp[1] + 2) {
                         gpc[0] = game_goal;
                         gpc[1] = 0;
                      } else {
                         gpc[0] = game_goal - 1;
                         gpc[1] = game_goal - 3;
                      }
                   } else {
                      if (gp[1] == gp[0] + 2) {
                         gpc[1] = game_goal;
                         gpc[0] = 0;
                      } else {
                         gpc[1] = game_goal - 1;
                         gpc[0] = game_goal - 3;
                      }
                   }
                }

                var pts0 = options.points.to_set - (pc[0] + gpc[0]);
                var pts1 = options.points.to_set - (pc[1] + gpc[1]);

                line0.push( { pts: pts0 + neg[0] });
                line1.push( { pts: pts1 + neg[1] });

                // if (server != undefined && points[i].server == undefined) { points[i].server = server; }
                points[i].server = server;
                checkBreakpoint(i);
                points[i].game = game_number;
             }
             if (pw) {
                game_count[pw] += 1; // only add if end of game
             }
             game_data.push({range: [game_first_point, i - 1], winner: pw, score: game_count.slice(), tiebreak: tiebreak_game });
             player_data = [line0, line1];

          }

          function checkBreakpoint(point_number) {
             var last_point = (points.length && point_number >= 1) ? points[point_number - 1].point : '0-0';
             if (progression[last_point]) {
                if (progression[last_point][0].indexOf('G') >= 0) {
                   if (points[point_number].server == 1) { 
                      points[point_number].breakpoint = 0; 
                   } else {
                      points[point_number].gamepoint = 0;
                   }
                } else if (progression[last_point][1].indexOf('G') >= 0) {
                   if (points[point_number].server == 0) { 
                      points[point_number].breakpoint = 1; 
                   } else {
                      points[point_number].gamepoint = 1;
                   }
                }
             }
          }

          function checkOptions() {
             if (options.set.games % 2 != 0) options.set.games = 12;
          }

          // ACCESSORS

          // allows updating individual options and suboptions
          // while preserving state of other options
          set.options = function(values) {
              if (!arguments.length) return options;
              var vKeys = Object.keys(values);
              var oKeys = Object.keys(options);
              for (var k=0; k < vKeys.length; k++) {
                 if (oKeys.indexOf(vKeys[k]) >= 0) {
                    if (typeof(options[vKeys[k]]) == 'object') {
                       var sKeys = Object.keys(values[vKeys[k]]);
                       var osKeys = Object.keys(options[vKeys[k]]);
                       for (var sk=0; sk < sKeys.length; sk++) {
                          if (osKeys.indexOf(sKeys[sk]) >= 0) {
                             options[vKeys[k]][sKeys[sk]] = values[vKeys[k]][sKeys[sk]];
                          }
                       }
                    } else {
                       options[vKeys[k]] = values[vKeys[k]];
                    }
                 }
              }
              checkOptions();
              return set;
          }

         set.events = function(functions) {
              if (!arguments.length) return events;
              var fKeys = Object.keys(functions);
              var eKeys = Object.keys(events);
              for (var k=0; k < fKeys.length; k++) {
                 if (eKeys.indexOf(fKeys[k]) >= 0) events[fKeys[k]] = functions[fKeys[k]];
              }
              return set;
         }

          set.points = function(value) {
             if (!arguments.length) return points;
             points = [];
             player_data = [[],[]];
             game_data = [];
             return set.push(value);
          };

          set.score = function() {
             return getScore(points.length - 1);
          }

          set.games = function() {
             return game_data;
          }

          // add a point or array of points
          set.push = function(values) {
             if (!arguments.length) {
                console.log('no argument given');
                return false;
             }
             var _values = JSON.parse(JSON.stringify(values));

             if ( _values.constructor === Array ) {

                for (var i=0; i < _values.length; i++) {
                   var result = pushRow(_values[i]);
                   dataCalcs();
                   if (!result.result) { 
                      result.remnant = _values.slice(i);
                      break; 
                   }
                }
                
             } else {
                var result = pushRow(_values);
                dataCalcs();
             }
             return result;
          }

          set.pop = function() {
              var row = points.pop();
              if (!points.length) {
                 set.reset()
              } else {
                 // set.update();
              }
              return row;
          };

          set.reset = function() {
             points = [];
             player_data = [[], []];
             game_data = [];
             // set.update();
          }

          set.players = function(a, b) {
              if (!arguments.length) return [options.players[0], options.players[1]];
              if (typeof a == 'string') options.players[0] = a;
              if (typeof b == 'string') options.players[1] = b;
              return set;
          }

          // END ACCESSORS
          
          // DATA
          // -------------

          var valid_points = [
             '0-15', '0-30', '0-40', '0-G', '15-0', '15-15', '15-30', '15-40', '15-G', '30-0', '30-15', '30-30', '30-40', '30-G',
             '40-0', 'G-0', '40-15', 'G-15', '40-30', 'G-30', '40-40', '40-A', '40-G', 'A-40', 'G-40'
          ]

          var progression = { 
             '0-0'  : ['15-0',  '0-15'], '0-15' : ['15-15', '0-30'], '0-30' : ['15-30', '0-40'], '0-40' : ['15-40', '0-G'], 
             '15-0' : ['30-0',  '15-15'], '15-15': ['30-15', '15-30'], '15-30': ['30-30', '15-40'], '15-40': ['30-40', '15-G'], 
             '30-0' : ['40-0',  '30-15'], '30-15': ['40-15', '30-30'], '30-30': ['40-30', '30-40'], '30-40': ['40-40', '30-G'], 
             '40-0' : ['G-0',   '40-15'], '40-15': ['G-15',  '40-30'], '40-30': ['G-30',  '40-40'], '40-40': ['A-40',  '40-A'], 
             'A-40' : ['G-40',  '40-40'], '40-A' : ['40-40', '40-G']
          };

          return set;
      }
   }

   mo.validGames = validGames;
   function validGames(game) {
      if (Array.isArray(game)) game = game.join('');
      if (game.indexOf(',') > 0) game = game.split(',').join('');
      if (game.indexOf(';') > 0) game = game.split(';').join('');
      var match = matchObject();
      match.options({set: {first_service: 0}});
      match.points(game.split(''));
      if (match.points().last().point.indexOf('G') >= 0) {
         return { wp: match.winProgression(), gp: match.gameProgression(), score: match.score().match_score };
      } else {
         return false;
      }
   }

   mo.validSet = validSet;
   function validSet(set) {
      var errors = [];
      if (set.indexOf('.') >= 0) {
         errors.push('More than one set submitted');
         return false;
      }
      var outcome = true;
      if (set.indexOf(';') > 0) {
         var games = set.split(';');
         for (var g=0; g < games.length; g++) {
            if (games[g].indexOf('/') < 0) {
               if (!validGames(games[g])) {
                  outcome = false;
                  errors.push('Game ' + g + ' is invalid: ' + games[g]);
               }
            } else {
               if (!validTiebreak(games[g])) {
                  outcome = false;
                  errors.push('Game ' + g + ' is an invalid tiebreak: ' + games[g]);
               }
            }
         }
      } 

      // remove all expected separators
      set = set.split('/').join('');
      set = set.split(';').join('');
      set = set.split(',').join('');

      try {
         var match = matchObject();
         match.options({set: {first_service: 0}});
         match.points(set.split(''));
         var score = match.score();
         if (score.sets.length != 1 || !score.sets[0].complete) outcome = false;
      }

      catch (err) {
         console.log('invalid characters in set string');
         outcome = false;
      }

      if (outcome) {
         return { wp: match.winProgression(), gp: match.gameProgression(), score: match.score().match_score };
      } else {
         return { errors: errors };
      }
   }

   mo.validTiebreak = validTiebreak;
   function validTiebreak(tiebreak) {
      var match = matchObject();
      match.options({set: {first_service: 0}});
      match.push('000011110000111100001111000011110000111100001111'.split(''));
      tiebreak = tiebreak.split('/').join('');
      tiebreak = tiebreak.split(',').join('');
      match.push(tiebreak.split(''));
      var score = match.score();
      if (score.sets.length == 1 && score.sets[0].complete) return true;
      return false;
   }

   if (typeof define === "function" && define.amd) define(mo); else if (typeof module === "object" && module.exports) module.exports = mo;
   this.mo = mo;
 
}();
   
