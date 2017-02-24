!function() {

   let umo = function() {};

   // these events will propagate to all objects created with factory functions
   umo.addPoint_events = [];
   umo.undo_events = [];
   umo.reset_events = [];

   umo.pointParser = defaultPointParser;

   let formats = {
      games: {
         'advantage': { description: 'Advantage Game', tiebreak: false, hasDecider: false, threshold: 4, minDiff: 2, },
         'noAdvantage': { description: 'No Advantage Game', tiebreak: false, hasDecider: true, threshold: 4, minDiff: 1, },
         'tiebreak7a': { description: 'Tiebreak to 7', tiebreak: true, hasDecider: false, threshold: 7, minDiff: 2,  },
         'tiebreak10a': { description: 'Tiebreak to 10', tiebreak: true, hasDecider: false, threshold: 10, minDiff: 2, },
         'tiebreak12a': { description: 'Tiebreak to 10', tiebreak: true, hasDecider: false, threshold: 12, minDiff: 2, },
         'tiebreak9n': { description: 'Tiebreak to 9, Golden Point', tiebreak: true, hasDecider: true, threshold: 9, minDiff: 1, },
      },
      sets: {
         'AdSetsTo6tb7': { 
            description: 'Advantage, 6 games for set, Tiebreak to 7',
            hasDecider: true, threshold: 6, minDiff: 2, children: 'advantage', decidingChild: 'tiebreak7a', 
         },
         'NoAdSetsTo6tb7': { 
            description: 'No-Ad, 6 games for set, Tiebreak to 7',
            hasDecider: true, threshold: 6, minDiff: 2, children: 'noAdvantage', decidingChild: 'tiebreak7a', 
         },
         'longSetTo6by2': { 
            description: 'Advantage, 6 games for set, win by 2 games',
            hasDecider: false, threshold: 6, minDiff: 2, children: 'advantage', decidingChild: 'advantage', 
         },
         'supertiebreak': { 
            description: 'Supertiebreak',
            hasDecider: true, threshold: 1, minDiff: 1, children: 'tiebreak10a',  decidingChild: 'tiebreak10a', 
         },
         'pro10a12': { 
            description: '10 Game No Ad Pro Set; tiebreak to 12',
            hasDecider: true, threshold: 10, minDiff: 2, children: 'noAdvantage', decidingChild: 'tiebreak12a',
         },
         'pro8a7': { 
            description: '8 Game Pro Set; tiebreak to 7', 
            hasDecider: true, threshold: 8, minDiff: 2, children: 'advantage', decidingChild: 'tiebreak7a'
         },
      },
      matches: {
         '3_6a_7': { 
            name: 'Standard Advantage',
            description: 'best of 3 sets, Advantage, 6 games for set, Tiebreak to 7', 
            hasDecider: true, threshold: 2, minDiff: 0, children: 'AdSetsTo6tb7', decidingChild: 'AdSetsTo6tb7',
         },
         '3_6n_7': { 
            name: 'Standard No-Advantage',
            description: 'best of 3 sets, No Advantage, 6 games for set, Tiebreak to 7', 
            hasDecider: true, threshold: 2, minDiff: 0, children: 'NoAdSetsTo6tb7', decidingChild: 'NoAdSetsTo6tb7',
         },
         '3_6n_10': { 
            name: 'No-Ad, 3rd Set Supertiebreak',
            description: 'best of 3 sets, No-Ad, 6 games for set, Tiebreak to 7, final set Supertiebreak', 
            hasDecider: true, threshold: 2, minDiff: 0, children: 'NoAdSetsTo6tb7', decidingChild: 'supertiebreak',
         },
         '5_6a_7': { 
            name: 'US Open Men',
            description: 'best of 5 sets, Advantage, 6 games for set, Tiebreak to 7', 
            hasDecider: true, threshold: 3, minDiff: 0, children: 'AdSetsTo6tb7', decidingChild: 'AdSetsTo6tb7',
         },
         '5_6a_7_long': { 
            name: 'Grand Slam Men - Final Advantage Set',
            description: 'best of 5 sets, Advantage, 6 games for set, Tiebreak to 7, final set by 2 games', 
            hasDecider: true, threshold: 3, minDiff: 0, children: 'AdSetsTo6tb7', decidingChild: 'longSetTo6by2',
         },
         '3_6a_7_long': { 
            name: 'Grand Slam Women - Final Advantage Set',
            description: 'best of 5 sets, Advantage, 6 games for set, Tiebreak to 7, final set by 2 games', 
            hasDecider: true, threshold: 2, minDiff: 0, children: 'AdSetsTo6tb7', decidingChild: 'longSetTo6by2',
         },
         '1_8a_7': { 
            name: '8 Game Pro Set',
            description: '1 set, Advantage, 8 games for set, Tiebreak to 7', 
            hasDecider: true, threshold: 1, minDiff: 0, children: 'pro8a7', decidingChild: 'pro8a7',
         },
      },
   }

   umo.formats = () => formats;
   umo.newFormat = ({type, code, description, tiebreak, hasDecider, threshold, minDiff, children, decidingChild} = {}) => {
      let hasType = Object.keys(formats).indexOf(type) >= 0;
      let hasCode = hasType && Object.keys(formats[type]).indexOf(code) >= 0;
      if (hasType && hasCode) return false;
      formats[type][code] = { description, tiebreak, hasDecider, threshold, minDiff, children, decidingChild };
      return true;
   }

   umo.stateObject = ({index, object, parent_object, child, format, common = umo.common()} = {}) => {
      let so = {};
      so.child = child;
      so.format = format;
      so.child_attributes = ['hasDecider', 'threshold', 'minDiff', 'tiebreak', 'code', 'description'];

      (so.reset = function(format) {
         so.children = [];
         so.local_history = [];
         so.counter = [0, 0];
         so.first_service = 0;
         if (!parent_object) {
            common.metadata.reset();
            common.metadata.resetStats();
            common.history = [];
            common.perspective_score = false;
            common.events.reset().forEach(fx => fx());
         }
         if (!parent_object && format) {
            so.format.singles(true);
            so.format.type(format);
         }
      })();

      so.set = {
         index(value) {
            if (!arguments.length) return index;
            if (!isNaN(value)) index = value;
            return so.set;
         },
         liveStats(value) {
            if (!arguments.length) return common.live_stats;
            if ([true, false].indexOf(value) < 0) return false;
            if (value && !common.live_stats && so.history.points().length) {
               common.metadata.resetStats();
               common.stats.counters();
            }
            if (!value && common.live_stats) common.metadata.resetStats();
            common.live_stats = value;
            return so.set;
         },
         perspectiveScore(value) {
            if (!arguments.length) return common.perspective_score;
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
      so.history.local = () => so.local_history;
      so.history.action = (action) =>  common.history.filter(episode => episode.action == action);
      so.history.points = () => common.history.filter(episode => episode.action == 'addPoint').map(episode => episode.point); 
      so.history.score = () => { 
         if (object == 'Game') return so.history.points().map(point => point.score); 
         return [].concat(...so.children.map(child => child.history.score())); 
      }
      so.history.games = () => (object == 'Set') ? so.local_history : [].concat(...so.children.map(child => child.history.games()));
      so.history.lastPoint = () => { 
         let point_history = so.history.points();
         return point_history[point_history.length - 1] || { score: '0-0' };
      }
      so.history.common = () => common.history;

      so.score = () => {
         let counters = {};
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
            score.components.sets = so.children.map(set => {
               let map = { games: set.score().counters.local };
               if (set.lastChild() && set.lastChild().format.tiebreak()) map.tiebreak = set.lastChild().score().counters.local;
               return map;
            });
         }
         score.display = {};
         return score;
      };

      so.accessChildren = () => so.children;
      so.lastChild = () => so.children[so.children.length - 1];
      so.scoreDifference = () => Math.abs(so.counter[0] - so.counter[1]);
      so.thresholdMet = () => Math.max(...so.counter) >= so.format.threshold();
      so.minDifferenceMet = () => so.scoreDifference() >= so.format.minDiff();
      so.singleThresholdMet = () => Math.max(...so.counter) >= so.format.threshold() && Math.min(...so.counter) < so.format.threshold();
      so.winner = () => (so.complete()) ? (so.counter[0] > so.counter[1] ? 0 : 1) : undefined;
      so.reverseScore = () => common.perspective_score && (so.nextTeamServing() % 2) == 1;
      so.nextTeamServing = () => common.metadata.teams().map(team => team.indexOf(so.nextService()) >= 0).indexOf(true);
      so.nextTeamReceiving = () => common.metadata.teams().map(team => team.indexOf(so.nextService()) >= 0).indexOf(false);
      so.perspectiveScore = (counter = so.counter, force) => {
         if (force != undefined) return force ? counter.slice().reverse() : counter;
         return so.reverseScore() ? counter.slice().reverse() : counter; 
      }
      so.complete = () => {
         function beyondDoubleThreshold() { return so.counter[0] >= so.format.threshold() && so.counter[1] >= so.format.threshold(); }
         return (so.thresholdMet() && so.minDifferenceMet()) || (beyondDoubleThreshold() && so.scoreDifference() && so.format.hasDecider()) ? true : false;
      }
      so.nextService = () => {
         if (so.complete()) return false;
         let last_child = so.lastChild();

         if (common.metadata.serviceOrder().indexOf(so.first_service) < 0) {
            // this would imply that #players decreased from 4 to 2
            // so, if at the beginning of a game the next team should be 1 - last team
            console.log('PROBLEM');
         }

         if (object == 'Game') {
            if (!so.format.tiebreak()) return so.first_service;
            return common.nextTiebreakService(so.local_history, so.first_service);
         }

         if (!last_child) return so.first_service;
         if (last_child.complete()) {
            let descendent = last_child.lastChild();
            while(descendent) { 
               last_child = descendent;
               descendent = last_child.lastChild();
            }
            let last_first_service = last_child.set.firstService();
            return common.advanceService(last_first_service);
         }
         return last_child.nextService();
      }

      so.currentChild = () => {
         if (so.complete()) return false;
         let last_child = so.lastChild();
         if (last_child && !last_child.complete()) return last_child;
         return so.newChild();
      }

      so.newChild = () => {
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
         let countersAtValue = (value) => so.counter[0] == value && so.counter[1] == value;
         let deciding_child_required = ( 
            (countersAtValue(threshold) && (so.format.hasDecider() || min_diff == 1)) || 
            (countersAtValue(threshold - 1) && min_diff == 0) );
         let code = (deciding_child_required) ? so.format.decidingChild.settings().code : so.format.children.settings().code;
         let total_children = so.children.length;

         let new_child = umo[so.child.object]({index: total_children, parent_object: so, type: code, common: common, });
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
            attributes.forEach(attribute => { 
               if (typeof source[attribute] == 'function') {
                  let value = source[attribute]();
                  let existing_value = target[attribute]();
                  target[attribute](value); 
                  let new_value = target[attribute]();
               }
            }); 
         }
      }

      let addPoint = (value) => {
         if (so.complete()) return { result: false };

         let server = so.nextService();
         let point = common.pointParser(value, server, so.history.lastPoint(), so.format, common.metadata.teams(), so.set.perspectiveScore(), so.score());
         if (!point) return { result: false };
         so.counter[point.winner] += 1;

         let attributes = { 
            points: so.counter.slice(), 
            score: so.scoreboard(), 
            number: so.local_history.filter(episode => episode.winner != undefined).length,
            index: so.history.points().length,
            [object.toLowerCase()]: index,
         }
        
         let points_to_game = so.pointsToGame();
         let has_game_point = points_to_game ? points_to_game.indexOf(1) : undefined;
         let breakpoint = has_game_point >= 0 && has_game_point == 1 - common.metadata.playerTeam(server);

         if (breakpoint) attributes.breakpoint = true;
         if (so.format.tiebreak()) attributes.tiebreak = true;
         if (common.metadata.timestamps() && !point.uts) attributes.uts = new Date().valueOf();
         Object.assign(point, attributes);
         so.local_history.push(point);

         let episode = { 
            action: 'addPoint',
            result: true, complete: so.complete(), 
            point: point, 
            needed: { points_to_game } 
         };

         common.history.push(episode);
         return episode;
      }

      so.addPoint = (value) => {
         if (Array.isArray(value)) return false;
         if (object == 'Game') return addPoint(value);

         let child = so.currentChild();
         if (!child) return { result: false };
         let episode = child.addPoint(value);
         if (!episode.result) return episode;

         if (child.complete()) {
            so.counter[episode.point.winner] += 1;
            so.local_history.push({ winner: episode.point.winner, [so.child.plural]: so.counter.slice(), index: child.set.index() });
         }
         episode.complete = so.complete();
         episode.next_service = so.nextService();
         let points_to_set = so.pointsNeeded ? so.pointsNeeded() : undefined;
         if (points_to_set) episode.needed = Object.assign({}, episode.needed, points_to_set);
         episode.point[so.child.label] = child.set.index();
         episode[so.child.label] = { 
            complete: child.complete(), 
            winner: child.winner(), 
            [so.child.plural]: so.counter.slice(), 
            index: child.set.index() 
         };
         if (!parent_object) common.addStatPoint(episode);
         if (!parent_object) common.events.addPoint().forEach(fx => fx(episode));
         return episode;
      }

      so.addPoints = (values = []) => so.addMultiple({values});

      so.addScore = (value) => {
         let episode = so.addPoint(value);
         if (episode.result) return episode;
         let last_point = so.history.lastPoint();
         let last_points = !last_point || last_point.score == '0-0' ? [0, 0] : last_point.points;
         let total_points = last_points.reduce((a, b) => (a + b));
         let attempt = so.change.pointScore(value);
         if (attempt.result) {
            so.undo();
            let new_points = attempt.pointChange.to;
            let new_total = new_points.reduce((a, b) => (a + b));
            let change = new_points.map((p, i) => { return { diff: p - last_points[i], i } }).filter(f=>f.diff);
            if (change.length == 1 && change[0].diff > 0) {
               let result;
               let player = change[0].i;
               let points_to_player = change[0].diff;
               for (let p=0; p < points_to_player; p++) {
                  result = so.addPoint(player);
                  if (!result.result) return result;
                  if (result.game.complete) return result;
               }
               return result;
            }
         }
         return { result: false };
      }

      so.addScores = (values = []) => so.addMultiple({values, fx: so.addScore});

      so.addMultiple = ({ values = [], fx = so.addPoint }) => {
         if (typeof values == 'string') values = values.match(/[01A-Za-z][\*\#\@]*/g);
         let added = [];
         let rejected = [];
         while (values.length) {
            let value = values.shift();
            let episode = fx(value);
            if (episode.result) {
               added.push(episode);
            } else {
               values.unshift(value);
               rejected = values.slice();
               values = [];
            }
         }
         return { result: added.length, added, rejected };
      }

      so.decoratePoint = (point, attributes) => {
         let indices = common.history
            .map((episode, i)  => { if (episode.action == 'addPoint' && episode.point.index == point.index) return i; })
            .filter(index => index != undefined);
         if (!indices.length) return false;
         let episode = common.history[indices[0]];
         episode.point = Object.assign({}, episode.point, attributes);
      }

      so.change = {};
      so.change.points = (values) => {
         if (!numbersArray(values) || values.length != 2) return false;
         if (object == 'Game') {
            let past_threshold = Math.max(...values) > so.format.threshold();
            let value_difference = Math.abs(values[0] - values[1]);
            if (past_threshold && value_difference > so.format.minDiff()) return false;
            if (so.complete()) return { result: false };
            let episode = { action: 'changePoints', result: true, pointChange: { from: so.counter, to: values } };
            so.local_history.push(episode);
            common.history.push(episode);
            so.counter = values;
            if (so.complete()) { 
               let winner = parseInt(so.winner());
               parent_object.counter[winner] += 1;
               parent_object.local_history.push({ winner: winner, games: parent_object.counter.slice(), index: index });
            }
            return episode;
         }
         return so.propagatePointChange(values, 'points');
      }
      so.change.pointScore = (value) => {
         if (value == '0-0') return so.change.points([0, 0]);
         if (object == 'Game') {
            if (so.format.tiebreak()) return so.change.points(value.split('-').map(v => parseInt(v)));
            value = value.replace(':', '-').split('-').map(m => m.trim()).join('-').split('D').join('40');
            let progression = Object.assign({}, adProgression);
            if (so.format.hasDecider()) Object.keys(noAdProgression).forEach(key => progression[key] = noAdProgression[key]);
            let valid_values = [].concat(...Object.keys(progression).map(key => progression[key]));
            if (valid_values.indexOf(value) < 0) return false;
            let point_value = ['0', '15', '30', '40', 'A', 'G'];
            let values = value.split('-').map(v => point_value.indexOf(v));

            // correct for advantage games that don't reach deuce
            if (values[0] == 5 && values[1] != 3) values[0] = 4;
            if (values[1] == 5 && values[0] != 3) values[1] = 4;
            return so.change.points(values);
         }
         return so.propagatePointChange(value, 'pointScore');
      }
      so.propagatePointChange = (values, fx) => {
         let last_child = so.lastChild();
         if (!last_child) { 
            if (object == 'Match') { return so.newChild().newChild().change[fx](values); }
            if (object == 'Set') { return so.newChild().change[fx](values); }
         };
         if (!parent_object && so.complete()) return { result: false };
         if (last_child.complete()) { return so.newChild().change[fx](values); }
         return last_child.change[fx](values);
      }
      so.change.games = (values) => {
         if (!numbersArray(values) || values.length != 2) return false;
         if (object == 'Game') return { result: false };
         if (object == 'Set') {
            if (so.complete()) return { result: false };
            let episode = { action: 'changeGames', result: true, gameChange: { from: so.counter, to: values } };
            so.local_history.push(episode);
            common.history.push(episode);
            so.counter = values;
            return episode;
         }
         let last_child = so.lastChild();
         if (!last_child && object == 'Match') { return so.newChild().change.games(values); };
         if (!parent_object && so.complete()) return { result: false };
         if (last_child.complete()) { return so.newChild().change.games(values); }
         return last_child.change.games(values);
      }

      so.undo = (count = 1) => {
         if (isNaN(count)) return false;
         if (object != 'Game' && !so.children.length && !so.local_history.length) return false;
         if (!common.history.length) return false;
         let undo = () => {
            let action = common.history[common.history.length - 1].action;
            return undo_actions[action]();
         }
         let undone = [...Array(count).keys()].map(i => undo());
         common.events.undo().forEach(fx => fx(undone));
         return (count == 1) ? undone[0] : undone;
      }

      let undo_actions = {};
      undo_actions.addPoint = () => {
         if (object == 'Game') {
            // clean up local and common histories
            so.local_history.pop();
            let common_episode = common.history.pop();
            so.counter[common_episode.point.winner] -= 1;
            common.removeStatPoint(common_episode);
            // common.events.undo().forEach(fx => fx(common_episode.point));
            return common_episode.point;
         }
         return so.propagateUndo();
      };
      undo_actions.changePoints = () => {
         if (object == 'Game') {
            // clean up local and common histories
            so.local_history.pop();
            let common_episode = common.history.pop();
            so.counter = common_episode.pointChange.from;
            return common_episode;
         }
         return so.propagateUndo();
      };
      undo_actions.changeGames = () => {
         if (object == 'Set') {
            // clean up local and common histories
            so.local_history.pop();
            let common_episode = common.history.pop();
            so.counter = common_episode.gameChange.from;
            return common_episode;
         }
         return so.propagateUndo();
      };

      so.propagateUndo = () => {
         let last_child = so.lastChild();
         let last_child_complete = last_child.complete();
         let episode = last_child.undo();

         // remove the last history event and decrement the counter
         if (last_child_complete) {
            // pop history of non-game object
            let episode = so.local_history.pop();
            if (episode && episode.winner != undefined) so.counter[episode.winner] -= 1;
         }

         if (!last_child.history.local().length && last_child.lastChild() == undefined) so.children.pop();
         return episode;
      }
      return so;
   }

   umo.Match = ({index, type, common = umo.common()} = {}) => {
      let child = { object: 'Set', label: 'set', plural: 'sets' }
      let format = umo.matchFormat({type, common});
      let match = umo.stateObject({index, object: 'Match', format, child, common});

      match.scoreboard = (perspective) => { 
         if (!match.children.length) return '0-0';
         if (perspective == undefined) perspective = match.set.perspectiveScore() ? match.nextService() : undefined;
         return match.children.map(child => child.scoreboard(perspective)).join(', '); 
      }

      return { 
         set: match.set, reset: match.reset, format: match.format, 
         events: common.events, assignParser: common.assignParser, metadata: common.metadata, 
         nextService: match.nextService, nextTeamServing: match.nextTeamServing, nextTeamReceiving: match.nextTeamReceiving,
         change: match.change, undo: match.undo, 
         addPoint: match.addPoint, addPoints: match.addPoints, decoratePoint: match.decoratePoint,
         addScore: match.addScore, addScores: match.addScores, 
         complete: match.complete, winner: match.winner, 
         score: match.score, scoreboard: match.scoreboard,
         [match.child.plural]: match.accessChildren, 
         history: match.history, stats: common.stats,
      }
   }

   umo.Set = ({index, parent_object, type, common = umo.common()} = {}) => {
      let child = { object: 'Game', label: 'game', plural: 'games' }
      let format = umo.setFormat({type, common});
      let set = umo.stateObject({index, parent_object, object: 'Set', format, child, common});

      set.pointsNeeded = () => {
         if (set.complete()) return undefined;
         let threshold = set.format.threshold();
         let deciding_game = set.format.hasDecider();
         let score_difference = set.scoreDifference();
         let min_diff = set.format.minDiff();
         let deciding_game_format_required = [false, false];
         let games_to_set = set.counter.map((player_score, player) => {
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
         let points_to_set = games_to_set.map((player_games_to_set, player) => {
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

      let formatScore = ([p0score, p1score], [t0score, t1score], tiebreak_to) => {
         if (t0score || t1score) {
            if (t0score > t1score) p1score += `(${t1score})`;
            if (t1score > t0score) p0score += `(${t0score})`;
         }
         return `${p0score}-${p1score}`
      }

      set.scoreboard = (perspective) => {
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

      return { 
         set: set.set, reset: set.reset, format: set.format, 
         events: common.events, assignParser: common.assignParser, metadata: common.metadata, 
         nextService: set.nextService, nextTeamServing: set.nextTeamServing, nextTeamReceiving: set.nextTeamReceiving,
         change: set.change, undo: set.undo, 
         addPoint: set.addPoint, addPoints: set.addPoints, decoratePoint: set.decoratePoint,
         addScore: set.addScore, addScores: set.addScores, 
         complete: set.complete, winner: set.winner, 
         score: set.score, scoreboard: set.scoreboard, 
         [set.child.plural]: set.accessChildren, children: set.accessChildren, lastChild: set.lastChild, newChild: set.newChild,
         history: set.history,
         pointsNeeded: set.pointsNeeded, 
      }
   }

   umo.Game = ({index, parent_object, type, common = umo.common()} = {}) => {
      let child = { object: 'Point', label: 'point', plural: 'points' }
      let format = umo.gameFormat({type, common});
      let game = umo.stateObject({index, object: 'Game', parent_object, format, child, common});

      game.pointsToGame = () => {
         if (game.complete()) return undefined;
         let threshold = game.format.threshold();
         let deciding_point = game.format.hasDecider();
         let score_difference = game.scoreDifference();
         let min_diff = game.format.minDiff();
         let points_to_game = game.counter.map((player_score, player) => {
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

      game.scoreboard = (perspective) => {
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
            scoreboard = score.map((points, player) => progression[points]).join('-');
         } else {
            scoreboard = score.map((points, player) => {
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
         events: common.events, assignParser: common.assignParser, metadata: common.metadata,
         nextService: game.nextService, nextTeamServing: game.nextTeamServing, nextTeamReceiving: game.nextTeamReceiving,
         change: game.change, undo: game.undo,
         addPoint: game.addPoint, addPoints: game.addPoints, decoratePoint: game.decoratePoint,
         addScore: game.addScore, addScores: game.addScores, 
         complete: game.complete, winner: game.winner,
         score: game.score, scoreboard: game.scoreboard,
         history: game.history,
         lastChild: game.lastChild,
         pointsToGame: game.pointsToGame, 
      };
   }

   // necessary to define it this way so that hoisting works!
   umo.defaultPointParser = defaultPointParser;
   function defaultPointParser(value, server, last_point, format, teams, perspective, score_object) {
      if (value == undefined) return false;
      if ((value).toString().length == 1 && !isNaN(value)) { 
         let code = +value == server ? 'S' : 'R';
         return ([0, 1].indexOf(+value) < 0) ? false : { winner: +value, server: server, code: code }; 
      }

      let winning_team;
      let serving_team = teams.map(team => team.indexOf(server) >=0).indexOf(true);
      let point = { server: server };

      if (typeof value == 'object') {
         if (value.winner != undefined && [0, 1].indexOf(+value.winner) >= 0) {
            value.winner = parseInt(value.winner);
            value.code = !value.code ? (value.winner == server ? 'S' : 'R') : value.code;
            // lowercase indicates that point was played on second serve
            if (value.first_serve) value.code = value.code.toLowerCase();
            return Object.assign({}, value, point);
         }
         if (value.code && parseCode(value.code)) return Object.assign({}, value, point);
      }

      if (typeof value == 'string') {
         if (parseScore(value)) return point;
         if (parseCode(value)) return point;
      }

      function parseCode(code) {
         let upper_code = code.toUpperCase().match(/[A-Za-z]/g);
         let modifier = code.match(/[*#@]/g);
         if (upper_code) upper_code = upper_code.join('');
         if (modifier) modifier = modifier.join('');
         if ('SAQDRP'.split('').indexOf(String(upper_code)) >= 0 ) {
            if (['S', 'A', 'Q'].indexOf(upper_code) >= 0) { winning_team = serving_team; }
            if (['D', 'R', 'P'].indexOf(upper_code) >= 0) { winning_team = 1 - serving_team; }
            if (['Q', 'P'].indexOf(upper_code) >= 0) { point.result = 'Penalty'; }
            if (upper_code == 'A') point.result = 'Ace';
            if (upper_code == 'D') {
               point.first_serve = { error: 'Error', serves: [ '0e'] };
               point.result = 'Double Fault';
            }
            if (modifier && !point.result) {
               if (modifier == '*') point.result = 'Winner';
               if (modifier == '#') point.result = 'Forced Error';
               if (modifier == '@') point.result = 'Unforced Error';
            }
            point.code = code;
            point.winner = parseInt(winning_team);
            if (code === code.toLowerCase()) point.first_serve = { error: 'Error', serves: [ '0e'] };
            return point;
         }
      }

      function parseScore(value) {
         value = value.replace(':', '-').split('-').map(m => m.trim()).join('-').split('D').join('40');
         if (value.split('-').length != 2) return false;
         let last_score = score_object.points;
         let combinedTotal = (score) => score.reduce((a, b) => a + b); 
         if (format.tiebreak()) {
            let values = value.split('-').map(m => parseInt(m));;
            let last_values = last_score.split('-').map(m => parseInt(m));
            if (!numbersArray(values) || values.length != 2) return false;
            if (combinedTotal(last_values) + 1 != combinedTotal(values)) return false;
            let change = [Math.abs(values[0] - last_values[0]), Math.abs(values[1] - last_values[1])];
            point.winner = change.indexOf(1);
            return point;
         }
         let progression = Object.assign({}, adProgression);
         if (format.hasDecider()) Object.keys(noAdProgression).forEach(key => progression[key] = noAdProgression[key]);

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

   umo.matchFormat = ({type = '3_6a_7', common} = {}) => {
      let mf = umo.formatObject({plural: 'matches', common});
      mf.children = umo.setFormat({common});
      mf.decidingChild = umo.setFormat({common});
      mf.init(type);

      return { 
         description: mf.description, singles: mf.singles, doubles: mf.doubles, settings: mf.settings, 
         type: mf.type, types: mf.types, threshold: mf.threshold, hasDecider: mf.hasDecider, 
         minDiff: mf.minDiff, children: mf.children, decidingChild: mf.decidingChild, 
      }
   }

   umo.setFormat = ({type = 'AdSetsTo6tb7', common} = {}) => {
      let sf = umo.formatObject({plural: 'sets', common});
      sf.children = umo.gameFormat({common});
      sf.decidingChild = umo.gameFormat({common, type: 'tiebreak7a'});
      sf.init(type);

      return { 
         description: sf.description, singles: sf.singles, doubles: sf.doubles, settings: sf.settings, 
         type: sf.type, types: sf.types, threshold: sf.threshold, hasDecider: sf.hasDecider, 
         minDiff: sf.minDiff, children: sf.children, decidingChild: sf.decidingChild, 
      }
   }

   umo.gameFormat = ({type = 'advantage', common} = {}) => {
      let gf = umo.formatObject({plural: 'games', common});
      gf.init(type);

      return { 
         description: gf.description, settings: gf.settings, singles: gf.singles, doubles: gf.doubles,
         type: gf.type, types: gf.types, threshold: gf.threshold, hasDecider: gf.hasDecider, 
         minDiff: gf.minDiff, tiebreak: gf.tiebreak,
      }
   }

   umo.formatObject = ({plural, common = umo.common()} = {}) => {
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
               fo.description(f.description);
               fo.values.code = format_type;

               if (f.children) fo.children.type(f.children);
               if (f.decidingChild) fo.decidingChild.type(f.decidingChild);
               return true;
            }
         },
         settings({name, description, code, players, threshold, has_decider, min_diff, tiebreak} = {}) {
            if (code) {
               fo.type(code);
            } else if (!threshold || !has_decider || !min_diff || !tiebreak) {
               let number_of_players = typeof common.singles == 'function' ? common.singles() ? 2 : 4 : '';
               let settings = { 
                  name: fo.values.name, description: fo.values.description, 
                  code: fo.values.code, players: number_of_players,
                  threshold: fo.values.threshold, has_decider: fo.values.has_decider, 
                  min_diff: fo.values.min_diff, tiebreak: fo.values.tiebreak,
               };
               return settings;
            } else {
               // TODO: propagate these settings down to unfinished sets/games
               fo.tiebreak(tiebreak);
               fo.threshold(threshold);
               fo.minDiff(min_diff);
               fo.hasDecider(has_decider);
               if (description) fo.description(description);
               if (name) fo.name(name);
               if (players) {
                  if (players == 4) {
                     fo.doubles();
                  } else {
                     fo.singles();
                  }
               }
            }
         },
         name(value) {
            if (!arguments.length) return fo.values.name;
            if (typeof value == 'string') fo.values.name = value;
            return fo;
         },
         description(value) {
            if (!arguments.length) return fo.values.description;
            if (typeof value == 'string') fo.values.description = value;
            return fo;
         },
         tiebreak(value) {
            if (!arguments.length) return fo.values.tiebreak;
            fo.values.description = fo.values.code = undefined;
            if ([true, false].indexOf(value) >= 0) fo.values.tiebreak = value;
            return fo;
         },
         threshold(value) {
            if (!arguments.length) return fo.values.threshold;
            fo.values.description = fo.values.code = undefined;
            if (!isNaN(value)) fo.values.threshold = value;
            return fo;
         },
         minDiff(value) {
            if (!arguments.length) return fo.values.min_diff;
            fo.values.description = fo.values.code = undefined;
            if (!isNaN(value)) fo.values.min_diff = value;
            return fo;
         },
         hasDecider(value) {
            if (!arguments.length) return fo.values.has_decider;
            fo.values.description = fo.values.code = undefined;
            if ([true, false].indexOf(value) >= 0) fo.values.has_decider = value;
            return fo;
         },
      };
      return fo;
   }

   umo.common = () => {
      let number_of_players = 2;
      let addPoint_events = umo.addPoint_events.slice();
      let undo_events = umo.undo_events.slice();
      let reset_events = umo.reset_events.slice();
      let metadata = {};
      let stat_points;
      let last_episode;

      let accessors = {
         resetStats() { 
            stat_points = undefined; 
            last_episode = undefined;
         },
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
            if (!arguments.length) return metadata.service_order.slice();
            return changeOrder(order, 'service_order', 'receive_order');
         },
         doublesServiceChange() {
            if (number_of_players != 4) return false;
            // FIXME: Not allowed if not the end of a set; how to determine within common?
         },
         receiveOrder(order) {
            if (!arguments.length) return metadata.receive_order.slice();
            return changeOrder(order, 'receive_order', 'service_order');
         },
         teams() {
            let teams = [];
            teams[0] = metadata.service_order.filter((service, i) => (i+1)%2).sort();
            teams[1] = metadata.service_order.filter((service, i) => i%2).sort();
            teams.sort();
            return teams;
         },
         playerTeam(player) {
            return accessors.teams().map(team => team.indexOf(player) >= 0).indexOf(true);
         },
         teamPlayers() {
            return accessors.teams().map(team => team.map(i => accessors.players(i).name));
         },
         players(index) {
            if (!arguments.length) {
               if (metadata.players.length > metadata.service_order.length) return metadata.players;
               return metadata.service_order.map(i => accessors.players(i));
            }
            if (isNaN(index) || index < 0 || index > 3) return false;
            if (metadata.players[index]) return metadata.players[index];
            return { name: `Player ${['One', 'Two', 'Three', 'Four'][index]}` };
         },
         definePlayer({index, name, birth, puid, hand, seed, rank, age, entry, ioc, draw_position, } = {}) {
            if (index == undefined) index = metadata.players.length;
            let player = metadata.players[index] || {};
            if ((!name && !player.name) || (isNaN(index) || index > 3)) return false;
            let definition = { name, birth, puid, hand, seed, rank, age, entry, ioc,  draw_position, };
            Object.keys(definition).forEach(key => { if (definition[key]) player[key] = definition[key] });
            metadata.players[index] = player;
            return { index, player };
         },
         defineTournament({ name, tuid, start_date, tour, rank, surface, in_out, draw, draw_size, round, level } = {}) {
            let definition = {name, tuid, start_date, tour, rank, surface, in_out, draw, draw_size, round, level };
            Object.keys(definition).forEach(key => { if (definition[key]) metadata.tournament[key] = definition[key] });
            return metadata.tournament;
         },
         defineMatch({ muid, date, gender, year, court, start_time, end_time, duration, status, umpire, official_score } = {}) {
            let definition = {muid, date, gender, year, court, start_time, end_time, duration, status, umpire, official_score };
            Object.keys(definition).forEach(key => { if (definition[key]) metadata.match[key] = definition[key] });
            return metadata.match;
         },
         showTiebreakOrder(first_service) { return calcTiebreakService(12, first_service); },
      }

      function changeOrder(order, submitted, counterpart) {
         let sameOrder = (a, b) => !a.filter((o, i) => o != b[i]).length;
         let notXinY = (x, y) => y.filter(n => x.indexOf(n) != -1).length != y.length;
         if (!Array.isArray(order) || order.length != number_of_players || notXinY(order, [0,1]) || notXinY([0, 1, 2, 3], order)) return false;

         let no_format_change = (order.length == metadata[submitted].length);
         if (sameOrder(order, metadata[submitted]) && no_format_change) return accessors;

         let teams = accessors.teams();
         metadata[submitted] = order;
         let new_teams = accessors.teams();

         if (order.length == 4 && sameOrder(teams[0], new_teams[0]) && no_format_change && 
               serviceToOpponent(metadata[submitted], metadata[counterpart], new_teams)) return accessors;

         metadata[counterpart] = order.map(o => (order.length - 1) - o);
         return accessors;
      }

      function serviceToOpponent(players, opponents, teams) {
         let sameTeam = (p, o) => teams.filter(team => team.filter(player => [p, o].indexOf(player) >= 0).length > 1).length;
         return !players.filter((s, i) => sameTeam(s, opponents[i])).length;
      }

      function calcTiebreakService(number, first_service) {
         let progression = [];
         return [...Array(number).keys()].map(() => { let result = calcNext(progression, first_service); progression.push(result); return result; });
      }

      function calcNext(progression, first_service) {
         let last_position = pos(progression.length);
         let next_position = ((progression.length + 1) % 4) < 2;
         let last_score = progression[progression.length - 1];
         let last_service = last_score != undefined ? last_score : (first_service != undefined ? first_service : metadata.service_order[0]);
         let next_service = (next_position == last_position) ? last_service : pub.advanceService(last_service);
         return next_service;
      }

      function pos(number) {
         let iterations = [true].concat([...Array(number).keys()].map(i => ((i+1)%4)<2));
         return iterations[number];
      }

      function setServiceOrder() {
         if (number_of_players == 2) {
            let existing_order = pub.metadata.serviceOrder();
            if (existing_order.length == 2) return;
            pub.metadata.serviceOrder(existing_order.filter(f => [0, 1].indexOf(f) >= 0));
         } else {
            let existing_order = pub.metadata.serviceOrder();
            if (existing_order.length == 4) return;
            let new_order = existing_order.slice();
            existing_order.forEach(o => new_order.push(o + 2));
            pub.metadata.serviceOrder(new_order);
         }
      }

      let addEvent = (add_event) => {
         if (!add_event) return addPoint_events;
         if (typeof add_event == 'function') {
            addPoint_events.push(add_event);
         } else if (typeof add_event == 'array') {
            add_event.foreach(e) (e => { if (typeof e == 'function') addPoint_events.push(c); });
         }
      }

      let undoEvent = (undo_event) => {
         if (!undo_event) return undo_events;
         if (typeof undo_event == 'function') {
            undo_events.push(undo_event);
         } else if (typeof undo_event == 'array') {
            undo_event.foreach(e) (e => { if (typeof e == 'function') undo_events.push(c); });
         }
      }

      let resetEvent = (reset_event) => {
         if (!reset_event) return reset_events;
         if (typeof reset_event == 'function') {
            reset_events.push(reset_event);
         } else if (typeof reset_event == 'array') {
            reset_event.foreach(e) (e => { if (typeof e == 'function') reset_events.push(c); });
         }
      }

      let clearEvents = () => {
         addPoint_events = [];
         undo_events = [];
         reset_events = [];
      }

      let pub = {
         metadata: accessors,
         pointParser: umo.pointParser,
         events: { addPoint: addEvent, undo: undoEvent, clearEvents, reset: resetEvent },
         history: [],
         live_stats: false,
         perspective_score: false,
         assignParser(parser) { pub.pointParser = parser; },
         advanceService(service) {
            let index = metadata.service_order.indexOf(service) + 1;
            return metadata.service_order[index < accessors.players().length ? index : 0];
         },
         nextTiebreakService(history, first_service) {
            let so = calcTiebreakService(history.length + 1, first_service);
            return so[so.length - 1];
         },
         singles(value) { 
            if (!arguments.length) return number_of_players == 2 ? true : false;
            number_of_players = value ? 2 : 4;
            setServiceOrder();
            return pub;
         },
         doubles(value) { 
            if (!arguments.length) return number_of_players == 4 ? true : false;
            number_of_players = value ? 4 : 2;
            setServiceOrder();
            return pub;
         },
         stats: {
            calculated(set_filter) { return calculatedStats(pub.stats.counters(), set_filter); },
            counters() {
               if (!stat_points) {
                  pub.live_stats = true;
                  let points = pub.history.filter(episode => episode.action == 'addPoint');
                  points.forEach(point => pub.addStatPoint(point));
               }
               return stat_points; 
            },
         },
         addStatPoint(episode) {
            if (!pub.live_stats) return;
            let point = episode.point;
            if (!stat_points) stat_points = { players: {}, teams: {} };
            let server_team = accessors.playerTeam(point.server);
            let team_winner = accessors.playerTeam(point.winner);
            let team_loser = 1 - team_winner;

            addStat({ player: point.server, episode, stat: 'pointsServed' });
            addStat({ team: team_winner, episode, stat: 'pointsWon' });
            if (point.result == 'Ace') addStat({ player: point.server, episode, stat: 'aces' });
            if (point.result == 'Double Fault') addStat({ player: point.server, episode, stat: 'doubleFaults' });
            if (point.result == 'Winner') addStat({ player: point.winner, episode, stat: 'winners' });

            if (point.result == 'Unforced Error') addStat({ team: team_loser, episode, stat: 'unforcedErrors' });
            if (point.result == 'Forced Error') addStat({ team: team_loser, episode, stat: 'forcedErrors' });

            if (!point.first_serve) addStat({ player: point.server, episode, stat: 'serves1stIn' });
            if (!point.first_serve && point.winner == server_team) {
               addStat({ player: point.server, episode, stat: 'serves1stWon' });
               addStat({ team: team_loser, undefined, stat: 'received1stWon' });
               addStat({ team: team_loser, undefined, stat: 'received2ndWon' });
            }
            if (!point.first_serve && point.winner != server_team) addStat({ team: team_winner, episode, stat: 'received1stWon' });
            if (point.first_serve && !point.result != 'Double Fault') addStat({ player: point.server, episode, stat: 'serves2ndIn' });
            if (point.first_serve && !point.result != 'Double Fault' && point.winner == point.server) {
               addStat({ player: point.server, episode, stat: 'serves2ndWon' });
               addStat({ team: team_loser, undefined, stat: 'received1stWon' });
               addStat({ team: team_loser, undefined, stat: 'received2ndWon' });
            }
            if (point.first_serve && !point.result != 'Double Fault' && point.winner != server_team) {
               addStat({ team: team_winner, episode, stat: 'received2ndWon' });
            }
            if (point.breakpoint) {
               addStat({ player: point.server, undefined, stat: 'breakpointsSaved' });
               addStat({ player: point.server, episode, stat: 'breakpointsFaced' });
            }
            if (last_episode && last_episode.point.breakpoint && last_episode.point.server == point.winner) {
               addStat({ player: point.server, episode, stat: 'breakpointsSaved' });
            }

            if (episode.game && episode.game.complete) { addStat({ team: team_winner, episode, stat: 'gamesWon' }); }
            last_episode = episode;
         },
         removeStatPoint(episode) {
            if (!pub.live_stats) return;
            Object.keys(stat_points).forEach(grouping => {
               Object.keys(stat_points[grouping]).forEach(group => {
                  Object.keys(stat_points[grouping][group]).forEach(stat => {
                     if (stat_points[grouping][group][stat].length) {
                        stat_points[grouping][group][stat] = stat_points[grouping][group][stat].filter(f=>f.point.index != episode.point.index);
                     }
                  });
               }); 
            });
            let points = pub.history.filter(episode => episode.action == 'addPoint');
            last_episode = points.length ? points[points.length - 1] : undefined;
         },
      }
      accessors.reset();
      return pub;

      // TODO: Add set_filter to calculations...
      function calculatedStats(stats, set_filter) {
         if (!stats || !stats.teams) return [];

         // prefix of '-' indicates that value for opposing team should be used
         // '*' indicates that value is optional
         let calculated_stats = {
            'Aces': { numerators: ['aces'], calc: 'number', },
            'Double Faults': { numerators: ['doubleFaults'], calc: 'number',  },
            'First Serve %': { numerators: ['serves1stIn'], denominators: ['pointsServed'], calc: 'percentage', },
            'Unforced Errors': { numerators: ['unforcedErrors'], calc: 'number', },
            'Forced Errors': { numerators: ['forcedErrors'], calc: 'number', },
            'Winners': { numerators: ['winners'], calc: 'number', },
            'Total Points Won': { numerators: ['pointsWon'], calc: 'number', },
            'Max Pts/Row': { numerators: ['pointsWon'], calc: 'maxConsecutive', attribute: 'index', },
            'Max Games/Row': { numerators: ['gamesWon'], calc: 'maxConsecutive', attribute: 'game', },
            'Total Points Won': { numerators: ['pointsWon'], calc: 'number', },
            'Points Won 1st': { numerators: ['serves1stWon'], denominators: ['serves1stIn'], calc: 'percentage', },
            'Points Won 2nd': { numerators: ['serves2ndWon'], denominators: ['serves2ndIn'], calc: 'percentage', },
            'Points Won Receiving': { numerators: ['received1stWon', 'received2ndWon'], denominators: ['-pointsServed'], calc: 'percentage', },
            'Breakpoints Saved': { numerators: ['breakpointsSaved'], denominators: ['breakpointsFaced'], calc: 'percentage', },
            'Breakpoints Converted': { numerators: ['-breakpointsSaved'], denominators: ['-breakpointsFaced'], calc: 'difference', },
            'Aggressive Margin': { 
               calc: 'aggressiveMargin', 
               numerators: ['*doubleFaults', '*unforcedErrors'], 
               denominators: ['*aces', '*winners', '-*forcedErrors'], 
            },
         };

         let reduceComponents = (components, teams, team) => {
            if (!components) return undefined;
            let values = components.map(component => {
               let counter = component.split('-').reverse()[0].split('*').join('');
               let component_team = teams[component.indexOf('-') == 0 ? 1 - team : team];
               return component_team && component_team[counter] ? component_team[counter].length : 0;
            });
            return [].concat(0, 0, ...values).reduce((a, b) => a + b);
         }

         let numeratorDenominator = (stat_obj, teams, team) => {
            let numerator = reduceComponents(stat_obj.numerators, teams, team);
            let denominator = reduceComponents(stat_obj.denominators, teams, team);
            return { numerator, denominator };
         }

         let displayPct = (numerator, denominator) => {
            let pct = Math.round((numerator / denominator) * 100);
            return { value: pct, display: `${pct}% (${numerator}/${denominator})` };
         }

         // set_filter might need to be applied on a per-stat basis
         // because stats are built based on the points that are found in teams
         // the other options is to replicate teams and apply filter to copy
         let stat_calcs = {
            number(stat_obj, teams, team) {
               ({numerator, denominator} = numeratorDenominator(stat_obj, teams, team));
               return { display: numerator, value: numerator, numerators: stat_obj.numerators };
            },
            maxConsecutive(stat_obj, teams, team) {
               let stat = stat_obj.numerators[0];
               let attribute = stat_obj.attribute;
               let episodes = teams[team][stat];
               if (!episodes) return { value: 0, display: 0 };
               let current = undefined;
               let max_consecutive = 0;
               let consecutive = episodes.length ? 1 : 0;
               episodes.forEach(episode => {
                  if (current + 1 == episode.point[attribute]) {
                     consecutive += 1;
                  } else {
                     if (consecutive > max_consecutive) max_consecutive = consecutive;
                     consecutive = 1;
                  }
                  current = episode.point[attribute];
               });
               if (consecutive > max_consecutive) max_consecutive = consecutive;
               return { display: max_consecutive, value: max_consecutive };
            },
            percentage(stat_obj, teams, team) {
               ({numerator, denominator} = numeratorDenominator(stat_obj, teams, team));
               if (numerator == undefined || !denominator) return { value: 0, display: 0 };
               return Object.assign(displayPct(numerator, denominator), { numerators: stat_obj.numerators });
            },
            difference(stat_obj, teams, team) {
               ({numerator, denominator} = numeratorDenominator(stat_obj, teams, team));
               if (numerator == undefined || !denominator) return { value: 0, display: 0 };
               let diff = Math.abs(denominator - numerator);
               return Object.assign(displayPct(diff, denominator), { numerators: stat_obj.numerators });
            },
            aggressiveMargin(stat_obj, teams, team) {
               ({numerator, denominator} = numeratorDenominator(stat_obj, teams, team));
               let diff = denominator - numerator;
               let point_counts = Object.keys(teams).map(team => teams[team].pointsWon ? teams[team].pointsWon.length : 0);
               let total_points = [].concat(0, 0, ...point_counts).reduce((a, b) => a + b);
               return Object.assign(displayPct(diff, total_points), { numerators: stat_obj.numerators });
            }
         }

         let teams_counters = [].concat(...Object.keys(stats.teams).map(team => Object.keys(stats.teams[team])));
         let available_stats = Object.keys(calculated_stats).map(stat => {
            let stat_obj = calculated_stats[stat];
            if (!stat_obj.denominators) stat_obj.denominators = [];
            // must remove any '-' indicators to invert
            let required_counters = [].concat(...stat_obj.numerators, ...stat_obj.denominators).map(m=>m.split('-').reverse()[0]);
            required_counters = required_counters.filter(counter => counter.indexOf('*') < 0);
            let counters_exist = required_counters.map(counter => teams_counters.indexOf(counter) < 0).filter(f=>f).length < 1;
            if (!counters_exist) return false;
            let team_stats = [0, 1].map(team => { return stat_calcs[stat_obj.calc](stat_obj, stats.teams, team); });
            return { name: stat, team_stats };
         }).filter(f=>f);

         return available_stats;
      }

      function addStat({player, team, episode, stat}) {
         // stat object is created even if there is no episode to add (=0)
         if (player != undefined) {
            if (!stat_points.players[player]) stat_points.players[player] = {};
            if (!stat_points.players[player][stat]) stat_points.players[player][stat] = [];
            if (episode) stat_points.players[player][stat].push(episode);
            team = accessors.playerTeam(player);
         }
         if (team != undefined) {
            if (!stat_points.teams[team]) stat_points.teams[team] = {};
            if (!stat_points.teams[team][stat]) stat_points.teams[team][stat] = [];
            if (episode) stat_points.teams[team][stat].push(episode);
         }
      }
   }

   function numbersArray(values) {
      if (!Array.isArray(values)) return false;
      if (values.map(value => !isNaN(value)).indexOf(false) >=0 ) return false;
      return true;
   }

   if (typeof define === "function" && define.amd) define(umo); else if (typeof module === "object" && module.exports) module.exports = umo;
   this.umo = umo;
 
}();
