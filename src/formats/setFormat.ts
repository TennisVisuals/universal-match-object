// @ts-nocheck
/**
 * Set Format Factory
 * Creates format objects for sets
 */

import { createFormatObject } from './formatObject';
import { createGameFormat } from './gameFormat';

export function createSetFormat({common, formatStructure} = {}) {
   let sf = createFormatObject({plural: 'sets', common});
   
   // Create children based on structure
   let childFormatStructure;
   let decidingChildFormatStructure;
   
   if (formatStructure) {
      sf.values.formatStructure = formatStructure;
      
      // Tiebreak set (supertiebreak) - entire set is ONE tiebreak game
      if (formatStructure.tiebreakSet) {
         // The ONE game in the set IS the tiebreak
         childFormatStructure = formatStructure.tiebreakSet;
         decidingChildFormatStructure = formatStructure.tiebreakSet;
      } else {
         // Normal set with games
         // Parser now adds gameFormat, so it's always present (never undefined)
         childFormatStructure = formatStructure.gameFormat || {};
         // Deciding child (tiebreak at 6-6) gets tiebreak format
         decidingChildFormatStructure = formatStructure.tiebreakFormat;
      }
      
      sf.values.childFormatStructure = childFormatStructure;
      sf.values.decidingChildFormatStructure = decidingChildFormatStructure;
   }

   sf.children = createGameFormat({common, formatStructure: childFormatStructure});
   sf.decidingChild = createGameFormat({common, formatStructure: decidingChildFormatStructure});

   return sf;
}
