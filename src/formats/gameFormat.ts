// @ts-nocheck
/**
 * Game Format Factory
 * Creates format objects for games
 */

import { createFormatObject } from './formatObject';

export function createGameFormat({common, formatStructure} = {}) {
   let gf = createFormatObject({plural: 'games', common});
   
   // Store the structure directly (no init, no type calls!)
   if (formatStructure) {
      gf.values.formatStructure = formatStructure;
   }
   
   // No children for games (leaf node)
   gf.children = null;
   gf.decidingChild = null;

   return gf;
}
