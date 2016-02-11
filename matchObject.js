// TODO
// Add setpoint and matchpoint attributes to checkBreakpoint

if (!Array.prototype.last) { Array.prototype.last = function() { return this[this.length - 1]; }; }

!function() { 
   var mo = {};

   // clients can register callbacks for notification when data updates
   var callbacks = [];

   mo.matchObject = matchObject;
   function matchObject() {

      var options = {
    
          id: 0,
          players: { 0: 'Player One', 1: 'Player Two'},
    
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
          so.options({ id: s })
          set_objects.push(so);
       }
       set_objects[0].options( { set: {first_service: options.match.first_service }} );

       function match() {
       };

       // ACCESSORS

       match.type = 'UMO';

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
           set_objects[0].options( { set: { first_service: options.match.first_service } } )
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

                var previous_set_first_service = set_objects[s].options().set.first_service;
                var previous_set_games = set_objects[s].games();
                previous_set_games = previous_set_games ? previous_set_games.length : 0;

                if (result.result) {
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
          match.update();
       }

       match.winProgression = function() {
          var points = match.points();
          var wp = '';
          // points.forEach(p => wp += p.winner);
          points.forEach(function(p) { wp += p.winner });
          return wp;
       }

       match.gameProgression = function() {
          var points = match.points();
          var gp = '';
          points.forEach(function(p) {
             if (p.score.indexOf('G') >= 0) gp += p.winner;
             if (p.score.indexOf('T')) {
                var tb_scores = p.score.split('T').join('').split('-');

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
                match.update();
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
          match.update();
          return result;
       }

       match.pop = function() {
          var row = undefined;
          for (var s = options.match.sets - 1; s >= 0; s--) {
             row = set_objects[s].pop();
             if (row != undefined) break;
          }
          match.update();
          return row;
       }

       match.update = function() {
          if (!callbacks.length) return;
          callbacks.forEach(function(c) {
             if (typeof c == 'function') c();
          });
       }

       match.callback = function(callback) {
          if (!arguments.length) return callbacks;
          if (typeof callback == 'function') {
             callbacks.push(callback);
          } else if (typeof callback == 'array') {
             callback.foreach(c) (function(c) {
                if (typeof c == 'function') callbacks.push(c);
             });
          }
       }

       match.players = function(a, b) {
          if (!arguments.length) return [options.players[0], options.players[1]];
          if (typeof a == 'string') options.players[0] = a;
          if (typeof b == 'string') options.players[1] = b;
          if (typeof a == 'string' && typeof b == 'string') {
             // set_objects.forEach(s => s.players(a, b));
             set_objects.forEach(function(s) { s.players(a, b) });
          }
          match.update();
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
          if (sets_won[0] > (options.match.sets / 2) || sets_won[1] > (options.match.sets / 2)) {
             var winner = sets_won[0] > sets_won[1] ? 0 : 1;
             match_winner = options.players[winner];
             match_loser = options.players[1 - winner];

             // build match score string
             for (var s=0; s < scoreboards.length; s++) {
                match_score += scoreboards[s].game_score;
                /*
                if (scoreboards[s].leader == winner) {
                   match_score += scoreboards[s].game_score;
                } else {
                   var score_split = scoreboards[s].game_score.split(' ');
                   var tbscore = score_split[0].split('(');
                   if (tbscore) {
                      match_score += tbscore[0].split('-').reverse().join('-');
                   } else {
                      match_score += score_split[0].split('-').reverse().join('-');
                   }
                   if (tbscore[1]) match_score += '(' + tbscore[1];
                   if (score_split[1]) match_score += score_split[1];
                }
                */
                if (s < scoreboards.length - 1) match_score += ', ';
             }
          }
          return { sets: scoreboards, match_score: match_score, winner: match_winner, loser: match_loser };
       }

       match.sets = function() {
          return set_objects.slice(0,options.match.sets);
       }

       // simulate rallies for dev purposes
       match.rr = function() {
          var points = match.points();
          var results = ['Ace', 'Winner', 'Serve Winner', 'Forced Error', 'Unforced Error', 'Double Fault', 'Penalty'];

          points.forEach(function(p) {
             var rr = Math.floor(Math.random() * 25) + 1;
             p.rally = new Array(rr);
             var rre = Math.floor(Math.random() * 7) + 1;
             p.result = results[rre - 1];
          });
       }

       match.nextService = function() {
          var sets = match.score().sets.length;
          if (sets == 0) {
             return options.match.first_service;
          } else {
             return set_objects[sets - 1].nextService();
          }
       }

       var valid_points = [
          '0-15', '0-30', '0-40', '0-G', '15-0', '15-15', '15-30', '15-40', '15-G', '30-0', '30-15', '30-30', '30-40', '30-G',
          '40-0', 'G-0', '40-15', 'G-15', '40-30', 'G-30', '40-40', '40-A', '40-G', 'A-40', 'G-40'
       ]

       match.pointIndex = function(set, game, score) {
          if (set < 0 || set > options.match.sets || game < 0) {
                 return false;
              }
          // var set_points = match.points().map(p => p.set == set ? p : undefined);
          var set_points = match.points().map(function(p) { return p.set == set ? p : undefined });
          // var game_points = set_points.map(p => p && p.game == game ? p : undefined);
          var game_points = set_points.map(function(p) { return p && p.game == game ? p : undefined });

          if (score && valid_points.indexOf(score) >= 0) {
             // var points = game_points.map(p => p && p.score == score ? p : undefined);
             var points = game_points.map(function(p) { return p && p.score == score ? p : undefined });
             for (var p=0; p < points.length; p++) {
                if (points[p] != undefined) return p;
             }
          }

          if (!score) {
             for (var p=0; p < game_points.length; p++) {
                if (game_points[p] != undefined) return p;
             }
          }
          return false;
       }

       match.findPoint = function(set, game, score, lazy) {
          if (set < 0 || set > options.match.sets ||
              game < 0 || !score || valid_points.indexOf(score) < 0) {
                 return false;
              }
          // var game_points = set_objects[set].points().filter(m => m.game == game);;
          var game_points = set_objects[set].points().filter(function(m) { return m.game == game });;

          // var point = game_points.filter(p => p.score == score);
          var point = game_points.filter(function(p) { return p.score == score });
          if (!point.length && lazy) {
             // point = game_points.filter(p => p.score == score.split('-').reverse().join('-'));
             point = game_points.filter(function(p) { return p.score == score.split('-').reverse().join('-') });
          }
          if (point.length) {
             return point[0]
          } else {
             return false;
          }
       }

      return match;

      function setObject() {

          // options which should be accessible via ACCESSORS
          var points = [];             // representation of every point in set
          var player_data = [[], []];  // player specific data
          var game_data = [];          // game specific data

          var options = {

            id: 0,
            players: { 0: 'Player One', 1: 'Player Two'},

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
            var point_score = points[point_number].score;

            if (points[point_number].score.indexOf('T') >= 0) {
               var tscore = points[point_number].score.split('-').map(function(m) { return parseInt(m.replace('T', '')); });
               if (Math.max.apply(null, tscore) >= options.set.tiebreak_to && Math.abs(tscore[0] - tscore[1]) > 1) {
                  var game = game_data[points[point_number].game];
                  point_score = '';
                  tiebreak = Number(Math.min.apply(null, tscore));

               } else {
                  var game = game_data[points[point_number].game - 1];
               }
            } else {
               if (points[point_number].score.indexOf('G') >= 0) {
                  var game = game_data[points[point_number].game];
                  point_score = '';
               } else {
                  var game = game_data[points[point_number].game - 1];
               }
            }
            var leader = game == undefined ? undefined : 
                         game.score[0] > game.score[1] ? 0 :
                         game.score[1] > game.score[0] ? 1 : undefined;
            var game_score  = game == undefined ? '0-0' :
                         game.score[0] + '-' + game.score[1];
                         // leader == 0 ? game.score[0] + '-' + game.score[1] : 
                         // game.score[1] + '-' + game.score[0];
            var legend = leader == undefined ? options.players[0].split(' ').last() + '/' + options.players[1].split(' ').last() :
                                               options.players[leader];

            if (tiebreak != undefined) game_score = game_score + '(' + tiebreak + ')';

            var complete = false;
            if (game) {
               if (game.score[0] == (options.set.games / 2) + 1 || game.score[1] == (options.set.games / 2) + 1) complete = true;
               if (game.score[0] == (options.set.games / 2) && game.score[1] < (options.set.games / 2) - 1) complete = true;
               if (game.score[1] == (options.set.games / 2) && game.score[0] < (options.set.games / 2) - 1) complete = true;
            } else {
               game = { score: [0, 0] };
            }

            return { point_score: point_score, game_score: game_score, legend: legend, leader: leader, games: game.score, tiebreak: tiebreak, complete: complete };
          }

          var get_key = function(d) { return d && d.key; };

          function add_index(d, i) {
             for (var v=0; v<d.length; v++) { d[v]['_i'] = i; }
             return d;
          }

          function tiebreakGame() {
             var score = getScore(points.length - 1);
             var tiebreak = score ? options.set.tiebreak && score.games[0] == (options.set.games / 2) && score.games[1] == (options.set.games / 2) : false;
             return tiebreak ? true : false;
          }

          function determineWinner(score) {
             var last_score = points.length ? points[points.length - 1].score : '0-0';
             last_score = last_score.indexOf('G') >= 0 ? '0-0' : last_score;
             if (score.indexOf('T') >= 0) {
                var ctv = validTiebreakScoreValue(score);
                // winner is the score that equals 1
                if (ctv && last_score == '0-0') return ctv[0] == 1 ? 0 : 1;
                var last_ctv = validTiebreakScoreValue(last_score);
                // winner is whichever score has changed
                return ctv[0] != last_ctv[0] ? 0 : 1;
             } else {
                return progression[last_score].indexOf(score);
             }
          }

          // determin the point score based on previous score and point winner
          function determineScore(winner) {
             var last_score = points.length ? points[points.length - 1].score : '0-0';
             last_score = last_score.indexOf('G') >= 0 ? '0-0' : last_score;
             var games = points.length ? points.map(function(m) { return m.score.indexOf('G') >= 0 ? 1 : 0; }).reduce(function(a, b){return a+b;}) : 0;
             if (games < options.set.games || !options.set.tiebreak) return progression[last_score][winner];
             if (last_score == '0-0') last_score = '0T-0T';
             var score = last_score.split('-');
             score[winner] = (parseInt(score[winner].replace('T','')) + 1) + 'T';
             return score.join('-');
          }

          function pushRow(value) {
             if (player_data[0].length && (player_data[0].last().pts == 0 || player_data[1].last().pts == 0)) {
                // set has been completed
                return { result: false, status: 'eos' };
             }

             var player;
             var point = { set: options.id };
             var server = nextService();

             if ('01SAQDRP'.split('').indexOf(String(value)) >= 0 ) {

                player = value;
                if (['S', 'A', 'Q'].indexOf(value) >= 0) { player = server; }
                if (['D', 'R', 'P'].indexOf(value) >= 0) { player = 1 - server; }
                if (['Q', 'P'].indexOf(value) >= 0) { point.result = 'Penalty'; }
                if (value == 'A') point.result = 'Ace';
                if (value == 'D') point.result = 'Double Fault';

                point.score = determineScore(player);
                point.winner = parseInt(player);
                if ('01'.indexOf(value) >= 0) {
                   point.code = server == point.winner ? 'S' : 'R';
                } else {
                   point.code = value;
                }

                points.push(point);
                return { result: true, point: point };
             }

             if (typeof value == 'object' && (value.score || '01SAQDRP'.split('').indexOf(String(value.winner)) >= 0)) {
                if (value.score) {
                   var sequence_score = checkSequence(value.score);
                   if (!sequence_score) return { result: false, error: 'sequence', score: value.score };
                   var winner = determineWinner(sequence_score);
                   if (value.winner && value.winner != winner) return { result: false, error: 'winner mismatch' };
                   value.winner = winner;
                   value.score = sequence_score;
                } else {
                   if (['S', 'A', 'Q'].indexOf(value.winner) >= 0) { value.winner = server; }
                   if (['D', 'R', 'P'].indexOf(value.winner) >= 0) { value.winner = 1 - server; }
                   if (['Q', 'P'].indexOf(value.winner) >= 0) { point.result = 'Penalty'; }
                   if (value.winner == 'A') point.result = 'Ace';
                   if (value.winner == 'D') point.result = 'Double Fault';
                   value.score = determineScore(value.winner);
                   value.winner = parseInt(value.winner);
                   if ('01'.indexOf(value) >= 0) {
                      value.code = server == value.winner ? 'S' : 'R';
                   } else if ('01SAQDRP'.indexOf(value) >= 0) {
                      value.code = value;
                   }
                }
                value.set = options.id;
                points.push(value);
                return { result: true, point: value };
             }

             var sequence_score = checkSequence(value);
             if (sequence_score) {
                var point = { winner: determineWinner(sequence_score), score: sequence_score, set: options.id };
                points.push(point);
                return { result: true, point: point };
             } 
             
             return { result: false, error: 'invalid point', value: value };
          }

          function checkSequence(score) {
             var last_row = points.length ? points[points.length - 1] : { score: '0-0' };
             var last_score = typeof last_row == 'object' ? last_row.score : last_row;
             last_score = last_score.indexOf('G') >= 0 ? '0-0' : last_score;

             var tiebreak_game = tiebreakGame();
             var valid_point = (progression[last_score] && progression[last_score].indexOf(score) >= 0);

             if (score.indexOf('T') >= 0 && options.set.tiebreak && set.games().length >= options.set.games) {
                return checkTiebreak(score) ? score : false;
             }

             // need to handle tiebreak_game && valid_point && final_set no tiebreak
             if (tiebreak_game && !valid_point) {
                // point score doesn't include 'T', but should be a tiebreak
                if (score.indexOf('G') >= 0) {
                   var scores = score.split('-');
                   var winner = scores.indexOf('G');
                   var last_value = last_score.split('-')[winner].replace('T', '');
                   scores[winner] = parseInt(last_value) + 1;
                   score = scores.join('-');
                }
                // var tb_point = score.split('-').map(m => m + 'T').join('-');
                var tb_point = score.split('-').map(function(m) { return m + 'T' }).join('-');

                return checkTiebreak(tb_point) ? tb_point : false;
             }

             if ( last_score == undefined || last_score.indexOf('G') >= 0 || last_score.indexOf('T') >= 0) { last_score = '0-0'; }
             if ( progression[last_score] && progression[last_score].indexOf(score) >= 0 ) { return score; }
             return false;

             function checkTiebreak(tb_point) {
                if (last_score == '0-0' && ['1T-0T', '0T-1T'].indexOf(tb_point) >= 0) { return true; }
                var ctv = validTiebreakScoreValue(tb_point);
                var last_ctv = validTiebreakScoreValue(last_score);
                // insure the total of the new tiebreak score is one more than previous total

                if (!ctv || !last_ctv) {
                   return false;
                }

                var valid_score = (ctv.reduce(function(a, b){return a+b}) == last_ctv.reduce(function(a, b){return a+b}) + 1);
                // insure that at least one of the tiebreak scores hasn't changed
                return valid_score && (ctv[0] == last_ctv[0] || ctv[1] == last_ctv[1]);
             }
          }

          function validTiebreakScoreValue(score) {
             var tees = score.split('-').map(function(m) { return m[m.length - 1] == 'T' ? 1 : 0 }).reduce(function(a, b){return a+b;});
             if (tees == 2) return score.split('T').join('').split('-').map(function(m) { return parseInt(m); });
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
                   var pw = String(points[i]);
                }

                if (pw == '' || '01SAQDRP'.split('').indexOf(pw) < 0) { continue; }

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
                if (['S', 'A', 'Q'].indexOf(pw) >= 0) { pw = server; }
                if (['D', 'R', 'P'].indexOf(pw) >= 0) { pw = 1 - server; }

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

          // add setpoint and matchpoint attributes
          function checkBreakpoint(point_number) {
             var score = points[point_number].score;
             var server = points[point_number].server;
             if (progression[score]) {
                if (progression[score][0].indexOf('G') >= 0) {
                   if (server == 1) { 
                      points[point_number].breakpoint = 0; 
                   } else {
                      points[point_number].gamepoint = 0;
                   }
                } else if (progression[score][1].indexOf('G') >= 0) {
                   if (server == 0) { 
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

          set.nextService = nextService;
          function nextService() {
             var last_point = set.points().last();

             // if no points yet in set, return first_service value
             if (!last_point) return options.set.first_service;

             // determine which game of the set
             var game_number = last_point.game;
             if (last_point.score.indexOf('G') >= 0) game_number += 1;

             // check if last point was played in a tiebreak
             var tiebreak_game = (last_point.score.indexOf('T') >= 0) ? true : false;

             var server = (parseInt(options.set.first_service) + game_number) % 2;

             if (tiebreak_game) {
                var tb_scores = last_point.score.split('T').join('').split('-');
                // var tiebreak_point = tb_scores.reduce((a, b) => parseInt(a) + parseInt(b));;
                var tiebreak_point = tb_scores.reduce(function(a, b) { return parseInt(a) + parseInt(b) });;
                var server = ((tiebreak_point + 1) % 4) < 2 ? server : 1 - server;

                // check for last point of tiebreak
                if (Math.abs(tb_scores[0] - tb_scores[1]) >= 2 
                    && (tb_scores[0] >= options.set.tiebreak_to || tb_scores[1] >= options.set.tiebreak_to)) {
                       game_number = last_point.game + 1;
                       server = (parseInt(options.set.first_service) + game_number) % 2;
                }
             }
             return server;
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

          set.score = function(point_number) {
             if (!arguments.length) {
                return getScore(points.length - 1);
             } else if (point_number < points.length) {
                return getScore(point_number);
             } else {
                return false;
             }
          }

          set.games = function() {
             return game_data;
          }

          set.player_data = function() {
             return player_data;
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
               dataCalcs();
            }
            return row;
          };

          set.reset = function() {
             points = [];
             player_data = [[], []];
             game_data = [];
               dataCalcs();
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
      if (match.points().last().score.indexOf('G') >= 0) {
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
   
