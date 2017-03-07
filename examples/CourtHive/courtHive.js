/* TODO
 *
 * Add GPS location detection -- use to auto-populate Country
 *
 * Limit Tournament Round by Draw Size
 * Limit Draw Position by Draw Size
 *
 * Add Date Validation... default to today's date if empty
 * Add Venue, City, Country, gps to Tournament?
 *
 * change vwhite score boxes to div not inputs...
 *
 * point history ... makes it possible to modify or delete points of current
 * game and recalculate score ... perhaps makes possible indeterminate points
 * don't know who won the point but will keep scoring points until the game
 * ends at which point the point can be assigned properly...
 *
 * GAMETREE -> counters contain points, not just number of points
 *          -> data is episode_points, not just points
 *
 * Screen for complete match: scoreboard at top, duration & etc.
 * with menu to select stats / momenutme
 *
 */

   var match = umo.Match();
   var ch_version = '1.2.3';

   var app = {
      isStandalone: 'standalone' in window.navigator && window.navigator.standalone,
      isIDevice: (/iphone|ipod|ipad/i).test(window.navigator.userAgent),
   }

   var env = {
      rally: 0,
      undone: [],
      view: 'entry',
      serve2nd: false,
      rally_mode: false,
      match_swap: false,
      swap_sides: false,
      orientation: 'vertical',
      serving: match.nextTeamServing(),
      receiving: match.nextTeamReceiving(),
   }

   var settings = {
      track_shot_types: true,
      audible_clicks: true,
      display_gamefish: true,
   };

   var options = {
      user_swap: false,
      highlight_better_stats: true,
      vertical_view: BrowserStorage.get('vertical_view') || 'vblack',
      horizontal_view: BrowserStorage.get('horizontal_view') || 'hblack',
   }

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

   // TODO: integrate this... requires HTTPS
   /*
   navigator.geolocation.getCurrentPosition(function(pos){
      if (typeof mt.geolocation == 'function') mt.geolocation(pos);
   });
   */

   window.addEventListener('load', function(e) {
     window.applicationCache.addEventListener('updateready', function(e) {
       if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
         if (confirm('A new version of CourtHive is available. Load it?')) { window.location.reload(); }
       }
     }, false);
   }, false);

   window.addEventListener("orientationchange", function() { orientationEvent(); }, false);
   window.addEventListener("resize", function() { orientationEvent(); }, false);

   function updateSettings() {
      Object.keys(settings).forEach(key => {
         settings[key] = document.getElementById(key).checked;
         BrowserStorage.set(key, settings[key]);
      });
   }

   function restoreSettings() {
      Object.keys(settings).forEach(key => {
         settings[key] = BrowserStorage.get(key) == "true";
         document.getElementById(key).checked = settings[key];
      });
   }

   function closeModal() { document.getElementById('modal').style.display = "none"; }
   function showModal(text, data) {
      document.getElementById('modaltext').innerHTML = text;
      if (data) document.getElementById("copy2clipboard").setAttribute("data-clipboard-text", data);
      document.getElementById('modal').style.display = "flex";
   }

   function showGame(d) { showGameFish(d.index); }
   function showGameFish(index) { 
      document.getElementById('gamefish').style.display = "flex"; 
      let games = groupGames();
      let game = index != undefined ? games[index] : games[games.length -1];
      let gridcells = (game.points[0].tiebreak) ? ['0', '1', '2', '3', '4', '5', '6', '7'] : ['0', '15', '30', '40', 'G'];
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

   touchManager.swipeLeft = (element) => {
      if (element && element.id) {
         if (element.id == 'main_menu') {
            let systeminfo = `
               <div><b>Standalone:</b> <span style="color: blue">${app.isStandalone}</span></div>
               <div><b>Perspective Score:</b> ${match.set.perspectiveScore()}</div>
            `;
            showModal(systeminfo);
            return;
         }
         let object_delete = document.getElementById(element.id + '_delete');
         let object_export = document.getElementById(element.id + '_export');
         let action_delete = object_delete ? object_delete.style.display : undefined;
         let action_export = object_export ? object_export.style.display : undefined;
         if (action_export == 'flex') {
            document.getElementById(element.id + '_export').style.display = 'none';
         } else if (action_delete == 'none') {
            document.getElementById(element.id + '_delete').style.display = 'flex';
         }
      }
   }

   touchManager.swipeRight = (element) => {
      if (element && element.id) {
         let object_delete = document.getElementById(element.id + '_delete');
         let object_export = document.getElementById(element.id + '_export');
         let action_delete = object_delete ? object_delete.style.display : undefined;
         let action_export = object_export ? object_export.style.display : undefined;
         if (action_delete == 'flex') {
            document.getElementById(element.id + '_delete').style.display = 'none';
         } else if (action_export == 'none') {
            document.getElementById(element.id + '_export').style.display = 'flex';
         }
      }
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
       let button = document.getElementById(id);
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
      let server_side = env.swap_sides ? 1 - env.serving : env.serving;
      let receiver_side = env.swap_sides ? 1 - env.receiving : env.receiving;

      Array.from(document.querySelectorAll('.fault')).forEach(div => div.innerHTML = 'Fault');

      let server_mode = `.modeaction_player${server_side}`;
      Array.from(document.querySelectorAll(server_mode)).forEach(div => div.innerHTML = 'Serve')

      let server_fault = `.modeerr_player${server_side}`;
      Array.from(document.querySelectorAll(server_fault)).forEach(div => div.innerHTML = 'Fault')
      let server_ace = `.modewin_player${server_side}`;
      Array.from(document.querySelectorAll(server_ace)).forEach(div => div.innerHTML = 'Ace')

      let receiver_mode = `.modeaction_player${receiver_side}`;
      Array.from(document.querySelectorAll(receiver_mode)).forEach(div => div.innerHTML = 'Return')

      let receiver_ufe = `.modeerr_player${receiver_side}`;
      Array.from(document.querySelectorAll(receiver_ufe)).forEach(div => div.innerHTML = 'UFE')
      let receiver_winner = `.modewin_player${receiver_side}`;
      Array.from(document.querySelectorAll(receiver_winner)).forEach(div => div.innerHTML = 'Winner')

      Array.from(document.querySelectorAll('.modeforce')).forEach(div => div.style.display = 'none');
      Array.from(document.querySelectorAll('.rally')).forEach(div => div.innerHTML = 'Rally');
   };

   function styleButton(id) {
      let button = document.getElementById(id);
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
      let score = match.score();
      let sets_counter = score.counters.sets;
      let games_counter = score.counters.games;
      let points = score.points.split('-');
      let left_side = env.swap_sides ? 1 : 0;
      let right_side = env.swap_sides ? 0 : 1;

      // old way
      let point_fields = Array.from(document.getElementsByClassName("points"));
      point_fields.forEach((field, index) => { field.value = points[env.swap_sides ? 1 - index : index] });

      // new way
      let display_point_0 = Array.from(document.querySelectorAll('.display_points_0'));
      display_point_0.forEach(element => element.innerHTML = points[left_side]);
      let display_point_1 = Array.from(document.querySelectorAll('.display_points_1'));
      display_point_1.forEach(element => element.innerHTML = points[right_side]);

      let display_game_0 = Array.from(document.querySelectorAll('.display_games_0'));
      display_game_0.forEach(element => element.innerHTML = games_counter[left_side]);
      let display_game_1 = Array.from(document.querySelectorAll('.display_games_1'));
      display_game_1.forEach(element => element.innerHTML = games_counter[right_side]);

      let display_set_0 = Array.from(document.querySelectorAll('.display_sets_0'));
      display_set_0.forEach(element => element.innerHTML = sets_counter[left_side]);
      let display_set_1 = Array.from(document.querySelectorAll('.display_sets_1'));
      display_set_1.forEach(element => element.innerHTML = sets_counter[right_side]);

      let sets = score.components.sets;
      let threshold = match.format.threshold();
      let max_games = threshold == 1 ? 0 : threshold > 2 ? 4 : 2;
      [0, 1, 2, 3, 4].forEach((set, index) => {
         if (!sets || (sets && !sets[index])) {
            // old way
            let set_fields = Array.from(document.getElementsByClassName("games" + index));
            set_fields.forEach(field => field.value = '-');
            // new way
            let player0_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_0'));
            player0_games.forEach(field => field.innerHTML = index > max_games ? ' ' : '-');
            let player1_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_1'));
            player1_games.forEach(field => field.innerHTML = index > max_games ? ' ' : '-');
         }
      });

      if (!sets) return;

      sets.forEach((set, index) => {
         // old way
         let set_fields = Array.from(document.getElementsByClassName("games" + index));
         set_fields.forEach((field, index) => field.value = set.games[env.swap_sides ? 1 - index : index]);
         // new way
         let player0_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_0'));
         player0_games.forEach(field => field.innerHTML = set.games[env.swap_sides ? 1 : 0]);
         let player1_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_1'));
         player1_games.forEach(field => field.innerHTML = set.games[env.swap_sides ? 0 : 1]);
      });
   }

   function swapServer() {
      env.serving = match.nextTeamServing();
      env.receiving = match.nextTeamReceiving();

      let server_side = env.swap_sides ? 1 - env.serving : env.serving;
      let receiver_side = env.swap_sides ? 1 - env.receiving : env.receiving;

      let div = document.getElementById(server_side ? 'player_receiving' : 'player_serving');
      div.parentNode.insertBefore(div, document.getElementById('team_two'));
      div = document.getElementById(server_side ? 'player_serving' : 'player_receiving');
      div.parentNode.insertBefore(div, document.getElementById('entry_end'));

      changeTextColor(`.indicate_serve.display_player_${server_side}`, 'yellow');
      changeTextColor(`.indicate_serve.display_player_${receiver_side}`, 'white');

      /*
      document.getElementById("playerone").style.color = env.swap_sides ? "red" : "blue";
      document.getElementById("playertwo").style.color = env.swap_sides ? "blue" : "red";
      */

      document.getElementById("team_one_role").innerHTML = server_side ? 'Receiving:' : 'Serving:';
      document.getElementById("team_two_role").innerHTML = server_side ? 'Serving:' : 'Receiving:';

      if (server_side) {
         changeClassDisplay('.display_0_serving', 'none');
         changeClassDisplay('.display_1_serving', 'flex');
      } else {
         changeClassDisplay('.display_0_serving', 'flex');
         changeClassDisplay('.display_1_serving', 'none');
      }

      let point_fields = Array.from(document.getElementsByClassName("points"));
      point_fields.forEach((field, index) => {
         let player = env.swap_sides ? 1 - index : index;
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
      let points = match.history.points();
      document.getElementById('footer_change_server').style.display = points.length == 0 ? 'inline' : 'none';
      Array.from(document.querySelectorAll('.view_stats')).forEach(div => div.style.display = points.length > 0 ? 'inline' : 'none');
      Array.from(document.querySelectorAll('.view_history')).forEach(div => div.style.display = points.length > 0 ? 'inline' : 'none');
      Array.from(document.querySelectorAll('.undo')).forEach(div => {
         div.style.display = points.length > 0 || env.serve2nd || env.rally_mode ? 'flex' : 'none'
      });
      Array.from(document.querySelectorAll('.redo')).forEach(div => {
         div.style.display = env.undone.length ? 'flex' : 'none'
      });
   }

   function stateChangeEvent() {
      updateMatchArchive();
      env.serve2nd = false;
      env.rally_mode = false;
      updateState();
      updateScore();
      visibleButtons();
   }
   
   function resetPlayers() {
      let entry_fields = Array.from(document.getElementsByClassName("player_entry"));
      entry_fields.forEach((element, index) => {
         element.value = default_players[index];
         match.metadata.definePlayer({index, name: element.value});
      });
      let current_players = JSON.stringify(match.metadata.players());
      BrowserStorage.set('current_players', current_players);
      updatePositions();
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

      resetStyles();
      resetPlayers();
      swapServer();
      stateChangeEvent();
   }

   function firstAndLast(value) {
      let parts = value.split(" ");
      let display = parts[0];
      if (parts.length > 1) display += " " + parts[parts.length - 1];
      return display;
   }

   function modalExport(match_id = BrowserStorage.get('current_match'), what = 'match') {
      Array.from(document.querySelectorAll('.mh_export')).forEach(selector => selector.style.display = 'none');
      let match_data = BrowserStorage.get(match_id);
      let save = `<p onclick="exportMatch('${match_id}')"><b>Save</b> <img class='export_action' src='./icons/save.png'></p>`;
      let copy = `
         <p><b>Copy to Clipboard</b>  
            <button id='copy2clipboard' class="c2c" data-clipboard-text=""> 
               <img class='export_action' src='./icons/clipboard.png'> 
            </button>
         </p> 
      `;
      let modaltext = `<div>${!app.isIDevice ? save : ''}${copy}</div>`;
      // let export_data = what == 'match' ? match_data : 'Point History';
      let export_data = match_data;
      showModal(modaltext, export_data);
   }

   function displayPointHistory() {
      let games = groupGames();
      let players = match.metadata.players();
      let html = '';
      if (!games.length) return false;
      games.forEach(game => {
         if (game.points && game.points.length) html += gameEntry(game, players);
      });
      document.getElementById('ph_frame').innerHTML = html;
   }

   function gameEntry(game, players) {
      let last_point = game.points[game.points.length - 1];
      let game_score = game.complete ? game.score.join('-') : undefined;
      let tiebreak = last_point.tiebreak;
      let server = tiebreak ? 'Tiebreak' : players[last_point.server].name;
      let service = tiebreak ? '' : last_point.server ? 'playertwo' : 'playerone';
      let servergame = tiebreak ? '' : last_point.server == last_point.winner ? 'won' : 'lost';
      let html = `
         <div class="flexrows ph_game" onclick="showGameFish(${game.index})">
            <div class='ph_margin flexrows'>
               <div class="ph_server ${service}">${server}</div>
               <div class="ph_action flexcenter"> <img class='ph_fish' src='./icons/fishblack.png'> </div>
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
      let evenodd = point.index % 2 ? 'even' : 'odd';
      let point_score = !point.tiebreak && point.server ? point.score.split('-').reverse().join('-') : point.score;
      let player_initials;
      if (point.result) {
         let shot_by;
         if (['Ace', 'Winner'].indexOf(point.result) >=0 ) {
            shot_by = players[point.winner].name;
         } else {
            shot_by = players[1 - point.winner].name;
         }
         player_initials = shot_by.split(' ').map(name => name[0]).join('');
      }
      let point_hand = point.hand ? point.hand + ' ' : '';
      let point_result = point.result || '';
      let point_description = (!point_result) ? '' : `${player_initials}: ${point_hand}${point_result}`;
      point_score = point_score == '0-0' ? 'GAME' : point_score;
      if (point.tiebreak) {
         if (point.server) point_score = `&nbsp;${point_score}*`;
         if (!point.server) point_score = `*${point_score}&nbsp;`;
      }
      let rally = point.rally ? point.rally.length + 1 : '';
      let html = `
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
      let episodes = match.history.action('addPoint');
      let point = episodes[index];
      // showModal(JSON.stringify(point));
   }

   function newMatch() {
      match.reset();
      loadDetails();
      updateScore();
      stateChangeEvent();
      let date = new Date();
      match.metadata.defineMatch({date: date.valueOf()});
      BrowserStorage.set('current_match', date.valueOf());
      viewManager('matchformat');
   }

   function displayFormats() {
      let format_types = match.format.types();
      let html = '';
      if (!format_types.length) return false;
      format_types.forEach(format => {
         html += formatEntry(format);
      });
      document.getElementById('matchformats').innerHTML = html;
   }

   function formatEntry(format) {
      ({name, description} = umo.formats().matches[format]);
      name = name || '';
      let html = `
      <div class='flexleft mf_format'>
         <div class='flexcols' onclick="changeFormat('${format}')">
            <div class='mf_name'> <div><b>${name}</b></div> </div>
            <div class='mf_description'> <div>${description}</div> </div>
         </div>
      </div>
      `;
      return html;
   }

   function displayMatchArchive() {
      let html = '';
      let match_archive = JSON.parse(BrowserStorage.get('match_archive') || '[]').sort().reverse();
      if (!match_archive.length) {
         match.reset();
         viewManager('entry');
         return;
      }
      match_archive.forEach(match_id => {
         let match_data = JSON.parse(BrowserStorage.get(match_id));
         if (match_data) {
            html += archiveEntry(match_id, match_data);
         } else {
            deleteMatch(match_id);
         }
      });
      document.getElementById('matcharchive').innerHTML = html;
      let elements = Array.from(document.querySelectorAll('.swipe'));
      Array.from(elements).forEach(element => touchManager.addSwipeTarget(element));
      return match_archive;
   }

   function archiveEntry(match_id, match_data) {
      let date = new Date(match_id);
      let display_date = [date.getDate(), months[date.getMonth()], date.getFullYear()].join('-');
      let players = match_data.players;
      let display_players = `
         <span class='nowrap'>${firstAndLast(players[0].name)}</span>
         <span> v. </span>
         <span class='nowrap'>${firstAndLast(players[1].name)}</span>
         `;
      let match_score = match_data.scoreboard;
      let match_format = match_data.format.name;
            /* 
            // TODO: use this to generate mail with link to match on tennisvisuals.com
            let points = JSON.stringify(match.scoreboard());
            <a href='mailto:?subject=CourtHive Match&body=${points}'>
               <div class='mh_fullheight'> <img class='mh_action' src='./icons/export.png'> </div>
            </a>
            */
      let html = `
      <div id='match_${match_id}' class='flexcenter mh_swipe swipe'>
         <div id='match_${match_id}_export' class='flexcols flexcenter mh_export' style='display: none;' onclick="modalExport('${match_id}')">
            <div class='mh_fullheight'> <img class='mh_action' src='./icons/exportwhite.png'> </div>
         </div>
         <div class='flexcols mh_match' onclick="loadMatch('${match_id}')">
            <div class='mh_players'>${display_players}</div>
            <div class='mh_details'>
               <div>${display_date}</div>
               <div class='mh_format'>${match_format}</div>
            </div>
            <div class='mh_score'>${match_score}</div>
         </div>
         <div id='match_${match_id}_delete' class='flexcols flexcenter mh_trash' style='display: none;' onclick="deleteMatch('${match_id}')">
            <div class='mh_fullheight'> <img class='mh_action' src='./icons/recycle.png'> </div>
         </div>
      </div>`
      return html;
   }

   function changeFormat(format) {
      match.format.type(format);
      let format_name = match.format.settings().name;
      document.getElementById('md_format').innerHTML = format_name;
      updateScore();
      viewManager('entry');
   }

   function loadDetails() {
      let players = match.metadata.players();
      players.forEach((player, index) => {
         let attributes = ['hand', 'entry', 'seed', 'draw_position', 'ioc', 'rank'];
         attributes.forEach(detail => {
            let target_id = `player${index}_${detail}`;
            document.getElementById(target_id).value = player[detail] || '';
         });
      });

      let match_details = match.metadata.defineMatch();
      let m_attrs = ['court', 'umpire'];
      m_attrs.forEach(attribute => {
         let target_id = `match_${attribute}`;
         document.getElementById(target_id).value = match_details[attribute] || '';
      });

      let tournament = match.metadata.defineTournament();
      let t_attrs = ['name', 'start_date', 'tour', 'rank', 'surface', 'in_out', 'draw', 'draw_size', 'round'];
      t_attrs.forEach(attribute => {
         let target_id = `tournament_${attribute}`;
         document.getElementById(target_id).value = tournament[attribute] || '';
      });
   }

   function updatePlayers() {
      match.metadata.definePlayer(updatePlayerDetails(0));
      match.metadata.definePlayer(updatePlayerDetails(1));
      updateMatchArchive();
   }

   function updatePlayerDetails(index) {
      let player = { index };
      let attributes = ['hand', 'entry', 'seed', 'draw_position', 'ioc', ];
      attributes.forEach(attribute => {
         let target_id = `player${index}_${attribute}`;
         let obj = document.getElementById(target_id);
         if (obj.selectedIndex >= 0) {
            let value = obj.options[obj.selectedIndex].value;
            if (value) player[attribute] = value;
         }
      });
      let rank = document.getElementById(`player${index}_rank`).value;
      if (rank) player.rank = rank;
      return player;
   }

   function updateMatchDetails() {
      let match_details = {};
      attributes = ['court', 'umpire'];
      attributes.forEach(attribute => {
         let target_id = `match_${attribute}`;
         let obj = document.getElementById(target_id);
         let value = document.getElementById(`match_${attribute}`).value;
         if (value) match_details[attribute] = value;
      });
      match.metadata.defineMatch(match_details);
      updateMatchArchive();
   }

   function updateTournamentDetails() {
      let tournament = {};
      let attributes = ['surface', 'in_out', 'draw', 'draw_size', 'round'];
      attributes.forEach(attribute => {
         let target_id = `tournament_${attribute}`;
         let obj = document.getElementById(target_id);
         if (obj.selectedIndex >= 0) {
            let value = obj.options[obj.selectedIndex].value;
            if (value) tournament[attribute] = value;
         }
      });
      attributes = ['name', 'start_date', 'tour', 'rank'];
      attributes.forEach(attribute => {
         let target_id = `tournament_${attribute}`;
         let obj = document.getElementById(target_id);
         let value = document.getElementById(`tournament_${attribute}`).value;
         if (value) tournament[attribute] = value;
      });
      match.metadata.defineTournament(tournament);
      updateMatchArchive();
   }

   function loadMatch(match_id) {
      if (!match_id) return;
      match.reset();
      let match_data = JSON.parse(BrowserStorage.get(match_id));
      if (!match_data) return;

      // reduce overhead by turning off matchObject state change events;
      clearActionEvents();
      BrowserStorage.set('current_match', match_id);
      if (match_data.first_service) match.set.firstService(match_data.first_service);
      if (match_data.match) match.metadata.defineMatch(match_data.match);
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

      if (match_data.players) populateEntryFields(match_data.players);
      updatePositions();
      updateScore();
      loadDetails();
      stateChangeEvent();
      defineActionEvents();
      viewManager('entry');
   }

   function loadCurrent() {
      let current_match_id = BrowserStorage.get('current_match');
      loadMatch(current_match_id);
      swapServer();
      resetButtons();
      visibleButtons();
   }

   function deleteMatch(match_id) {
      BrowserStorage.remove(match_id);
      let current_match_id = BrowserStorage.get('current_match');
      let match_archive = JSON.parse(BrowserStorage.get('match_archive') || '[]');
      match_archive = match_archive.filter(archive_id => match_id != archive_id);
      BrowserStorage.set('match_archive', JSON.stringify(match_archive));
      if (match_id == current_match_id) BrowserStorage.remove('current_match');
      displayMatchArchive();
   }

   function exportMatch(match_id) {
      let match_data = BrowserStorage.get(match_id);
      download(match_data, `match_${match_id}.json`);
   }

   function formatChangePossible() {
      let points = match.history.points();
      return points.length == 0;

      // TODO: implement when umo can propagate changes to children...
      /*
      scores = points.map(point=>point.score);
      let games = match.score().counters.games.reduce((a, b) => a + b);
      let advantages = scores.map(m=>m.indexOf('A') >= 0).filter(f=>f);
      if (games < 1 && advantages < 1) return true;
      */
   }

   function strokeSlider(show, close) {
      let width = window.innerWidth;
      let stroke_slider = document.getElementById('stroke_slider');
      if (show) {
         stroke_slider.style.display = 'flex';
         document.getElementById('slideleft').style.display = show == 'right' ? 'flex' : 'none';
         document.getElementById('slideright').style.display = show == 'left' ? 'flex' : 'none';
         stroke_slider.style.left = show == 'left' ? (width * -1) + 'px' : (width * 1.5) + 'px';
         let range = show == 'left' ? d3.range(0, 1.1, .1) : d3.range(0, 1.1, .1).reverse();
         d3.selectAll('.stroke_slider').data(range).transition().duration(500).style('left', function(d) { return ((d * width * .5)) + "px"; });
      } else if (close) {
         stroke_slider.style.display = 'flex';
         let range = close == 'left' ? d3.range(-1.5, 1.1, .1) : d3.range(1, 2.6, .1).reverse();
         d3.selectAll('.stroke_slider').data(range).transition().duration(500).style('left', function(d) { return ((d * width * .5)) + "px"; });
      } else {
         stroke_slider.style.display = 'none';
      }
      return;


   }

   function setOrientation() {
      env.orientation = (window.innerHeight > window.innerWidth) ? 'portrait' : 'landscape';
      touchManager.orientation = env.orientation;
   }

   function orientationEvent () {
      setOrientation();
      vizUpdate();
      viewManager();
   }

   let changeDisplay = (display, id) => {
      var element = document.getElementById(id);
      if (element) { element.style.display = display; }
   }

   function viewManager(new_view = env.view, params) {
      // hide strokeslider any time view changes
      strokeSlider();
      changeDisplay('none', 'system');

      let views = {
         mainmenu({activate = true} = {}) {
            if (activate) {
               touchManager.prevent_touch = false;

               let match_archive = JSON.parse(BrowserStorage.get('match_archive') || '[]');
               document.getElementById('menu_match_archive').style.display = match_archive.length ? 'flex' : 'none';
               document.getElementById('menu_match_format').style.display = formatChangePossible() ? 'flex' : 'none';

               let points = match.history.points();
               document.getElementById('menu_change_server').style.display = points.length == 0 ? 'flex' : 'none';
               document.getElementById('footer_change_server').style.display = points.length == 0 ? 'inline' : 'none';
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
               let point_episodes = match.history.action('addPoint');
               charts.mc.width(window.innerWidth).height(820);
               charts.mc.data(point_episodes).update();
               charts.mc.update();
            }
         },
         gametree({activate = true} = {}) {
            changeDisplay(activate ? 'flex' : 'none', 'gametree');
            if (activate) {
               touchManager.prevent_touch = false;
               let point_episodes = match.history.action('addPoint');
               let noAd = match.format.settings().code.indexOf('n_') >= 0;
               charts.gametree.options({display: { noAd }});
               charts.gametree.data(point_episodes).update();
               charts.gametree.update({sizeToFit: true});
            }
         },
      }

      let view_keys = Object.keys(views);
      if (view_keys.indexOf(new_view) >= 0) {
         // disactivate all views that don't match the new_view
         view_keys.filter(view => view != new_view).forEach(view => views[view]({activate: false}));
         views[new_view]({activate: true, params});
         env.view = new_view;
         return new_view;
      }
   }

   function toggleChart(obj) {
      let element = document.getElementById(obj.id + '_chart');
      if (element) {
         let visible = element.style.display != 'none';
         element.style.display = visible ? 'none' : 'flex';
      }
   }

   // defunct... first pass at stats page... saved for posterity
   function statCounters() {
      let html = '';
      let stats = match.stats.counters();
      if (stats && stats.teams) {
         let left_stats = stats.teams[0] ? Object.keys(stats.teams[0]) : [];
         let right_stats = stats.teams[1] ? Object.keys(stats.teams[1]) : [];
         let stat_keys = [].concat(...left_stats, ...right_stats).filter((item, i, s) => s.lastIndexOf(item) == i).sort();
         stat_keys.forEach(key => {
            let left = stats.teams[0] && stats.teams[0][key] ? stats.teams[0][key].length : '0';
            let right = stats.teams[1] && stats.teams[1][key] ? stats.teams[1][key].length : '0';
            let row = `<div class='statrow' id="${key}" onClick="toggleChart(this)"><div class='statleft'>${left}</div>` + 
                      `<div class='statname'>${key}</div><div class='statright'>${right}</div></div>`;
            let table = `<div class='statrow' id="${key}_chart" style='display:none'><img src='icons/chart.png'></div>`;
            html += row + table;
         });
      }
      document.querySelector('#statlines').innerHTML = html;
   }

   function addCharts(charts) {
      let counters = match.stats.counters();
      let stripModifiers = (text) => text.match(/[A-Za-z0-9]/g).join('');
      if (!counters) return;
      charts.forEach(chart => {
         let player_points = [];
         Object.keys(counters.teams).forEach(key => {
            let team = counters.teams[key];
            let numerators = chart.numerators.split(',').map(numerator => stripModifiers(numerator));
            let episodes = [].concat(...numerators.map(numerator => team[numerator]))
            let points = episodes.map(episode => episode ? episode.point : undefined).filter(f=>f).sort((a, b) => a.index - b.index);
            player_points.push(points.map(point => point.index));
         });
         simpleChart(chart.target, player_points);
      });
   }

   function showChartSource(src) { console.log(src); }

   function updateStats(set_filter) {
      let html = '';
      let charts = [];
      let sets = match.sets().length;
      let statselectors = `<div class='s_set' onclick="updateStats()">Match</div>`;
      let stats = match.stats.calculated(set_filter);
      let stripModifiers = (text) => text.match(/[A-Za-z0-9_]/g).join('');
      if (stats && stats.length) {
         // generate & display match/set view selectors
         if (sets > 1) {
            for (let s=0; s < sets; s++) {
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
            let numerators = [].concat(...[left, right].map(value => value.numerators ? value.numerators : []))
               .filter((item, i, s) => s.lastIndexOf(item) == i).join(',');
            let value = [].concat(0, 0, ...[left, right].map(side => side.value ? side.value : [])).reduce((a, b) => a + b);
            let id = stripModifiers(stat.name.toLowerCase().split(' ').join('_'));
            let left_display = left.display;
            let right_display = right.display;

            let statclass = (numerators && value && stat.name != 'Aggressive Margin') ? 'statname_chart' : 'statname';

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
            let table = `<div class='statrow' id="${id}_chart" style='display:none' onclick="showChartSource('${numerators}')"></div>`;

            if (numerators && value && stat.name != 'Aggressive Margin') {
               charts.push({ target: `${id}_chart`, numerators });
               html += table;
            }
         });

         let counters = match.stats.counters(set_filter).teams;
         if (counters[0].Backhand || counters[0].Forehand || counters[1].Backhand || counters[1].Forehand) {
            html += `<div class='statsection flexcenter'>Finishing Shots - Strokes</div>`;
            ['Forehand', 'Backhand'].forEach(hand => {
               if (counters[0][hand] || counters[1][hand]) {
                  let left_display = counters[0][hand] ? counters[0][hand].length : 0;
                  let right_display = counters[1][hand] ? counters[1][hand].length : 0;
                  html += `<div class='statrow'><div class='statleft'><b>${left_display}</b></div>` + 
                            `<div class='statname'><b>Total ${hand} Shots</b></div><div class='statright'><b>${right_display}</b></div></div>`;
                  // get a list of unique results
                  let results = [].concat(...Object.keys(counters).map(key => {
                     return counters[key][hand] ? counters[key][hand].map(episode => episode.point.result).filter(f=>f) : []
                  })).filter((item, i, s) => s.lastIndexOf(item) == i);
                  results.forEach(result => {
                     let left_results = counters[0][hand] ? counters[0][hand].filter(f=>f.point.result == result) : [];
                     let right_results = counters[1][hand] ? counters[1][hand].filter(f=>f.point.result == result) : [];
                     if (left_results.length || right_results.length) {
                        html += `<div class='statrow'><div class='statleft'>${left_results.length}</div>` + 
                                  `<div class='statname'>${hand} ${result}s</div><div class='statright'>${right_results.length}</div></div>`;
                     }
                     // get a list of unique strokes
                     let strokes = [].concat(...Object.keys(counters).map(key => {
                        return counters[key][hand] ? counters[key][hand].map(episode => episode.point.stroke).filter(f=>f) : []
                     })).filter((item, i, s) => s.lastIndexOf(item) == i);
                     strokes.forEach(stroke => {
                        let left_results = counters[0][hand] ? counters[0][hand].filter(f=>f.point.result == result && f.point.stroke == stroke) : [];
                        let right_results = counters[1][hand] ? counters[1][hand].filter(f=>f.point.result == result && f.point.stroke == stroke) : [];
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
      let elements = Array.from(document.querySelectorAll(className));
      elements.forEach(element => element.style.display = display);
   }

   function updatePositions() {
      let left_side = env.swap_sides ? 1 : 0;
      let right_side = env.swap_sides ? 0 : 1;
      let server_side = env.swap_sides ? 1 - env.serving : env.serving;
      let receiver_side = env.swap_sides ? 1 - env.receiving : env.receiving;

      let entry_fields = Array.from(document.getElementsByClassName("player_entry"));
      entry_fields.forEach((element, index) => {
         let player = env.swap_sides ? 1 - index : index;
         if (!element.value.length) element.value = default_players[index];
         if (element.value.length > 20) {
            element.style.fontSize = '12px';
         } else {
            element.style.fontSize = '16px';
         }
         match.metadata.definePlayer({index, name: element.value});
      });

      updateMatchArchive();

      let display_position = Array.from(document.getElementsByClassName("position_display"));
      display_position[0].value = firstAndLast(entry_fields[left_side].value);
      display_position[1].value = firstAndLast(entry_fields[right_side].value);
      document.getElementById("playerone").innerHTML = firstAndLast(entry_fields[left_side].value);
      document.getElementById("playertwo").innerHTML = firstAndLast(entry_fields[right_side].value);

      // new way
      let display_player_0 = Array.from(document.querySelectorAll('.display_player_0'));
      display_player_0.forEach(element => element.innerHTML = entry_fields[left_side].value);
      let display_player_1 = Array.from(document.querySelectorAll('.display_player_1'));
      display_player_1.forEach(element => element.innerHTML = entry_fields[right_side].value);
   }

   function submitPlayerName(keypress) {
      if (keypress.keyCode == 13) {
         document.getElementById("blur").focus();
         updatePositions();
      } else if (keypress.keyCode == 9) {
         let target = keypress.target.id;
         if (target == 'player0') document.getElementById("player1").focus();
         if (target == 'player1') document.getElementById("blur").focus();
      }
   }

   function defineEntryEvents() {
      let entry_fields = Array.from(document.getElementsByClassName("player_entry"));
      let catchTab = (evt) => { if (evt.which == 9) { evt.preventDefault(); } }
      Array.from(entry_fields).forEach(entry => {
         entry.addEventListener('keyup', submitPlayerName, false)
         entry.onfocus = function() { 
            setTimeout(()=>{ this.setSelectionRange(0, this.value.length); } , 300);
         }
         entry.addEventListener('keydown', catchTab , false);
      });
   }

   function populateEntryFields(players) {
         let entry_fields = Array.from(document.getElementsByClassName("player_entry"));
         players.forEach((player, index) => {
            player.index = index;
            match.metadata.definePlayer(player)
            entry_fields[index].value = player.name;
         });
   }

   function changeTextColor(classes, value) {
      let objs = Array.from(document.querySelectorAll(classes));
      objs.forEach(obj => obj.style.color = value);
   }

   function classAction(obj, action, player, service) {
      let slider_side = player ? 'right' : 'left';
      if (env.swap_sides && ['server', 'receiver'].indexOf(player) < 0) player = 1 - player;
      resetStyles();

      function changeValue(classes, value) {
         let objs = Array.from(document.querySelectorAll(classes));
         objs.forEach(obj => obj.innerHTML = value);
      }

      function rallyMode() {
         env.rally_mode = true;
         Array.from(document.querySelectorAll('.modeforce')).forEach(div => div.style.display = 'flex');
         changeValue('.vs_action_button.winner', 'Winner');
         changeValue('.vs_action_button.fault', 'UFE');
         changeValue('.vs_mode_button', 'Base Line');
      }

      let actions = {
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
            let player_side = env.swap_sides ? 1 - player : player;
            changeValue(`.fault.display_${player_side}_serving`, 'Double Fault');
            changeValue(`.fault.modeerr_player${player_side}`, 'Double Fault');
            let server_side = env.swap_sides ? 1 - env.serving : env.serving;
            let server_mode = `.modeaction_player${server_side}`;
            Array.from(document.querySelectorAll(server_mode)).forEach(div => div.innerHTML = '2nd Serve')
            env.serve2nd = true;
         },
         doubleFault(point, player) { return player != env.serving ? undefined : { code: 'd'} },
         ace(point, player) { return player != env.serving ? undefined : env.serve2nd ? { code: 'a'} : { code: 'A'} },
         winner(point, player) { return { winner: player, result: 'Winner' }},
         unforced(point, player) { return { winner: 1 - player, result: 'Unforced Error' }},
         forced(point, player) { return { winner: 1 - player, result: 'Forced Error' }},
         point(point, player) { return { winner: player }},
         penalty(point, player) { return { winner: 1 - player, result: 'Penalty', code: player == env.serving ? 'P' : 'Q' }},

         modewin(point, player) {
            let action = obj.innerHTML;
            if (action == 'Ace') return actions.ace(point, player);
            if (action == 'Winner') return actions.winner(point, player);
         },
         modeerr(point, player) {
            let action = obj.innerHTML;
            if (action == 'Fault' || action == 'Double Fault') return actions.fault(point, player);
            if (action == 'UFE') return actions.unforced(point, player);
            if (action == 'Forced') return actions.forced(point, player);
         },
         modeaction(point, player) {
            let action = obj.innerHTML;
            if (['Serve', '2nd Serve', 'Return'].indexOf(action) >= 0) { rallyMode(); }
            if (action == 'Serve' || action == 'Return') { rallyMode(); }
            if (action == 'Net') { obj.innerHTML = 'Base Line'; }
            if (action == 'Base Line') { obj.innerHTML = 'Net'; }
         },
         rally() {
            let action = obj.innerHTML;
            env.rally = parseInt((action.match(/\d+/g) || ['0']).join(''));
            env.rally += 1;
            changeValue(`.rally`, `Rally: ${env.rally}`);
            if (env.rally == 1) rallyMode();
         }
      }

      let sound = document.getElementById("click");
      if (settings.audible_clicks) sound.play();
      if (obj.id) styleButton(obj.id);
      if (service && service == 'second_service') env.serve2nd = true;
      if (Object.keys(actions).indexOf(action) < 0) return undefined;
      let player_position = ['server', 'receiver'].indexOf(player);
      if (player_position >= 0) player = player_position ? env.receiving : env.serving;
      let point = env.serve2nd ? { first_serve: { error: 'Error', serves: [ '0e' ] } } : {};
      let result = actions[action](point, player);
      if (result) {
         checkStartTime();
         Object.assign(point, result);
         if (env.rally) point.rally = new Array(env.rally);
         let point_location = getPointLocation(point);
         if (point_location) point.location = point_location;
         let action = match.addPoint(point); 
         if (
               settings.track_shot_types && 
               action.result && 
               action.point.result && 
               ['Penalty', 'Ace','Double Fault'].indexOf(action.point.result) < 0
            ) {
               strokeSlider(slider_side);
            } else {
               checkMatchEnd(action);
            }
         env.rally = 0;
         env.undone = [];
         updateState();
      } else {
         checkMatchEnd();
      }
      visibleButtons();
   }

   function checkMatchEnd(action) {
      if (match.complete()) {
         let winner = match.metadata.players()[match.winner()].name;
         showModal(`Match Complete!<br>Winner: ${winner}`);
         BrowserStorage.remove('current_match');
      } else if (action && action.game.complete && settings.display_gamefish) {
         showGameFish();
      }
   }

   function strokeAction(hand, stroke, side) {
      if (hand && stroke) {
         let last_point = match.history.lastPoint();
         match.decoratePoint(last_point, { hand, stroke });
         let side = document.getElementById('slideleft').style.display == 'flex' ? 'right' : 'left';
      }
      strokeSlider(false, side);
      let point_episodes = match.history.action('addPoint');
      checkMatchEnd(point_episodes[point_episodes.length - 1]);
   }

   function checkStartTime() {
      let points = match.history.points();
      if (points.length == 0) {
         // remove old start time
         let match_id = match.metadata.defineMatch().date;
         BrowserStorage.remove(match_id);

         // define new start time
         let date = new Date();
         match.metadata.defineMatch({date: date.valueOf()});
         BrowserStorage.set('current_match', date.valueOf());
      }
   }

   // this is a crude beginning for this sort of logic...
   function getPointLocation(point) {
      let p0location = document.querySelectorAll('.modeaction_player0');
      let p1location = document.querySelectorAll('.modeaction_player1');
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

   function updateMatchArchive() {
      let points = match.history.points();

      let match_id = match.metadata.defineMatch().date;
      if (!match_id) return;

      // add key for current match
      // key is date of match which is uts timestamp of first point
      let match_archive = JSON.parse(BrowserStorage.get('match_archive') || '[]');

      if (match_archive.indexOf(match_id) < 0) {
         match_archive.push(match_id);
         BrowserStorage.set('match_archive', JSON.stringify(match_archive));
      }

      let match_object = {
         ch_version: ch_version,
         players: match.metadata.players(),
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
      let actions = {
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
               resetButtons();
            } else {
               let undo = match.undo();
               if (undo) env.undone.push(undo);
            }
            visibleButtons();
         },
         redo() { 
            if (!env.undone.length) return;
            match.addPoint(env.undone.pop());
         },
         swap() { 
            options.user_swap = !options.user_swap;
            setCourtSide();
         },
         settings() { viewManager('settings'); },
         newMatch() { newMatch(); },
         horizontalview() {
            options.horizontal_view = (options.horizontal_view == 'hblack') ? 'hwhite' : 'hblack';
            BrowserStorage.set('horizontal_view', options.horizontal_view);
            viewManager('entry');
         },
         verticalview() {
            options.vertical_view = (options.vertical_view == 'vblack') ? 'vwhite' : 'vblack';
            BrowserStorage.set('vertical_view', options.vertical_view);
            viewManager('entry');
         },
      }
      if (Object.keys(actions).indexOf(action) < 0) return undefined;
      let result = actions[action]();
   }

   function setCourtSide() { 
      env.swap_sides = env.match_swap;
      if (options.user_swap) env.swap_sides = !env.swap_sides;
      stateChangeEvent();
      swapServer();
   }

   function defineActionEvents() {
      match.events.addPoint(stateChangeEvent);
      match.events.undo(stateChangeEvent);
      match.events.reset(resetEvent);
   }

   function clearActionEvents() { match.events.clearEvents(); }

   function init() {
      let clipboard = new Clipboard('.c2c');
      clipboard.on('success', function(e) { closeModal(); });

      restoreSettings();
      defineEntryEvents();
      defineActionEvents();
      touchManager.addSwipeTarget(document.getElementById('mainmenu'));

      // populate drop down list box selectors
      let select_seed = Array.from(document.querySelectorAll(".md_seed"));
      select_seed.forEach(select => { [...Array(32).keys()].forEach(i => select.options[i + 1] = new Option(i + 1, i + 1)); });
      let select_draw_position = Array.from(document.querySelectorAll(".md_draw_position"));
      select_draw_position.forEach(select => { [...Array(128).keys()].forEach(i => select.options[i + 1] = new Option(i + 1, i + 1)); });
      d3.json('./assets/ioc_codes.json', function(data) { 
         let select_ioc = Array.from(document.querySelectorAll(".md_ioc"));
         select_ioc.forEach(select => {
            data.forEach((entry, index) => select.options[index + 1] = new Option(entry.name, entry.ioc));
         });
         // load Details to be sure that ioc data can be used to populate country
         loadDetails();
      });

      loadCurrent();
      setOrientation();
      configureViz();
      vizUpdate();
      viewManager();
   }

   function newGame() {
      let common_pointsAdded = match.history.action('addPoint');
      let last_point = common_pointsAdded[common.pointsAdded.length - 1];
      let total_games = [].concat(...match.score().components.sets.map(s => s.games));
      let current_points = match.score().counters.points.reduce((a, b) => a + b);
      let tiebreak_side = Math.floor(current_points / 6) % 2;
   }

   function groupGames() {
      let point_episodes = match.history.action('addPoint');
      let games = [{ points: [] }];
      let game_counter = 0;
      let current_game = 0;
      point_episodes.forEach(episode => {
         let point = episode.point;
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
      });
      return games;
      if (set != undefined) games = games.filter(function(game) { return game.set == set });
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

   function closeViz() { viewManager('entry'); }

   function vizUpdate() {
      let direction = env.orientation == 'landscape' ? 'horizontal' : 'vertical';

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

      let players = match.metadata.players();
      charts.gametree.options({ 
         labels: { 
            Player: players[0].name, 
            Opponent: players[1].name,
         },
      });
      charts.gametree.update({sizeToFit: true});
   }

   function modalInfo() {
      let modaltext = `
         <p><b>CourtHive</b> version <a id="version" target="_blank" href="https://github.com/TennisVisuals/universal-match-object/tree/master/examples/CourtHive">${ch_version}</a></p>
         <p>An 
            <a target="_blank" href="https://github.com/TennisVisuals/universal-match-object/tree/master/examples/CourtHive">Open Source</a> project developed by 
            <a target="_blank" href="http://TennisVisuals.com">TennisVisuals</a>
         </p>
         <p><a href="mailto:info@tennisvisuals.com?subject=CourtHive">Feedback Welcome!</a></p>
      `;
      showModal(modaltext);
   }
