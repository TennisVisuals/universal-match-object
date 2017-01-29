!function() {

   let mo = function() {};

   // these events will propagate to all objects created with factory functions
   mo.addPoint_events = [];
   mo.undo_events = [];

   mo.pointParser = defaultPointParser;

   let formats = {
      games: {
         'advantage': { name: 'Advantage Game', tiebreak: false, hasDecider: false, threshold: 4, minDiff: 2, },
         'noAdvantage': { name: 'No Advantage Game', tiebreak: false, hasDecider: true, threshold: 4, minDiff: 1, },
         'tiebreak7a': { name: 'Tiebreak to 7', tiebreak: true, hasDecider: false, threshold: 7, minDiff: 2,  },
         'tiebreak10a': { name: 'Tiebreak to 10', tiebreak: true, hasDecider: false, threshold: 10, minDiff: 2, },
         'tiebreak12a': { name: 'Tiebreak to 10', tiebreak: true, hasDecider: false, threshold: 12, minDiff: 2, },
         'tiebreak9n': { name: 'Tiebreak to 9, Golden Point', tiebreak: true, hasDecider: true, threshold: 9, minDiff: 1, },
      },
      sets: {
         'AdSetsTo6tb7': { 
            name: 'Advantage, 6 games for set, Tiebreak to 7',
            hasDecider: true, threshold: 6, minDiff: 2, children: 'advantage', decidingChild: 'tiebreak7a', 
         },
         'NoAdSetsTo6tb7': { 
            name: 'No-Ad, 6 games for set, Tiebreak to 7',
            hasDecider: true, threshold: 6, minDiff: 2, children: 'noAdvantage', decidingChild: 'tiebreak7a', 
         },
         'longSetTo6by2': { 
            name: 'Advantage, 6 games for set, win by 2 games',
            hasDecider: false, threshold: 6, minDiff: 2, children: 'advantage', decidingChild: 'advantage', 
         },
         'supertiebreak': { 
            name: 'Supertiebreak',
            hasDecider: true, threshold: 1, minDiff: 1, children: 'tiebreak10a',  decidingChild: 'tiebreak10a', 
         },
         'pro10a12': { 
            name: '10 Game No Ad Pro Set',
            hasDecider: true, threshold: 10, minDiff: 2, children: 'noAdvantage', decidingChild: 'tiebreak12a',
         },
      },
      matches: {
         '3_6a_7': { 
            name: 'best of 3 sets, Advantage, 6 games for set, Tiebreak to 7', 
            hasDecider: true, threshold: 2, minDiff: 0, children: 'AdSetsTo6tb7', decidingChild: 'AdSetsTo6tb7',
         },
         '3_6n_7': { 
            name: 'best of 3 sets, No Advantage, 6 games for set, Tiebreak to 7', 
            hasDecider: true, threshold: 2, minDiff: 0, children: 'NoAdSetsTo6tb7', decidingChild: 'NoAdSetsTo6tb7',
         },
         '3_6n_10': { 
            name: 'best of 3 sets, No-Ad, 6 games for set, Tiebreak to 7, final set Supertiebreak', 
            hasDecider: true, threshold: 2, minDiff: 0, children: 'NoAdSetsTo6tb7', decidingChild: 'supertiebreak',
         },
         '5_6a_7': { 
            name: 'best of 5 sets, Advantage, 6 games for set, Tiebreak to 7', 
            hasDecider: true, threshold: 3, minDiff: 0, children: 'AdSetsTo6tb7', decidingChild: 'AdSetsTo6tb7',
         },
         '3_6a_7_long': { 
            name: 'best of 5 sets, Advantage, 6 games for set, Tiebreak to 7, final set by 2 games', 
            hasDecider: true, threshold: 2, minDiff: 0, children: 'AdSetsTo6tb7', decidingChild: 'longSetTo6by2',
         },
         '5_6a_7_long': { 
            name: 'best of 5 sets, Advantage, 6 games for set, Tiebreak to 7, final set by 2 games', 
            hasDecider: true, threshold: 3, minDiff: 0, children: 'AdSetsTo6tb7', decidingChild: 'longSetTo6by2',
         },
      },
   }

   mo.format = function(type, code, name, tiebreak, hasDecider, threshold, minDiff, children, decidingChild) {
      if (!arguments.length) return formats;
      let hasType = Object.keys(formats).indexOf(type) >= 0;
      let hasCode = hasType && Object.keys(formats[type]).indexOf(code) >= 0;
      if (arguments.length == 1) return hasType ? formats[type] : false;
      if (arguments.length == 2) return (hasType && hasCode) ? formats[type][code] : false;
      if (hasType && hasCode) return false;
      formats[type][code] = { name, tiebreak, hasDecider, threshold, minDiff, children, decidingChild };
      return true;
   }

   mo.stateObject = function({index, object, parent_object, child, format, common = mo.common()} = {}) {
      let so = {};
      so.child = child;
      so.format = format;
      so.child_attributes = ['hasDecider', 'threshold', 'minDiff', 'tiebreak', 'code', 'name'];

      (so.reset = function(format) {
         so.children = [];
         so.local_history = [];
         so.counter = [0, 0];
         so.first_service = 0;
         if (!parent_object) {
            common.history = [];
            common.perspective_score = true;
         }
         if (!parent_object && format) {
            so.format.singles(true);
            so.format.type(format);
            common.metadata.reset();
         }
      })();

      so.set = {
         index(value) {
            if (!arguments.length) return index;
            if (!isNaN(value)) index = value;
            return so.set;
         },
         perspectiveScore(value) {
            if (!arguments.length) return common.perspective_score;
            // TODO: for changes to be allowed after first point logged -> the entire point history would have to be updated
            if (so.history.points().length) return false;
            if ([true, false].indexOf(value) >= 0) common.perspective_score = value;
            return so.set;
         },
         firstService(value) {
            if (!arguments.length) return so.first_service;
            if (common.metadata.serviceOrder().indexOf(value) < 0) return false;
            so.first_service = value;
            return so.set;
         },
      };

      so.history = {};
      so.history.local = function() { return so.local_history; }
      so.history.points = function() { 
         return common.history.filter(function(episode) { return episode.action == 'addPoint'; }).map(function(episode) { return episode.point; });
      }
      so.history.score = function() { 
         if (object == 'Game') return so.history.points().map(function(point) { return point.score; }); 
         return [].concat(...so.children.map(function(child) { return child.history.score(); })); 
      }
      so.history.games = function() { 
         if (object == 'Set') return so.local_history; 
         return [].concat(...so.children.map(function(child) { return child.history.games(); })); 
      }
      so.history.lastPoint = function() { 
         let point_history = so.history.points();
         return point_history[point_history.length - 1] || { score: '0-0' };
      }
      so.history.common = function() { return common.history; }

      so.score = function() {
         let counters = {};
         // local counter doesn't consider whether a game/set/match is complete or not
         counters.local = so.counter;
         counters.points = object == 'Game' ? (so.complete() ? [0, 0] : so.counter) : (so.lastChild() ? so.lastChild().score().counters.points : [0, 0]); 
         counters.games = object == 'Set' ? (so.complete() ? [0, 0] : so.counter) : (object == 'Match' ? (so.lastChild() ? so.lastChild().score().counters.games : [0, 0]) : undefined);
         counters.sets = object == 'Match' ? so.counter : undefined;
         let current = {};
         let score = { counters };
         score.points = object == 'Game' ? (so.complete() ? '0-0' : so.scoreboard()) : (so.lastChild() ? so.lastChild().score().points : '0-0'); 
         score.games = object == 'Set' ? (so.complete() ? '0-0' : so.perspectiveScore().join('-')) : (so.lastChild() ? so.lastChild().score().games : '0-0');
         score.sets = object == 'Match' ? (so.complete() ? '0-0' : so.perspectiveScore().join('-')) : (so.lastChild() ? so.lastChild().score().sets : '0-0');
         score.components = {};
         if (object == 'Match' && so.children.length) {
            score.components.sets = so.children.map(function(set) {
               let map = { games: set.score().counters.local };
               if (set.lastChild().format.tiebreak()) map.tiebreak = set.lastChild().score().counters.local;
               return map;
            });
         }
         score.display = {};
         return score;
      };

      so.accessChildren = function() { return so.children; }
      so.lastChild = function() { return so.children[so.children.length - 1]; }
      so.scoreDifference = function() { return  Math.abs(so.counter[0] - so.counter[1]); }
      so.thresholdMet = function() { return Math.max(...so.counter) >= so.format.threshold(); }
      so.minDifferenceMet = function() { return so.scoreDifference() >= so.format.minDiff(); }
      so.singleThresholdMet = function() { return Math.max(...so.counter) >= so.format.threshold() && Math.min(...so.counter) < so.format.threshold(); }
      so.winner = function() { return (so.complete()) ? (so.counter[0] > so.counter[1] ? 0 : 1) : undefined; }
      so.reverseScore = function() { return common.perspective_score && (so.nextTeamServing() % 2) == 1; };
      so.nextTeamServing = function() {
         let next_server = so.nextService();
         return common.metadata.teams().map(function(team) { return team.indexOf(next_server) >= 0; }).indexOf(true);
      }
      so.perspectiveScore = function(counter = so.counter, force) { 
         if (force != undefined) return force ? counter.slice().reverse() : counter;
         return so.reverseScore() ? counter.slice().reverse() : counter; 
      }

      so.complete = function() {
         function beyondDoubleThreshold() { return so.counter[0] >= so.format.threshold() && so.counter[1] >= so.format.threshold(); }
         return (so.thresholdMet() && so.minDifferenceMet()) || (beyondDoubleThreshold() && so.scoreDifference() && so.format.hasDecider()) ? true : false;
      }

      so.nextService = function() {
         if (so.complete()) return false;
         let last_child = so.lastChild();

         if (common.metadata.serviceOrder().indexOf(so.first_service) < 0) {
            // this would imply that #players decreased from 4 to 2
            // so, if at the beginning of a game the next team should be 1 - last team
            console.log('PROBLEM');
         }

         if (object == 'Game') {
            if (!so.format.tiebreak()) return so.first_service;
            return common.nextTiebreakService(so.local_history);
         }

         if (!last_child) return so.first_service;
         if (last_child.complete()) {
            let descendent = last_child.lastChild();
            while(descendent) { 
               last_child = descendent;
               descendent = last_child.lastChild();
            }
            let last_first_service = last_child.set.firstService();
            let next_service = common.advanceService(last_first_service);
            return next_service;
         }
         return last_child.nextService();
      }

      so.currentChild = function() {
         if (so.complete()) return false;
         let last_child = so.lastChild();
         if (last_child && !last_child.complete()) return last_child;
         return so.newChild();
      }

      so.newChild = function() {
         let last_child = so.lastChild();
         let next_first_service;
         if (!last_child) {
            next_first_service = so.first_service;
         } else {
            let descendent = last_child.lastChild();
            while(descendent) { 
               last_child = descendent;
               descendent = last_child.lastChild();
            }
            next_first_service = common.advanceService(last_child.set.firstService());
         }

         let threshold = so.format.threshold();
         let min_diff = so.format.minDiff();
         let deciding_child_required = ( 
            (countersAtValue(threshold) && (so.format.hasDecider() || min_diff == 1)) || 
            (countersAtValue(threshold - 1) && min_diff == 0) );
         let code = (deciding_child_required) ? so.format.decidingChild.settings().code : so.format.children.settings().code;
         let total_children = so.children.length;

         let new_child = mo[so.child.object]({index: total_children, parent_object: so, type: code, common: common, });
         new_child.set.firstService(next_first_service);

         if (!code) {
            let source_format = (deciding_child_required) ? so.format.decidingChild : so.format.children;
            copyAttributes(source_format, new_child.format, so.child_attributes);
            if (source_format.children) {
               copyAttributes(source_format.children, new_child.format.children, so.child_attributes);
               copyAttributes(source_format.decidingChild, new_child.format.decidingChild, so.child_attributes);
            }
         }

         so.children.push(new_child);
         return new_child;

         function copyAttributes(source, target, attributes) { 
            attributes.forEach(function(attribute) { 
               if (typeof source[attribute] == 'function') {
                  let value = source[attribute]();
                  let existing_value = target[attribute]();
                  target[attribute](value); 
                  let new_value = target[attribute]();
               }
            }); 
         }
         function countersAtValue(value) { return so.counter[0] == value && so.counter[1] == value; }
      }

      let addPoint = function(value) {
         if (so.complete()) return { result: false };

         let server = so.nextService();
         let point = common.pointParser(value, server, so.history.lastPoint(), so.format, common.metadata.teams(), so.set.perspectiveScore());
         if (!point) return { result: false };
         so.counter[point.winner] += 1;

         let attributes = { 
            points: so.counter.slice(), 
            score: so.scoreboard(), 
            number: so.local_history.filter(function(episode) { return episode.winner != undefined; }).length,
            index: so.history.points().length,
            [object.toLowerCase()]: index,
         }
        
         if (so.format.tiebreak()) attributes.tiebreak = true;
         if (common.metadata.timestamps()) attributes.uts = new Date();
         Object.assign(point, attributes);
         so.local_history.push(point);

         let result = { 
            action: 'addPoint',
            result: true, complete: so.complete(), 
            point: point, 
            needed: { points_to_game: so.pointsToGame() } 
         };

         common.events.addPoint.forEach(function(e) { e(result); });
         common.history.push(result);
         return result;
      }

      so.addPoint = function(value) {
         if (Array.isArray(value)) return false;
         if (object == 'Game') return addPoint(value);

         let child = so.currentChild();
         if (!child) return { result: false };
         let action = child.addPoint(value);
         if (!action.result) return action;

         if (child.complete()) {
            so.counter[action.point.winner] += 1;
            so.local_history.push({ winner: action.point.winner, [so.child.plural]: so.counter.slice(), index: child.set.index() });
         }
         action.complete = so.complete();
         action.next_service = so.nextService();
         let points_to_set = so.pointsNeeded ? so.pointsNeeded() : undefined;
         if (points_to_set) action.needed = Object.assign({}, action.needed, points_to_set);
         action.point[so.child.label] = child.set.index();
         action[so.child.label] = { 
            complete: child.complete(), 
            winner: child.winner(), 
            [so.child.plural]: so.counter.slice(), 
            index: child.set.index() 
         };
         return action;
      }

      so.addPoints = function(values = []) {
         if (typeof values == 'string') values = values.split('');
         let added = [];
         let rejected = [];
         while (values.length) {
            let value = values.shift();
            let action = so.addPoint(value);
            if (action.result) {
               added.push(action);
            } else {
               values.unshift(value);
               rejected = values.slice();
               values = [];
            }
         }
         return { result: added.length, added, rejected };
      }

      so.decoratePoint = function(point, attributes) {
         let indices = common.history
            .map(function(episode, i) { if (episode.action == 'addPoint' && episode.point.index == point.index) return i; })
            .filter(function(index) { return index != undefined });
         if (!indices.length) return false;
         let episode = common.history[indices[0]];
         episode.point = Object.assign({}, episode.point, attributes);
      }

      so.change = {};
      so.change.points = function(values) {
         if (!numbersArray(values) || values.length != 2) return false;
         if (so.thresholdMet() && Math.abs(values[0] - values[1]) > so.format.minDiff()) return false;
         if (object == 'Game') {
            if (so.complete()) return { result: false };
            let action = { action: 'changePoints', result: true, pointChange: { from: so.counter, to: values } };
            so.local_history.push(action);
            common.history.push(action);
            so.counter = values;
            if (so.complete()) { 
               let winner = parseInt(so.winner());
               parent_object.counter[winner] += 1;
               parent_object.local_history.push({ winner: winner, games: parent_object.counter.slice(), index: index });
            }
            return action;
         }
         return so.propagatePointChange(values, 'points');
      }
      so.change.pointScore = function(value) {
         if (value == '0-0') return so.change.points([0, 0]);
         if (object == 'Game') {
            if (so.format.tiebreak()) return so.change.points(value.split('-').map(function(v) { return parseInt(v); }));
            value = value.replace(':', '-').split('-').map(function(m) { return m.trim(); }).join('-').split('D').join('40');
            let progression = adProgression;
            if (so.format.hasDecider()) Object.keys(noAdProgression).forEach(function(key) { progression[key] = noAdProgression[key]; });
            let valid_values = [].concat(...Object.keys(progression).map(function(key) { return progression[key]; }));
            if (valid_values.indexOf(value) < 0) return false;
            let point_value = ['0', '15', '30', '40', 'A', 'G'];
            let values = value.split('-').map(function(v) { return point_value.indexOf(v); });
            return so.change.points(values);
         }
         return so.propagatePointChange(value, 'pointScore');
      }
      so.propagatePointChange = function(values, fx) {
         let last_child = so.lastChild();
         if (!last_child) { 
            if (object == 'Match') { return so.newChild().newChild().change[fx](values); }
            if (object == 'Set') { return so.newChild().change[fx](values); }
         };
         if (!parent_object && so.complete()) return { result: false };
         if (last_child.complete()) { return so.newChild().change[fx](values); }
         return last_child.change[fx](values);
      }
      so.change.games = function(values) {
         if (!numbersArray(values) || values.length != 2) return false;
         if (object == 'Game') return { result: false };
         if (object == 'Set') {
            if (so.complete()) return { result: false };
            let action = { action: 'changeGames', result: true, gameChange: { from: so.counter, to: values } };
            so.local_history.push(action);
            common.history.push(action);
            so.counter = values;
            return action;
         }
         let last_child = so.lastChild();
         if (!last_child && object == 'Match') { return so.newChild().change.games(values); };
         if (!parent_object && so.complete()) return { result: false };
         if (last_child.complete()) { return so.newChild().change.games(values); }
         return last_child.change.games(values);
      }

      so.undo = function(count = 1) {
         if (isNaN(count)) return false;
         if (object != 'Game' && !so.children.length && !so.local_history.length) return false;
         if (!common.history.length) return false;

         let undone = [...Array(count).keys()].map(function(i) { return undo(); });
         return (count == 1) ? undone[0] : undone;
         
         function undo() {
            let action = common.history[common.history.length - 1].action;
            common.events.undo.forEach(function(e) { e(action); });
            return undo_actions[action]();
         }
      }

      let undo_actions = {};
      undo_actions.addPoint = function() {
         if (object == 'Game') {
            // clean up local and common histories
            so.local_history.pop();
            let common_episode = common.history.pop();
            so.counter[common_episode.point.winner] -= 1;
            return common_episode.point;
         }
         return so.propagateUndo();
      };
      undo_actions.changePoints = function() {
         if (object == 'Game') {
            // clean up local and common histories
            so.local_history.pop();
            let common_episode = common.history.pop();
            so.counter = common_episode.pointChange.from;
            return common_episode;
         }
         return so.propagateUndo();
      };
      undo_actions.changeGames = function() {
         if (object == 'Set') {
            // clean up local and common histories
            so.local_history.pop();
            let common_episode = common.history.pop();
            so.counter = common_episode.gameChange.from;
            return common_episode;
         }
         return so.propagateUndo();
      };

      so.propagateUndo = function() {
         let last_child = so.lastChild();
         let last_child_complete = last_child.complete();
         let episode = last_child.undo();

         // remove the last history event and decrement the counter
         if (last_child_complete) {
            // pop history of non-game object
            let episode = so.local_history.pop();
            if (episode.winner != undefined) so.counter[episode.winner] -= 1;
         }

         if (!last_child.history.local().length && last_child.lastChild() == undefined) so.children.pop();
         return episode;
      }
      return so;
   }

   mo.Match = function({index, type, common = mo.common()} = {}) {
      let child = { object: 'Set', label: 'set', plural: 'sets' }
      let format = mo.matchFormat({type, common});
      let match = mo.stateObject({index, object: 'Match', format, child, common});

      match.scoreboard = function(perspective) { 
         if (!match.children.length) return '0-0';
         if (perspective == undefined) perspective = match.set.perspectiveScore() ? match.nextService() : undefined;
         return match.children.map(function(child) { return child.scoreboard(perspective); }).join(', '); 
      }

      return { 
         set: match.set, reset: match.reset, format: match.format, 
         events: common.events, notify: common.notify, assignParser: common.assignParser, metadata: common.metadata, 
         nextService: match.nextService, addPoint: match.addPoint, addPoints: match.addPoints, 
         change: match.change, undo: match.undo, 
         complete: match.complete, winner: match.winner, 
         score: match.score, scoreboard: match.scoreboard,
         [match.child.plural]: match.accessChildren, 
         history: match.history,

         decoratePoint: match.decoratePoint,
      }
   }

   mo.Set = function({index, parent_object, type, common = mo.common()} = {}) {
      let child = { object: 'Game', label: 'game', plural: 'games' }
      let format = mo.setFormat({type, common});
      let set = mo.stateObject({index, parent_object, object: 'Set', format, child, common});

      set.pointsNeeded = function() {
         if (set.complete()) return undefined;
         let threshold = set.format.threshold();
         let deciding_game = set.format.hasDecider();
         let score_difference = set.scoreDifference();
         let min_diff = set.format.minDiff();
         let deciding_game_format_required = [false, false];
         let games_to_set = set.counter.map(function(player_score, player) {
            let opponent_score = set.counter[1 - player];
            if (player_score > opponent_score) {
               if (opponent_score == threshold && deciding_game) return 0;
               if (player_score >= threshold && score_difference >= min_diff) return 0;
               if (player_score >= threshold - 1) return 1;
               return threshold - player_score;
            } else if (opponent_score > player_score) {
               deciding_game_format_required[player] = deciding_game && threshold == opponent_score;
               if (player_score == threshold && deciding_game) return 0;
               if (opponent_score >= threshold && score_difference >= min_diff) return 0;
               if (deciding_game_format_required[player]) return score_difference + 1;
               if (opponent_score >= threshold - 1) return score_difference + min_diff;
               return threshold - player_score;
            } else {
               deciding_game_format_required[player] = 
                  ((deciding_game && threshold == player_score && threshold == opponent_score) ||
                   (min_diff == 1 && threshold == player_score && threshold == opponent_score) ||
                   (min_diff == 0 && threshold - 1 == player_score && threshold - 1 == opponent_score));
               if (deciding_game_format_required[player]) return 1;
               if (player_score >= threshold - 1) return min_diff;
               return threshold - player_score;
            }
         });

         let last_game = set.lastChild();
         let points_to_set = games_to_set.map(function(player_games_to_set, player) {
            let points_needed = 0;
            if (last_game && !last_game.complete()) {
               points_needed += last_game.pointsToGame()[player];
               player_games_to_set -= 1;
            }
            if (!player_games_to_set) return points_needed;
            
            if (deciding_game_format_required[player]) {
               points_needed += set.format.decidingChild.threshold();
               player_games_to_set -= 1;
            }

            for (let i=player_games_to_set; i; i--) { points_needed += set.format.children.threshold(); }
            return points_needed;
         });

         return { points_to_set, games_to_set };
      }

      set.scoreboard = function(perspective) {
         let last_game = set.lastChild();
         let score = set.perspectiveScore(set.counter, perspective);
         if (!last_game) return score.join('-');
         let tiebreak = (last_game.format.tiebreak() == true);
         if (last_game.complete() && !tiebreak) return score.join('-');
         if (!last_game.complete()) return `${score.join('-')} (${last_game.scoreboard(perspective)})`;
         let last_game_score = last_game.score().counters.local;
         let tiebreak_score = set.perspectiveScore(last_game_score, perspective);
         if (tiebreak && set.complete() && set.children.length == 1) return tiebreak_score.join('-');
         let tiebreak_to = last_game.format.threshold();
         return formatScore(score, tiebreak_score, tiebreak_to);
      }

      function formatScore([p0score, p1score], [t0score, t1score], tiebreak_to) {
         if (t0score || t1score) {
            if (t0score > t1score) p1score += `(${t1score})`;
            if (t1score > t0score) p0score += `(${t0score})`;
         }
         return `${p0score}-${p1score}`
      }

      return { 
         set: set.set, reset: set.reset, format: set.format, 
         events: common.events, notify: common.notify, assignParser: common.assignParser, metadata: common.metadata, 
         nextService: set.nextService, addPoint: set.addPoint, addPoints: set.addPoints, change: set.change, undo: set.undo, 
         complete: set.complete, winner: set.winner, 
         score: set.score, scoreboard: set.scoreboard, 
         [set.child.plural]: set.accessChildren, children: set.accessChildren, lastChild: set.lastChild, newChild: set.newChild,
         history: set.history,
         pointsNeeded: set.pointsNeeded, 
         decoratePoint: set.decoratePoint,
      }
   }

   mo.Game = function({index, parent_object, type, common = mo.common()} = {}) {
      let child = { object: 'Point', label: 'point', plural: 'points' }
      let format = mo.gameFormat({type, common});
      let game = mo.stateObject({index, object: 'Game', parent_object, format, child, common});

      game.pointsToGame = function() {
         if (game.complete()) return undefined;
         let threshold = game.format.threshold();
         let deciding_point = game.format.hasDecider();
         let score_difference = game.scoreDifference();
         let min_diff = game.format.minDiff();
         let points_to_game = game.counter.map(function(player_score, player) {
            let opponent_score = game.counter[1 - player];
            if (player_score > opponent_score) {
               if (opponent_score == threshold && deciding_point) return 0;
               if (player_score >= threshold && score_difference >= min_diff) return 0;
               if (player_score >= threshold - 1) return 1;
               return threshold - player_score;
            } else if (opponent_score > player_score) {
               if (player_score == threshold && deciding_point) return 0;
               if (opponent_score >= threshold && score_difference >= min_diff) return 0;
               if (opponent_score == threshold && deciding_point) return score_difference + 1;
               if (opponent_score >= threshold - 1) return score_difference + min_diff;
               return threshold - player_score;
            } else {
               if (deciding_point && threshold == player_score && threshold == opponent_score) return 1;
               if (player_score >= threshold - 1) return min_diff;
               return threshold - player_score;
            }
         });
         return points_to_game;
      }

      game.scoreboard = function(perspective) { 
         let scoreboard;
         let threshold = game.format.threshold();
         let min_diff = game.format.minDiff();
         let score = game.perspectiveScore(game.counter, perspective);
         let tiebreak = threshold != 4 || game.format.tiebreak() == true;
         if (tiebreak) return score.join('-');
         if (!game.thresholdMet() || 
             (game.singleThresholdMet() && game.minDifferenceMet()) ||
             (game.singleThresholdMet() && game.format.hasDecider() && min_diff == 1) ) {
            let progression = ['0', '15', '30', '40', 'G', 'G'];
            scoreboard = score.map(function(points, player) { return progression[points]; }).join('-');
         } else {
            scoreboard = score.map(function(points, player) {
               let opponent_points = score[1 - player];
               let point = points - threshold;
               let opponent_point = opponent_points - threshold;
               if (point > opponent_point && game.minDifferenceMet()) return 'G';
               return (point > opponent_point) ? 'A' : '40';
            }).join('-');
         }
         return scoreboard.indexOf('G') >= 0 ? '0-0' : scoreboard;
      } 

      return { 
         set: game.set, reset: game.reset, format: game.format, 
         events: common.events, notify: common.notify, assignParser: common.assignParser, metadata: common.metadata,
         nextService: game.nextService, addPoint: game.addPoint, addPoints: game.addPoints, change: game.change, undo: game.undo,
         complete: game.complete, winner: game.winner,
         score: game.score, scoreboard: game.scoreboard,
         history: game.history,
         lastChild: game.lastChild,
         pointsToGame: game.pointsToGame, 
         decoratePoint: game.decoratePoint,
      };
   }

   // necessary to define it this way so that hoisting works!
   mo.defaultPointParser = defaultPointParser;
   function defaultPointParser(value, server, last_point, format, teams, perspective) {
      if (value == undefined) return false;
      if ((value).toString().length == 1 && !isNaN(value)) { 
         let code = +value == server ? 'S' : 'R';
         return ([0, 1].indexOf(+value) < 0) ? false : { winner: +value, server: server, code: code }; 
      }

      let winning_team;
      let serving_team = teams.map(function(team) { return team.indexOf(server) >=0 }).indexOf(true);
      let point = { server: server };

      if (typeof value == 'object') {
         if (value.winner != undefined && [0, 1].indexOf(+value.winner) >= 0) {
            value.winner = parseInt(value.winner);
            value.code = !value.code ? (value.winner == server ? 'S' : 'R') : value.code;
            return Object.assign({}, value, point);
         }
         if (value.code && parseCode(value.code)) return Object.assign({}, value, point);
      }

      if (typeof value == 'string') {
         if (parseCode(value)) return point;
         if (parseScore(value)) return point;
      }

      function parseCode(code) {
         code = code.toUpperCase();
         if ('SAQDRP'.split('').indexOf(String(code)) >= 0 ) {
            if (['S', 'A', 'Q'].indexOf(code) >= 0) { winning_team = serving_team; }
            if (['D', 'R', 'P'].indexOf(code) >= 0) { winning_team = 1 - serving_team; }
            if (['Q', 'P'].indexOf(code) >= 0) { point.result = 'Penalty'; }
            if (code == 'A') point.result = 'Ace';
            if (code == 'D') point.result = 'Double Fault';
            point.code = code;
            point.winner = parseInt(winning_team);
            return point;
         }
      }

      function combinedTotal(score) { return score.reduce(function(a, b) { return a + b; }); }
      function parseScore(value) {
         let last_score = last_point.score;
         value = value.replace(':', '-').split('-').map(function(m) { return m.trim(); }).join('-').split('D').join('40');
         if (format.tiebreak()) {
            let values = value.split('-').map(function(m) { return parseInt(m); });;
            let last_values = last_score.split('-').map(function(m) { return parseInt(m); });
            if (!numbersArray(values) || values.length != 2) return false;
            if (combinedTotal(last_values) + 1 != combinedTotal(values)) return false;
            let change = [Math.abs(values[0] - last_values[0]), Math.abs(values[1] - last_values[1])];
            point.winner = change.indexOf(1);
            return point;
         }
         let progression = adProgression;
         if (format.hasDecider()) Object.keys(noAdProgression).forEach(function(key) { progression[key] = noAdProgression[key]; });

         if (value == '0-0' && progression[last_score].join('-').indexOf('G') >= 0) {
            // one player had game point.  assign winner based on which player has greater # of points.
            point.winner = last_point.points.indexOf(Math.max(...last_point.points));
            return point;
         }
         // after a tiebreak, for instance...
         if (progression[last_score] == undefined) last_score = '0-0';
         let winner = progression[last_score] ? progression[last_score].indexOf(value) : false;
         if (winner >= 0) {
            if (perspective && server) winner = 1 - winner;
            point.winner = winner;
            return point;
         }
      }
   }

   var noAdProgression = { '40-40' : ['G-40', '40-G'] };
   var adProgression = { 
      '0-0'  : ['15-0',  '0-15'], '0-15' : ['15-15', '0-30'], '0-30' : ['15-30', '0-40'], '0-40' : ['15-40', '0-G'], 
      '15-0' : ['30-0',  '15-15'], '15-15': ['30-15', '15-30'], '15-30': ['30-30', '15-40'], '15-40': ['30-40', '15-G'], 
      '30-0' : ['40-0',  '30-15'], '30-15': ['40-15', '30-30'], '30-30': ['40-30', '30-40'], '30-40': ['40-40', '30-G'], 
      '40-0' : ['G-0',   '40-15'], '40-15': ['G-15',  '40-30'], '40-30': ['G-30',  '40-40'], '40-40': ['A-40',  '40-A'], 
      'A-40' : ['G-40',  '40-40'], '40-A' : ['40-40', '40-G']
   };

   mo.matchFormat = function({type = '3_6a_7', common} = {}) {
      let mf = mo.formatObject({plural: 'matches', common});
      mf.children = mo.setFormat({common});
      mf.decidingChild = mo.setFormat({common});
      mf.init(type);

      return { 
         name: mf.name, singles: mf.singles, doubles: mf.doubles, settings: mf.settings, 
         type: mf.type, types: mf.types, threshold: mf.threshold, hasDecider: mf.hasDecider, 
         minDiff: mf.minDiff, children: mf.children, decidingChild: mf.decidingChild, 
      }
   }

   mo.setFormat = function({type = 'AdSetsTo6tb7', common} = {}) {
      let sf = mo.formatObject({plural: 'sets', common});
      sf.children = mo.gameFormat({common});
      sf.decidingChild = mo.gameFormat({common, type: 'tiebreak7a'});
      sf.init(type);

      return { 
         name: sf.name, singles: sf.singles, doubles: sf.doubles, settings: sf.settings, 
         type: sf.type, types: sf.types, threshold: sf.threshold, hasDecider: sf.hasDecider, 
         minDiff: sf.minDiff, children: sf.children, decidingChild: sf.decidingChild, 
      }
   }

   mo.gameFormat = function({type = 'advantage', common} = {}) {
      let gf = mo.formatObject({plural: 'games', common});
      gf.init(type);

      return { 
         name: gf.name, settings: gf.settings, singles: gf.singles, doubles: gf.doubles,
         type: gf.type, types: gf.types, threshold: gf.threshold, hasDecider: gf.hasDecider, 
         minDiff: gf.minDiff, tiebreak: gf.tiebreak,
      }
   }

   mo.formatObject = function({plural, common = mo.common()} = {}) {
      let fo = {
         values: { plural: plural },
         singles: common.singles,
         doubles: common.doubles,
         init(format_type) { 
            if (fo.types(fo.values.plural).indexOf(format_type) >= 0) { 
               fo.type(format_type); 
               fo.values.initial_code = format_type;
            }
         },
         types(object = fo.values.plural) { return Object.keys(formats[object]); },
         type(format_type) {
            if (!fo.values.plural) return false;
            if (format_type == true && fo.values.initial_code) format_type = fo.values.initial_code;
            if (fo.types(fo.values.plural).indexOf(format_type) >= 0) {
               let f = formats[fo.values.plural][format_type];

               fo.hasDecider(f.hasDecider).minDiff(f.minDiff).threshold(f.threshold);
               if (f.tiebreak != undefined) fo.tiebreak(f.tiebreak);

               // must be set after all other attributes!
               fo.name(f.name);
               fo.values.code = format_type;

               if (f.children) fo.children.type(f.children);
               if (f.decidingChild) fo.decidingChild.type(f.decidingChild);
               return true;
            }
         },
         settings() {
            let number_of_players = typeof common.singles == 'function' ? common.singles() ? 2 : 4 : '';
            let settings = { 
               name: fo.values.name, code: fo.values.code, players: number_of_players,
               threshold: fo.values.threshold, has_decider: fo.values.has_decider, 
               min_diff: fo.values.min_diff, tiebreak: fo.values.tiebreak,
            };
            return settings;
         },
         name(value) {
            if (!arguments.length) return fo.values.name;
            if (typeof value == 'string') fo.values.name = value;
            return fo;
         },
         tiebreak(value) {
            if (!arguments.length) return fo.values.tiebreak;
            fo.values.name = fo.values.code = undefined;
            if ([true, false].indexOf(value) >= 0) fo.values.tiebreak = value;
            return fo;
         },
         threshold(value) {
            if (!arguments.length) return fo.values.threshold;
            fo.values.name = fo.values.code = undefined;
            if (!isNaN(value)) fo.values.threshold = value;
            return fo;
         },
         minDiff(value) {
            if (!arguments.length) return fo.values.min_diff;
            fo.values.name = fo.values.code = undefined;
            if (!isNaN(value)) fo.values.min_diff = value;
            return fo;
         },
         hasDecider(value) {
            if (!arguments.length) return fo.values.has_decider;
            fo.values.name = fo.values.code = undefined;
            if ([true, false].indexOf(value) >= 0) fo.values.has_decider = value;
            return fo;
         },
      };
      return fo;
   }

   mo.common = function() {
      let pnum = 2;
      let addPoint_events = mo.addPoint_events.slice();
      let undo_events = mo.undo_events.slice();
      let metadata = {};

      let accessors = {
         reset() {
            metadata = { 
               players: [], teams: [], service_order: [0, 1], receive_order: [1, 0],
               tournament: {}, match: {}, timestamps: false, 
               charter: undefined, 
            }
         },
         timestamps(value){
            if (!arguments.length) return metadata.timestamps;
            if ([true, false].indexOf(value) >= 0) metadata.timestamps = value;
            return accessors;
         },
         serviceOrder(order) {
            if (!arguments.length) return metadata.service_order;
            return changeOrder(order, 'service_order', 'receive_order');
         },
         doublesServiceChange() {
            if (pnum != 4) return false;
            // FIXME: Not allowed if not the end of a set; how to determine within common?
         },
         receiveOrder(order) {
            if (!arguments.length) return metadata.receive_order;
            return changeOrder(order, 'receive_order', 'service_order');
         },
         teams() {
            let teams = [];
            teams[0] = metadata.service_order.filter(function(service, i) { return (i+1)%2; }).sort();
            teams[1] = metadata.service_order.filter(function(service, i) { return i%2; }).sort();
            teams.sort();
            return teams;
         },
         teamPlayers() {
            return accessors.teams().map(function(team) { return team.map(function(i) { return accessors.players(i).name; }); });
         },
         players(index) {
            if (!arguments.length) {
               if (metadata.players.length > metadata.service_order.length) return metadata.players;
               return metadata.service_order.map(function(i) { return accessors.players(i); });
            }
            if (isNaN(index) || index < 0 || index > 3) return false;
            if (metadata.players[index]) return metadata.players[index];
            return { name: `Player ${['One', 'Two', 'Three', 'Four'][index]}` };
         },
         definePlayer({index, name, birth, puid, fh, seed, rank, age, entry, ioc,} = {}) {
            if (index == undefined) index = metadata.players.length;
            let player = metadata.players[index] || {};
            if ((!name && !player.name) || (isNaN(index) || index > 3)) return false;
            let definition = { name, birth, puid, fh, seed, rank, age, entry, ioc };
            Object.keys(definition).forEach(function(key) { if (definition[key]) player[key] = definition[key] });
            metadata.players[index] = player;
            return { index, player };
         },
         defineTournament({ name, tuid, tour, rank, surface, draw, round,} = {}) {
            let definition = {name, tuid, tour, rank, surface, draw, round,};
            Object.keys(definition).forEach(function(key) { if (definition[key]) metadata.tournament[key] = definition[key] });
            return metadata.tournament;
         },
         defineMatch({ muid, date, category, year, court, start_time, end_time, duration, status, in_out, umpire, official_score } = {}) {
            let definition = {muid, date, category, year, court, start_time, end_time, duration, status, in_out, umpire, official_score };
            Object.keys(definition).forEach(function(key) { if (definition[key]) metadata.match[key] = definition[key] });
            return metadata.match;
         },
         showTiebreakOrder(first_service) { return calcTiebreakService(12, first_service); },
      }

      function changeOrder(order, submitted, counterpart) {
         if (!Array.isArray(order) || order.length != pnum || notXinY(order, [0,1]) || notXinY([0, 1, 2, 3], order)) return false;

         let no_format_change = (order.length == metadata[submitted].length);
         if (sameOrder(order, metadata[submitted]) && no_format_change) return accessors;

         let teams = accessors.teams();
         metadata[submitted] = order;
         let new_teams = accessors.teams();

         if (order.length == 4 && sameOrder(teams[0], new_teams[0]) && no_format_change && 
               serviceToOpponent(metadata[submitted], metadata[counterpart], new_teams)) return accessors;

         metadata[counterpart] = order.map(function(o) { return (order.length - 1) - o; });
         return accessors;
      }

      function notXinY(x, y) { return y.filter(function(n) { return x.indexOf(n) != -1; }).length != y.length }
      function sameOrder(a, b) { return !a.filter(function(o, i) { return o != b[i]; }).length; }

      function serviceToOpponent(players, opponents, teams) {
         return !players.filter(function(s, i) { return sameTeam(s, opponents[i]); }).length;

         function sameTeam(p, o) { 
            return teams.filter(function(team) { 
               return team.filter(function(player) { 
                  return [p, o].indexOf(player) >= 0 
               }).length > 1
            }).length; 
         }
      }

      function calcTiebreakService(number, first_service) {
         let progression = [];
         return [...Array(number).keys()].map(function() { let result = calcNext(progression, first_service); progression.push(result); return result; });
      }

      function calcNext(progression, first_service) {
         let last_position = pos(progression.length);
         let next_position = ((progression.length + 1) % 4) < 2;
         let last_score = progression[progression.length - 1];
         let last_service = last_score != undefined ? last_score : (first_service || metadata.service_order[0]);
         let next_service = (next_position == last_position) ? last_service : pub.advanceService(last_service);
         return next_service;
      }

      function pos(number) {
         let iterations = [true].concat([...Array(number).keys()].map(function(i) { return ((i+1)%4)<2; }));
         return iterations[number];
      }

      function setServiceOrder() {
         if (pnum == 2) {
            let existing_order = pub.metadata.serviceOrder();
            if (existing_order.length == 2) return;
            pub.metadata.serviceOrder(existing_order.filter(function(f) { return [0, 1].indexOf(f) >= 0; }));
         } else {
            let existing_order = pub.metadata.serviceOrder();
            if (existing_order.length == 4) return;
            let new_order = existing_order.slice();
            existing_order.forEach(function(o) { new_order.push(o + 2); });
            pub.metadata.serviceOrder(new_order);
         }
      }

      addEvent = function(add_event) {
         if (!arguments.length) return addPoint_events;
         if (typeof add_event == 'function') {
            addPoint_events.push(add_event);
         } else if (typeof add_event == 'array') {
            add_event.foreach(e) (function(e) { if (typeof e == 'function') addPoint_events.push(c); });
         }
      }

      undoEvent = function(undo_event) {
         if (!arguments.length) return undo_events;
         if (typeof undo_event == 'function') {
            undo_events.push(undo_event);
         } else if (typeof undo_event == 'array') {
            undo_event.foreach(e) (function(e) { if (typeof e == 'function') undo_events.push(c); });
         }
      }

      let pub = {
         metadata: accessors,
         pointParser: mo.pointParser,
         events: { addPoint: addPoint_events, undo: undo_events },
         notify: { addPoint: addEvent, undo: undoEvent },
         history: [],
         perspective_score: true,
         assignParser(parser) { pub.pointParser = parser; },
         advanceService(service) {
            let index = metadata.service_order.indexOf(service);
            index += 1; 
            let next_service = metadata.service_order[index < accessors.players().length ? index : 0];
            return next_service;
         },
         nextTiebreakService(history, first_service) {
            let so = calcTiebreakService(history.length + 1, first_service);
            return so[so.length - 1];
         },
         singles(value) { 
            if (!arguments.length) return pnum == 2 ? true : false;
            pnum = value ? 2 : 4;
            setServiceOrder();
            return pub;
         },
         doubles(value) { 
            if (!arguments.length) return pnum == 4 ? true : false;
            pnum = value ? 4 : 2;
            setServiceOrder();
            return pub;
         },
      }
      accessors.reset();
      return pub;
   }

   function numbersArray(values) {
      if (!Array.isArray(values)) return false;
      if (values.map(function(value) { return !isNaN(value); }).indexOf(false) >=0 ) return false;
      return true;
   }

   if (typeof define === "function" && define.amd) define(mo); else if (typeof module === "object" && module.exports) module.exports = mo;
   this.mo = mo;
 
}();
