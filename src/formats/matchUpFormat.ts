// @ts-nocheck
/**
 * Match Format Factory
 * Creates format objects for matches with TODS-native structure
 */

import { createFormatObject } from './formatObject';
import { createSetFormat } from './setFormat';

export function createMatchUpFormat({formatStructure, formatCode, common} = {}) {
   let mf = createFormatObject({plural: 'matches', common});
   
   // Store the structure and code directly
   if (formatStructure) {
      mf.values.formatStructure = formatStructure;
      mf.values.code = formatCode;
      mf.values.name = formatCode;
      mf.values.description = `Factory format: ${formatCode}`;
      
      // Store child formatStructures for newChild() to use
      mf.values.childFormatStructure = formatStructure.setFormat;
      mf.values.decidingChildFormatStructure = formatStructure.finalSetFormat || formatStructure.setFormat;
   }
   
   // Create children WITH their structures directly (no delayed updates!)
   mf.children = createSetFormat({
      common, 
      formatStructure: formatStructure?.setFormat
   });
   mf.decidingChild = createSetFormat({
      common, 
      formatStructure: formatStructure?.finalSetFormat || formatStructure?.setFormat
   });

   return mf;
}
