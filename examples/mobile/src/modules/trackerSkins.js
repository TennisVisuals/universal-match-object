import { theme } from './theme';

export const trackerSkins = function() {
   var fx = {};
   var skins = {};
   var sliders = {};
   var elements = {};

   fx.elements = (el) => { elements = el; return fx; }
   fx.set = (skin) => {
      elements.tracker.innerHTML = skins[skin];
      fx.show();
   }
   fx.show = () => {
      theme.showChild(document.getElementById('container'), document.getElementById('tracker'), 'black');
   }

   skins.vblack = `
      <div id='vblack' class='noselect'>
         <div class='vs_players ch_flexrows'>
            <div class='vs_player ch_flexcenter indicate_serve display_player_0 editPlayer'>Player One</div>
            <div class='vs_swap ch_flexcenter swapPlayerSides'> <div class='swapimage action_image swapPlayerSides'></div> </div>
            <div class='vs_player ch_flexcenter indicate_serve display_player_1 editPlayer'>Player Two</div>
         </div>
         <div class='vs_center ch_flexrows'>
            <div class='vs_components ch_flexols'>
               <div class='vs_label ch_flexcenter'>Sets</div>
               <div class='vs_label ch_flexcenter'>Games</div>
               <div class='vs_label ch_flexcenter'>Points</div>
            </div>
            <div class='vs_player_score ch_flexols'>
               <div class='vs_value ch_flexcenter display_sets_0'>0</div>
               <div class='vs_value ch_flexcenter display_games_0'>0</div>
               <div class='vs_value value_border ch_flexcenter display_points_0 addGamePoint'>0</div>
            </div>
            <div class='vs_player_score ch_flexols'>
               <div class='vs_value ch_flexcenter display_sets_1'>0</div>
               <div class='vs_value ch_flexcenter display_games_1'>0</div>
               <div class='vs_value value_border ch_flexcenter display_points_1 addGamePoint'>0</div>
            </div>
            <div class='vs_filler'></div>
            <div class='vs_menuaction ch_flexcols'>
               <div class='vs_mode_action ch_flexcenter'>
                  <div class='view_stats iconstats action_icon viewMatchStats' style='display: none'></div>
                  <div class='change_server iconchange action_icon changeServer'></div>
               </div>
               <div class='vs_mode_action ch_flexcenter'>
                  <div class='iconmenu action_icon viewTrackerMenu'></div>
               </div>
               <div class='vs_mode_action ch_flexcenter'>
                  <div class='view_history iconhistory action_icon viewPointHistory' style='display: none'></div>
                  <div class='view_archive iconarchive action_icon viewMatchArchive'></div>
                  <div class='view_settings iconsettings action_icon viewTrackerSettings'></div>
               </div>
            </div>
         </div>
         <div class='vs_entry ch_flexrows'>
            <div class='vs_player_actions'>
               <div class='vs_action_area ch_flexrows'>
                  <div class='vs_action_buttons ch_flexcenter'>
                     <div class='vs_action_button winner modewin_player0 ch_flexcenter assignWinner'>Ace</div> 
                     <div class='vs_action_button forced modeforce_player0 ch_flexcenter assignForce'>Let</div> 
                     <div class='vs_action_button fault modeerr_player0 ch_flexcenter assignError'>Fault</div> 
                  </div>
                  <div class='vs_mode_buttons ch_flexcols ch_flexcenter'>
                     <div class='vs_mode_action ch_flexcenter'>
                        <div class='redo iconredo action_icon redoAction' style='display: none'></div>
                     </div>
                     <div class='vs_mode_button modeaction_player0 ch_flexcenter modeAction'>Serve</div>
                  </div>
               </div>
            </div>
            <div class='vs_player_actions'>
               <div class='vs_action_area ch_flexrows'>
                  <div class='vs_mode_buttons ch_flexcols ch_flexcenter'>
                     <div class='vs_mode_action ch_flexcenter'>
                        <div class='undo iconundo action_icon undoAction' style='display: none'></div>
                     </div>
                     <div class='vs_mode_button modeaction_player1 ch_flexcenter modeAction'>Return</div>
                  </div>
                  <div class='vs_action_buttons ch_flexcenter'>
                     <div class='vs_action_button winner modewin_player1 ch_flexcenter assignWinner'>Winner</div> 
                     <div class='vs_action_button forced modeforce_player1 ch_flexcenter assignForce'>Forced</div> 
                     <div class='vs_action_button fault modeerr_player1 ch_flexcenter assignError'>UFE</div> 
                  </div>
               </div>
            </div>
         </div>
         <div class='vs_status ch_flexrows'>
            <div class='vs_status_message ch_flexcenter'>
               <div class='status_message'></div>
            </div>
         </div>
         <div class='footer vs_rally'>
            <div class='vs_rallybar rally ch_flexcenter pressAndHold rallyCount'>Rally</div>
         </div>
      </div>
   `;

   skins.hblack = `
      <div id="hblack" class='noselect'>
         <div id='h_scoreboard' class='ch_flexrows'>
            <div id='h_playernames' class='ch_flexcols'>
               <div class='h_playername ch_flexcenter indicate_serve display_player_0 editPlayer'> Player One</div>
               <div class='h_playername ch_flexcenter indicate_serve display_player_1 editPlayer'> Player Two </div>
            </div>
            <div class='h_swap ch_flexcenter swapPlayerSides'> <div class='swapimage action_image swapPlayerSides'></div> </div>
            <div class='h_scores'>
               <div class='h_setscore ch_flexcols'>
                  <div class='ch_flexcenter h_score'><div class='display_set_0_games_0'> - </div></div>
                  <div class='ch_flexcenter h_score'><div class='display_set_0_games_1'> - </div></div>
               </div>
               <div class='h_setscore ch_flexcols'>
                  <div class='ch_flexcenter h_score'><div class='display_set_1_games_0'> - </div></div>
                  <div class='ch_flexcenter h_score'><div class='display_set_1_games_1'> - </div></div>
               </div>
               <div class='h_setscore ch_flexcols'>
                  <div class='ch_flexcenter h_score'><div class='display_set_2_games_0'> - </div></div>
                  <div class='ch_flexcenter h_score'><div class='display_set_2_games_1'> - </div></div>
               </div>
               <div class='h_setscore ch_flexcols'>
                  <div class='ch_flexcenter h_score'><div class='display_set_3_games_0'>   </div></div>
                  <div class='ch_flexcenter h_score'><div class='display_set_3_games_1'>   </div></div>
               </div>
               <div class='h_setscore ch_flexcols'>
                  <div class='ch_flexcenter h_score'><div class='display_set_4_games_0'>   </div></div>
                  <div class='ch_flexcenter h_score'><div class='display_set_4_games_1'>   </div></div>
               </div>
            </div>
         </div>
         <div id='h_timer' class='ch_flexrows'>
            <div class='h_playerside flexjustifystart'>
               <div id='h_playerleft' class='indicate_serve display_player_0 editPlayer'>Player One</div>
            </div>
            <div class='h_datetime'> &nbsp; </div>
            <div class='h_datetime'> &nbsp; </div>
            <div class='h_playerside flexjustifyend'>
               <div id='h_playerright' class='indicate_serve display_player_1 editPlayer'>Player Two</div> 
            </div>
         </div>
         <div id='h_entry' class='ch_flexrows'>
            <div id='h_left' class='ch_flexcols h_borderright'>
               <div class='h_action'>
                  <div class='h_button fault display_0_serving assignError'>Fault</div>
                  <div class="ch_flexcenter display_1_serving" style="height: 100%">
                     <div class='view_stats iconstats action_icon_large viewMatchStats'></div>
                     <div class='change_server iconchange action_icon_large changeServer'></div>
                  </div>
               </div>
               <div class='h_action'>
                  <div class='h_button winner assignWinner'>Winner</div>
               </div>
               <div class='h_action'>
                  <div class='h_button unforced assignError'>Unforced Error</div>
               </div>
               <div class='h_action'>
                  <div class='h_button forced assignForce'>Forced Error</div>
               </div>
            </div>
            <div id='h_center' class='ch_flexcols'>
               <div id='h_extras' class='ch_flexrows'>
                  <div class='h_serviceaction'>
                     <div class='h_button winner display_0_serving assignWinner'>Ace</div>
                     <div class="ch_flexcenter display_1_serving" style="height: 100%">
                        <div class='view_history iconhistory action_icon_large viewPointHistory'></div>
                        <div class='view_archive iconarchive action_icon_large viewMatchArchive'></div>
                     </div>
                  </div>
                  <div class='h_message ch_flexcenter'>
                     <div class='h_messagetext status_message'> &nbsp; </div>
                  </div>
                  <div class='h_serviceaction'>
                     <div class='h_button winner display_1_serving assignWinner'>Ace</div>
                     <div class="ch_flexcenter display_0_serving" style="height: 100%">
                        <div class='view_history iconhistory action_icon_large viewPointHistory'></div>
                        <div class='view_archive iconarchive action_icon_large viewMatchArchive'></div>
                     </div>
                  </div>
               </div>
               <div id='h_points' class='ch_flexrows'>
                  <div class='h_point ch_flexcenter h_borderright addGamePoint'>
                     <div class='display_points_0 addGamePoint'>0</div>
                  </div>
                  <div class='h_point ch_flexcenter h_borderleft addGamePoint'>
                     <div class='display_points_1 addGamePoint'>0</div>
                  </div>
               </div>
            </div>
            <div id='h_right' class='ch_flexcols h_borderleft'>
               <div class='h_action'>
                  <div class='h_button fault display_1_serving assignError'>Fault</div>
                  <div class="ch_flexcenter display_0_serving" style="height: 100%">
                     <div class='view_stats iconstats action_icon_large viewMatchStats'></div>
                     <div class='change_server iconchange action_icon_large changeServer'></div>
                  </div>
               </div>
               <div class='h_action'>
                  <div class='h_button winner assignWinner'>Winner</div>
               </div>
               <div class='h_action'>
                  <div class='h_button unforced assignError'>Unforced Error</div>
               </div>
               <div class='h_action'>
                  <div class='h_button forced assignForce'>Forced Error</div>
               </div>
            </div>
         </div>
         <div id='h_menu' class='ch_flexrows'>
            <div class='h_menuitem ch_flexcenter viewTrackerMenu'>
               <div class='iconmenu action_icon_large viewTrackerMenu'></div>
            </div>
            <div class='h_menuitem ch_flexcenter viewTrackerSettings'>
               <div class='iconsettings action_icon_large viewTrackerSettings'></div>
            </div>
            <div class='h_menuitem ch_flexcenter penalty_player_0 assignPenalty'>
               <div class='h_button penalty_player_0 assignPenalty'>Penalty</div>
            </div>
            <div class='h_menuitem ch_flexcenter'>
               <div class='redo iconredo action_icon_large redoAction'></div>
            </div>
            <div class='h_menuitem ch_flexcenter'>
               <div class='undo iconundo action_icon_large undoAction'></div>
            </div>
            <div class='h_menuitem ch_flexcenter penalty_player_1 assignPenalty'>
               <div class='h_button penalty_player_1 assignPenalty'>Penalty</div>
            </div>
            <div class='h_menuwide ch_flexcenter pressAndHold rallyCount'>
               <div class='h_button rally rallyCount'>Rally</div>
            </div>
         </div>
      </div>
   `;

   sliders.stroke = `
      <div id="stroke_slider" class="flexrows stroke_slider" style='display: none'>
            <div id="slideleft" style='display: none' class="slideback flexcenter" onclick="strokeAction(undefined, undefined, 'right')">&#62;</div>
            <div class="flexcols flexcenter strokes">
               <div class="stroke flexcenter">
                  <div>Lob</div>
                  <div class='forehand' onclick='strokeAction("Forehand", "Lob")'><div class='hand_label flexjustifystart'>F</div></div>
                  <div class='backhand' onclick='strokeAction("Backhand", "Lob")'><div class='hand_label flexjustifyend'>B</div></div>
               </div>
               <div class="stroke flexcenter">
                  <div>Overhead</div>
                  <div class='forehand' onclick='strokeAction("Forehand", "Overhead")'></div>
                  <div class='backhand' onclick='strokeAction("Backhand", "Overhead")'></div>
               </div>
               <div class="stroke flexcenter">
                  <div>Volley</div>
                  <div class='forehand' onclick='strokeAction("Forehand", "Volley")'></div>
                  <div class='backhand' onclick='strokeAction("Backhand", "Volley")'></div>
               </div>
               <div class="stroke flexcenter">
                  <div>Drive Volley</div>
                  <div class='forehand' onclick='strokeAction("Forehand", "Drive Volley")'></div>
                  <div class='backhand' onclick='strokeAction("Backhand", "Drive Volley")'></div>
               </div>
               <div class="stroke flexcenter">
                  <div>Drive</div>
                  <div class='forehand' onclick='strokeAction("Forehand", "Drive")'></div>
                  <div class='backhand' onclick='strokeAction("Backhand", "Drive")'></div>
               </div>
               <div class="stroke flexcenter">
                  <div>Slice</div>
                  <div class='forehand' onclick='strokeAction("Forehand", "Slice")'></div>
                  <div class='backhand' onclick='strokeAction("Backhand", "Slice")'></div>
               </div>
               <div class="stroke flexcenter">
                  <div>Half Volley</div>
                  <div class='forehand' onclick='strokeAction("Forehand", "Half Volley")'></div>
                  <div class='backhand' onclick='strokeAction("Backhand", "Half Volley")'></div>
               </div>
               <div class="stroke flexcenter">
                  <div>Drop Shot</div>
                  <div class='forehand' onclick='strokeAction("Forehand", "Drop Shot")'></div>
                  <div class='backhand' onclick='strokeAction("Backhand", "Drop Shot")'></div>
               </div>
            </div>
            <div id="slideright" class="slideback flexcenter" onclick="strokeAction(undefined, undefined, 'left')">&#60;</div>
      </div>
   `;

   sliders.endpoint = `
      <div id="endpoint_slider" class="flexrows endpoint_slider" style='display: none'>
            <div class="flexcols flexcenter strokes">
               <div class="stroke flexcenter">
                  <div class='' onclick='endPoint("long")'>Long</div>
               </div>
               <div class="stroke flexcenter">
                  <div class='' onclick='endPoint("wide")'>Wide</div>
               </div>
               <div class="stroke flexcenter">
                  <div class='' onclick='endPoint("long_wide")'>Long and Wide</div>
               </div>
               <div class="stroke flexcenter">
                  <div class='' onclick='endPoint("net")'>Net</div>
               </div>
               <div class="stroke flexcenter">
                  <div class='' onclick='endPoint("net_cord")'>Net Cord</div>
               </div>
            </div>
      </div>
   `;

   return fx;
}();
