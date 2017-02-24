/* TODO
 *
 * Identify Server on Horizontal View
 * Skin Manager for multiple horizontal/vertical views
 *
 * Tab from first entry field to second
 *
 * Add GPS location detection -- use to auto-populate Country
 *
 * Limit Tournament Round by Draw Size
 * Limit Draw Position by Draw Size
 *
 * Add Date Validation... default to today's date if empty
 * Add Venue, City, Country, gps to Tournament?
 *
 */

   var match = umo.Match();

   var toggles = {};
   var view = 'entry';
   var serve2nd = false;
   var rally = 0;
   var highlight_better_stats = true;
   var serving = match.nextTeamServing();
   var receiving = match.nextTeamReceiving();
   var default_players = ['Player One', 'Player Two'];
   var undone = [];
   var vertical_view = BrowserStorage.get('vertical_view', vertical_view) || 'vblack';
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
         if (confirm('A new version of Match Tracker is available. Load it?')) { window.location.reload(); }
       }
     }, false);
   }, false);

   window.addEventListener("orientationchange", function() { viewManager(); }, false);
   window.addEventListener("resize", function() { viewManager(); }, false);

   function closeModal() { document.getElementById('modal').style.display = "none"; }

   function showModal(text) {
      document.getElementById('modaltext').innerHTML = text;
      document.getElementById('modal').style.display = "inline";
   }

   touchManager.swipeLeft = (element) => {
      if (element && element.id) {
         let action_delete = document.getElementById(element.id + '_delete').style.display;
         let action_export = document.getElementById(element.id + '_export').style.display;
         if (action_export == 'flex') {
            document.getElementById(element.id + '_export').style.display = 'none';
         } else if (action_delete == 'none') {
            document.getElementById(element.id + '_delete').style.display = 'flex';
         }
      }
   }

   touchManager.swipeRight = (element) => {
      if (element && element.id) {
         let action_delete = document.getElementById(element.id + '_delete').style.display;
         let action_export = document.getElementById(element.id + '_export').style.display;
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
      Array.from(document.querySelectorAll('.fault')).forEach(div => div.innerHTML = 'Fault');

      let server_mode = `.modeaction_player${serving}`;
      Array.from(document.querySelectorAll(server_mode)).forEach(div => div.innerHTML = 'Serve')

      let server_fault = `.modeerr_player${serving}`;
      Array.from(document.querySelectorAll(server_fault)).forEach(div => div.innerHTML = 'Fault')
      let server_ace = `.modewin_player${serving}`;
      Array.from(document.querySelectorAll(server_ace)).forEach(div => div.innerHTML = 'Ace')

      let receiver_mode = `.modeaction_player${receiving}`;
      Array.from(document.querySelectorAll(receiver_mode)).forEach(div => div.innerHTML = 'Return')

      let receiver_ufe = `.modeerr_player${receiving}`;
      Array.from(document.querySelectorAll(receiver_ufe)).forEach(div => div.innerHTML = 'UFE')
      let receiver_winner = `.modewin_player${receiving}`;
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
            serve2nd = id == 'second_serve' ? true : false;
            button.style.backgroundColor = buttons[id].color;
            button.style.color = 'white';
         } else {
            serve2nd = false;
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

      // old way
      let point_fields = Array.from(document.getElementsByClassName("points"));
      point_fields.forEach((field, index) => field.value = points[index]);

      // new way
      let display_point_0 = Array.from(document.querySelectorAll('.display_points_0'));
      display_point_0.forEach(element => element.innerHTML = points[0]);
      let display_point_1 = Array.from(document.querySelectorAll('.display_points_1'));
      display_point_1.forEach(element => element.innerHTML = points[1]);

      let display_game_0 = Array.from(document.querySelectorAll('.display_games_0'));
      display_game_0.forEach(element => element.innerHTML = games_counter[0]);
      let display_game_1 = Array.from(document.querySelectorAll('.display_games_1'));
      display_game_1.forEach(element => element.innerHTML = games_counter[1]);

      let display_set_0 = Array.from(document.querySelectorAll('.display_sets_0'));
      display_set_0.forEach(element => element.innerHTML = sets_counter[0]);
      let display_set_1 = Array.from(document.querySelectorAll('.display_sets_1'));
      display_set_1.forEach(element => element.innerHTML = sets_counter[1]);

      let sets = score.components.sets;
      [0, 1, 2].forEach((set, index) => {
         if (!sets || (sets && !sets[index])) {
            // old way
            let set_fields = Array.from(document.getElementsByClassName("games" + index));
            set_fields.forEach(field => field.value = '-');
            // new way
            let player0_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_0'));
            player0_games.forEach(field => field.innerHTML = '-');
            let player1_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_1'));
            player1_games.forEach(field => field.innerHTML = '-');
         }
      });

      if (!sets) return;

      sets.forEach((set, index) => {
         // old way
         let set_fields = Array.from(document.getElementsByClassName("games" + index));
         set_fields.forEach((field, index) => field.value = set.games[index]);
         // new way
         let player0_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_0'));
         player0_games.forEach(field => field.innerHTML = set.games[0]);
         let player1_games = Array.from(document.getElementsByClassName('display_set_' + index + '_games_1'));
         player1_games.forEach(field => field.innerHTML = set.games[1]);
      });
   }

   function swapServer() {
      serving = match.nextTeamServing();
      receiving = match.nextTeamReceiving();

      let div = document.getElementById(serving ? 'player_receiving' : 'player_serving');
      div.parentNode.insertBefore(div, document.getElementById('team_two'));
      div = document.getElementById(serving ? 'player_serving' : 'player_receiving');
      div.parentNode.insertBefore(div, document.getElementById('entry_end'));

      changeTextColor(`.indicate_serve.display_player_${serving}`, 'yellow');
      changeTextColor(`.indicate_serve.display_player_${receiving}`, 'white');

      document.getElementById("team_one_role").innerHTML = serving ? 'Receiving:' : 'Serving:';
      document.getElementById("team_two_role").innerHTML = serving ? 'Serving:' : 'Receiving:';

      if (serving) {
         changeClassDisplay('.display_0_serving', 'none');
         changeClassDisplay('.display_1_serving', 'flex');
      } else {
         changeClassDisplay('.display_0_serving', 'flex');
         changeClassDisplay('.display_1_serving', 'none');
      }

      let point_fields = Array.from(document.getElementsByClassName("points"));
      point_fields.forEach((field, index) => field.style.backgroundColor = index == serving ? '#FBF781' : '#D1FBFB');
      resetButtons();
   }

   function updateState() {
      if (match.nextTeamServing() != serving) setTimeout(()=>swapServer() , 400);
      resetButtons();
      updatePositions();
   }

   function stateChangeEvent() {
      let date = new Date();
      let match_id = match.metadata.defineMatch().date;
      let points = match.history.points();
      document.getElementById('menu_change_server').style.display = points.length == 0 ? 'flex' : 'none';
      document.getElementById('footer_change_server').style.display = points.length == 0 ? 'inline' : 'none';
      if (points.length == 1 && !match_id) {
         match.metadata.defineMatch({date: date.valueOf()});
         BrowserStorage.set('current_match', date.valueOf());
      } else if (points.length == 0) {
         if (match_id) BrowserStorage.remove(match_id);
      }
      updateMatchArchive();
      serve2nd = false;
      updateState();
      updateScore();
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

      serve2nd = false;
      serving = match.nextTeamServing();
      receiving = match.nextTeamReceiving();
      undone = [];
      rally = 0;

      resetStyles();
      resetPlayers();
      /*
      resetButtons();
      swapServer();
      */
      stateChangeEvent();
   }

   function firstAndLast(value) {
      let parts = value.split(" ");
      let display = parts[0];
      if (parts.length > 1) display += " " + parts[parts.length - 1];
      return display;
   }

   function historyEntry(match_data) {
      let match_id = match_data.match.date;
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
         <div id='match_${match_id}_export' class='flexcols flexcenter mh_export' style='display: none;' onclick="exportMatch('${match_id}')">
            <div class='mh_fullheight'> <img class='mh_action' src='./icons/export.png'> </div>
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

   function formatEntry(format) {
      ({name, description} = umo.formats().matches[format]);
      name = name || '';
      let html = `
      <div class='flexleft mf_format'>
         <div class='flexcols' onclick="changeFormat('${format}')">
            <div class='mf_name'> <div><b>${name}</b></div> </div>
            <div class='mf_description'> <div>${description}</div> </div>
         </div>
      </div>`
      return html;
   }

   function newMatch() {
      match.reset();
      loadDetails();
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

   function displayMatchArchive() {
      let html = '';
      let match_archive = JSON.parse(BrowserStorage.get('match_archive') || '[]');
      if (!match_archive.length) {
         match.reset();
         viewManager('entry');
         return;
      }
      match_archive.forEach(match_id => {
         let match_data = JSON.parse(BrowserStorage.get(match_id));
         if (match_data) {
            html += historyEntry(match_data);
         } else {
            deleteMatch(match_id);
         }
      });
      document.getElementById('matcharchive').innerHTML = html;
      let elements = Array.from(document.querySelectorAll('.swipe'));
      Array.from(elements).forEach(element => touchManager.addSwipeTarget(element));
      return match_archive;
   }

   function changeFormat(format) {
      match.format.type(format);
      let format_name = match.format.settings().name;
      document.getElementById('md_format').innerHTML = format_name;
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
      if (match_data.match) match.metadata.defineMatch(match_data.match);
      if (match_data.tournament) match.metadata.defineTournament(match_data.tournament);
      match.set.perspectiveScore(false);
      if (match_data.format) {
         match.format.settings(match_data.format);
         document.getElementById('md_format').innerHTML = match_data.format.name;
      }
      match_data.points.forEach(point => match.addPoint(point));
      match.metadata.timestamps(true);

      if (match_data.players) populateEntryFields(match_data.players);
      updatePositions();
      updateScore();

      loadDetails();
      viewManager('entry');
      BrowserStorage.set('current_match', match_id);
   }

   function loadCurrent() {
      let current_match_id = BrowserStorage.get('current_match');
      loadMatch(current_match_id);
      swapServer();
      resetButtons();
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

   function viewManager(new_view = view) {
      let orientation = (window.innerHeight > window.innerWidth) ? 'portrait' : 'landscape';
      touchManager.orientation = orientation;

      let changeDisplay = (display, id) => {
         var element = document.getElementById(id);
         if (element) { element.style.display = display; }
      }

      let views = {
         mainmenu(activate = true) {
            if (activate) {
               touchManager.prevent_touch = false;
               let match_archive = JSON.parse(BrowserStorage.get('match_archive') || '[]');
               document.getElementById('menu_match_archive').style.display = match_archive.length ? 'flex' : 'none';
               document.getElementById('menu_match_format').style.display = formatChangePossible() ? 'flex' : 'none';
            }
            changeDisplay(activate ? 'flex' : 'none', 'mainmenu');
         },
         matcharchive(activate = true) {
            if (activate) {
               touchManager.prevent_touch = false;
               displayMatchArchive();
            }
            changeDisplay(activate ? 'flex' : 'none', 'matcharchive');
         },
         matchformat(activate = true) {
            displayFormats();
            changeDisplay(activate ? 'flex' : 'none', 'matchformats');
         },
         matchdetails(activate = true) {
            changeDisplay(activate ? 'flex' : 'none', 'matchdetails');
         },
         entry(activate = true) {
            if (activate) touchManager.prevent_touch = true;
            changeDisplay(activate && orientation == 'landscape' ? 'flex' : 'none', 'horizontalentry');
            changeDisplay(activate && orientation == 'portrait' ? 'flex' : 'none', vertical_view);
            changeDisplay(activate && orientation == 'portrait' ? 'flex' : 'none', 'toolbar');
         },
         stats(activate = true) {
            changeDisplay(activate ? 'flex' : 'none', 'statsscreen');
            if (activate) {
               touchManager.prevent_touch = false;
               updateStats();
            }
         },
      }

      let view_keys = Object.keys(views);
      if (view_keys.indexOf(new_view) >= 0) {
         // disactivate all views that don't match the new_view
         view_keys.filter(view => view != new_view).forEach(view => views[view](false));
         views[new_view]();
         view = new_view;
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

   function calcStats() {
      let html = '';
      let charts = [];
      let stats = match.stats.calculated();
      let stripModifiers = (text) => text.match(/[A-Za-z0-9_]/g).join('');
      if (stats && stats.length) {
         stats.forEach(stat => {
            ([left, right] = stat.team_stats);
            let numerators = [].concat(...[left, right].map(value => value.numerators ? value.numerators : []))
               .filter((item, i, s) => s.lastIndexOf(item) == i).join(',');
            let value = [].concat(0, 0, ...[left, right].map(side => side.value ? side.value : [])).reduce((a, b) => a + b);
            let id = stripModifiers(stat.name.toLowerCase().split(' ').join('_'));
            let left_display = left.display;
            let right_display = right.display;
            let statclass = (numerators && value) ? 'statname_chart' : 'statname';
            if (highlight_better_stats) {
               if (left.value > right.value) left_display = `<b>${left_display}</b>`;
               if (right.value > left.value) right_display = `<b>${right_display}</b>`;
            }
            html += `<div class='statrow' id="${id}" onClick="toggleChart(this)"><div class='statleft'>${left_display}</div>` + 
                      `<div class='${statclass}'>${stat.name}</div><div class='statright'>${right_display}</div></div>`;
            let table = `<div class='statrow' id="${id}_chart" style='display:none' onclick="showChartSource('${numerators}')"></div>`;
            if (numerators && value) {
               charts.push({ target: `${id}_chart`, numerators });
               html += table;
            }
         });
      }
      document.querySelector('#statlines').innerHTML = html;
      addCharts(charts);
   }

   function updateStats() {
      // statCounters();
      calcStats();
   }

   function changeServer() {
      if (!match.history.points().length) {
         match.set.firstService(1 - serving);
         updateState();
      }
   }

   function changeClassDisplay(className, display) {
      let elements = Array.from(document.querySelectorAll(className));
      elements.forEach(element => element.style.display = display);
   }

   function updatePositions() {
      let entry_fields = Array.from(document.getElementsByClassName("player_entry"));
      entry_fields.forEach((element, index) => {
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
      display_position[0].value = firstAndLast(entry_fields[0].value);
      display_position[1].value = firstAndLast(entry_fields[1].value);
      document.getElementById("playerone").innerHTML = entry_fields[0].value;
      document.getElementById("playertwo").innerHTML = entry_fields[1].value;

      // new way
      let display_player_0 = Array.from(document.querySelectorAll('.display_player_0'));
      display_player_0.forEach(element => element.innerHTML = entry_fields[0].value);
      let display_player_1 = Array.from(document.querySelectorAll('.display_player_1'));
      display_player_1.forEach(element => element.innerHTML = entry_fields[1].value);
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

   function entryEvents() {
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
      resetStyles();

      function changeValue(classes, value) {
         let objs = Array.from(document.querySelectorAll(classes));
         objs.forEach(obj => obj.innerHTML = value);
      }

      function rallyMode() {
         Array.from(document.querySelectorAll('.modeforce')).forEach(div => div.style.display = 'flex');
         changeValue('.vs_action_button.winner', 'Winner');
         changeValue('.vs_action_button.fault', 'UFE');
         changeValue('.vs_mode_button', 'Base Line');
      }

      let actions = {
         firstServe() { serve2nd = false; },
         secondServe() { 
            serve2nd = toggles.serve2nd ? false : true;
            toggles.serve2nd = !toggles.serve2nd;
         },
         fault(point, player) { 
            if (player != serving) return undefined;
            if (serve2nd) return { code: 'D'};
            changeValue(`.fault.display_${player}_serving`, 'Double Fault');
            changeValue(`.fault.modeerr_player${player}`, 'Double Fault');
            let server_mode = `.modeaction_player${serving}`;
            Array.from(document.querySelectorAll(server_mode)).forEach(div => div.innerHTML = '2nd Serve')
            serve2nd = true;
         },
         doubleFault(point, player) { return player != serving ? undefined : { code: 'd'} },
         ace(point, player) { return player != serving ? undefined : serve2nd ? { code: 'a'} : { code: 'A'} },
         winner(point, player) { return { winner: player, result: 'Winner' }},
         unforced(point, player) { return { winner: 1 - player, result: 'Unforced Error' }},
         forced(point, player) { return { winner: 1 - player, result: 'Forced Error' }},
         point(point, player) { return { winner: player }},
         penalty(point, player) { return { winner: 1 - player, result: 'Penalty', code: player == serving ? 'P' : 'Q' }},

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
            rally = parseInt((action.match(/\d+/g) || ['0']).join(''));
            rally += 1;
            changeValue(`.rally`, `Rally: ${rally}`);
            if (rally == 1) rallyMode();
         }
      }

      if (obj.id) styleButton(obj.id);
      if (service && service == 'second_service') serve2nd = true;
      if (Object.keys(actions).indexOf(action) < 0) return undefined;
      let player_position = ['server', 'receiver'].indexOf(player);
      if (player_position >= 0) player = player_position ? receiving : serving;
      let point = serve2nd ? { first_serve: { error: 'Error', serves: [ '0e' ] } } : {};
      let result = actions[action](point, player);
      if (result) {
         Object.assign(point, result);
         if (rally) point.rally = new Array(rally);
         match.addPoint(point); 
         rally = 0;
         undone = [];
         updateState();
      }
      if (match.complete()) {
         let winner = match.metadata.players()[match.winner()].name;
         showModal(`Match Complete!<br>Winner: ${winner}`);
      }
   }

   function updateMatchArchive() {
      let points = match.history.points();
      if (!points.length) return;

      // add key for current match
      // key is date of match which is uts timestamp of first point
      let match_archive = JSON.parse(BrowserStorage.get('match_archive') || '[]');
      let match_id = match.metadata.defineMatch().date;

      if (match_archive.indexOf(match_id) < 0) {
         match_archive.push(match_id);
         BrowserStorage.set('match_archive', JSON.stringify(match_archive));
      }

      let match_object = {
         players: match.metadata.players(),
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
         menu() { },
         history() { },
         changeServer() { 
            if (!match.history.points().length) {
               match.set.firstService(1 - serving);
               updateState();
               view = viewManager('entry');
            }
         },
         undo() { 
            let undo = match.undo();
            if (undo) undone.push(undo);
         },
         redo() { 
            if (!undone.length) return;
            match.addPoint(undone.pop());
         },
         info() { },
         stats() { view = viewManager('stats'); },
         newMatch() { newMatch(); },
         verticalview() {
            vertical_view = (vertical_view == 'vblack') ? 'vwhite' : 'vblack';
            BrowserStorage.set('vertical_view', vertical_view);
            view = viewManager('entry');
         },
      }
      if (Object.keys(actions).indexOf(action) < 0) return undefined;
      let result = actions[action]();
   }

   function init() {
      match.events.addPoint(stateChangeEvent);
      match.events.undo(stateChangeEvent);
      match.events.reset(resetEvent);

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
      entryEvents();
      viewManager();
   }

