// @ts-nocheck
/**
 * State Object Factory - COMPLETE
 */

import { numbersArray } from '../scoring/pointParser';

export function createStateObject({
   index, 
   object, 
   parent_object, 
   child, 
   format, 
   common
}: any) {
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
            // Set singles as default for match level
            if (format) so.format.singles(true);
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
      so.history.action = (action) => common.history.filter(episode => episode.action == action);
      so.history.points = (set) => {
         let points = common.history.filter(episode => episode.action == 'addPoint').map(episode => episode.point); 
         if (set != undefined) points = points.filter(point => point.set == set);
         return points;
      }
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
         counters.local = so.counter.slice(); // Copy to avoid reference sharing
         counters.points = object == 'Game' ? (so.complete() ? [0, 0] : so.counter.slice()) : (so.lastChild() ? so.lastChild().score().counters.points : [0, 0]); 
         counters.games = object == 'Set' ? (so.complete() ? [0, 0] : so.counter.slice()) : (object == 'Match' ? (so.lastChild() ? so.lastChild().score().counters.games : [0, 0]) : undefined);
         counters.sets = object == 'Match' ? so.counter.slice() : undefined;
         let current = {};
         let score = { counters };
         score.points = object == 'Game' ? (so.complete() ? '0-0' : so.scoreboard()) : (so.lastChild() ? so.lastChild().score().points : '0-0'); 
         score.games = object == 'Set' ? (so.complete() ? '0-0' : so.perspectiveScore().join('-')) : (so.lastChild() ? so.lastChild().score().games : '0-0');
         score.sets = object == 'Match' ? so.perspectiveScore().join('-') : (so.lastChild() ? so.lastChild().score().sets : '0-0');
         score.components = {};
         if (object == 'Match' && so.children.length) {
            score.components.sets = so.children.map(set => {
               let map = { games: set.score().counters.local };
               if (set.lastChild() && set.lastChild().format.isTiebreak) map.tiebreak = set.lastChild().score().counters.local;
               return map;
            });
         }
         score.display = {};
         return score;
      };

      so.accessChildren = () => so.children;
      so.lastChild = () => so.children[so.children.length - 1];
      so.scoreDifference = () => Math.abs(so.counter[0] - so.counter[1]);
      so.thresholdMet = () => Math.max(...so.counter) >= so.format.pointsTo;
      so.minDifferenceMet = () => so.scoreDifference() >= so.format.winBy;
      so.singleThresholdMet = () => Math.max(...so.counter) >= so.format.pointsTo && Math.min(...so.counter) < so.format.pointsTo;
      so.winner = () => (so.complete()) ? (so.counter[0] > so.counter[1] ? 0 : 1) : undefined;
      so.reverseScore = () => common.perspective_score && (so.nextTeamServing() % 2) == 1;
      so.nextTeamServing = () => common.metadata.teams().map(team => team.indexOf(so.nextService()) >= 0).indexOf(true);
      so.nextTeamReceiving = () => common.metadata.teams().map(team => team.indexOf(so.nextService()) >= 0).indexOf(false);
      so.perspectiveScore = (counter = so.counter, force) => {
         if (force != undefined) return force ? counter.slice().reverse() : counter;
         return so.reverseScore() ? counter.slice().reverse() : counter; 
      }
      so.complete = () => {
         function beyondDoubleThreshold() { return so.counter[0] >= so.format.pointsTo && so.counter[1] >= so.format.pointsTo; }
         return (so.thresholdMet() && so.minDifferenceMet()) || (beyondDoubleThreshold() && so.scoreDifference() && so.format.hasGoldenPoint) ? true : false;
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
            if (!so.format.isTiebreak) return so.first_service;
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

         let threshold = so.format.pointsTo;
         let min_diff = so.format.winBy;
         let countersAtValue = (value) => so.counter[0] == value && so.counter[1] == value;
         let deciding_child_required = ( 
            (countersAtValue(threshold) && (so.format.hasGoldenPoint || min_diff == 1)) || 
            (countersAtValue(threshold - 1) && min_diff == 0) );
         let total_children = so.children.length;

         // Get formatStructure from parent's stored structures (no function calls - just read the JSON!)
         const childFormatStructure = (deciding_child_required) 
            ? so.format.values.decidingChildFormatStructure
            : so.format.values.childFormatStructure;

         let new_child = umo[so.child.object]({
            index: total_children, 
            parent_object: so, 
            common: common,
            formatStructure: childFormatStructure
         });
         new_child.set.firstService(next_first_service);

         // Legacy fallback: If no formatStructure, copy attributes from template
         // (This path should rarely/never be hit with new architecture)
         if (!childFormatStructure) {
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
         if (so.format.isTiebreak) attributes.tiebreak = true;
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
         if (typeof values == 'string') values = values.match(/[01A-Za-z][\*\#\@]*/g) || [];
         let added = [];
         let rejected = [];
         while (values && values.length) {
            let value = values.shift();
            let episode = fx(value);
            // Null/undefined check to prevent TypeError
            if (episode && episode.result) {
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
            let past_threshold = Math.max(...values) > so.format.pointsTo;
            let value_difference = Math.abs(values[0] - values[1]);
            if (past_threshold && value_difference > so.format.winBy) return false;
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
            if (so.format.isTiebreak) return so.change.points(value.split('-').map(v => parseInt(v)));
            value = value.replace(':', '-').split('-').map(m => m.trim()).join('-').split('D').join('40');
            let progression = Object.assign({}, adProgression);
            if (so.format.hasGoldenPoint) Object.keys(noAdProgression).forEach(key => progression[key] = noAdProgression[key]);
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
