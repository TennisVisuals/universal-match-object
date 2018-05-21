/* TODO
 *
 * Limit Tournament Round by Draw Size
 * Limit Draw Position by Draw Size
 *
 * Add Date Validation... default to today's date if empty
 * Add Venue, City, Country, gps to Tournament?
 *
 * Screen for complete match: scoreboard at top, duration & etc.
 * with menu to select stats / momentum
 *
 * Press and Hold Rally Button prompts for Rally Length
 *
 * timer.start(10, 'service_timer')
 * timer.setSpeed(0)
 *
 */

   var match = umo.Match();
   var ch_version = '1.6.4';

   var device = {
      isStandalone: 'standalone' in window.navigator && window.navigator.standalone,
      isIDevice: (/iphone|ipod|ipad/i).test(window.navigator.userAgent),
      isMobile: (typeof window.orientation !== "undefined"),
      geoposition: {},
   }

   var dev = {}

   var env = {
      lets: 0,
      rally: 0,
      undone: [],
      view: 'entry',
      serve2nd: false,
      rally_mode: false,
      match_swap: false,         // automatic swap
      swap_sides: false,         // user initiated swap
      orientation: 'vertical',
      serving: match.nextTeamServing(),
      receiving: match.nextTeamReceiving(),
   };

   var coms = {
      socket: undefined,
      connectionOptions:  {
         "force new connection" : true,
         "reconnectionDelay" : 1000,
         "reconnectionAttempts": "Infinity",
         "timeout" : 20000,
      },
   };

   var app = {
      broadcast: undefined,
      user_uuid: undefined,
   }

   var settings = {
      track_shot_types: undefined,
      audible_clicks: undefined,
      display_gamefish: undefined,
      auto_swap_sides: undefined,
   };

   var options = {
      user_swap: false,
      highlight_better_stats: true,
      vertical_view: BrowserStorage.get('vertical_view') || 'vblack',
      horizontal_view: BrowserStorage.get('horizontal_view') || 'hblack',
   };

   var charts = {};
   var toggles = {};
   var default_players = ['Player One', 'Player Two'];
   var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
   var buttons = {
      'first_serve': { color: 'rgb(64, 168, 75)', type: 'toggle' },
      'second_serve': { color: 'rgb(255, 116, 51)', type: 'toggle' },
      'double_fault': { color: 'rgb(221, 56, 48)', type: 'flash' },
      'penalty': { color: 'rgb(221, 56, 48)', type: 'flash' },
      'first_ace': { color: 'rgb(64, 168, 75)', type: 'flash' },
      'second_ace': { color: 'rgb(255, 116, 51)', type: 'flash' },
      'server_winner': { color: 'rgb(64, 168, 75)', type: 'flash' },
      'server_unforced': { color: 'rgb(221, 56, 48)', type: 'flash' },
      'server_forced': { color: 'rgb(255, 116, 51)', type: 'flash' },
      'receiving_winner': { color: 'rgb(64, 168, 75)', type: 'flash' },
      'receiving_unforced': { color: 'rgb(221, 56, 48)', type: 'flash' },
      'receiving_forced': { color: 'rgb(255, 116, 51)', type: 'flash' },
   };
   var toggle_ids = Object.keys(buttons).filter(f=>buttons[f].type == 'toggle');

   // used to locate known tournaments in vicinity; auto-fill country
   navigator.geolocation.getCurrentPosition(function(pos) { device.geoposition = pos; });

   window.addEventListener('load', function(e) {
     window.applicationCache.addEventListener('updateready', function(e) {
       if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
         if (confirm('A new version of CourtHive is available. Load it?')) { window.location.reload(); }
       }
     }, false);
   }, false);

   window.addEventListener("orientationchange", function() { orientationEvent(); }, false);
   window.addEventListener("resize", function() { orientationEvent(); }, false);

   function updateAppState() {
      Object.keys(settings).forEach(key => {
         var em = document.getElementById(key);
         if (em) settings[key] = em.checked;
      });
      BrowserStorage.set('CH_AppSettings', JSON.stringify(settings));
      BrowserStorage.set('CH_AppState', JSON.stringify(app));
   }

   function restoreAppState() {
      var app_settings = BrowserStorage.get('CH_AppSettings');
      if (app_settings) settings = JSON.parse(app_settings);
      Object.keys(settings).forEach(key => {
         var em = document.getElementById(key);
         if (em) em.checked = settings[key];
      });
      var app_state = BrowserStorage.get('CH_AppState');
      if (app_state) app = JSON.parse(app_state);
   }

   function closeModal(which) { 
      if (which) {
         document.getElementById(which).style.display = "none"; 
      } else {
         Array.from(document.querySelectorAll('.modal')).forEach(modal => modal.style.display = "none");
      }
   }

   function showModal(text, data) {
      document.getElementById('modaltext').innerHTML = text;
      if (data) document.getElementById("copy2clipboard").setAttribute("data-clipboard-text", data);
      document.getElementById('modal').style.display = "flex";
   }

   function showGame(d) { showGameFish(d.index); }
   function showGameFish(index) { 
      document.getElementById('gamefish').style.display = "flex"; 
      var games = groupGames();
      var game = index != undefined ? games[index] : games[games.length -1];
      var gridcells = (game.points[0].tiebreak) ? ['0', '1', '2', '3', '4', '5', '6', '7'] : ['0', '15', '30', '40', 'G'];
      charts.gamefish.options({ 
         display: { reverse: env.swap_sides, },
         fish: { 
            gridcells: gridcells,
            cell_size: 20 
         },
         score: game.score 
      });
      charts.gamefish.data(game.points).update();
      window.scrollTo(0, 0);
   }
   function closeGameFish() { 
      document.getElementById('gamefish').style.display = "none"; 
   }

   touchManager.disableDrag();

   touchManager.swipeLeft = (element) => {
      if (element && element.id) {
         if (element.id == 'main_menu') {
            var systeminfo = `
               <div><b>Standalone:</b> <span style="color: blue">${device.isStandalone}</span></div>
               <div><b>Perspective Score:</b> ${match.set.perspectiveScore()}</div>
            `;
            showModal(systeminfo);
            return;
         }
         var object_delete = document.getElementById(element.id + '_delete');
         var object_export = document.getElementById(element.id + '_export');
         var action_delete = object_delete ? object_delete.style.display : undefined;
         var action_export = object_export ? object_export.style.display : undefined;
         if (action_export == 'flex') {
            document.getElementById(element.id + '_export').style.display = 'none';
         } else if (action_delete == 'none') {
            document.getElementById(element.id + '_delete').style.display = 'flex';
         }
      }
   }

   touchManager.swipeRight = (element) => {
      if (element && element.id) {
         var object_delete = document.getElementById(element.id + '_delete');
         var object_export = document.getElementById(element.id + '_export');
         var action_delete = object_delete ? object_delete.style.display : undefined;
         var action_export = object_export ? object_export.style.display : undefined;
         if (action_delete == 'flex') {
            document.getElementById(element.id + '_delete').style.display = 'none';
         } else if (action_export == 'none') {
            document.getElementById(element.id + '_export').style.display = 'flex';
         }
      }
   }

   // TODO: is this used??
   touchManager.pressAndHold = (element) => {
      if (element.classList.contains('rally')) {
         console.log('Prompt for Rally Length');
      };
   }

   function download(textToWrite, fileNameToSaveAs) {
      fileNameToSaveAs = fileNameToSaveAs || 'match.json';
      var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
      var downloadLink = document.createElement("a");
      downloadLink.download = fileNameToSaveAs;
      downloadLink.innerHTML = "Download File";
      if (window.URL != null) { 
          downloadLink.href = window.URL.createObjectURL(textFileAsBlob); 
      } else {
          downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
          downloadLink.onclick = destroyClickedElement;
          downloadLink.style.display = "none";
          document.body.appendChild(downloadLink);
      }
      downloadLink.click();
   }

   function resetButton(id, color) {
       var button = document.getElementById(id);
       if (!button) return;
       if (buttons[id] && buttons[id].color) {
          button.style.backgroundColor = "white";
          button.style.color = buttons[id].color;
          button.style.borderColor = buttons[id].color;
       }
   }

   function resetStyles() {
      Object.keys(buttons).forEach(id => resetButton(id));
   }

   function resetButtons() {
      var server_side = env.swap_sides ? 1 - env.serving : env.serving;
      var receiver_side = env.swap_sides ? 1 - env.receiving : env.receiving;

      Array.from(document.querySelectorAll('.fault')).forEach(div => div.innerHTML = 'Fault');

      var server_mode = `.modeaction_player${server_side}`;
      Array.from(document.querySelectorAll(server_mode)).forEach(div => div.innerHTML = 'Serve')

      var server_fault = `.modeerr_player${server_side}`;
      Array.from(document.querySelectorAll(server_fault)).forEach(div => div.innerHTML = 'Fault')
      var server_ace = `.modewin_player${server_side}`;
      Array.from(document.querySelectorAll(server_ace)).forEach(div => div.innerHTML = 'Ace')
      var server_let = `.modeforce_player${server_side}`;
      Array.from(document.querySelectorAll(server_let)).forEach(div => div.innerHTML = 'Let')

      var receiver_mode = `.modeaction_player${receiver_side}`;
      Array.from(document.querySelectorAll(receiver_mode)).forEach(div => div.innerHTML = 'Return')

      var receiver_ufe = `.modeerr_player${receiver_side}`;
      Array.from(document.querySelectorAll(receiver_ufe)).forEach(div => div.innerHTML = 'UFE')
      var receiver_winner = `.modewin_player${receiver_side}`;
      Array.from(document.querySelectorAll(receiver_winner)).forEach(div => div.innerHTML = 'Winner')
      var receiver_forced = `.modeforce_player${receiver_side}`;
      Array.from(document.querySelectorAll(receiver_forced)).forEach(div => div.innerHTML = 'Forced')

      Array.from(document.querySelectorAll('.vs_point_button')).forEach(div => div.style.display = settings.point_buttons ? 'flex' : 'none');

      Array.from(document.querySelectorAll('.rally')).forEach(div => div.innerHTML = 'Rally');
   };

   function styleButton(id) {
      var button = document.getElementById(id);
      if (!button) return;
      if (buttons[id].type == 'flash') {
         button.style.backgroundColor = buttons[id].color;
         button.style.color = "white";
         setTimeout(()=>resetStyles() , 300);
      } else if (buttons[id].type == 'toggle') {
         if (button.style.backgroundColor == 'white') {
            env.serve2nd = id == 'second_serve' ? true : false;
            button.style.backgroundColor = buttons[id].color;
            button.style.color = 'white';
         } else {
            env.serve2nd = false;
            button.style.backgroundColor = 'white';
            button.style.color = buttons[id].color;
         }
         toggle_ids.filter(f=>f!=id).forEach(id => resetButton(id));
      }
   }

   function updateScore() {
      var score = match.score();
      var sets_counter = score.counters.sets;
      var games_counter = score.counters.games;
      var points = score.points.split('-');
      var left_side = env.swap_sides ? 1 : 0;
      var right_side = env.swap_sides ? 0 : 1;

      // old way
      var point_fields = Array.from(document.getElementsByClassName("points"));
      point_fields.forEach((field, index) => { field.value = points[env.swap_sides ? 1 - index : index] });

      // new way
      var display_point_0 = Array.from(document.querySelectorAll('.display_points_0'));
      display_point_0.forEach(element => element.innerHTML = points[left_side]);
      var display_point_1 = Array.from(document.querySelectorAll('.display_points_1'));
      display_point_1.forEach(element => element.innerHTML = points[right_side]);

      var display_game_0 = Array.from(document.querySelectorAll('.display_games_0'));
      display_game_0.forEach(element => element.innerHTML = games_counter[left_side]);
      var display_game_1 = Array.from(document.querySelectorAll('.display_games_1'));
      display_game_1.forEach(element => element.innerHTML = games_counter[right_side]);

      var display_set_0 = Array.from(document.querySelectorAll('.display_sets_0'));
      display_set_0.forEach(element => element.innerHTML = sets_counter[left_side]);
      var display_set_1 = Array.from(document.querySelectorAll('.display_sets_1'));
      display_set_1.forEach(element => element.innerHTML = sets_counter[right_side]);

      var sets = score.components.sets;
      var threshold = match.format.threshold();
      var max_games = threshold == 1 ? 0 : threshold > 2 ? 4 : 2;
      [0, 1, 2, 3, 4].forEach((set, index) => {
         if (!sets || (sets && !sets[index])) {
            // old way
            var set_fields = Array.from(document.getElementsByClassName("games" + index));
            set_fields.forEach(field => field.value = '-');
            // new way
            var player0_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_0'));
            player0_games.forEach(field => field.innerHTML = index > max_games ? ' ' : '-');
            var player1_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_1'));
            player1_games.forEach(field => field.innerHTML = index > max_games ? ' ' : '-');
         }
      });

      if (!sets) return;

      sets.forEach((set, index) => {
         // old way
         var set_fields = Array.from(document.getElementsByClassName("games" + index));
         set_fields.forEach((field, index) => field.value = set.games[env.swap_sides ? 1 - index : index]);
         // new way
         var player0_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_0'));
         player0_games.forEach(field => field.innerHTML = set.games[env.swap_sides ? 1 : 0]);
         var player1_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_1'));
         player1_games.forEach(field => field.innerHTML = set.games[env.swap_sides ? 0 : 1]);
      });
   }

   function swapSides(number) {
      var iterations = [true].concat([...Array(number).keys()].map(i => ((i+1)%4)<2));
      return !iterations[number];
   }

   function swapServer() {
      env.serving = match.nextTeamServing();
      env.receiving = match.nextTeamReceiving();

      if (settings.auto_swap_sides) {
         var games = groupGames();
         var game_number = games.length;
         if (games[games.length - 1].complete) game_number += 1;
         env.match_swap = swapSides(game_number);
      } else {
         env.match_swap = false;
      }
      setCourtSide();

      var server_side = env.swap_sides ? 1 - env.serving : env.serving;
      var receiver_side = env.swap_sides ? 1 - env.receiving : env.receiving;

      var div = document.getElementById(server_side ? 'player_receiving' : 'player_serving');
      // div.parentNode.insertBefore(div, document.getElementById('team_two'));
      div = document.getElementById(server_side ? 'player_serving' : 'player_receiving');
      // div.parentNode.insertBefore(div, document.getElementById('entry_end'));

      changeTextColor(`.indicate_serve.display_player_${server_side}`, 'yellow');
      changeTextColor(`.indicate_serve.display_player_${receiver_side}`, 'white');

      // document.getElementById("team_one_role").innerHTML = server_side ? 'Receiving:' : 'Serving:';
      // document.getElementById("team_two_role").innerHTML = server_side ? 'Serving:' : 'Receiving:';

      if (server_side) {
         changeClassDisplay('.display_0_serving', 'none');
         changeClassDisplay('.display_1_serving', 'flex');
      } else {
         changeClassDisplay('.display_0_serving', 'flex');
         changeClassDisplay('.display_1_serving', 'none');
      }

      var point_fields = Array.from(document.getElementsByClassName("points"));
      point_fields.forEach((field, index) => {
         var player = env.swap_sides ? 1 - index : index;
         field.style.backgroundColor = player == env.serving ? '#FBF781' : '#D1FBFB'
      });
      resetButtons();
   }

   function updateState() {
      if (match.nextTeamServing() != env.serving) setTimeout(()=>swapServer() , 400);
      resetButtons();
      updatePositions();
   }

   function visibleButtons() {
      var points = match.history.action('addPoint');
      var match_archive = JSON.parse(BrowserStorage.get('match_archive') || '[]');
      // document.getElementById('footer_change_server').style.display = points.length == 0 ? 'inline' : 'none';
      Array.from(document.querySelectorAll('.view_stats')).forEach(div => div.style.display = points.length > 0 ? 'inline' : 'none');
      Array.from(document.querySelectorAll('.change_server')).forEach(div => div.style.display = points.length == 0 ? 'inline' : 'none');
      Array.from(document.querySelectorAll('.view_archive')).forEach(div => div.style.display = points.length == 0 && match_archive.length ? 'inline' : 'none');
      Array.from(document.querySelectorAll('.view_settings')).forEach(div => div.style.display = points.length == 0 && !match_archive.length ? 'inline' : 'none');
      Array.from(document.querySelectorAll('.view_history')).forEach(div => div.style.display = points.length > 0 ? 'inline' : 'none');
      Array.from(document.querySelectorAll('.undo')).forEach(div => {
         div.style.display = points.length > 0 || env.serve2nd || env.rally_mode ? 'flex' : 'none'
      });
      Array.from(document.querySelectorAll('.redo')).forEach(div => {
         div.style.display = env.undone.length ? 'flex' : 'none'
      });
      var last_point = points.length ? points[points.length - 1] : undefined;
      var status_message = statusMessage();
      match.status = status_message;
      Array.from(document.querySelectorAll('.status_message')).forEach(div => div.innerHTML = status_message);

      function statusMessage() {
         if (last_point) {
            if (last_point.needed.points_to_set && Math.min(...last_point.needed.points_to_set) == 1) return 'SET POINT';
            if (last_point.point.breakpoint) return 'BREAK POINT';
            if (last_point.needed.points_to_game && last_point.needed.points_to_game[last_point.point.server] == 1) return 'GAME POINT';
         }
         if (env.lets) return `Lets: ${env.lets}`;
         return '';
      }
   }

   function stateChangeEvent() {
      updateMatchArchive();
      env.serve2nd = false;
      env.rally_mode = false;
      updateState();
      updateScore();
      visibleButtons();
   }
  
   function resetEvent() {
      match.set.perspectiveScore(false);
      match.set.liveStats(true);
      match.metadata.timestamps(true);
      match.metadata.defineMatch({date: null});

      env.serve2nd = false;
      env.rally_mode = false;
      env.serving = match.nextTeamServing();
      env.receiving = match.nextTeamReceiving();
      env.undone = [];
      env.rally = 0;
      env.lets = 0;

      resetStyles();
      updatePositions();
      swapServer();
      stateChangeEvent();
   }

   function firstAndLast(value) {
      var parts = value.split(" ");
      var display = parts[0];
      if (parts.length > 1) display += " " + parts[parts.length - 1];
      return display;
   }

   function modalExport(match_id = BrowserStorage.get('current_match'), what = 'match') {
      Array.from(document.querySelectorAll('.mh_export')).forEach(selector => selector.style.display = 'none');
      var match_data = BrowserStorage.get(match_id);
      var header = `
         <p>&nbsp;</p>
         <h1>Export Options</h1>
         <p>Supported by your device</p>
      `;
      var save = `
         <div onclick="exportMatch('${match_id}')" class="flexcenter">
            <div class='export_action action_icon iconsave'></div>
         </div>
      `;
      var copy = `
         <div class="flexcenter">
            <button id='copy2clipboard' class="flexcenter c2c" data-clipboard-text=""> 
               <div class='export_action action_icon iconclipboard'></div> 
            </button>
         </div> 
      `;
      var modaltext = `<div>${header}<div class="flexrows flexcenter">${!device.isIDevice ? save : ''}${copy}</div></div>`;
      var export_data = match_data;
      showModal(modaltext, export_data);
   }

   function displayPointHistory() {
      var games = groupGames();
      var players = match.metadata.players();
      var html = '';
      if (!games.length) return false;
      games.forEach((game, game_number) => {
         if (game.points && game.points.length) html += gameEntry(game, players, game_number);
      });
      html += `
         <div class="flexrows ph_game">
            <div class='ph_margin' style='width: 100%'>
               <div class='flexcenter' style='width: 100%'>Duration ${matchDuration()}</div>
            </div>
         </div>
      `;
      document.getElementById('ph_frame').innerHTML = html;
   }

   function matchDuration() {
      var timestamps = match.history.points().map(p=>p.uts);
      var start = Math.min(...timestamps);
      var end = Math.max(...timestamps);
      let seconds = (end - start) / 1000.0;
      return HHMMSS(seconds);
   }

   function HHMMSS(s) {
       var sec_num = parseInt(s, 10); // don't forget the second param
       var hours   = Math.floor(sec_num / 3600);
       var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
       var seconds = sec_num - (hours * 3600) - (minutes * 60);

       if (hours   < 10) {hours   = "0"+hours;}
       if (minutes < 10) {minutes = "0"+minutes;}
       if (seconds < 10) {seconds = "0"+seconds;}
       return hours+':'+minutes+':'+seconds;
   }

   function gameEntry(game, players, game_number) {
      var last_point = game.points[game.points.length - 1];
      var game_score = game.complete ? game.score.join('-') : undefined;
      var tiebreak = last_point.tiebreak;
      var server = tiebreak ? 'Tiebreak' : players[last_point.server].name;
      var service = tiebreak ? '' : last_point.server ? 'playertwo' : 'playerone';
      var servergame = tiebreak ? '' : last_point.server == last_point.winner ? 'won' : 'lost';
      var html = `
         <div class="flexrows ph_game" onclick="showGameFish(${game.index})">
            <div class='ph_margin flexrows'>
               <div class="ph_server ${service}">${server}</div>
               <div class="ph_action flexcenter"> 
                  <div class='ph_fish iconfish'></div>
               </div>
               <div class='ph_rally ph_${servergame}''> <b>${game_score || ''}</b> </div>
            </div>
         </div>
      `;
      game.points.forEach((point, index) => {
         html += pointEntry(point, players, (game.complete && index == game.points.length - 1) ? game.score.join('-') : undefined);
      });
      return html;
   }

   function pointEntry(point, players, game_score) {
      var evenodd = point.index % 2 ? 'even' : 'odd';
      var point_score = !point.tiebreak && point.server ? point.score.split('-').reverse().join('-') : point.score;
      var player_initials;
      if (point.result) {
         var shot_by;
         if (['Ace', 'Winner'].indexOf(point.result) >=0 ) {
            shot_by = players[point.winner].name;
         } else {
            shot_by = players[1 - point.winner].name;
         }
         player_initials = shot_by.split(' ').map(name => name[0]).join('');
      }
      var point_hand = point.hand ? point.hand + ' ' : '';
      var point_result = point.result || '';
      var point_description = (!point_result) ? '' : `${player_initials}: ${point_hand}${point_result}`;
      point_score = point_score == '0-0' ? 'GAME' : point_score;
      if (point.tiebreak) {
         if (point.server) point_score = `&nbsp;${point_score}*`;
         if (!point.server) point_score = `*${point_score}&nbsp;`;
      }
      var rally = point.rally ? point.rally.length + 1 : '';
      var html = `
      <div class='flexrows ph_episode' onclick="editPoint(${point.index})">
         <div class='ph_point_${evenodd} flexrows'>
            <div class='ph_result'>${point_description}</div>
            <div class='ph_score'>${point_score} </div>
            <div class='ph_score'>${rally}</div>
         </div>
      </div>
      `;
      return html;
   }

   function editPoint(index) {
      env.edit_point_index = index;
      var episodes = match.history.action('addPoint');
      env.edit_point = episodes[index].point;
      env.edit_point_result = env.edit_point.result;
      var score = env.edit_point.server ? env.edit_point.score.split('-').reverse().join('-') : env.edit_point.score;
      if (score == '0-0') score = 'Gamepoint';
      document.getElementById('ep_sgp').innerHTML = `Set: ${env.edit_point.set + 1}, Game: ${env.edit_point.game + 1}, Point: ${score}`;
      var players = match.metadata.players();
      var player_select = Array.from(document.querySelectorAll(".select_player"));
      player_select.forEach(select => players.forEach((player, index) => select.options[index] = new Option(player.name, index)));
      document.getElementById('point_winner').value = env.edit_point.winner;
      document.getElementById('point_result').value = env.edit_point.result || '';
      changePointWinner();
      changeResultOptions();
      document.getElementById('editpoint').style.display = 'flex';
   }

   function updatePoint() {
      var winner = document.getElementById('point_winner').value;
      var result = document.getElementById('point_result').value;
      env.edit_point.winner = winner;
      env.edit_point.result = result;
      env.edit_point.code = undefined; // TODO: code needs to be updated properly
      stateChangeEvent();
      var current_match_id = BrowserStorage.get('current_match');
      loadMatch(current_match_id, 'pointhistory');
      document.getElementById('editpoint').style.display = 'none';
   }

   function changeResultOptions() {
      var player = document.getElementById('point_player').value;
      var result_options = document.getElementById('point_result');
      env.edit_point_result = result_options.value;
      result_options.innerHTML = '';
      result_options.options[0] = new Option('- select -', '');
      var results = [];
      if (player == env.edit_point.server) results = [].concat(...results, 'Ace', 'Double Fault');
      results = [].concat(...results, 'Winner', 'Unforced Error', 'Forced Error');
      results.forEach((result, index) => result_options.options[index + 1] = new Option(result, result));
      result_options.value = env.edit_point_result;
   }

   function changePointPlayer() {
      var player = document.getElementById('point_player').value;
      var result = document.getElementById('point_result').value;
      env.edit_point.result = result;
      var winner = document.getElementById('point_winner').value;
      if ((result.indexOf('Winner') >= 0 || result.indexOf('Ace') >= 0) && player != winner) {
         document.getElementById('point_winner').value = player;
      }
      if (result.indexOf('Winner') < 0 && result.indexOf('Ace') < 0 && player == winner) {
         document.getElementById('point_winner').value = 1 - player;
      }
      changeResultOptions();
   }

   function changePointWinner() {
      var player = document.getElementById('point_player').value;
      var result = document.getElementById('point_result').value;
      var winner = document.getElementById('point_winner').value;
      if (result.indexOf('Winner') < 0 && result.indexOf('Ace') < 0 && player == winner) {
         document.getElementById('point_player').value = 1 - winner;
      }
      if ((result.indexOf('Winner') >= 0 || result.indexOf('Ace') >= 0) && player != winner) {
         document.getElementById('point_player').value = winner;
      }
   }

   function resetMatch() {
      match.reset();
      loadDetails();
      updateScore();
      var date = new Date().valueOf();
      var muid = UUID.generate();
      match.metadata.defineMatch({muid, date});
      BrowserStorage.set('current_match', muid);
      stateChangeEvent();
   }

   function newMatch(force_format) {
      resetMatch();
      viewManager(force_format ? 'entry' : 'matchformat');
   }

   function displayFormats() {
      var format_types = match.format.types();
      var html = '';
      if (!format_types.length) return false;
      format_types.forEach(format => {
         html += formatEntry(format);
      });
      document.getElementById('matchformatlist').innerHTML = html;
   }

   function formatEntry(format) {
      let name;
      let description;
      ({name, description} = umo.formats().matches[format]);
      name = name || '';
      var html = `
      <div class='flexjustifystart mf_format'>
         <div class='flexcols' onclick="changeFormat('${format}')">
            <div class='mf_name'> <div><b>${name}</b></div> </div>
            <div class='mf_description'> <div>${description}</div> </div>
         </div>
      </div>
      `;
      return html;
   }

   function displayMatchArchive({active}={}) {
      var html = `<div class='swipe-panel no-top'>`;
      // archive used to sort by match.date when match_id was timestamp...
      // need a fix for this...
      var match_archive = JSON.parse(BrowserStorage.get('match_archive') || '[]')
         .filter((item, i, s) => s.lastIndexOf(item) == i)
         .reverse();
      if (!match_archive.length) {
         newMatch();
         return;
      }
      if (active) return;

      match_archive.forEach(match_id => {
         var match_data = JSON.parse(BrowserStorage.get(match_id));
         if (match_data) {
            html += archiveEntry(match_id, match_data);
         } else {
            BrowserStorage.remove(match_id);
         }
      });
      html += '</div>';
      let ma_elem = document.getElementById('matcharchiveList');
      ma_elem.innerHTML = html;

      SwipeList.init({
        container: '.swipe-item',
        buttons: [
             {
                 width: 60,
                 side: 'right',
                 class: 'img_export swipe_img',
                 image: './icons/exportwhite.png',
                 image_class: 'export_icon',
             },
             {
                 width: 60,
                 side: 'right',
                 class: 'img_recycle swipe_img',
                 image: './icons/recycle.png',
                 image_class: 'recycle_icon',
             },
         ]
      });

      function findUpClass(el, class_name) {
         while (el.parentNode) {
            el = el.parentNode;
            if (el.classList && Array.from(el.classList).indexOf(class_name) >= 0) return el;
         }
         return null;
      }

      ma_elem.addEventListener('click', function(e) {
         let p = findUpClass(e.target, 'swipe-item');
         let muid = p.getAttribute('muid');
         let selected_match = findUpClass(e.target, 'mh_match');
         if (selected_match) { return loadMatch(muid); }

         if (e.target.className.indexOf('img_export') >= 0 || e.target.className == 'export_icon') {
            p.classList.remove('move-out-click');
            p.style.webkitTransitionDuration = '125ms';
            p.style.transitionDuration = '125ms';
            p.style.webkitTransform = 'translateX(0px)';
            p.style.transform = 'translateX(0px)';
            modalExport(muid);
         }
         if (e.target.className.indexOf('img_recycle') >= 0 || e.target.className == 'recycle_icon') {
            deleteMatch(muid);
            p.remove();
         }
      });

      return match_archive;
   }

   function archiveEntry(match_id, match_data) {
      var date = new Date(match_data.match.date);
      var display_date = [date.getDate(), months[date.getMonth()], date.getFullYear()].join('-');
      var players = match_data.players;
      var display_players = `
         <span class='nowrap'>${firstAndLast(players[0].name)}</span>
         <span> v. </span>
         <span class='nowrap'>${firstAndLast(players[1].name)}</span>
         `;
      var match_score = match_data.scoreboard;
      var match_format = match_data.format.name;
      var html = `
      <div id='match_${match_id}' muid='${match_id}' class='flexcenter mh_swipe swipe-item'>
         <div class='flexcols mh_match'>
            <div class='mh_players'>${display_players}</div>
            <div class='mh_details'>
               <div>${display_date}</div>
               <div class='mh_format'>${match_format}</div>
            </div>
            <div class='mh_score'>${match_score}</div>
         </div>
      </div>`
      return html;
   }

   function changeFormat(format) {
      match.format.type(format);
      var format_name = match.format.settings().name;
      document.getElementById('md_format').innerHTML = format_name;
      updateScore();
      updateMatchArchive();
      viewManager('entry');
   }

   function loadDetails() {
      var players = match.metadata.players();
      players.forEach((player, index) => {
         var attributes = ['hand', 'entry', 'seed', 'draw_position', 'ioc', 'rank'];
         attributes.forEach(detail => {
            var target_id = `player${index}_${detail}`;
            var target = document.getElementById(target_id);
            if (target) target.value = player[detail] || '';
         });
      });

      var match_details = match.metadata.defineMatch();
      var m_attrs = ['court', 'umpire'];
      m_attrs.forEach(attribute => {
         var target_id = `match_${attribute}`;
         document.getElementById(target_id).value = match_details[attribute] || '';
      });

      var tournament = match.metadata.defineTournament();
      var t_attrs = ['name', 'start_date', 'tour', 'rank', 'surface', 'in_out', 'draw', 'draw_size', 'round'];
      t_attrs.forEach(attribute => {
         var target_id = `tournament_${attribute}`;
         document.getElementById(target_id).value = tournament[attribute] || '';
      });
   }

   function updatePlayer() {
      match.metadata.definePlayer(updatePlayerDetails(env.edit_player));
      updateMatchArchive();
   }

   function updatePlayers() {
      match.metadata.definePlayer(updatePlayerDetails(0));
      match.metadata.definePlayer(updatePlayerDetails(1));
      updateMatchArchive();
   }

   function updatePlayerDetails() {
      var player = { index: env.edit_player };
      var attributes = ['hand', 'entry', 'seed', 'draw_position', 'ioc', ];
      attributes.forEach(attribute => {
         var target_id = `player_${attribute}`;
         var obj = document.getElementById(target_id);
         if (obj.selectedIndex >= 0) {
            var value = obj.options[obj.selectedIndex].value;
            if (value) player[attribute] = value;
         }
      });
      var rank = document.getElementById('player_rank').value;
      if (rank) player.rank = rank;
      return player;
   }

   function updateMatchDetails() {
      var match_details = {};
      attributes = ['court', 'umpire'];
      attributes.forEach(attribute => {
         var target_id = `match_${attribute}`;
         var obj = document.getElementById(target_id);
         var value = document.getElementById(`match_${attribute}`).value;
         if (value) match_details[attribute] = value;
      });
      match.metadata.defineMatch(match_details);
      updateMatchArchive();
   }

   function updateTournamentDetails() {
      var tournament = {};
      var attributes = ['surface', 'in_out', 'draw', 'draw_size', 'round'];
      attributes.forEach(attribute => {
         var target_id = `tournament_${attribute}`;
         var obj = document.getElementById(target_id);
         if (obj.selectedIndex >= 0) {
            var value = obj.options[obj.selectedIndex].value;
            if (value) tournament[attribute] = value;
         }
      });
      attributes = ['name', 'start_date', 'tour', 'rank'];
      attributes.forEach(attribute => {
         var target_id = `tournament_${attribute}`;
         var obj = document.getElementById(target_id);
         var value = document.getElementById(`tournament_${attribute}`).value;
         if (value) tournament[attribute] = value.trim();
      });
      match.metadata.defineTournament(tournament);
      updateMatchArchive();
   }

   function loadMatch(match_id, view = 'entry') {
      if (!match_id) {
         viewManager('entry');
         return;
      }
      match.reset();
      var json = BrowserStorage.get(match_id);
      var match_data = (json && isJSON(json)) ? JSON.parse(BrowserStorage.get(match_id)) : undefined;
      if (!match_data) {
         // newMatch(); ??
         // insure match_id is not in match_archive ??
         viewManager('entry');
         return;
      }

      // reduce overhead by turning off matchObject state change events;
      clearActionEvents();
      BrowserStorage.set('current_match', match_id);
      if (match_data.match) {
         if (!match_data.match.muid) {
            match_data.match.muid = UUID.generate();
            BrowserStorage.remove(match_id);
         }
         match.metadata.defineMatch(match_data.match);
      }
      if (match_data.first_service) match.set.firstService(match_data.first_service);
      if (match_data.tournament) match.metadata.defineTournament(match_data.tournament);
      if (match_data.format) {
         match.format.settings(match_data.format);
         document.getElementById('md_format').innerHTML = match_data.format.name;
      }

      if (!match_data.version) {
         match_data.points.forEach(point => match.addPoint(point));
      } else {
      }

      // turn on timestamps *after* loading all points
      match.metadata.timestamps(true);

      if (match_data.players) {
         match_data.players.forEach((player, index) => {
            player.index = index;
            match.metadata.definePlayer(player)
         });
      }
      updatePositions();
      updateScore();
      loadDetails();
      stateChangeEvent();
      defineActionEvents();
      viewManager(view);
   }

   function loadCurrent() {
      var current_match_id = BrowserStorage.get('current_match');
      if (!current_match_id) {
         var match_archive = BrowserStorage.get('match_archive');
         // only show quick start if this is first launch
         newMatch();
         if (!match_archive) modalHelp(true);
      } else {
         loadMatch(current_match_id);
         swapServer();
         resetButtons();
         visibleButtons();
      }
   }

   function broadcastStatus(status) {
      if (broadcasting()) {
         var muid = match.metadata.defineMatch().muid;
         var data = { muid, status };
         var tournament = match.metadata.defineTournament();
         data.tuid = tournament.tuid || tournament.name;
         coms.socket.emit('match status', data);
      }
   }

   function deleteMatch(match_id) {
      if (broadcasting()) {
         var match_data = JSON.parse(BrowserStorage.get(match_id));
         var data = { muid: match_id };
         var tournament = match_data && match_data.tournament || {};
         data.tuid = tournament.tuid || tournament.name;
         coms.socket.emit('delete match', data);
      }

      BrowserStorage.remove(match_id);
      var current_match_id = BrowserStorage.get('current_match');
      var match_archive = JSON.parse(BrowserStorage.get('match_archive') || '[]');
      match_archive = match_archive.filter(archive_id => match_id != archive_id);
      BrowserStorage.set('match_archive', JSON.stringify(match_archive));
      if (match_id == current_match_id) { resetMatch(); }
      displayMatchArchive({ active: true });
   }

   function exportMatch(match_id) {
      var match_data = BrowserStorage.get(match_id);
      download(match_data, `match_${match_id}.json`);
      closeModal();
   }

   function formatChangePossible() {
      var points = match.history.points();
      return points.length == 0;

      // TODO: implement when umo can propagate changes to children...
      /*
      scores = points.map(point=>point.score);
      var games = match.score().counters.games.reduce((a, b) => a + b);
      var advantages = scores.map(m=>m.indexOf('A') >= 0).filter(f=>f);
      if (games < 1 && advantages < 1) return true;
      */
   }

   function strokeSlider(show) {
      var range;
      var width = window.innerWidth;
      var stroke_slider = document.getElementById('stroke_slider');
      if (show) {
         stroke_slider.style.display = 'flex';
         document.getElementById('slideleft').style.display = show == 'right' ? 'flex' : 'none';
         document.getElementById('slideright').style.display = show == 'left' ? 'flex' : 'none';
         stroke_slider.style.left = show == 'left' ? (width * -1) + 'px' : (width * 1.5) + 'px';
         range = show == 'left' ? d3.range(0, 1.1, .1) : d3.range(0, 1.1, .1).reverse();
         d3.selectAll('.stroke_slider').data(range).transition().duration(500).style('left', function(d) { return ((d * width * .5)) + "px"; });
      } else {
         var side = document.getElementById('slideleft').style.display == 'flex' ? 'right' : 'left';
         range = side == 'left' ? d3.range(-1.5, 1.1, .1) : d3.range(1, 2.6, .1).reverse();
         setTimeout(()=>hideSlide() , 700);
      }
      d3.selectAll('.stroke_slider').data(range).transition().duration(500).style('left', function(d) { return ((d * width * .5)) + "px"; });
      return;
   }

   function hideSlide() {
      var stroke_slider = document.getElementById('stroke_slider');
      stroke_slider.style.display = 'none';
   }

   function setOrientation() {
      if (device.isMobile) {
         env.orientation = (Math.abs(window.orientation) == 90) ? 'landscape' : 'portrait';
      } else {
         env.orientation = (window.innerWidth > window.innerHeight) ? 'landscape' : 'portrait';
      }
   }

   function orientationEvent () {
      setOrientation();
      vizUpdate();
      viewManager();
   }

   var changeDisplay = (display, id) => {
      var element = document.getElementById(id);
      if (element) { element.style.display = display; }
   }

   function viewManager(new_view = env.view, params) {
      // hide strokeslider any time view changes
      strokeSlider();
      // changeDisplay('none', 'system');

      var views = {
         mainmenu({activate = true} = {}) {
            if (activate) {
               touchManager.prevent_touch = false;

               var match_archive = JSON.parse(BrowserStorage.get('match_archive') || '[]');
               document.getElementById('menu_match_archive').style.display = match_archive.length ? 'flex' : 'none';
               document.getElementById('menu_match_format').style.display = formatChangePossible() ? 'flex' : 'none';

               var points = match.history.points();
               document.getElementById('menu_change_server').style.display = points.length == 0 ? 'flex' : 'none';
               // document.getElementById('footer_change_server').style.display = points.length == 0 ? 'inline' : 'none';
            }
            changeDisplay(activate ? 'flex' : 'none', 'mainmenu');
         },
         pointhistory({activate = true} = {}) {
            if (activate) {
               touchManager.prevent_touch = false;
               displayPointHistory();
            }
            changeDisplay(activate ? 'flex' : 'none', 'pointhistory');
         },
         matcharchive({activate = true} = {}) {
            if (activate) {
               touchManager.prevent_touch = false;
               displayMatchArchive();
            }
            changeDisplay(activate ? 'flex' : 'none', 'matcharchive');
         },
         matchformat({activate = true} = {}) {
            displayFormats();
            if (activate) touchManager.prevent_touch = false;
            changeDisplay(activate ? 'flex' : 'none', 'matchformats');
         },
         settings({activate = true} = {}) {
            changeDisplay(activate ? 'flex' : 'none', 'settings');
         },
         welcome({activate = true} = {}) {
            changeDisplay(activate ? 'flex' : 'none', 'welcome');
         },
         matchdetails({activate = true} = {}) {
            if (activate) touchManager.prevent_touch = false;
            changeDisplay(activate ? 'flex' : 'none', 'matchdetails');
         },
         entry({activate = true} = {}) {
            if (activate) touchManager.prevent_touch = true;
            changeDisplay(activate && env.orientation == 'landscape' ? 'flex' : 'none', options.horizontal_view);
            changeDisplay(activate && env.orientation == 'portrait' ? 'flex' : 'none', options.vertical_view);
            changeDisplay(activate && env.orientation == 'portrait' ? 'flex' : 'none', 'toolbar');
         },
         stats({activate = true} = {}) {
            changeDisplay(activate ? 'flex' : 'none', 'statsscreen');
            if (activate) {
               touchManager.prevent_touch = false;
               match.metadata.resetStats(); // necessary because decorations not added when calculated
               updateStats();
            }
         },
         momentum({activate = true} = {}) {
            if (!activate) {
               changeDisplay('none', 'momentum');
               changeDisplay('none', 'pts');
            } else {
               if (env.orientation == 'landscape') {
                  changeDisplay('none', 'momentum');
                  changeDisplay('flex', 'pts');
                  charts.pts_match.update();
               } else {
                  changeDisplay('inline', 'momentum');
                  changeDisplay('none', 'pts');
               }
               touchManager.prevent_touch = false;
               var point_episodes = match.history.action('addPoint');
               charts.mc.width(window.innerWidth).height(820);
               charts.mc.data(point_episodes).update();
               charts.mc.update();
            }
         },
         gametree({activate = true} = {}) {
            changeDisplay(activate ? 'flex' : 'none', 'gametree');
            if (activate) {
               touchManager.prevent_touch = false;
               var point_episodes = match.history.action('addPoint');
               var noAd = match.format.settings().code.indexOf('n_') >= 0;
               charts.gametree.options({display: { noAd }});
               charts.gametree.data(point_episodes).update();
               charts.gametree.update({sizeToFit: true});
            }
         },
      }

      var view_keys = Object.keys(views);
      if (view_keys.indexOf(new_view) >= 0) {
         // disactivate all views that don't match the new_view
         view_keys.filter(view => view != new_view).forEach(view => views[view]({activate: false}));
         views[new_view]({activate: true, params});
         env.view = new_view;
         return new_view;
      }
   }

   function toggleChart(obj) {
      var element = document.getElementById(obj.id + '_chart');
      if (element) {
         var visible = element.style.display != 'none';
         element.style.display = visible ? 'none' : 'flex';
      }
   }

   // defunct... first pass at stats page... saved for posterity
   /*
   function statCounters() {
      var html = '';
      var stats = match.stats.counters();
      if (stats && stats.teams) {
         var left_stats = stats.teams[0] ? Object.keys(stats.teams[0]) : [];
         var right_stats = stats.teams[1] ? Object.keys(stats.teams[1]) : [];
         var stat_keys = [].concat(...left_stats, ...right_stats).filter((item, i, s) => s.lastIndexOf(item) == i).sort();
         stat_keys.forEach(key => {
            var left = stats.teams[0] && stats.teams[0][key] ? stats.teams[0][key].length : '0';
            var right = stats.teams[1] && stats.teams[1][key] ? stats.teams[1][key].length : '0';
            var row = `<div class='statrow' id="${key}" onClick="toggleChart(this)"><div class='statleft'>${left}</div>` + 
                      `<div class='statname'>${key}</div><div class='statright'>${right}</div></div>`;
            var table = ` <div class='statrow' id="${key}_chart" style='display:none'> <div class='action_icon iconchart'></div> </div> `;
            html += row + table;
         });
      }
      document.querySelector('#statlines').innerHTML = html;
   }
   */

   function addCharts(charts) {
      var counters = match.stats.counters();
      var stripModifiers = (text) => text.match(/[A-Za-z0-9]/g).join('');
      if (!counters) return;
      charts.forEach(chart => {
         var player_points = [];
         Object.keys(counters.teams).forEach(key => {
            var team = counters.teams[key];
            var numerators = chart.numerators.split(',').map(numerator => stripModifiers(numerator));
            var episodes = [].concat(...numerators.map(numerator => team[numerator]))
            var points = episodes.map(episode => episode ? episode.point : undefined).filter(f=>f).sort((a, b) => a.index - b.index);
            player_points.push(points.map(point => point.index));
         });
         simpleChart(chart.target, player_points);
      });
   }

   function showChartSource(src) { console.log(src); }

   function updateStats(set_filter) {
      var html = '';
      var charts = [];
      var sets = match.sets().length;
      var statselectors = `<div class='s_set' onclick="updateStats()">Match</div>`;
      var stats = match.stats.calculated(set_filter);
      var stripModifiers = (text) => text.match(/[A-Za-z0-9_]/g).join('');
      if (stats && stats.length) {
         // generate & display match/set view selectors
         if (sets > 1) {
            for (var s=0; s < sets; s++) {
               statselectors += `<div class='s_set' onclick="updateStats(${s})">Set ${s+1}</div>`;
            }
         }
         document.querySelector('#statview').innerHTML = statselectors;

         // generate & display stats html
         stats.forEach(stat => {
            if (env.swap_sides) {
               ([right, left] = stat.team_stats);
            } else {
               ([left, right] = stat.team_stats);
            }
            var numerators = [].concat(...[left, right].map(value => value.numerators ? value.numerators : []))
               .filter((item, i, s) => s.lastIndexOf(item) == i).join(',');
            var value = [].concat(0, 0, ...[left, right].map(side => side.value ? side.value : [])).reduce((a, b) => a + b);
            var id = stripModifiers(stat.name.toLowerCase().split(' ').join('_'));
            var left_display = left.display;
            var right_display = right.display;

            var statclass = (numerators && value && stat.name != 'Aggressive Margin') ? 'statname_chart' : 'statname';

            if (isNaN(left.value)) { left.value = 0; left_display = '0'; }
            if (isNaN(right.value)) { right.value = 0; right_display = '0'; }

            if (options.highlight_better_stats) {
               if (['Double Faults', 'Unforced Errors', 'Forced Errors'].indexOf(stat.name) >= 0) {
                  if (left.value < right.value) left_display = `<b>${left_display}</b>`;
                  if (right.value < left.value) right_display = `<b>${right_display}</b>`;
               } else {
                  if (left.value > right.value) left_display = `<b>${left_display}</b>`;
                  if (right.value > left.value) right_display = `<b>${right_display}</b>`;
               }
            }
            html += `<div class='statrow' id="${id}" onClick="toggleChart(this)"><div class='statleft'>${left_display}</div>` + 
                      `<div class='${statclass}'>${stat.name}</div><div class='statright'>${right_display}</div></div>`;
            var table = `<div class='statrow' id="${id}_chart" style='display:none' onclick="showChartSource('${numerators}')"></div>`;

            if (numerators && value && stat.name != 'Aggressive Margin') {
               charts.push({ target: `${id}_chart`, numerators });
               html += table;
            }
         });

         var counters = match.stats.counters(set_filter).teams;
         if (counters[0].Backhand || counters[0].Forehand || counters[1].Backhand || counters[1].Forehand) {
            var left = env.swap_sides ? 1 : 0;
            var right = env.swap_sides ? 0 : 1;
            html += `<div class='statsection flexcenter'>Finishing Shots - Strokes</div>`;
            ['Forehand', 'Backhand'].forEach(hand => {
               if (counters[0][hand] || counters[1][hand]) {
                  var left_display = counters[left][hand] ? counters[left][hand].length : 0;
                  var right_display = counters[right][hand] ? counters[right][hand].length : 0;
                  html += `<div class='statrow'><div class='statleft'><b>${left_display}</b></div>` + 
                            `<div class='statname'><b>Total ${hand} Shots</b></div><div class='statright'><b>${right_display}</b></div></div>`;
                  // get a list of unique results
                  var results = [].concat(...Object.keys(counters).map(key => {
                     return counters[key][hand] ? counters[key][hand].map(episode => episode.point.result).filter(f=>f) : []
                  })).filter((item, i, s) => s.lastIndexOf(item) == i);
                  results.forEach(result => {
                     var left_results = counters[left][hand] ? counters[left][hand].filter(f=>f.point.result == result) : [];
                     var right_results = counters[right][hand] ? counters[right][hand].filter(f=>f.point.result == result) : [];
                     if (left_results.length || right_results.length) {
                        html += `<div class='statrow'><div class='statleft'>${left_results.length}</div>` + 
                                  `<div class='statname'>${hand} ${result}s</div><div class='statright'>${right_results.length}</div></div>`;
                     }
                     // get a list of unique strokes
                     var strokes = [].concat(...Object.keys(counters).map(key => {
                        return counters[key][hand] ? counters[key][hand].map(episode => episode.point.stroke).filter(f=>f) : []
                     })).filter((item, i, s) => s.lastIndexOf(item) == i);
                     strokes.forEach(stroke => {
                        var left_results = counters[left][hand] ? counters[left][hand].filter(f=>f.point.result == result && f.point.stroke == stroke) : [];
                        var right_results = counters[right][hand] ? counters[right][hand].filter(f=>f.point.result == result && f.point.stroke == stroke) : [];
                        if (left_results.length || right_results.length) {
                           html += `<div class='statrow'><div class='statleft'>${left_results.length}</div>` + 
                                     `<div class='statname'><i>${hand} ${stroke} ${result}s</i></div><div class='statright'>${right_results.length}</div></div>`;
                        }
                     });
                  });
               }
            });
         }

         document.querySelector('#statlines').innerHTML = html;
         addCharts(charts);
      } else {
         viewManager('entry');
      }
   }

   function changeServer() {
      if (!match.history.points().length) {
         match.set.firstService(1 - env.serving);
         updateState();
      }
   }

   function changeClassDisplay(className, display) {
      var elements = Array.from(document.querySelectorAll(className));
      elements.forEach(element => element.style.display = display);
   }

   function updatePositions() {
      var left_side = env.swap_sides ? 1 : 0;
      var right_side = env.swap_sides ? 0 : 1;
      var server_side = env.swap_sides ? 1 - env.serving : env.serving;
      var receiver_side = env.swap_sides ? 1 - env.receiving : env.receiving;

      updateMatchArchive();

      var player_names = match.metadata.players();
      // var display_position = Array.from(document.getElementsByClassName("position_display"));
      // display_position[0].value = firstAndLast(player_names[left_side].name);
      // display_position[1].value = firstAndLast(player_names[right_side].name);
      document.getElementById("playerone").innerHTML = firstAndLast(player_names[left_side].name);
      document.getElementById("playertwo").innerHTML = firstAndLast(player_names[right_side].name);

      // new way
      var display_player_0 = Array.from(document.querySelectorAll('.display_player_0'));
      display_player_0.forEach(element => element.innerHTML = player_names[left_side].name);
      var display_player_1 = Array.from(document.querySelectorAll('.display_player_1'));
      display_player_1.forEach(element => element.innerHTML = player_names[right_side].name);
   }

   function defineEntryEvents() {
      var catchTab = (evt) => { if (evt.which == 9) { evt.preventDefault(); } }
      var playername = document.getElementById('playername');
      playername.addEventListener('keyup', checkPlayerName, false)
      playername.addEventListener('keydown', catchTab , false);
      playername.onblur = function() { changePlayerName(); };
      playername.onfocus = function() { 
         setTimeout(()=>{ this.setSelectionRange(0, this.value.length); } , 300);
      }
      document.getElementById('player_rank').onfocus = function() { 
         setTimeout(()=>{ this.setSelectionRange(0, this.value.length); } , 300);
      }

      var hold_targets = Array.from(document.querySelectorAll('.pressAndHold'));
      Array.from(hold_targets).forEach(target => touchManager.addPressAndHold(target));
   }

   function editPlayer(index) {
      env.edit_player = env.swap_sides ? 1 - index : index;
      closeModal();
      document.getElementById('editplayer').style.display = 'flex';
      var player = match.metadata.players(env.edit_player);
      document.getElementById('playername').value = player.name;
      var attributes = ['hand', 'entry', 'seed', 'draw_position', 'ioc', ];
      attributes.forEach(attribute => {
         var target_id = `player_${attribute}`;
         document.getElementById(target_id).value = player[attribute] || '';
      });
      document.getElementById('player_rank').value = player.rank || '';
      var next_edit = index ? `editMatchDetails()` : `editPlayer(${env.swap_sides ? env.edit_player : 1 - env.edit_player})`;
      d3.select('.ep_next').attr('onclick', next_edit)
   }

   function editMatchDetails() {
      closeModal();
      document.getElementById('matchdeets').style.display = 'flex';
      document.getElementById('matchdetail_content').scrollTop = 0;
   }

   function checkPlayerName(keypress) {
      if (keypress.keyCode == 13 || keypress.code == 9) {
         document.getElementById("player_hand").focus();
         changePlayerName();
      }
   }

   function changePlayerName() {
      var player_name = document.getElementById('playername').value;
      match.metadata.definePlayer({index: env.edit_player, name: player_name});
      updatePositions();
   }

   function changeTextColor(classes, value) {
      var objs = Array.from(document.querySelectorAll(classes));
      objs.forEach(obj => obj.style.color = value);
   }

   function classAction(obj, action, player, service) {
      if (checkMatchEnd()) return;
      var slider_side = player ? 'right' : 'left';
      if (env.swap_sides && ['server', 'receiver'].indexOf(player) < 0) player = 1 - player;
      resetStyles();

      function changeValue(classes, value) {
         var objs = Array.from(document.querySelectorAll(classes));
         objs.forEach(obj => obj.innerHTML = value);
      }

      function rallyMode() {
         env.rally_mode = true;
         Array.from(document.querySelectorAll('.modeforce')).forEach(div => div.style.display = 'flex');
         changeValue('.vs_action_button.winner', 'Winner');
         changeValue('.vs_action_button.fault', 'UFE');
         changeValue('.vs_action_button.forced', 'Forced');
         Array.from(document.querySelectorAll('.vs_mode_button')).forEach(button => {
            if (['Serve', 'Return', '2nd Serve'].indexOf(button.innerHTML) >= 0) button.innerHTML = 'Base Line';
         });
      }

      var actions = {
         firstServe() { 
            env.serve2nd = false; 
         },
         secondServe() { 
            env.serve2nd = toggles.serve2nd ? false : true;
            toggles.serve2nd = !toggles.serve2nd;
         },
         fault(point, player) { 
            if (player != env.serving) return undefined;
            if (env.serve2nd) return { code: 'D'};
            var player_side = env.swap_sides ? 1 - player : player;
            changeValue(`.fault.display_${player_side}_serving`, 'Double Fault');
            changeValue(`.fault.modeerr_player${player_side}`, 'Double Fault');
            var server_side = env.swap_sides ? 1 - env.serving : env.serving;
            var server_mode = `.modeaction_player${server_side}`;
            Array.from(document.querySelectorAll(server_mode)).forEach(div => div.innerHTML = '2nd Serve')
            env.serve2nd = true;
            broadcastStatus('Service Fault');
         },
         doubleFault(point, player) { return player != env.serving ? undefined : { code: 'd'} },
         ace(point, player) { return player != env.serving ? undefined : env.serve2nd ? { code: 'a'} : { code: 'A'} },
         winner(point, player) { return { winner: player, result: 'Winner' }},
         unforced(point, player) { return { winner: 1 - player, result: 'Unforced Error' }},
         forced(point, player) { return { winner: 1 - player, result: 'Forced Error' }},
         point(point, player) { return { winner: player }},
         penalty(point, player) { return { winner: 1 - player, result: 'Penalty', code: player == env.serving ? 'P' : 'Q' }},

         modewin(point, player) {
            var action = obj.innerHTML;
            if (action == 'Ace') return actions.ace(point, player);
            if (action == 'Winner') return actions.winner(point, player);
         },
         modeerr(point, player) {
            var action = obj.innerHTML;
            if (action == 'Fault' || action == 'Double Fault') return actions.fault(point, player);
            if (action == 'UFE') return actions.unforced(point, player);
            if (action == 'Forced') return actions.forced(point, player);
            if (action == 'Let') return actions.let(point, player);
         },
         modeaction(point, player) {
            var action = obj.innerHTML;
            if (['Serve', '2nd Serve', 'Return'].indexOf(action) >= 0) { rallyMode(); }
            if (action == 'Serve' || action == 'Return') { rallyMode(); }
            if (action == 'Net') { obj.innerHTML = 'Base Line'; }
            if (action == 'Base Line') { obj.innerHTML = 'Net'; }
         },
         rally() {
            var action = obj.innerHTML;
            env.rally = parseInt((action.match(/\d+/g) || ['0']).join(''));
            env.rally += 1;
            changeValue(`.rally`, `Rally: ${env.rally}`);
            if (env.rally == 1) rallyMode();
         },
         let(point, player) {
            broadcastStatus('Service: Let');
            var server_side = env.swap_sides ? 1 - env.serving : env.serving;
            var server_let = `.modeforce_player${server_side}`;
            var action = obj.innerHTML;
            env.lets += 1;
            // reset serve clock
            return;
         },
      }

      var sound = document.getElementById("click");
      if (settings.audible_clicks) sound.play();
      if (obj.id) styleButton(obj.id);
      if (service && service == 'second_service') env.serve2nd = true;
      if (Object.keys(actions).indexOf(action) < 0) return undefined;
      var player_position = ['server', 'receiver'].indexOf(player);
      if (player_position >= 0) player = player_position ? env.receiving : env.serving;
      var point = env.serve2nd ? { first_serve: { error: 'Error', serves: [ '0e' ] } } : {};
      var result = actions[action](point, player);
      if (result) {
         checkStartTime();
         Object.assign(point, result);
         if (env.rally) point.rally = new Array(env.rally);
         var point_location = getPointLocation(point);
         if (point_location) point.location = point_location;

         // perhaps refactor to defer adding point until
         // stroke/result action, if any; then decorate point not necessary
         // and broadcast of point doesn't have to wait until decoration...
         // would require a global variable, perhaps 'pip' for point-in-progress
         var action = match.addPoint(point); 

         if (
               settings.track_shot_types && 
               action.result && 
               action.point.result && 
               ['Penalty', 'Ace','Double Fault'].indexOf(action.point.result) < 0
            ) {
               strokeSlider(slider_side);
            } else {
               checkMatchEnd(action);
               broadcastScore(action);
            }

         env.rally = 0;
         env.lets = 0;
         env.undone = [];
         updateState();
      }
      visibleButtons();
   }

   function broadcastScore(action) {
      action = action || match.history.lastPoint();
      var players = match.metadata.players();

      // don't publish if the player names haven't been changed
      var pub = players[0].name != default_players[0] && players[1].name != default_players[1];

      if (pub && broadcasting()) {
         var coords = device.geoposition.coords || {};
         var match_message = { 
            match: match.metadata.defineMatch(), 
            tournament: match.metadata.defineTournament(), 
            status: match.status,
            players: match.metadata.players(), 
            score: match.score(), 
            point: action.point,
            serving: match.nextTeamServing(), 
            complete: match.complete(), 
            winner: match.winner(), 
            geoposition: {
               latitude: coords.latitude,
               longitude: coords.longitude,
            },
            undo: typeof action == 'string' && action == 'Undo',
         }
         dev.match_message = match_message;
         coms.socket.emit('match score', match_message);
      }
   }

   // returns distance in km.  Use it to determine whether user is within 5km of tournament
   function distance(lat1, lon1, lat2, lon2) {
      var p = 0.017453292519943295;    // Math.PI / 180
      var c = Math.cos;
      var a = 0.5 - c((lat2 - lat1) * p)/2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))/2;

      return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
   }

   function checkMatchEnd(action) {
      if (match.complete()) {
         var winner = match.metadata.players()[match.winner()].name;
         showModal(`<div style="height: 50vh" class="flexcols flexcenter"><div>Match Complete!</div><div>Winner: ${winner}</div></div>`);
         return true;
      } else if (action && action.game.complete && settings.display_gamefish) {
         showGameFish();
      }
   }

   function strokeAction(hand, stroke, side) {
      if (hand && stroke) {
         var last_point = match.history.lastPoint();
         match.decoratePoint(last_point, { hand, stroke });
         stateChangeEvent(); // make sure to save the decoration in case of exit!!
      }
      strokeSlider();
      var point_episodes = match.history.action('addPoint');
      var last_action = point_episodes[point_episodes.length - 1];
      checkMatchEnd(last_action);
      broadcastScore(last_action);
   }

   function checkStartTime() {
      var points = match.history.points();
      if (points.length == 0) {
         // if no points, define new start time
         var date = new Date();
         match.metadata.defineMatch({date: date.valueOf()});
      }
   }

   // this is a crude beginning for this sort of logic...
   function getPointLocation(point) {
      var p0location = document.querySelectorAll('.modeaction_player0');
      var p1location = document.querySelectorAll('.modeaction_player1');
      if ((p0location  && p0location[0].innerHTML == 'Net') || (p1location && p1location[0].innerHTML == 'Net')) {
         if (point.result == 'Unforced Error' || point.result == 'Forced Error') {
            if (point.winner == 0 && p1location[0].innerHTML == 'Net') return 'Net'; 
            if (point.winner == 1 && p0location[0].innerHTML == 'Net') return 'Net'; 
         } else if (point.result == 'Winner') {
            if (point.winner == 0 && p0location[0].innerHTML == 'Net') return 'Net'; 
            if (point.winner == 1 && p1location[0].innerHTML == 'Net') return 'Net'; 
         }
      }
   }

   function updateMatchArchive(force) {
      var points = match.history.points();

      // var match_id = match.metadata.defineMatch().muid;
      var match_id = BrowserStorage.get('current_match');
      if (!match_id) return;
      var players = match.metadata.players();
      var save = force || points.length || (players[0].name != default_players[0] && players[1].name != default_players[1]);
      if (!save) return;

      // add key for current match
      var match_archive = JSON.parse(BrowserStorage.get('match_archive') || '[]');

      if (match_archive.indexOf(match_id) < 0) {
         match_archive.push(match_id);
         BrowserStorage.set('match_archive', JSON.stringify(match_archive));
      }

      var match_object = {
         ch_version: ch_version,
         players: players,
         first_service: match.set.firstService(),
         match: match.metadata.defineMatch(),
         format: match.format.settings(),
         tournament: match.metadata.defineTournament(),
         points: points,
         scoreboard: match.scoreboard(),
      }
      BrowserStorage.set(match_id, JSON.stringify(match_object));
   }

   function menuAction(obj, action) {
      var actions = {
         changeServer() { 
            if (!match.history.points().length) {
               match.set.firstService(1 - env.serving);
               updateState();
               viewManager('entry');
            }
         },
         undo() { 
            if (env.serve2nd || env.rally_mode) {
               env.serve2nd = false;
               env.rally_mode = false;
               env.rally = 0;
               env.lets = 0;
               resetButtons();
            } else {
               var undo = match.undo();
               broadcastScore('Undo');
               if (undo) env.undone.push(undo);
               updateMatchArchive(true);
            }
            visibleButtons();
         },
         redo() { 
            if (!env.undone.length) return;
            var action = match.addPoint(env.undone.pop());
            broadcastScore(action);
         },
         swap() { 
            options.user_swap = !options.user_swap;
            setCourtSide();
            swapServer();
         },
         settings() { viewManager('settings'); },
         newMatch() { newMatch(); },
         horizontalview() {
            options.horizontal_view = (options.horizontal_view == 'hblack') ? 'hwhite' : 'hblack';
            BrowserStorage.set('horizontal_view', options.horizontal_view);
            viewManager('entry');
         },
         verticalview() {
            /*
            options.vertical_view = (options.vertical_view == 'vblack') ? 'vwhite' : 'vblack';
            BrowserStorage.set('vertical_view', options.vertical_view);
            viewManager('entry');
            */
         },
      }
      if (Object.keys(actions).indexOf(action) < 0) return undefined;
      var result = actions[action]();
   }

   function setCourtSide() { 
      env.swap_sides = env.match_swap;
      if (options.user_swap) env.swap_sides = !env.swap_sides;
      stateChangeEvent();
   }

   function defineActionEvents() {
      match.events.addPoint(stateChangeEvent);
      match.events.undo(stateChangeEvent);
      match.events.reset(resetEvent);
   }

   function clearActionEvents() { match.events.clearEvents(); }
   function comsConnect() {};
   function comsDisconnect() {};
   function comsError() {};
   function sendHistory() {
      var muid = match.metadata.defineMatch().muid;
      var point_history = match.history.points();
      var data = { muid, point_history };
      if (muid && point_history.length) coms.socket.emit('point history', data);
   }

   function connectSocket() {
      if (navigator.onLine && !coms.socket) {   
         coms.socket = io.connect('/match', coms.connectionOptions);
         coms.socket.on('connect', comsConnect);                                 
         coms.socket.on('disconnect', comsDisconnect);
         coms.socket.on('connect_error', comsError);
         coms.socket.on('history request', sendHistory);
      }
   } 

   function endBroadcast() {
      app.broadcast = false;
      d3.select('#startpulse').style('display', 'flex');
      d3.select('#pulse').style('display', 'none').selectAll('svg').remove();
   }

   function broadcasting() {
      if (app.broadcast && coms.socket) return true;
      if (app.broadcast && !coms.socket && navigator.onLine) { connectSocket(); }
      return false;
   }

   function startBroadcast() {
      connectSocket();
      // var pc = pulseCircle.basic()
      var pc = pulseCircle()
         .color_range(['white', 'white'])
         .height(60)
         .width(60)
         .radius(28)
         .stroke_width(5);
      d3.select('#startpulse').style('display', 'none');
      d3.select('#pulse').style('display', 'block').call(pc);
   }

   function broadcastToggle() {
      app.broadcast = !app.broadcast;
      if (app.broadcast && navigator.onLine) {
         startBroadcast();
      } else {
         endBroadcast();
      }
      if (!navigator.onLine) showModal(` <p> <h1>No Internet Connection!</h1>`);
      updateAppState();
   }

   function checkUserUUID() {
      if (!app.user_uuid) {
         app.user_uuid = UUID.generate();
         updateAppState();
      }
   }

   function init() {
      // dismiss notification of requirements
      changeDisplay('none', 'welcome');

      // initialize clipboard
      var clipboard = new Clipboard('.c2c');
      clipboard.on('success', function(e) { closeModal(); });

      restoreAppState();
      checkUserUUID();
      if (app.broadcast && navigator.onLine) startBroadcast();

      defineEntryEvents();
      defineActionEvents();
      touchManager.addSwipeTarget(document.getElementById('mainmenu'));

      // populate drop down list box selectors
      var select_seed = Array.from(document.querySelectorAll(".md_seed"));
      select_seed.forEach(select => { [...Array(32).keys()].forEach(i => select.options[i + 1] = new Option(i + 1, i + 1)); });
      var select_draw_position = Array.from(document.querySelectorAll(".md_draw_position"));
      select_draw_position.forEach(select => { [...Array(128).keys()].forEach(i => select.options[i + 1] = new Option(i + 1, i + 1)); });
      d3.json('./assets/ioc_codes.json', function(data) { 
         var select_ioc = Array.from(document.querySelectorAll(".md_ioc"));
         select_ioc.forEach(select => {
            data.forEach((entry, index) => select.options[index + 1] = new Option(entry.name, entry.ioc));
         });
         // load Details to be sure that ioc data can be used to populate country
         loadDetails();
      });

      setOrientation();
      loadCurrent();
      configureViz();
      vizUpdate();
   }

   function newGame() {
      var common_pointsAdded = match.history.action('addPoint');
      var last_point = common_pointsAdded[common.pointsAdded.length - 1];
      var total_games = [].concat(...match.score().components.sets.map(s => s.games));
      var current_points = match.score().counters.points.reduce((a, b) => a + b);
      var tiebreak_side = Math.floor(current_points / 6) % 2;
   }

   function groupGames() {
      var point_episodes = match.history.action('addPoint');
      var games = [{ points: [] }];
      var game_counter = 0;
      var current_game = 0;
      point_episodes.forEach(episode => {
         var point = episode.point;
         if (point.game != current_game) {
            game_counter += 1;
            current_game = point.game;
            games[game_counter] = { points: [] };
         }
         games[game_counter].points.push(point);
         games[game_counter].index = game_counter;
         games[game_counter].set = episode.set.index;
         games[game_counter].score = episode.game.games;
         games[game_counter].complete = episode.game.complete;
         if (episode.game.complete) games[game_counter].winner = point.winner;
         if (episode.set.complete) games[game_counter].last_game = true;
      });
      return games;
      // if (set != undefined) games = games.filter(function(game) { return game.set == set });
   }

   function configureViz() {
      // set up momentum
      var pcolors = ["#a55194", "#6b6ecf"];
      charts.mc = momentumChart();
      charts.mc.options({ 
         display: { 
            sizeToFit:        false,
            continuous:       false,
            orientation:      'vertical',
            transition_time:  0,
            service:          false,
            rally:            true,
            player:           false,
            grid:             false,
            score:            true,
         },
         colors: pcolors
      })
      charts.mc.events({ 'score' : { 'click': showGame }, });
      d3.select('#momentumChart').call(charts.mc);

      // set up gameFish
      var pcolors = { players: ["#a55194", "#6b6ecf"] };
      charts.gamefish = gameFish();
      charts.gamefish.options({ 
         display:    { sizeToFit: true, },
         colors:     pcolors 
      });
      d3.select('#gameFishChart').call(charts.gamefish);

      // set up gametree
      charts.gametree = gameTree();
      var options = {
         display: { sizeToFit: true, },
         lines: {
            points: { winners: "green", errors: "#BA1212", unknown: "#2ed2db" },
            colors: { underlines: "black" }
         },
         nodes: {
            colors: { 0: pcolors.players[0] , 1: pcolors.players[1], neutral: '#ecf0f1' }
         },
         selectors: {
            enabled: true,
            selected: { 0: false, 1: false }
         }
      }
      charts.gametree.options(options);
      d3.select('#gameTreeChart').call(charts.gametree);

      charts.pts_match = ptsMatch();
      charts.pts_match.options({ 
         margins: { top: 40, bottom: 20 },
         display: { sizeToFit: true, }
      });
      charts.pts_match.data(match);
      d3.select('#PTSChart').call(charts.pts_match);
   }

   function closeViz() { 
      viewManager('entry'); 
   }

   function vizUpdate() {
      var direction = env.orientation == 'landscape' ? 'horizontal' : 'vertical';

      if (env.view == 'pts' && direction == 'vertical') {
         changeDisplay('none', 'pts');
         changeDisplay('inline', 'momentum');
         charts.mc.width(window.innerWidth).height(820);
         charts.mc.update();
         env.view = 'momentum';
      } else if (env.view == 'momentum' && direction == 'horizontal') {
         changeDisplay('none', 'momentum');
         changeDisplay('flex', 'pts');
         charts.pts_match.update({sizeToFit: true});
         env.view = 'pts';
      }

      charts.gamefish.update();

      var players = match.metadata.players();
      charts.gametree.options({ 
         labels: { 
            Player: players[0].name, 
            Opponent: players[1].name,
         },
      });
      charts.gametree.update({sizeToFit: true});
   }

   function modalShare(match_id) {
      broadcastScore();
      match_id = match_id || BrowserStorage.get('current_match');
      var modaltext = ` <p> <h1>First Track a Match!</h1> </p> `;
      var tv_link;
      if (match_id) {
         var match_data = BrowserStorage.get(match_id);
         var json_data = JSON.parse(match_data);
         var muid = json_data.match.muid;
         if (!muid) {
            muid = UUID.generate();
            json_data.match.muid = muid;
            match.metadata.defineMatch({muid});
            BrowserStorage.set(match_id, JSON.stringify(json_data));
         }
         aip.shareFile(json_data, 'mailcache/ch', muid, 'ch', shareResult);

         function shareResult(response) {
            var result = JSON.parse(response);
            if (!result.error) {
               tv_link = `https://tennisvisuals.net/?ch=${muid}.ch`;
               var tvb = `TennisVisuals Match Visualization: ${tv_link}`;
               var broadcast_link = app.broadcast ? `CourtHive Live Score: ${location.origin}/scores?muid=${muid}` : '';
               var email_message = `${tvb}%0D%0A ${broadcast_link}%0D%0A `;
               var copy_message = `${tvb}\r\n${broadcast_link}\r\n`;
               modaltext = `
                  <p>&nbsp;</p>
                  <h1>Options for Sharing</h1>
                  <div class='flexrows'> 
                     <div class='flexcenter iconmargin' onclick='closeModal()'>
                        <a href="${tv_link}" target="_blank" class="notextdecoration">
                           <img class="icon_large" src='icons/link.png'>
                        </a>
                     </div>
                     <div class='flexcenter iconmargin' onclick='closeModal()'>
                        <a href='mailto:?subject=CourtHive Match Link&body=${email_message}' class="notextdecoration">
                           <img class="icon_large" src='icons/emailblack.png'>
                        </a> 
                     </div>
                     <div class='flexcenter iconmargin'>
                        <button id='copy2clipboard' class="flexcenter c2c" data-clipboard-text=""> 
                           <div class='export_action action_icon_large iconclipboard'></div> 
                        </button>
                     </div>
                  </div> 
               `;
               showModal(modaltext, copy_message);
            } else {
               modaltext = ` <p> <h1>Unable to share match...</h1> <p><i>Connection Error</i></p> </p> `;
               showModal(modaltext);
            }
         }

      } else {
         showModal(modaltext);
      }
   }

   function modalInfo() {
      var modaltext = `
         <p>&nbsp;</b>
         <h2>CourtHive</h2>
         <p>version <a id="version" target="_blank" href="https://github.com/TennisVisuals/universal-match-object/tree/master/examples/CourtHive">${ch_version}</a></p>
         <p>An 
            <a target="_blank" href="https://github.com/TennisVisuals/universal-match-object/tree/master/examples/CourtHive">Open Source</a> project developed by 
            <a target="_blank" href="http://TennisVisuals.com">TennisVisuals</a>
         </p>
         <p><a href="mailto:tennis.aip@gmail.com?subject=CourtHive">Feedback Welcome!</a></p>
         <h2>Help</h2>
         <div class="helpitem">Difficulties after an app update?</div>
         <div class="flexcenter">
            <div class='flexcenter reset' onclick="appReset()">Reset</div>
         </div>
         <p>&nbsp;</b>
      `;
      showModal(modaltext);
   }

   function lsTest(){
       var test = 'test';
       try {
           localStorage.setItem(test, test);
           localStorage.removeItem(test);
           return true;
       } catch(e) {
           return false;
       }
   }

   function isJSON(str) {
       try {
           JSON.parse(str);
       } catch (e) {
           return false;
       }
       return true;
   }

   function appReset() {
      if (lsTest()) {
         localStorage.clear();
      } else {
         BrowserStorage.remove('current_match');
         var match_archive = BrowserStorage.get('match_archive');
         if (isJSON(match_archive)) {
            var match_ids = JSON.parse(match_archive);
            match_ids.forEach(id => BrowserStorage.remove(id));
            BrowserStorage.remove('match_archive');
         }
      }
      closeModal();
      newMatch();
   }

   function modalHelp(quick_start) {
      var quick = `
         <div class="helpintro">Quick Start</div>
         <div class="flexhelp"> <div class='iconmenub action_icon_large'></div> <div class="quicktitle">Main Menu</div> </div>
         <div class="quickitem"> <span> Set <b>Match Details</b>, <b>Share</b>, or turn on <b>Broadcasting</b> </span></div>
         <div class="flexhelp"> <div class='iconsettingsb action_icon_large'></div> <div class="quicktitle">Settings</div> </div>
         <div class="quickitem"> <span> Turn on <b>Audible Clicks</b> and <b>Track Shot Types</b></span></div>
         <div class="flexhelp"> <div class='iconchangeb action_icon_large'></div> <div class="quicktitle">Change First Server</div> </div>
         <div class="quickitem"> <span>After Service press <b>Serve</b>, <b>Return</b>, or <b>Rally</b> to switch into Rally Mode </span></div>
         <div class="quickitem"> <span>To simply advance points, tap the <b>Points</b> display </span></div>
         <div class="flexhelp"> <img src='icons/points.jpg'> </div>
      `;
      var save = `
         <div class="helpintro">Save To Home Screen</div>
         <div class="helpitem">CourtHive is a Progressive Web App</div>
         <div class="helpitem"><b>For Full Screen View:</b></div>
         <div class="helpitem">On iOS use Safari to Save</div>
         <div class="helpitem">On Android use Chrome</div>
      `;
      var helptext = `
         <div class="helpintro">How to</div>
         <div class="helpitem"><div><b>Add/Change Player Names</b>:</div> &nbsp; <div> Touch the name!</div></div>
         <div class="helpitem"><div><b>Edit a Point</b>:</div><div> &nbsp; Touch the point in History view</div></div>
         <div class="helpitem"><div><b>Delete Match</b>:</div><div> &nbsp; Swipe Left in Match Archive </div></div>
         <div class="helpitem"><div><b>Export Match</b>:</div><div> &nbsp; Swipe Right in Match Archive </div></div>
         <div class="helpitem"><div><b>Points-to-Set</b>:</div><div> &nbsp; Rotate Momentum Chart</div></div>
         <div class="helpitem"><div><b>GameTree</b>:</div><div> &nbsp; Tap Player to filter by server</div></div>
         <div class="flexhelp"> <div class='iconbroadcast icon icon_5'></div> <div class="quicktitle">Enable Broadcast</div> </div>
         <div class="flexhelp"> <div class='iconshare icon icon_3'></div> <div class="quicktitle">Share (Email, Copy/Paste)</div> </div>
      `;
      var modaltext = quick_start ? quick + save + helptext : helptext + save + quick;
      showModal(modaltext);
   }

   var timer = (function() {
       var basePeriod = 1000;
       var currentSpeed = 1;
       var timerElement;
       var timeoutRef;
       var count = 0;

       return {
         start : function(speed, id) {
           if (speed >= 0) {
             currentSpeed = speed;
           }
           if (id) timerElement = document.getElementById(id);
           timer.run();
         },

         run: function() {
           if (timeoutRef) clearInterval(timeoutRef);
           if (timerElement) {
             timerElement.innerHTML = count;
           }
           if (currentSpeed) {
             timeoutRef = setTimeout(timer.run, basePeriod/currentSpeed);
           }
           ++count;
         },

         setSpeed: function(speed) {
           currentSpeed = +speed;
           timer.run();
         }
       }

   }());
