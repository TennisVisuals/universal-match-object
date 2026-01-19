// @ts-nocheck
/**
 * Format Object Factory
 * 
 * Base factory for creating format objects used by Match, Set, and Game.
 * Handles format configuration, validation, and type conversion.
 * 
 * IMPORTANT: This is the COMPLETE formatObject with all getter logic.
 * The getters intelligently read from formatStructure when available.
 */

import { isFactoryFormat, parseFormat, isLegacyFormat, convertLegacyToFactory } from '../formatConverter';

export function createFormatObject({plural, common = null} = {}) {
   // Handle case where common is not provided (for extracted modules)
   const hasCommon = common && typeof common === 'object';
   
   let fo = {
      values: { 
         plural: plural,
         formatStructure: undefined,  // Store parsed Factory JSON structure
         code: undefined              // Store format code
      },
      singles: hasCommon ? common.singles : () => undefined,
      doubles: hasCommon ? common.doubles : () => undefined,
      init(format_type) { 
         // DEPRECATED: Format must be set via constructor matchUpFormat parameter
         // This method kept for backward compatibility but does nothing
         if (format_type) {
            console.warn('⚠️  format.init() is deprecated. Use matchUpFormat constructor parameter instead.');
         }
      },
      settings({name, description, players, threshold, has_decider, min_diff, tiebreak} = {}) {
         if (!threshold || !has_decider || !min_diff || !tiebreak) {
            let number_of_players = hasCommon && typeof common.singles == 'function' ? common.singles() ? 2 : 4 : '';
            let settings = { 
               name: fo.values.name, 
               description: fo.values.description, 
               code: fo.values.code,
               players: number_of_players,
               threshold: fo.threshold(),
               has_decider: fo.hasDecider(),
               min_diff: fo.minDiff(),
               tiebreak: fo.tiebreak(),
            };
            return settings;
         } else {
            fo.tiebreak(tiebreak);
            fo.threshold(threshold);
            fo.minDiff(min_diff);
            fo.hasDecider(has_decider);
            if (description) fo.description(description);
            if (name) fo.name(name);
            if (players && hasCommon) {
               if (players == 4) {
                  fo.doubles();
               } else {
                  fo.singles();
               }
            }
         }
      },
      name(value) {
         if (!arguments.length) return fo.values.name;
         if (typeof value == 'string') fo.values.name = value;
         return fo;
      },
      description(value) {
         if (!arguments.length) return fo.values.description;
         if (typeof value == 'string') fo.values.description = value;
         return fo;
      },
      tiebreak(value) {
         if (!arguments.length) {
            // Getter: Inspect formatStructure JSON directly
            if (fo.values.formatStructure) {
               const fs = fo.values.formatStructure;
               return !!fs.tiebreakTo;
            }
            // Default: false for regular games
            return fo.values.tiebreak !== undefined ? fo.values.tiebreak : false;
         }
         // Setter
         fo.values.description = fo.values.code = undefined;
         if ([true, false].indexOf(value) >= 0) fo.values.tiebreak = value;
         return fo;
      },
      threshold(value) {
         if (!arguments.length) {
            // Getter: Inspect formatStructure JSON directly
            if (fo.values.formatStructure) {
               const fs = fo.values.formatStructure;
               
               // Match level: bestOf - return sets to WIN
               if (fs.bestOf !== undefined) return Math.ceil(fs.bestOf / 2);
               
               // Supertiebreak set
               if (fs.tiebreakSet !== undefined) return 1;
               
               // Regular set
               if (fs.setTo !== undefined) return fs.setTo;
               
               // Tiebreak/game
               if (fs.tiebreakTo !== undefined) return fs.tiebreakTo;
               
               // Regular game
               return 4;
            }
            // Default: 4 for regular games, or use explicitly set value
            return fo.values.threshold !== undefined ? fo.values.threshold : 4;
         }
         // Setter
         fo.values.description = fo.values.code = undefined;
         if (!isNaN(value)) fo.values.threshold = value;
         return fo;
      },
      minDiff(value) {
         if (!arguments.length) {
            // Getter: Inspect formatStructure JSON directly
            if (fo.values.formatStructure) {
               const fs = fo.values.formatStructure;
               
               // Match level
               if (fs.bestOf !== undefined) return 0;
               
               // Set level
               if (fs.setTo !== undefined) return fs.setMinDiff || 2;
               
               // Tiebreak-only sets
               if (fs.tiebreakSet !== undefined) return 1;
               
               // Game level
               if (fs.tiebreakTo !== undefined) {
                  if (fs.winBy !== undefined) return fs.winBy;
                  return fs.NoAD ? 1 : 2;
               }
               
               // Regular game
               if (fs.winBy !== undefined) return fs.winBy;
               return fs.NoAD ? 1 : 2;
            }
            // Default: 2 for regular games
            return fo.values.min_diff !== undefined ? fo.values.min_diff : 2;
         }
         // Setter
         fo.values.description = fo.values.code = undefined;
         if (!isNaN(value)) fo.values.min_diff = value;
         return fo;
      },
      hasDecider(value) {
         if (!arguments.length) {
            // Getter: Inspect formatStructure JSON directly
            if (fo.values.formatStructure) {
               const fs = fo.values.formatStructure;
               
               // Match level
               if (fs.bestOf !== undefined) return true;
               
               // Set level
               if (fs.setTo !== undefined || fs.tiebreakSet !== undefined) {
                  return !!(fs.tiebreakAt || fs.tiebreakSet);
               }
               
               // Game level
               if (fs.tiebreakTo !== undefined) return false;
               
               // Regular game
               return !!fs.NoAD;
            }
            // Default: false for regular games (use deuce/advantage)
            return fo.values.has_decider !== undefined ? fo.values.has_decider : false;
         }
         // Setter
         fo.values.description = fo.values.code = undefined;
         if ([true, false].indexOf(value) >= 0) fo.values.has_decider = value;
         return fo;
      },
      // FACTORY-NATIVE: Getters
      childFormatStructure() {
         return fo.values.childFormatStructure;
      },
      decidingChildFormatStructure() {
         return fo.values.decidingChildFormatStructure;
      },
   };

   // Modern API getters
   Object.defineProperty(fo, 'structure', {
      get() { return fo.values.formatStructure; },
      enumerable: true,
      configurable: true
   });
   
   Object.defineProperty(fo, 'code', {
      get() { return fo.values.code; },
      enumerable: true,
      configurable: true
   });
   
   // TODS compatibility: matchUpFormat should return same as code
   Object.defineProperty(fo, 'matchUpFormat', {
      get() { return fo.values.code; },
      set(value) { 
         // Allow direct setting for backward compatibility
         fo.values.code = value;
      },
      enumerable: true,
      configurable: true
   });
   
   Object.defineProperty(fo, 'setsToWin', {
      get() {
         const fs = fo.values.formatStructure;
         if (!fs || !fs.bestOf) return undefined;
         return Math.ceil(fs.bestOf / 2);
      },
      enumerable: true,
      configurable: true
   });
   
   Object.defineProperty(fo, 'bestOf', {
      get() { return fo.values.formatStructure?.bestOf; },
      enumerable: true,
      configurable: true
   });
   
   Object.defineProperty(fo, 'isDoubles', {
      get() { return hasCommon && typeof common.doubles === 'function' ? common.doubles() : false; },
      enumerable: true,
      configurable: true
   });
   
   // DEPRECATED: changeFormat via code
   // Format changes should be done by creating a new Match with new matchUpFormat
   fo.changeFormat = function(formatCode) {
      console.warn('⚠️  format.changeFormat() is deprecated. Create a new Match with the desired matchUpFormat instead.');
      return false;
   };

   return fo;
}
