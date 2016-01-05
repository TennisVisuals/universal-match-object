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
             tiebreak_to: 7,
             average_points: 56
          },
    
          points: {
             to_set: 24
          }
       }
    
       // programmatic
       var set_objects = [];

       // prepare sets
       for (var s=0; s < 5; s++) {
          set_objects.push(setObject());
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
           checkOptions();
           for (var s=0; s < 5; s++) {
              set_objects[s].options( { players: options.players, set: options.set, points: options.points } );
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
          var ngames = 0;
          for (var s=0; s < 5; s++) {
             if (values.length) {
                if (s + 1 == options.match.sets) { 
                   var opts = { set: { 
                      first_service: (options.match.first_service + ngames) % 2,
                      tiebreak: options.match.final_set_tiebreak,
                      tiebreak_to: options.match.final_set_tiebreak_to
                   } };
                } else {
                   var opts = { set: { first_service: (options.match.first_service + ngames) % 2 } };
                }
                set_objects[s].players(options.players).options(opts);
                var result = set_objects[s].points(values);
                var sg = set_objects[s].games();
                var lgt = sg.last().tiebreak;
                ngames += sg.length - (lgt ? 1 : 0);

                if (result.result) {
                   if (typeof update === 'function') update();
                   values = [];
                } else if (result.remnant) {
                   values = result.remnant;
                }
             } else {
                set_objects[s].reset()
             }
          }
       }

       match.push = function(values) {
          for (var s=0; s < options.match.sets; s++) {
             var ngames = 0;
             var result = set_objects[s].push(values);
             if (result.result) {
                if (typeof update === 'function') update();
                break;
             } else if (result.remnant) {
                values = result.remnant;
             }
             if (result.status == 'eos') {
                var sg = set_objects[s].games();
                var lgt = sg.last().tiebreak;
                ngames += sg.length - (lgt ? 1 : 0);
                var opts = { set: { first_service: (options.match.first_service + ngames) % 2 } };
                // update first_service of next set based on number of games played this set
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
              for (var s=0; s < 5; s++) {
                 set_objects[s].players(a, b);
              }
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
                sets_won[score.leader] += 1;
             }
          }

          var match_score = '';
          var match_winner = '';
          var match_loser = '';
          // check if there is a match winner
          if (sets_won[0] != sets_won[1]) {
             var winner = sets_won[0] > sets_won[1] ? 0 : 1;
             match_winner = options.players[winner];
             match_loser = options.players[1 - winner];
             // build match score string
             for (var s=0; s < scoreboards.length; s++) {
                if (scoreboards[s].leader == winner) {
                   match_score += scoreboards[s].score;
                } else {
                   var score_split = scoreboards[s].score.split(' ');
                   match_score += score_split[0].split('-').reverse().join('-');
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

       function checkOptions() {
          if (options.set.games % 2 != 0) options.set.games = 12;
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
               first_service: undefined,
               average_points: 56
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

            var tiebreak = '';
            var point = points[point_number].point;

            if (points[point_number].point.indexOf('T') >= 0) {
               var tscore = points[point_number].point.split('-').map(function(m) { return parseInt(m.replace('T', '')); });
               if (Math.max.apply(null, tscore) >= options.set.tiebreak_to && Math.abs(tscore[0] - tscore[1]) > 1) {
                  var game = game_data[points[point_number].game];
                  point = '';
                  tiebreak = '(' + Number(Math.min.apply(null, tscore)) + ')';

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

            if (tiebreak) score = score + tiebreak;

            var complete = false;
            if (game) {
               if (game.score[0] == (options.set.games / 2) + 1 || game.score[1] == (options.set.games / 2) + 1) complete = true;
               if (game.score[0] == (options.set.games / 2) && game.score[1] < (options.set.games / 2) - 1) complete = true;
               if (game.score[1] == (options.set.games / 2) && game.score[0] < (options.set.games / 2) - 1) complete = true;
            } else {
               game = { score: [0, 0] };
            }

            return { score: score, point: point, legend: legend, leader: leader, games: game.score, complete: complete };
          }

          var get_key = function(d) { return d && d.key; };

          function foo(d, i, self) {
             // console.log(d, points[d].point, game_data[points[d].game].score);
          }

          function add_index(d, i) {
             for (var v=0; v<d.length; v++) { d[v]['_i'] = i; }
             return d;
          }

          function checkSequence(point) {
             var last_row = points.length ? points[points.length - 1] : { point: '0-0' };
             var last_point = typeof last_row == 'object' ? last_row.point : last_row;
             last_point = last_point.indexOf('G') >= 0 ? '0-0' : last_point;
             if (point.indexOf('T') >= 0 && options.set.tiebreak && set.games().length >= options.set.games) {
                if (last_point == '0-0' && ['1T-0T', '0T-1T'].indexOf(point) >= 0) { return true; }
                var score = valid_tiebreak(point);
                var last_score = valid_tiebreak(last_point);
                if (score.reduce(function(a, b){return a+b}) == last_score.reduce(function(a, b){return a+b}) + 1) { return true; }
             }  else {
                if ( last_point == undefined || last_point.indexOf('G') >= 0 || last_point.indexOf('T') >= 0) { last_point = '0-0'; }
                if ( progression[last_point].indexOf(point) >= 0 ) { return true; }
                return false;
             }
          }

          function valid_tiebreak(point) {
             var score = point.split('-').map(function(m) { return m[m.length - 1] == 'T' ? 1 : 0 }).reduce(function(a, b){return a+b;});
             if (score == 2) return point.split('T').join('').split('-').map(function(m) { return parseInt(m); });
             return false;
          }

          function determineWinner(point) {
             var last_point = points.length ? points[points.length - 1].point : '0-0';
             last_point = last_point.indexOf('G') >= 0 ? '0-0' : last_point;
             if (point.indexOf('T') >= 0) {
                var score = valid_tiebreak(point);
                // winner is the score that equals 1
                if (score && last_point == '0-0') return score[0] == 1 ? 0 : 1;
                var last_score = valid_tiebreak(last_point);
                // winner is whichever score has changed
                return score[0] != last_score[0] ? 0 : 1;
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
             if (!last_point) return options.set.first_service;
             var game_number = last_point.game;
             if (last_point.point.indexOf('G') >= 0) game_number += 1;
             var tiebreak_game = (last_point.point.indexOf('T') >= 0) ? true : false;

             var server = (parseInt(options.set.first_service) + game_number) % 2;
             if (tiebreak_game) {
                var tb_scores = last_point.point.split('T').join('').split('-');
                var tiebreak_point = tb_scores.reduce((a, b) => parseInt(a) + parseInt(b));;
                var server = ((tiebreak_point + 1) % 4) < 2 ? server : 1 - server;

                // check for last point of tiebreak
                if (Math.abs(tb_scores[0] - tb_scores[0]) >= 2 
                    && (tb_scores[0] >= options.set.tiebreak_to || tb_scores[1] >= options.set.tiebreak_to)) {
                       game_number = last_point.game + 1;
                       server = (parseInt(options.set.first_service) + game_number) % 2;
                }
             }
             return server;
          }

          function pushRow(value) {
             if (player_data[0].length && (player_data[0].last().pts == 0 || player_data[1].last().pts == 0)) {
                return { result: false, status: 'eos' };       // set has been completed
             }

             if (['0', '1', 'S', 'A', 'D', 'R'].indexOf(String(value)) >= 0 ) {

                var server = nextService();

                if (['S', 'A'].indexOf(value) >= 0) { value = server; }
                if (['D', 'R'].indexOf(value) >= 0) { value = 1 - server; }

                var point = determinePoint(value);
                var row = { winner: parseInt(value), point: point };
             } else if (valid_points.indexOf(value) >= 0 && checkSequence(value)) {
                var row = { winner: determineWinner(value), point: value };
             } else if (typeof value == 'object' && (value.point || ["0", "1"].indexOf(String(value.winner)) >= 0)) {
                if (value.point) {
                   var winner = determineWinner(value.point);
                   if (!checkSequence(value.point)) return { result: false, error: 'sequence' };
                   if (value.winner != winner) return { result: false, error: 'mismatch' };
                   value.winner = winner;
                } else {
                   value.winner = parseInt(value.winner);
                   value.point = determinePoint(value.winner);
                }
                var row = value;
             } else {
                return { result: false, error: 'invalid point' };
             }
             points.push(row);
             return { result: true };
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
             if (!arguments.length) return false;
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
      if (game.indexOf(';') > 0) game = game.split(',').join('');
      var match = matchObject();
      match.options({set: {first_service: 0}});
      match.points(game.split(''));
      return match.points().last().point.indexOf('G') >= 0;
   }

   mo.validSet = validSet;
   function validSet(set) {
      var outcome = true;
      if (set.indexOf(';') > 0) {
         var games = set.split(';');
         for (var g=0; g < games.length; g++) {
            if (games[g].indexOf('/') < 0) {
               if (!validGames(games[g])) {
                  outcome = false;
                  console.log('Game', g, 'is invalid:', games[g]);
               }
            } else {
               if (!validTiebreak(games[g])) {
                  outcome = false;
                  console.log('Game', g, 'is an invalid tiebreak:', games[g]);
               }
            }
         }
      } 

      // remove all expected separators
      set = set.split('/').join('');
      set = set.split(';').join('');
      set = set.split(',').join('');

      var match = matchObject();
      match.options({set: {first_service: 0}});
      match.points(set.split(''));
      var score = match.score();
      if (score.sets.length != 1 || !score.sets[0].complete) outcome = false;

      return outcome
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
   
