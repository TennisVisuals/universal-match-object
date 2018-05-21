var orientation;

window.addEventListener("orientationchange", function() { setOrientation(); }, false);

function setOrientation() { orientation = (window.innerHeight > window.innerWidth) ? 'portrait' : 'landscape'; }
function zeroPad(number) { return number.toString()[1] ? number : "0" + number; }

setOrientation();

var coms = {
   socket: undefined,
   connectionOptions:  {
      "force new connection" : true,
      "reconnectionDelay" : 1000,
      "reconnectionAttempts": "Infinity",
      "timeout" : 20000,
   },
};

function updateScore(msg) {
   var score = msg.score;
   var serving = msg.serving;
   var points = score.points.split('-');
   var players = msg.players;

   var player_0 = Array.from(document.querySelectorAll('.display_player_0'));
   player_0.forEach(function(element) { return element.innerHTML = players[0].name });
   player_0.forEach(function(element) { return element.style['color'] = serving || msg.complete ? 'white' : 'yellow' });
   var player_1 = Array.from(document.querySelectorAll('.display_player_1'));
   player_1.forEach(function(element) { return element.innerHTML = players[1].name });
   player_1.forEach(function(element) { return element.style['color'] = serving && !msg.complete ? 'yellow' : 'white' });

   var display_point_0 = Array.from(document.querySelectorAll('.display_points_0'));
   display_point_0.forEach(function(element) { element.innerHTML = points[0]; });
   display_point_0.forEach(function(element) { element.style['color'] = msg.complete ? 'black' : serving ? 'white' : 'yellow' });
   var display_point_1 = Array.from(document.querySelectorAll('.display_points_1'));
   display_point_1.forEach(function(element) { element.innerHTML = points[1] });
   display_point_1.forEach(function(element) { element.style['color'] = msg.complete ? 'black' : serving ? 'yellow' : 'white' });

   var sets = score.components.sets;
   if (!sets) return;

   sets.forEach(function(set, index) {
      var set_displays = Array.from(document.getElementsByClassName('hs' + index));
      set_displays.forEach(function(set) { set.style.display = 'flex' });

      var player0_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_0'));
      player0_games.forEach(function(field) { field.innerHTML = set.games[0] });
      var player1_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_1'));
      player1_games.forEach(function(field) { field.innerHTML = set.games[1] });
   });

   for (var s=sets.length; s < 5; s++ ) {
      var set_displays = Array.from(document.getElementsByClassName('hs' + s));
      set_displays.forEach(function(set) { set.style.display = 'none' });
   }
}

function updatePointHistory(msg) {
   var point = msg.point;
   document.getElementById('pointhistory').style.display = 'block';

   var player = point ? point.winner : 0;

   var result_class = "";
   var rez = point && point.result ? point.result.toLowerCase() : "";
   if (rez.indexOf("ace") >= 0) {
      result_class = "winner";
   } else if (rez.indexOf("winner") >= 0) {
      result_class = "winner";
   } else if (rez.indexOf("unforced") >= 0) {
      result_class = "unforced";
      player = 1 - player;
   } else if (rez.indexOf("fault") >= 0) {
      result_class = "fault";
      player = 1 - player;
   } else if (rez.indexOf("forced") >= 0) {
      result_class = "forced";
      player = 1 - player;
   }

   var point_result = '<span class=' + (result_class || "") + '>' + (point && point.result ? point.result : '') + '</span>';

   var stroke = point ? [point.hand, point.stroke].filter(function(f) { return f; }).join(' ') : '';
   var hand_stroke = '<span class="hand_stroke">' + (stroke) + '</span>';
   var tm = (point && point.uts) ? (new Date(point.uts)) : '';
   var points = point ? point.score : msg.score.points;
   if (points == '0-0' && tm != '') points = 'GAME';

   var p0 = player ? '' : '<div class="flexjustifystart">' + (player ? '&nbsp;' : hand_stroke) + '</div><div class="r_left flexjustifyend">' + (player ? '&nbsp;' : point_result) + '</div>';
   var p1 = player ? '<div class="r_right flexjustifystart">' + (player ? point_result : '&nbsp;') + '</div><div class="flexjustifyend">' + (player ? hand_stroke : '&nbsp;') + '</div>' : '';
   var timestring = tm ? [tm.getHours(), zeroPad(tm.getMinutes()), zeroPad(tm.getSeconds())].join(':') : '';
   var timestamp = '<div class="time ' + (player ? 'flexjustifystart' : 'flexjustifyend') + '">' + timestring + '</div>';

   var undo = '<div class="time flexcenter">Undo</div>';
   if (msg.undo) { p0 = undo; p1 = undo; }

   var history_item = '<div class="flexrows result_row"><div class="result_player0 flexrows">' + (p0 || timestamp) + '</div><div class="flexcenter score">' + points + '</div><div class="result_player1 flexrows">' + (p1 || timestamp) + '</div></div>';

   var updates = document.getElementById('updates');
   var node = document.createElement("LI");
   node.innerHTML = history_item;
   updates.insertBefore(node, updates.firstChild);

   if (msg.complete) { 
      history_item = '<div class="flexcenter complete">MATCH COMPLETE</div>'; 
      var fin = document.createElement("LI");
      fin.innerHTML = history_item;
      updates.insertBefore(fin, updates.firstChild);
   }

   var elem = document.getElementById('details');
   elem.scrollTop = 0;

}

var QueryString = function () {
  var qs = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (typeof qs[pair[0]] === "undefined") {
      qs[pair[0]] = pair[1];
    } else if (typeof qs[pair[0]] === "string") {
      var arr = [ qs[pair[0]], pair[1] ];
      qs[pair[0]] = arr;
    } else {
      qs[pair[0]].push(pair[1]);
    }
  } 
  return qs;
} ();

var okeys = Object.keys(QueryString);
function init() {
   coms.socket = io.connect('/match', coms.connectionOptions);
   coms.socket.on('connect', function() { 
      console.log('connected');
      if (okeys.indexOf('muid') >= 0) { 
         coms.socket.emit('join match', QueryString.muid); 
      }
   });
   coms.socket.on('disconnect', function () { console.log('disconnected'); });
   coms.socket.on('point history', function(data) {
      if (data) {
         var points = JSON.parse('[' + data.join(',') + ']');
         points = points.sort(function(a, b) { return a.uts - b.uts });
         d3.select('#updates').html('');
         points.forEach(function(point) { updatePointHistory({ point: point }); });
      }
   });

   coms.socket.on('match details', function(msg){ 
      updateScore(msg); 
   });
   coms.socket.on('match score', function(msg){
      updateScore(msg);
      updatePointHistory(msg);
   });
   coms.socket.on('messages', function(msg) { });
} 

init();
