// @ts-nocheck
/**
 * Point Parser - Pure function for parsing point values
 * 
 * Extracts point winner and metadata from various input formats:
 * - Numeric: 0, 1 (player index)
 * - Code: 'S', 'R', 'A', 'D', etc. (with modifiers *, #, @)
 * - Score: '15-0', '30-15', '40-40', etc.
 * - Object: { winner: 0, code: 'S' }
 */

// Helper function
function numbersArray(values) {
   if (!Array.isArray(values)) return false;
   if (values.map(value => !isNaN(value)).indexOf(false) >=0 ) return false;
   return true;
}

// Score progression maps
const noAdProgression = { '40-40' : ['G-40', '40-G'] };
const adProgression = { 
   '0-0'  : ['15-0',  '0-15'], '0-15' : ['15-15', '0-30'], '0-30' : ['15-30', '0-40'], '0-40' : ['15-40', '0-G'], 
   '15-0' : ['30-0',  '15-15'], '15-15': ['30-15', '15-30'], '15-30': ['30-30', '15-40'], '15-40': ['30-40', '15-G'], 
   '30-0' : ['40-0',  '30-15'], '30-15': ['40-15', '30-30'], '30-30': ['40-30', '30-40'], '30-40': ['40-40', '30-G'], 
   '40-0' : ['G-0',   '40-15'], '40-15': ['G-15',  '40-30'], '40-30': ['G-30',  '40-40'], '40-40': ['A-40',  '40-A'], 
   'A-40' : ['G-40',  '40-40'], '40-A' : ['40-40', '40-G']
};

export function defaultPointParser(value, server, last_point, format, teams, perspective, score_object) {
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

export { numbersArray, adProgression, noAdProgression };
