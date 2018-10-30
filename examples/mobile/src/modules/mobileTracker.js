import { eventManager } from './eventManager';
import { trackerSkins } from './trackerSkins';

export const mobileTracker = function() {
   var fx = {};
   var elements;

   fx.elements = (el) => { elements = el; return fx; }

   fx.init = () => {
      eventManager
         .register('editPlayer', 'tap', editPlayer) 
         .register('swapPlayerSides', 'tap', swapPlayerSides) 
         .register('addGamePoint', 'tap', addGamePoint) 
         .register('viewMatchStats', 'tap', viewMatchStats) 
         .register('changeServer', 'tap', changeServer)
         .register('viewTrackerMenu', 'tap', viewTrackerMenu)
         .register('viewPointHistory', 'tap', viewPointHistory)
         .register('viewMatchArchive', 'tap', viewMatchArchive)
         .register('viewTrackerSettings', 'tap', viewTrackerSettings)
         .register('assignWinner', 'tap', assignWinner)
         .register('assignForce', 'tap', assignForce)
         .register('assignError', 'tap', assignError)
         .register('redoFunction', 'tap', redoFunction)
         .register('undoFunction', 'tap', undoFunction)
         .register('rallyCount', 'tap', rallyCount)
         .register('modeAction', 'tap', modeAction)
   }

   fx.display = (skin='vblack') => trackerSkins.set(skin);

   function editPlayer() { console.log('editPlayer'); }
   function swapPlayerSides() { console.log('swapPlayerSides'); }
   function addGamePoint() { console.log('addGamePoint'); }
   function viewMatchStats() { console.log('viewMatchStats'); }
   function changeServer() { console.log('changeServer'); }
   function viewTrackerMenu() { console.log('viewTrackerMenu'); }
   function viewPointHistory() { console.log('viewPointHistory'); }
   function viewMatchArchive() { console.log('viewMatchArchive'); }
   function viewTrackerSettings() { console.log('viewTrackerSettings'); }
   function assignWinner() { console.log('assignWinner'); }
   function assignForce() { console.log('assignForce'); }
   function assignError() { console.log('assignError'); }
   function redoFunction() { console.log('redoFunction'); }
   function undoFunction() { console.log('undoFunction'); }
   function rallyCount() { console.log('rallyCount'); }
   function modeAction() { console.log('modeAction'); }

   return fx;
}();
