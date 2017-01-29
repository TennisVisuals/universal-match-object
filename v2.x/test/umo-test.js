// Mocha test file

const assert = require('assert');
const matchObject = require('../src/matchObject');
let match = matchObject.Match();
let set = matchObject.Set();
let game = matchObject.Game();

discreetGameFormatChanges = function() {
   let gf = matchObject.gameFormat();

   var settings = gf.settings();
   assert.equal(settings.name, 'Advantage Game');
   assert.equal(settings.threshold, 4);
   assert.equal(settings.has_decider, false);
   assert.equal(settings.min_diff, 2);
   assert.equal(settings.tiebreak == true, false);

   gf.threshold(8);
   assert.equal(gf.threshold(), 8);
   gf.minDiff(4);
   assert.equal(gf.minDiff(), 4);
   gf.hasDecider(true);
   assert.equal(gf.hasDecider(), true);
   gf.tiebreak(true);
   assert.equal(gf.tiebreak(), true);
   gf.name('Foo');
   assert.equal(gf.name(), 'Foo');

   var settings = gf.settings();;
   assert.equal(settings.name, 'Foo');
   assert.equal(settings.threshold, 8);
   assert.equal(settings.has_decider, true);
   assert.equal(settings.min_diff, 4);
   assert.equal(settings.tiebreak, true);

   gf.threshold(6);
   assert.equal(gf.threshold(), 6);
   gf.minDiff(2);
   assert.equal(gf.minDiff(), 2);
   gf.hasDecider(false);
   assert.equal(gf.hasDecider(), false);
   gf.tiebreak(false);
   assert.equal(gf.tiebreak(), false);
   gf.name('Boo');
   assert.equal(gf.name(), 'Boo');

   var settings = gf.settings();
   assert.equal(settings.name, 'Boo');
   assert.equal(settings.threshold, 6);
   assert.equal(settings.has_decider, false);
   assert.equal(settings.min_diff, 2);
   assert.equal(settings.tiebreak, false);

}

namedGameFormatChanges = function() {
   let gf = matchObject.gameFormat();

   gf.type('noAdvantage');
   var settings = gf.settings();
   assert.equal(settings.name, 'No Advantage Game');
   assert.equal(settings.threshold, 4);
   assert.equal(settings.has_decider, true);
   assert.equal(settings.min_diff, 1);
   assert.equal(settings.tiebreak, false);

   gf.type('tiebreak7a');
   var settings = gf.settings();
   assert.equal(settings.name, 'Tiebreak to 7');
   assert.equal(settings.threshold, 7);
   assert.equal(settings.has_decider, false);
   assert.equal(settings.min_diff, 2);
   assert.equal(settings.tiebreak, true);

   gf.type('noAdvantage');
   var settings = gf.settings();
   assert.equal(settings.name, 'No Advantage Game');
   assert.equal(settings.threshold, 4);
   assert.equal(settings.has_decider, true);
   assert.equal(settings.min_diff, 1);
   assert.equal(settings.tiebreak, false);

   gf.type('tiebreak10a');
   var settings = gf.settings();
   assert.equal(settings.name, 'Tiebreak to 10');
   assert.equal(settings.threshold, 10);
   assert.equal(settings.has_decider, false);
   assert.equal(settings.min_diff, 2);
   assert.equal(settings.tiebreak, true);

   gf.type('advantage');
   var settings = gf.settings();
   assert.equal(settings.name, 'Advantage Game');
   assert.equal(settings.threshold, 4);
   assert.equal(settings.has_decider, false);
   assert.equal(settings.min_diff, 2);
   assert.equal(settings.tiebreak, false);

}

discreetSetFormatChanges = function() {
   set.reset(true);
   set.format.hasDecider(true).threshold(4).minDiff(2).name('Cyprus Kids League');
   set.format.singles(true);
   set.format.children.type('advantage');
   set.format.decidingChild.type('tiebreak4a');

   set.addPoints('00001111000011110000111100001111');
   let scoreboard = set.scoreboard();
   assert.equal(scoreboard, '4-4');
   set.addPoints('0101010101010101');
   let game_points = set.score().counters.points;
   assert.equal(game_points[0], 8);
   assert.equal(game_points[1], 8);
   set.addPoints('SR');
   assert.equal(set.complete(), true);
   set.reset();
   set.addPoints('010101011110101010000101010111101010100001010101111010101000');
   assert.equal(set.scoreboard(), '3-3');
   set.reset();
   set.addPoints('00001111000000000000');
   assert.equal(set.scoreboard(), '4-1');

   set.reset();
   set.format.hasDecider(true).threshold(8).minDiff(2).name('8 Game Pro Set');
   set.format.singles(true);
   set.format.children.type('advantage');
   set.format.decidingChild.type('tiebreak7a');

   set.addPoints('0000000000000000000000000000');
   scoreboard = set.scoreboard();
   assert.equal(scoreboard, '0-7');
   set.addPoints('0000');
   assert.equal(set.complete(), true);
   set.reset();
   set.addPoints('00001111000011110000111100001111');
   set.addPoints('00001111000011110000111100001111');
   set.addPoints('0000000');
   assert.equal(set.complete(), true);

   set.reset(true);
   set.format.hasDecider(true).threshold(4).minDiff(0).name('Under 10 Set to 4, tiebreak at 3-3');
   set.format.singles(true);
   set.format.children.type('noAdvantage');
   set.format.decidingChild.type('tiebreak7a');
   set.addPoints('0000000000000000');
   assert.equal(set.complete(), true);
   set.reset();
   set.addPoints('000011110000111100001111');
   assert.equal(set.scoreboard(), '3-3');
   set.addPoints('0101010000');
   assert.equal(set.scoreboard(), '4-3(3)');
   assert.equal(set.complete(), true);
   set.reset();
   // test no advantage
   set.addPoints('010101110101000101011101010001010111010100');
   assert.equal(set.scoreboard(), '3-3');
   set.addPoints('1010101111');
   assert.equal(set.scoreboard(), '3(3)-4');
   assert.equal(set.complete(), true);

   set.reset(true);
   set.format.hasDecider(true).threshold(4).minDiff(2).name('Under 10 Set to 4, tiebreak at 4-4');
   set.format.singles(true);
   set.format.children.type('noAdvantage');
   set.format.decidingChild.type('tiebreak7a');
   set.addPoints('000011110000111100001111');
   assert.equal(set.scoreboard(), '3-3');
   set.addPoints('0101010000');
   assert.equal(set.scoreboard(), '3-4 (0-40)');
   set.addPoint(0);
   assert.equal(set.complete(), true);
   assert.equal(set.scoreboard(), '5-3');

}

namedSetFormatChanges = function() {
   set.reset(true);
   set.format.type('AdSetsTo6tb7');
   var settings = set.format.settings();
   assert.equal(settings.name, 'Advantage, 6 games for set, Tiebreak to 7');
   assert.equal(settings.threshold, 6);
   assert.equal(settings.has_decider, true);
   assert.equal(settings.min_diff, 2);
   assert.equal(settings.tiebreak, undefined);
   assert.equal(set.format.children.settings().code, 'advantage');
   assert.equal(set.format.decidingChild.settings().code, 'tiebreak7a');

   set.reset();
   set.format.type('NoAdSetsTo6tb7');
   var settings = set.format.settings();
   assert.equal(settings.name, 'No-Ad, 6 games for set, Tiebreak to 7');
   assert.equal(settings.threshold, 6);
   assert.equal(settings.has_decider, true);
   assert.equal(settings.min_diff, 2);
   assert.equal(settings.tiebreak, undefined);
   assert.equal(set.format.children.settings().code, 'noAdvantage');
   assert.equal(set.format.decidingChild.settings().code, 'tiebreak7a');

   set.reset();
   set.format.type('supertiebreak');
   var settings = set.format.settings();
   assert.equal(settings.name, 'Supertiebreak');
   assert.equal(settings.threshold, 1);
   assert.equal(settings.has_decider, true);
   assert.equal(settings.min_diff, 1);
   assert.equal(settings.tiebreak, undefined);
   assert.equal(set.format.children.settings().code, 'tiebreak10a');
   assert.equal(set.format.decidingChild.settings().code, 'tiebreak10a');

   set.reset();
   set.format.type('pro10a12');
   var settings = set.format.settings();
   assert.equal(settings.name, '10 Game No Ad Pro Set');
   assert.equal(settings.threshold, 10);
   assert.equal(settings.has_decider, true);
   assert.equal(settings.min_diff, 2);
   assert.equal(settings.tiebreak, undefined);
   assert.equal(set.format.children.settings().code, 'noAdvantage');
   assert.equal(set.format.decidingChild.settings().code, 'tiebreak12a');
}

discreetMatchFormatChanges = function() {
   match.reset(true);
   match.format.threshold(1).hasDecider(true).minDiff(1);
   match.format.children.type('supertiebreak');
   match.format.decidingChild.type('supertiebreak');
   let settings = match.format.settings();
   assert.equal(settings.name, undefined);
   assert.equal(settings.code, undefined);
   assert.equal(settings.threshold, 1);
   assert.equal(settings.min_diff, 1);
   assert.equal(settings.has_decider, true);
   match.addPoints('000111000111');
   assert.equal(match.scoreboard(), '0-0 (6-6)');
   match.addPoints('0000')
   assert.equal(match.scoreboard(), '10-6');
   assert.equal(match.complete(), true);

}

namedMatchFormatChanges = function() {
   match.reset(true);
   match.format.type('3_6n_10');
   var settings = match.format.settings();
   assert.equal(settings.name, 'best of 3 sets, No-Ad, 6 games for set, Tiebreak to 7, final set Supertiebreak');
   assert.equal(settings.threshold, 2);
   assert.equal(settings.has_decider, true);
   assert.equal(settings.min_diff, 0);
   assert.equal(settings.tiebreak, undefined);
   assert.equal(match.format.children.settings().code, 'NoAdSetsTo6tb7');
   assert.equal(match.format.decidingChild.settings().code, 'supertiebreak');

   match.format.type('3_6n_7');
   var settings = match.format.settings();
   assert.equal(settings.name, 'best of 3 sets, No Advantage, 6 games for set, Tiebreak to 7');
   assert.equal(settings.threshold, 2);
   assert.equal(settings.has_decider, true);
   assert.equal(settings.min_diff, 0);
   assert.equal(settings.tiebreak, undefined);
   assert.equal(match.format.children.settings().code, 'NoAdSetsTo6tb7');
   assert.equal(match.format.decidingChild.settings().code, 'NoAdSetsTo6tb7');

   match.format.type('3_6a_7');
   var settings = match.format.settings();
   assert.equal(settings.name, 'best of 3 sets, Advantage, 6 games for set, Tiebreak to 7');
   assert.equal(settings.threshold, 2);
   assert.equal(settings.has_decider, true);
   assert.equal(settings.min_diff, 0);
   assert.equal(settings.tiebreak, undefined);
   assert.equal(match.format.children.settings().code, 'AdSetsTo6tb7');
   assert.equal(match.format.decidingChild.settings().code, 'AdSetsTo6tb7');
}

firstServiceChanges = function() {
   match.reset(true);
   match.format.singles(true);
   match.format.type('3_6n_10');
   assert.equal(match.set.firstService(3), false);
   match.format.doubles(true);
   match.metadata.serviceOrder([0, 1, 2, 3]);
   match.set.firstService(3);
   assert.equal(match.nextService(), 3);
   assert.equal(match.set.firstService(5), false);
   match.format.singles(true);
   // assert.equal(match.set.firstService(), 1); // FIXME: first service needs to be 1 or 0 in singles
}

addPoint = function(object) { 
   object.reset(true);
   let action = object.addPoint(0);
   assert.equal(action.result, true);
   let point_score = object.score().counters.points;
   assert.equal(point_score[0], 1);
   assert.equal(point_score[1], 0);

   object.undo();
   action = object.addPoint({winner: 0});
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[0], 1);
   assert.equal(point_score[1], 0);

   object.undo();
   action = object.addPoint(1);
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[1], 1);
   assert.equal(point_score[0], 0);

   object.undo();
   action = object.addPoint({winner: 1});
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[1], 1);
   assert.equal(point_score[0], 0);

   object.reset(true);
   object.set.firstService(0);
   action = object.addPoint('S');
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[0], 1);
   action = object.addPoint('R');
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[1], 1);

   object.reset(true);
   object.set.firstService(0);
   action = object.addPoint({code: 'S'});
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[0], 1);
   action = object.addPoint({code: 'R'});
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[1], 1);

   object.reset(true);
   object.set.firstService(1);
   action = object.addPoint('S');
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[1], 1);
   action = object.addPoint('R');
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[0], 1);

   object.reset(true);
   object.set.firstService(1);
   action = object.addPoint({code: 'S'});
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[1], 1);
   action = object.addPoint({code: 'R'});
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[0], 1);

   object.reset(true);
   object.set.firstService(0);
   action = object.addPoint('Q');
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[0], 1);
   action = object.addPoint('P');
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[1], 1);

   object.reset(true);
   object.set.firstService(1);
   action = object.addPoint('Q');
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[1], 1);
   action = object.addPoint('P');
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[0], 1);

   object.reset(true);
   object.set.firstService(0);
   action = object.addPoint('A');
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[0], 1);
   action = object.addPoint('D');
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[1], 1);

   object.reset(true);
   object.set.firstService(1);
   action = object.addPoint('A');
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[1], 1);
   action = object.addPoint('D');
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[0], 1);

   object.reset(true);
   object.set.firstService(0);
   action = object.addPoint({winner: 0});
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[0], 1);
   action = object.addPoint({winner: 1});
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[1], 1);

   object.reset(true);
   object.set.firstService(1);
   action = object.addPoint({winner: 0});
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[0], 1);
   action = object.addPoint({winner: 1});
   assert.equal(action.result, true);
   point_score = object.score().counters.points;
   assert.equal(point_score[1], 1);
}

addPointsArray = function(object) { 
   object.reset(true);
   let points_array = [0, 1, 0, 0, 1];
   let action = object.addPoints(points_array);
   assert.equal(action.result, 5);
   let point_score = object.score().counters.points;
   assert.equal(point_score[0], 3);
   assert.equal(point_score[1], 2);
}

addPointsString = function(object) { 
   object.reset(true);
   let points_string = "01001";
   let action = object.addPoints(points_string);
   assert.equal(action.result, 5);
   let point_score = object.score().counters.points;
   assert.equal(point_score[0], 3);
   assert.equal(point_score[1], 2);
}

testPerspectiveChange = function(object) {
   let points_string = "01101A";

   object.reset(true);
   object.set.firstService(1);
   object.set.perspectiveScore(true);
   let action = object.addPoints(points_string);
   let score_history = object.history.score();
   assert.equal(score_history[0], '0-15');
   assert.equal(score_history[2], '30-15');
   assert.equal(score_history[4], '40-30');

   object.reset(true);
   object.set.firstService(1);
   object.set.perspectiveScore(false);
   action = object.addPoints(points_string);
   score_history = object.history.score();
   assert.equal(score_history[0], '15-0');
   assert.equal(score_history[2], '15-30');
   assert.equal(score_history[4], '30-40');

   object.reset(true);
   object.set.firstService(0);
   object.set.perspectiveScore(true);
   action = object.addPoints(points_string);
   score_history = object.history.score();
   assert.equal(score_history[0], '15-0');
   assert.equal(score_history[2], '15-30');
   assert.equal(score_history[4], '30-40');

}

Game_addPoint = function() { addPoint(game); }
Game_addPointsArray = function() { addPointsArray(game); }
Game_addPointsString = function() { addPointsString(game); }
Set_addPoint = function() { addPoint(set); }
Set_addPointsArray = function() { addPointsArray(set); }
Set_addPointsString = function() { addPointsString(set); }
Match_addPoint = function() { addPoint(match); }
Match_addPointsArray = function() { addPointsArray(match); }
Match_addPointsString = function() { addPointsString(match); }

Game_testSinglesTiebreakServiceProgression = function() {
   game.reset(true);
   game.format.singles(true);
   game.format.type('tiebreak7a');
   assert.equal(game.nextService(), 0);
   game.addPoint(0);
   assert.equal(game.nextService(), 1);
   game.addPoint(1);
   assert.equal(game.nextService(), 1);
   game.addPoint(0);
   assert.equal(game.nextService(), 0);
   game.addPoint(1);
   assert.equal(game.nextService(), 0);
   game.addPoint(0);
   assert.equal(game.nextService(), 1);
   game.addPoint(1);
   assert.equal(game.nextService(), 1);
   game.addPoints([0, 1]);
   assert.equal(game.nextService(), 0);
   game.addPoints([0, 1]);
   assert.equal(game.nextService(), 1);
}

Match_DoublesServiceProgression = function() {
   match.reset(true);
   match.format.doubles(true);
   match.addPoints('0000');
   let next_service = match.nextService();
   assert.equal(next_service, 1);
   match.addPoints('0000');
   next_service = match.nextService();
   assert.equal(next_service, 2);
   match.addPoints('0000');
   next_service = match.nextService();
   assert.equal(next_service, 3);
   match.addPoints('111111111111111111110000000000001111');
   next_service = match.nextService();
   assert.equal(next_service, 0);
   let action = match.addPoint('0');
   assert.equal(action.next_service, 1);
   action = match.addPoint('S');
   assert.equal(action.next_service, 1);
   action = match.addPoint('A');
   assert.equal(action.next_service, 2);
   action = match.addPoint('R');
   assert.equal(action.next_service, 2);
   action = match.addPoint('P');
   assert.equal(action.next_service, 3);
   action = match.addPoint('D');
   assert.equal(action.next_service, 3);
   action = match.addPoint(0);
   assert.equal(action.next_service, 0);
   match.addPoints('111');
   next_service = match.nextService();
   assert.equal(next_service, 1);
}

Doubles_pointAssignment = function() {
   match.reset(true);
   match.format.doubles(true);
   let action = match.addPoint('S');
   assert.equal(action.point.server, 0);
   assert.equal(action.point.winner, 0);
   match.addPoints('SSS');
   action = match.addPoint('S');
   assert.equal(action.point.server, 1);
   assert.equal(action.point.winner, 1);
   match.addPoints('SSS');
   action = match.addPoint('S');
   assert.equal(action.point.server, 2);
   assert.equal(action.point.winner, 0);
   match.addPoints('SSS');
   action = match.addPoint('S');
   assert.equal(action.point.server, 3);
   assert.equal(action.point.winner, 1);

   match.reset(true);
   match.format.doubles(true);
   match.set.firstService(3);
   match.metadata.serviceOrder([3, 0, 2, 1]);
   let teams = match.metadata.teams();
   action = match.addPoint('S');
   assert.equal(action.point.server, 3);
   assert.equal(action.point.winner, 1);
   match.addPoints('SSS');
   action = match.addPoint('S');
   assert.equal(action.point.server, 0);
   assert.equal(action.point.winner, 0);
   match.addPoints('SSS');
   action = match.addPoint('S');
   assert.equal(action.point.server, 2);
   assert.equal(action.point.winner, 1);
   match.addPoints('SSS');
   action = match.addPoint('S');
   assert.equal(action.point.server, 1);
   assert.equal(action.point.winner, 0);
}

Game_testPerspectiveChange = function() { 
   let game = matchObject.Game();
   testPerspectiveChange(game); 
}
Set_testPerspectiveChange = function() { 
   let set = matchObject.Set();
   testPerspectiveChange(set); 

   set.reset(true);
   set.set.firstService(0);
   set.set.perspectiveScore(false);
   action = set.addPoints('0000000000000000');
   score_history = set.history.score();
   assert.equal(score_history[0], '15-0');
   assert.equal(score_history[2], '40-0');
   assert.equal(score_history[4], '15-0');
   assert.equal(score_history[12], '15-0');
}

Match_multipleSetPerspectives = function() {
   match.reset(true);
   match.format.type('singles3_6a_7');
   match.addPoints('SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS');
   let scoreboard = match.scoreboard();
   assert.equal(scoreboard,'6-6 (6-6)');
   match.addPoint(0);
   scoreboard = match.scoreboard();
   assert.equal(scoreboard,'6-6 (6-7)');
   scoreboard = match.scoreboard(0);
   assert.equal(scoreboard,'6-6 (7-6)');
   match.addPoint(0);
   scoreboard = match.scoreboard();
   assert.equal(scoreboard,'6(6)-7');
   match.addPoints('SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS');
   scoreboard = match.scoreboard();
   assert.equal(scoreboard,'7-6(6), 6-6 (6-6)');
   scoreboard = match.scoreboard(1);
   assert.equal(scoreboard,'6(6)-7, 6-6 (6-6)');
   match.addPoints('11'); 
   scoreboard = match.scoreboard();
   assert.equal(scoreboard,'7-6(6), 6(6)-7');
   scoreboard = match.scoreboard(1);
   assert.equal(scoreboard,'6(6)-7, 7-6(6)');
   assert.equal(match.nextService(), 0);
   match.addPoints('SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS');
   let action = match.addPoints('AAAARRRRPQPQDDDD');
   assert.equal(action.result, 10);
   assert.equal(action.rejected.length, 6);
   scoreboard = match.scoreboard();
   assert.equal(scoreboard,'7-6(6), 6(6)-7, 6(10)-7');
}

disablePerspective = function() {
   set.reset(true);
   set.format.type('supertiebreak');
   assert.equal(set.nextService(), 0);
   set.addPoint(0);
   assert.equal(set.nextService(), 1);
   assert.equal(set.scoreboard(), '0-0 (0-1)');
   set.addPoint(0);
   assert.equal(set.nextService(), 1);
   assert.equal(set.scoreboard(), '0-0 (0-2)');
   set.addPoint(0);
   assert.equal(set.nextService(), 0);
   assert.equal(set.scoreboard(), '0-0 (3-0)');

   set.reset(true);
   set.format.type('supertiebreak');
   set.set.perspectiveScore(false);
   assert.equal(set.nextService(), 0);
   set.addPoint(0);
   assert.equal(set.nextService(), 1);
   assert.equal(set.scoreboard(), '0-0 (1-0)');
   set.addPoint(0);
   assert.equal(set.nextService(), 1);
   assert.equal(set.scoreboard(), '0-0 (2-0)');
   set.addPoint(0);
   assert.equal(set.nextService(), 0);
   assert.equal(set.scoreboard(), '0-0 (3-0)');

}

doublesPerspective = function() {
   match.reset();
   match.format.doubles(true);
   match.metadata.serviceOrder([0, 1, 2, 3]);
   match.addPoint(0);
   assert.equal(match.scoreboard(), '0-0 (15-0)'); 
   // TODO: Finish This!
}

Game_advantageFormat = function() {
   game.reset(true);
   game.format.type('advantage');
   let action = game.addPoints('0001110101');
   assert.equal(action.result, 10);
   let points = game.score().counters.points;
   assert.equal(points[0], 5);
   assert.equal(points[1], 5);
   let score = game.scoreboard();
   assert.equal(score, '40-40');
   action = game.addPoint(0);
   assert.equal(action.point.winner, 0);
   action = game.addPoint(1);
   assert.equal(action.point.winner, 1);
   action = game.addPoints('010101101010');
   assert.equal(action.result, 12);
   points = game.score().counters.points;
   assert.equal(points[0], 12);
   assert.equal(points[1], 12);
   score = game.scoreboard();
   assert.equal(score, '40-40');
   action = game.addPoint(0);
   assert.equal(action.complete, false);
   action = game.addPoint(0);
   assert.equal(action.complete, true);
   score = game.scoreboard();
   assert.equal(score, '0-0');
   action = game.addPoints('0000');
   assert.equal(action.result, 0);
   assert.equal(action.rejected.length, 4);
   game.reset(true);
   action = game.addPoints('0000');
   assert.equal(action.result, 4);
   assert.equal(action.rejected.length, 0);
}

Game_noAdFormat = function() {
   game.reset(true);
   game.format.type('noAdvantage');
   let action = game.addPoints('0001110');
   assert.equal(action.result, 7);
   let points = game.score().counters.local;
   assert.equal(points[0], 4);
   assert.equal(points[1], 3);
   let score = game.scoreboard();
   assert.equal(score, '0-0');
   action = game.addPoint(0);
   assert.equal(action.result, false);

   game.reset(true);
   action = game.addPoints('1111');
   assert.equal(action.result, 4);
   points = game.score().counters.local;
   assert.equal(points[0], 0);
   assert.equal(points[1], 4);
   score = game.scoreboard();
   assert.equal(score, '0-0');
   action = game.addPoint(0);
   assert.equal(action.result, false);
}

Game_tiebreakFormat = function() {
   game.reset();
   game.format.type('tiebreak7a');
   let action = game.addPoints('0101010101010100');
   assert.equal(action.result, 16);
   let points = game.score().counters.local;
   assert.equal(points[0], 9);
   assert.equal(points[1], 7);
   let score = game.scoreboard();
   assert.equal(score, '9-7');
   action = game.addPoint(0);
   assert.equal(action.result, false);

   game.reset();
   action = game.addPoints('1111111');
   assert.equal(action.result, 7);
   points = game.score().counters.local;
   assert.equal(points[0], 0);
   assert.equal(points[1], 7);
   score = game.scoreboard();
   assert.equal(score, '0-7');
   action = game.addPoint(0);
   assert.equal(action.result, false);
}

Game_supertiebreakFormat = function() {
   game.reset(true);
   game.format.type('tiebreak10a');
   let action = game.addPoints('000000000111111111010111');
   assert.equal(action.result, 24);
   let points = game.score().counters.local;
   assert.equal(points[0], 11);
   assert.equal(points[1], 13);
   let score = game.scoreboard();
   assert.equal(score, '11-13');
   action = game.addPoint(0);
   assert.equal(action.result, false);

   game.reset();
   action = game.addPoints('0000000000');
   assert.equal(action.result, 10);
   points = game.score().counters.local;
   assert.equal(points[0], 10);
   assert.equal(points[1], 0);
   score = game.scoreboard();
   assert.equal(score, '10-0');
   action = game.addPoint(0);
   assert.equal(action.result, false);
}

Match_singles3_6a_7 = function() {
   match = mo.Match();
   match.format.type('3_6a_7');
   match.format.singles(true);
   let action = match.addPoints('00001111000011110000111100001111');
   assert.equal(action.result, 32);
   let point_score = match.score().counters.points;
   assert.equal(point_score[0], 0);
   assert.equal(point_score[1], 0);
   action = match.addPoints('00001111000011110000111100001111');
   assert.equal(action.result, 32);
   point_score = match.score().counters.points;
   assert.equal(point_score[0], 0);
   assert.equal(point_score[1], 0);
   action = match.addPoints('00001111000011110000111100001111');
   assert.equal(action.result, 32);
   point_score = match.score().counters.points;
   assert.equal(point_score[0], 0);
   assert.equal(point_score[1], 0);
   action = match.addPoints('00001111000011110000111100001111');
   assert.equal(action.result, 32);
   point_score = match.score().counters.points;
   assert.equal(point_score[0], 0);
   assert.equal(point_score[1], 0);
   action = match.addPoints('00001111000011110000111100001111');
   assert.equal(action.result, 32);
   point_score = match.score().counters.points;
   assert.equal(point_score[0], 0);
   assert.equal(point_score[1], 0);
   action = match.addPoints('00001111000011110000111100001111');
   assert.equal(action.result, 19);
   point_score = match.score().counters.points;
   assert.equal(point_score[0], 0);
   assert.equal(point_score[1], 0);
}

Match_doubles3_6n_10 = function() {
   match = mo.Match();
   match.format.type('3_6n_10');
   match.format.doubles(true);
   match.addPoints('000100001000010000100001000010');
   let set_score = match.score().counters.sets;
   assert.equal(set_score[0], 1);
   assert.equal(set_score[1], 0);
   let game_score = match.score().counters.games;
   assert.equal(game_score[0], 0);
   assert.equal(game_score[1], 0);
   match.addPoints('111011110111101111011110111101');
   set_score = match.score().counters.sets;
   assert.equal(set_score[0], 1);
   assert.equal(set_score[1], 1);
   let scoreboard = match.scoreboard();
   assert.equal(scoreboard, '6-0, 0-6');
   match.addPoint(0);
   let score_history = match.history.score();
   let last_score = score_history[score_history.length - 1];
   assert.equal(last_score, '1-0');
}

customizedFormatPropagation = function() {
   match.reset(true);
   match.format.threshold(3).hasDecider(true).minDiff(0).name('Wonky Match, Best of 5 Sets');

   match.format.children.threshold(2).hasDecider(true).minDiff(2).name('Best of 3 Games');
   match.format.children.children.threshold(4).hasDecider(false).minDiff(2).tiebreak(true).name('Tiebreak to 4, win by 2');
   match.format.children.decidingChild.threshold(8).hasDecider(true).minDiff(0).tiebreak(true).name('Tiebreak to 8, win by 1');

   match.format.decidingChild.threshold(3).hasDecider(true).minDiff(1).name('Best of 5 Games');
   match.format.decidingChild.children.threshold(9).hasDecider(false).minDiff(2).tiebreak(true).name('Tiebreak to 9, win by 2');
   match.format.decidingChild.decidingChild.threshold(12).hasDecider(true).minDiff(0).tiebreak(true).name('Tiebreak to 12, win by 1');

   match.addPoints('0000111100001111');
   // match.scoreboard(); //FIXME: not displaying scoreboard properly for set which is composed of only tiebreak games
   let games_won = match.score().counters.games;
   assert.equal(games_won[0], 2);
   assert.equal(games_won[1], 2);
   let action = match.addPoint(0);
   assert.equal(action.point.score, '1-0');
   match.addPoints('11111111');
   assert.equal(match.scoreboard(), '3-2(1)');
   match.addPoints('0000000000000000');
   match.addPoints('11111111');
   action = match.addPoint(0);
   assert.equal(action.needed.points_to_set[0], 26);
   assert.equal(action.needed.points_to_set[1], 27);
}

Set_AdSetsTo6tb7 = function() {
   set = mo.Set();
   set.format.type('AdSetsTo6tb7');
   set.addPoints('ARSRSRSSARSRSRSSARSRSRSSARSRSRSSARSRSRSSARSRSRSS');
   let game_score = set.score().counters.games;
   assert.equal(game_score[0], 3);
   assert.equal(game_score[1], 3);
   set.addPoints('ARSRSRSSARSRSRSSARSRSRSSARSRSRSSARSRSRSSARSRSRSS');
   game_score = set.score().counters.games;
   assert.equal(game_score[0], 6);
   assert.equal(game_score[1], 6);
   set.addPoints('SASASASASASASASAS');
   let point_score = set.score().counters.points;
   assert.equal(point_score[0], 9);
   assert.equal(point_score[1], 8);
   set.addPoint('D');
   assert.equal(set.complete(), true);
   set.reset();

   // supports that win-by-two
   let action = set.addPoints('000011110000111100001111000011110000111100000000');
   assert.equal(action.rejected.length, 0);
   assert.equal(set.complete(), true);
   assert.equal(set.scoreboard(), '7-5');
}

Set_NoAdSetsTo6tb7 = function() {
   set = mo.Set();
   set.format.type('NoAdSetsTo6tb7');
   set.addPoints('010101101010110101011010101101010110101011');
   assert.equal(set.complete(), true);
   set.reset();
   set.addPoints('101010010101001010100101010010101001010100');
   assert.equal(set.complete(), true);
   set.reset();
   set.addPoints('000011110000111100001111000011110000111100001111');
   let game_score = set.score().counters.games;
   assert.equal(game_score[0], 6);
   assert.equal(game_score[1], 6);
   set.addPoints('10101010101010');
   let point_score = set.score().counters.points;
   assert.equal(point_score[0], 7);
   assert.equal(point_score[1], 7);
   set.addPoints('11');
   assert.equal(set.complete(), true);
}

Set_supertiebreak = function() {
   set = mo.Set();
   set.format.type('supertiebreak');
   set.addPoints('01010101010101');
   let point_score = set.score().counters.points;
   assert.equal(point_score[0], 7);
   assert.equal(point_score[1], 7);
   set.addPoints('000');
   point_score = set.score().counters.points;
   assert.equal(point_score[0], 0);
   assert.equal(point_score[1], 0);
   let action = set.addPoints('000');
   assert.equal(action.result, 0);
   // FIXME: need to check for proper score format for supertiebreak sets
   // shoould be 10-4 instead of 1-0(4)
}

pointsNeededCalcs = function() {
   set.reset();
   set.format.type('AdSetsTo6tb7');
   assert.equal(set.scoreboard(), '0-0');
   pts = set.addPoint(0).needed.points_to_set;
   assert.equal(pts[0], 23);
   assert.equal(pts[1], 24);
   set.addPoints('0000000000000000000000');
   pts = set.pointsNeeded().points_to_set;
   assert.equal(pts[0], 1);
   assert.equal(pts[1], 29);
   set.addPoints('111');
   pts = set.pointsNeeded().points_to_set;
   assert.equal(pts[0], 2);
   assert.equal(pts[1], 26);
   set.addPoints('11111');
   pts = set.pointsNeeded().points_to_set;
   assert.equal(pts[0], 5);
   assert.equal(pts[1], 21);
   set.addPoints('11111111111');
   pts = set.pointsNeeded().points_to_set;
   assert.equal(pts[0], 4);
   assert.equal(pts[1], 10);
   set.addPoint(1);
   pts = set.pointsNeeded().points_to_set;
   assert.equal(pts[0], 5);
   assert.equal(pts[1], 9);
   set.addPoint(1);
   pts = set.pointsNeeded().points_to_set;
   assert.equal(pts[0], 8);
   assert.equal(pts[1], 8);
   set.addPoints('0000');
   pts = set.pointsNeeded().points_to_set;
   assert.equal(pts[0], 4);
   assert.equal(pts[1], 11);
   set.addPoints('000');
   pts = set.pointsNeeded().points_to_set;
   assert.equal(pts[0], 1);
   assert.equal(pts[1], 12);
   set.addPoints('111');
   pts = set.pointsNeeded().points_to_set;
   assert.equal(pts[0], 2);
   assert.equal(pts[1], 9);
   set.addPoints('11');
   pts = set.pointsNeeded().points_to_set;
   assert.equal(pts[0], 7);
   assert.equal(pts[1], 7);
   set.addPoints('000000');
   pts = set.pointsNeeded().points_to_set;
   assert.equal(pts[0], 1);
   assert.equal(pts[1], 8);
   set.addPoints('1111111');
   pts = set.pointsNeeded().points_to_set;
   assert.equal(pts[0], 3);
   assert.equal(pts[1], 1);
   set.addPoints('000');
   pts = set.pointsNeeded();
   assert.equal(pts, undefined);

}

queryCommands = function() {
   let formats = game.format.types();
   assert.equal(formats.length > 1, true);
   formats = set.format.types();
   assert.equal(formats.length > 1, true);
   formats = match.format.types();
   assert.equal(formats.length > 1, true);
}

CommonAttributeClosure = function() {
   let g1 = mo.Game();
   let g2 = mo.Game();
   g1.metadata.definePlayer({name: 'foo'});
   let g1players = g1.metadata.players();
   assert.equal(g1players[0].name, 'foo');
   assert.equal(g1players[1].name, 'Player Two');
   let g2players = g2.metadata.players();
   assert.equal(g2players[0].name, 'Player One');
   assert.equal(g2players[1].name, 'Player Two');
}

Metadata_ServiceReceiveOrder = function() {
   match.reset(true);
   assert.equal(match.format.singles(), true);
   let service_order = match.metadata.serviceOrder();
   assert.equal(service_order[0], 0);
   assert.equal(service_order[1], 1);
   let receive_order = match.metadata.receiveOrder();
   assert.equal(receive_order[0], 1);
   assert.equal(receive_order[1], 0);
   let teams = match.metadata.teams();
   assert.equal(teams[0].length == 1, true);
   assert.equal(teams[1].length == 1, true);
   assert.equal(teams[0][0], 0);
   assert.equal(teams[1][0], 1);

   // cannot change service order to four players when singles() == true
   service_order = match.metadata.serviceOrder([1,2,3,0]);
   assert.equal(service_order, false);
   // only [0,1] allowed when singles() == true
   service_order = match.metadata.serviceOrder('a');
   assert.equal(service_order, false);
   service_order = match.metadata.serviceOrder([3,2]);
   assert.equal(service_order, false);

   // service order changes propagate
   match.metadata.serviceOrder([1, 0]);
   service_order = match.metadata.serviceOrder();
   assert.equal(service_order[0], 1);
   assert.equal(service_order[1], 0);
   receive_order = match.metadata.receiveOrder();
   assert.equal(receive_order[0], 0);
   assert.equal(receive_order[1], 1);

   // receive order changes propagate
   match.metadata.receiveOrder([1, 0]);
   service_order = match.metadata.serviceOrder();
   assert.equal(service_order[0], 0);
   assert.equal(service_order[1], 1);
   receive_order = match.metadata.receiveOrder();
   assert.equal(receive_order[0], 1);
   assert.equal(receive_order[1], 0);

   // changing to doubles expands service order
   match.format.doubles(true);
   service_order = match.metadata.serviceOrder();
   assert.equal(service_order[0], 0);
   assert.equal(service_order[1], 1);
   assert.equal(service_order[2], 2);
   assert.equal(service_order[3], 3);
   receive_order = match.metadata.receiveOrder();
   assert.equal(receive_order[0], 3);
   assert.equal(receive_order[1], 2);
   assert.equal(receive_order[2], 1);
   assert.equal(receive_order[3], 0);

   // teams reflect service order
   teams = match.metadata.teams();
   assert.equal(teams[0][0], 0);
   assert.equal(teams[0][1], 2);
   assert.equal(teams[1][0], 1);
   assert.equal(teams[1][1], 3);

   // cannot change service order to two players when doubles() == true
   service_order = match.metadata.serviceOrder([0, 1]);
   assert.equal(service_order, false);

   // service order can be any permutation of 0-3
   service_order = match.metadata.serviceOrder([2,1,0,3]);
   assert.equal(service_order != false, true);

   // teams stay sorted by player order
   teams = match.metadata.teams();
   assert.equal(teams[0][0], 0);
   assert.equal(teams[0][1], 2);
   assert.equal(teams[1][0], 1);
   assert.equal(teams[1][1], 3);

   // receiver order does not change unnecessarily
   receive_order = match.metadata.receiveOrder();
   assert.equal(receive_order[0], 3);
   assert.equal(receive_order[1], 2);
   assert.equal(receive_order[2], 1);
   assert.equal(receive_order[3], 0);

   service_order = match.metadata.serviceOrder([1,2,3,0]);
   assert.equal(service_order != false, true);

   // teams stay sorted by player order
   teams = match.metadata.teams();
   assert.equal(teams[0][0], 0);
   assert.equal(teams[0][1], 2);
   assert.equal(teams[1][0], 1);
   assert.equal(teams[1][1], 3);

   // receiver order MUST change because team members can't serve to each other
   receive_order = match.metadata.receiveOrder();
   assert.equal(receive_order[0], 2);
   assert.equal(receive_order[1], 1);
   assert.equal(receive_order[2], 0);
   assert.equal(receive_order[3], 3);

   // singles service order distlls 1,0 order from doubles service order
   match.format.singles(true);
   service_order = match.metadata.serviceOrder();
   assert.equal(service_order[0], 1);
   assert.equal(service_order[1], 0);

   match.format.doubles(true);
   match.metadata.serviceOrder([0, 3, 2, 1]);
   match.format.singles(true);
   service_order = match.metadata.serviceOrder();
   assert.equal(service_order[0], 0);
   assert.equal(service_order[1], 1);
}

Match_propagationOfServiceChanges = function() {
   match.reset(true);
   match.set.firstService(1);
   let first_service = match.set.firstService();
   assert.equal(first_service, 1);
   match.addPoints('0');
   first_service = match.sets()[0].set.firstService();
   assert.equal(first_service, 1);
   first_service = match.sets()[0].games()[0].set.firstService();
   assert.equal(first_service, 1);

   match.undo();
   match.set.firstService(0);
   first_service = match.set.firstService();
   assert.equal(first_service, 0);
   match.addPoints('0');
   first_service = match.sets()[0].set.firstService();
   assert.equal(first_service, 0);
   first_service = match.sets()[0].games()[0].set.firstService();
   assert.equal(first_service, 0);
}

Match_propagationOfSinglesDoublesChanges = function() {
   match.reset(true);
   match.addPoint(0);
   assert.equal(match.metadata.players().length, 2);
   assert.equal(match.sets()[0].metadata.players().length, 2);
   assert.equal(match.sets()[0].games()[0].metadata.players().length, 2);
   assert.equal(match.format.settings().players, 2);
   assert.equal(match.format.children.settings().players, 2);
   assert.equal(match.format.children.children.settings().players, 2);
   assert.equal(match.format.children.decidingChild.settings().players, 2);
   assert.equal(match.format.decidingChild.settings().players, 2);
   assert.equal(match.format.decidingChild.children.settings().players, 2);
   assert.equal(match.format.decidingChild.decidingChild.settings().players, 2);
   match.format.doubles(true);
   assert.equal(match.metadata.players().length, 4);
   assert.equal(match.sets()[0].metadata.players().length, 4);
   assert.equal(match.sets()[0].games()[0].metadata.players().length, 4);
   assert.equal(match.format.settings().players, 4);
   assert.equal(match.format.children.settings().players, 4);
   assert.equal(match.format.children.children.settings().players, 4);
   assert.equal(match.format.children.decidingChild.settings().players, 4);
   assert.equal(match.format.decidingChild.settings().players, 4);
   assert.equal(match.format.decidingChild.children.settings().players, 4);
   assert.equal(match.format.decidingChild.decidingChild.settings().players, 4);
   match.format.doubles(false);
   assert.equal(match.metadata.players().length, 2);
   assert.equal(match.sets()[0].metadata.players().length, 2);
   assert.equal(match.sets()[0].games()[0].metadata.players().length, 2);
   assert.equal(match.format.settings().players, 2);
   assert.equal(match.format.children.settings().players, 2);
   assert.equal(match.format.children.children.settings().players, 2);
   assert.equal(match.format.children.decidingChild.settings().players, 2);
   assert.equal(match.format.decidingChild.settings().players, 2);
   assert.equal(match.format.decidingChild.children.settings().players, 2);
   assert.equal(match.format.decidingChild.decidingChild.settings().players, 2);
   match.format.singles(false);
   assert.equal(match.metadata.players().length, 4);
   assert.equal(match.sets()[0].metadata.players().length, 4);
   assert.equal(match.sets()[0].games()[0].metadata.players().length, 4);
   assert.equal(match.format.settings().players, 4);
   assert.equal(match.format.children.settings().players, 4);
   assert.equal(match.format.children.children.settings().players, 4);
   assert.equal(match.format.children.decidingChild.settings().players, 4);
   assert.equal(match.format.decidingChild.settings().players, 4);
   assert.equal(match.format.decidingChild.children.settings().players, 4);
   assert.equal(match.format.decidingChild.decidingChild.settings().players, 4);
   match.format.singles(true);
   assert.equal(match.metadata.players().length, 2);
   assert.equal(match.sets()[0].metadata.players().length, 2);
   assert.equal(match.sets()[0].games()[0].metadata.players().length, 2);
   assert.equal(match.format.settings().players, 2);
   assert.equal(match.format.children.settings().players, 2);
   assert.equal(match.format.children.children.settings().players, 2);
   assert.equal(match.format.children.decidingChild.settings().players, 2);
   assert.equal(match.format.decidingChild.settings().players, 2);
   assert.equal(match.format.decidingChild.children.settings().players, 2);
   assert.equal(match.format.decidingChild.decidingChild.settings().players, 2);
}

Games_undo = function() {
   game.reset(true);
   game.format.singles(true);
   game.format.type('advantage');
   let action = game.addPoint(0);
   let point_history = game.history.points();
   assert.equal(point_history.length, 1);
   let undo = game.undo();
   assert.equal(action.point.score, undo.score);
   point_history = game.history.points();
   assert.equal(point_history.length, 0);
   action = game.addPoints('0000');
   assert.equal(game.complete(), true);
   undo = game.undo();
   assert.equal(undo.score,'0-0');
   let point_score = game.score().points;
   assert.equal(point_score, '40-0');
   game.addPoints('1111');
   point_score = game.score().points;
   assert.equal(point_score, '40-A');
}

Sets_undo = function() {
   set.reset(true);
   set.format.singles(true);
   set.format.type('NoAdSetsTo6tb7');
   set.addPoints('0101010');
   let point_score = set.score().points;
   assert.equal(point_score, '0-0');

   let action = set.addPoint(1);
   // score reversed because of perspective
   point_score = set.score().points;
   assert.equal(point_score, '15-0');
   let game_points = set.score().counters.points;
   assert.equal(game_points[1], 1);
   let undo = set.undo();
   assert.equal(action.point.score, undo.score);
   point_score = set.score().points;
   assert.equal(point_score, '0-0');
   set.addPoint(0);
   point_score = set.score().points;
   assert.equal(point_score, '0-15');
   game_points = set.score().counters.points;
   assert.equal(game_points[0], 1);
   let point_history = set.history.points();
   assert.equal(point_history.length, 8);
   undo = set.undo(8);
   point_history = set.history.points();
   assert.equal(point_history.length, 0);
   let games = set.games();
   assert.equal(games.length, 0);
   let set_score = set.score().counters;
   assert.equal(set_score.games[0], 0);
   assert.equal(set_score.games[1], 0);
}

Match_undo = function() {
   match.reset(true);
   match.addPoints('000000000000000000000000');
   let num_sets = match.sets().length;
   assert.equal(num_sets, 1);
   let point_history = match.history.points();
   assert.equal(point_history.length, 24);
   let scoreboard = match.scoreboard();
   assert.equal(scoreboard, '6-0');
   match.addPoint(0);
   num_sets = match.sets().length;
   assert.equal(num_sets, 2);
   match.undo();
   num_sets = match.sets().length;
   assert.equal(num_sets, 1);
   match.addPoints('000000000000000000000000');
   assert.equal(match.complete(), true);
   match.undo();
   assert.equal(match.complete(), false);
}

function isSorted(arr) { let i; for (i=0; i < arr.length - 1 && arr[i] < arr[i+1]; i++){}; return i == arr.length -1; }

PointIndices_undo = function() {
   match.reset(true);
   match.addPoints('SADRPQDS10pq100010saqrdp');
   let point_history_indices = match.history.points().map(m=>m.index);
   assert.equal(isSorted(point_history_indices), true);
   match.undo(5);
   match.addPoint(0);
   point_history_indices = match.history.points().map(m=>m.index);
   assert.equal(isSorted(point_history_indices), true);
   match.undo(10);
   match.addPoints('000000000000000000000000000000');
   point_history_indices = match.history.points().map(m=>m.index);
   assert.equal(isSorted(point_history_indices), true);
   match.addPoints('111111111111111111111111');
   match.undo(20);
   point_history_indices = match.history.points().map(m=>m.index);
   assert.equal(isSorted(point_history_indices), true);
}

UndoPointsChange = function() {
   match.reset(true);
   match.change.points([3, 2]);
   assert.equal(match.scoreboard(), '0-0 (40-30)');
   match.undo();
   assert.equal(match.scoreboard(), '0-0');
   match.addPoint(0);
   match.change.points([6, 5]);
   assert.equal(match.scoreboard(), '0-0 (A-40)');
   match.addPoint(0);
   match.change.points([3, 2]);
   assert.equal(match.scoreboard(), '0-1 (30-40)');
   match.undo();
   match.addPoints('111');
   assert.equal(match.scoreboard(), '0-1 (40-0)');
   match.reset();
   match.addPoints('111111111111111111111111');
   assert.equal(match.scoreboard(), '0-6');
   match.change.points([1, 1])
   assert.equal(match.scoreboard(), '0-6, 0-0 (15-15)');
   match.undo();
   assert.equal(match.scoreboard(), '0-6');
   match.undo();
   assert.equal(match.scoreboard(), '5-0 (40-0)');
   match.addPoints('111111111111111111111111');
   assert.equal(match.complete(), false);
   match.addPoint(1);
   assert.equal(match.complete(), true);
   let action = match.change.points([1, 1]);
   assert.equal(action.result, false);
}

UndoGamesChange = function() {
}

addNewTypes = function() {
   var mo = matchObject;
   mo.format('sets', 'pro8a7', '8 Game Pro Set', false, true, 8, 2, 'advantage', 'tiebreak7a');
   set = matchObject.Set({type: 'pro8a7'});
   set.addPoints('0000000000000000000000000000');
   let scoreboard = set.scoreboard();
   assert.equal(scoreboard, '0-7');
   set.addPoints('0000');
   assert.equal(set.complete(), true);

   set.reset();
   set.addPoints('00001111000011110000111100001111');
   set.addPoints('00001111000011110000111100001111');
   set.addPoints('0000000');
   assert.equal(set.complete(), true);
}

eventHooks = function() {
   let new_match = mo.Match();
   function notifyAdd(point) { console.log('Point Added!'); }
   function notifyUndo(point) { console.log('Point Undone!'); }
   new_match.notify.addPoint(notifyAdd);
   new_match.notify.undo(notifyUndo);
}

pluggableParser = function() {
   let match = matchObject.Match();
   match.assignParser(customParser);
   let action = match.addPoint('X');
   assert.equal(action.result, true);

   function customParser(value, server, last_point, format, teams, perspective) {
      let winning_team;
      let serving_team = teams.map(function(team) { return team.indexOf(server) >=0 }).indexOf(true);
      let point = { server: server };

      if (typeof value == 'string') {
         if (parseCode(value)) return point;
      }

      return { result: false };

      function parseCode(code) {
         code = code.toUpperCase();
         if ('XY'.split('').indexOf(String(code)) >= 0 ) {

            if (['X'].indexOf(code) >= 0) { winning_team = serving_team; }
            if (['Y'].indexOf(code) >= 0) { winning_team = 1 - serving_team; }

            point.code = code;
            point.winner = parseInt(winning_team);
            return point;
         }
      }
   }

}

scoreProgressions = function() {
   match.reset(true);
   match.addPoints(['0-15', '0-30', '0-40', '0-0']);
   assert.equal(match.scoreboard(), '1-0');
   match.reset();
   let action = match.addPoint('15-15');
   assert.equal(action.result, false);
}

describe('Common Data Propagation', function() {
  it('Metadata changes should be equivalent in all parent/child relationships', Match_propagationOfServiceChanges);
  it('# of players should be equivalent in all parent/child relationsihps', Match_propagationOfSinglesDoublesChanges);
  it('Common attributes should be shared only with children objects, not new instances of parent object', CommonAttributeClosure);
});

describe('Game Format Changes', function() {
  it('should accept discreet changes in game formats', discreetGameFormatChanges);
  it('should accept type changes in game formats', namedGameFormatChanges);
  it('Changes in Serve/Receive Order should not conflict', Metadata_ServiceReceiveOrder);
});

describe('Set Format Changes', function() {
  it('should accept discreet changes in Set formats', discreetSetFormatChanges);
  it('should accept type changes in Set formats', namedSetFormatChanges);
});

describe('Match Format Changes', function() {
  it('should accept discreet changes in Match formats', discreetMatchFormatChanges);
  it('should accept type changes in Match formats', namedMatchFormatChanges);
  it('set.firstService(n), n must be an element of metadata.serviceOrder()', firstServiceChanges);
});

describe('Game Points', function() {
  it('should accept a point as string or object', Game_addPoint);
  it('should accept an array of points', Game_addPointsArray);
  it('should accept a string of points', Game_addPointsString);
});

describe('Server Perspective Changess', function() {
  it('should support perspective Changes from Games', Game_testPerspectiveChange);
  it('should support perspective Changes from Sets', Set_testPerspectiveChange);
  it('should properly reflect perspective for Multiple Match Sets', Match_multipleSetPerspectives); 
  it('should allow perspective scores to be disabled', disablePerspective);
  it('should change perspective properly with various doubles combinations', doublesPerspective);
});

describe('Service Progression', function() {
  it('should change service properly in Singles Tiebreaks', Game_testSinglesTiebreakServiceProgression);
  it('service order should follow serviceOrder() in Doubles', Match_DoublesServiceProgression);
});

describe('Set Points', function() {
  it('should accept a point', Set_addPoint);
  it('should accept an array of points', Set_addPointsArray);
  it('should accept a string of points', Set_addPointsString);
});

describe('Match Points', function() {
  it('should accept a point', Match_addPoint);
  it('should accept an array of points', Match_addPointsArray);
  it('should accept a string of points', Match_addPointsString);
});

describe('Point Assignment', function() {
   it('Doubles: Proper assignment of points to winning team', Doubles_pointAssignment);
});

describe('Game Format Points', function() {
  it('should keep proper score for Advantage Games', Game_advantageFormat);
  it('should keep proper score for No-Advantage Games', Game_noAdFormat);
  it('should keep proper score for Tiebreak Games', Game_tiebreakFormat);
  it('should keep proper score for Supertiebreak Games', Game_supertiebreakFormat);
});

describe('Set Formats', function() {
  it('Supports Singles Advantage sets to 6 with 7 point tiebreak', Set_AdSetsTo6tb7);
  it('Supports Singles No-Advantage sets to 6 with 7 point tiebreak', Set_NoAdSetsTo6tb7);
  it('Supports Singles 10 point supertiebreak Set'); // , Set_supertiebreak);
});

describe('Match Formats', function() {
  it('Supports Standard Singles Best of 3 sets to 6 with 7 point tiebreak', Match_singles3_6a_7);
  it('Supports Standard Doubles 2 sets to 6 with 7 point tiebreak, 10 point tiebreak', Match_doubles3_6n_10);
  it('Customized formats for Match children & children.children etc. propagate properly', customizedFormatPropagation);
});

describe('Points To Set', function() {
  it('Proper PTS calculation', pointsNeededCalcs);
});

describe('Standard Commands', function() {
  it('Format query commnds', queryCommands);
});

describe('Parsing', function() {
  it('Default parser should accept score progressions', scoreProgressions);
  it('Should support pluggable point parsers', pluggableParser);
});

describe('Score Changes', function() {
  it('Able to change points for current game');
  it('Able to change point scores for current game');
  it('Point scores which complete a game will increment parent set game counter');
});

describe('Scoreboard', function() {
  it('Should display score properly for Matches which consist of only one tiebreak');
});

describe('Orientation', function() {
  it('Should include service court indicators (Ad/Deuce)');
  it('Should include court End indicators (Starting/Opposite)');
  it('Should accurately indicate next receiver');
});

describe('Intelligence', function() {
  it('Should allow an unknown point to be entered and determine winner from subsequent score entry');
});

describe('Extensible', function() {
  it('Able to add new formats programmatically', addNewTypes);
  it('Provides Hooks for event publication / statistics', eventHooks);
});

describe('Undo', function() {
  it('Should support undo within games', Games_undo);
  it('Should support undo across game boundaries', Sets_undo);
  it('Should support undo across set boundaries', Match_undo);
  it('Point Indices when adding points after an undo should be correct', PointIndices_undo);
  it('Point Changes should undo properly in Games, Sets and Matches', UndoPointsChange);
  it('Point Score Changes should undo properly in Games, Sets and Matches'); //, UndoPointScoreChange);
  it('Games Changes should undo properly in Sets and Matches'); //, UndoGamesChange);
});

