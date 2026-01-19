/**
 * Score validation integration with Factory validators
 * 
 * Provides validation for UMO match scores using Factory's battle-tested validators.
 * This catches invalid scores that could result from bugs or incorrect usage.
 */

import { validateMatchUpScore, validateSetScore } from './validators/validateMatchUpScore';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate a UMO match score against its format
 * 
 * @param match - UMO Match object
 * @param matchUpStatus - Optional match status (e.g., 'RETIRED', 'WALKOVER')
 * @returns Validation result with error message if invalid
 * 
 * @example
 * const match = Match({matchUpFormat: 'SET3-S:6/TB7-F:TB10'});
 * // ... play match ...
 * const validation = validateUMOScore(match);
 * if (!validation.isValid) {
 *   console.error('Invalid score:', validation.error);
 * }
 */
export function validateUMOScore(match: any, matchUpStatus?: string): ValidationResult {
  // Extract score data from UMO match
  const sets = match.sets();
  
  // Convert UMO sets to Factory format
  const factorySets = sets.map((set: any, index: number) => {
    const setScore = set.score();
    const counters = setScore.counters.local;
    
    const factorySet: any = {
      side1Score: counters[0],
      side2Score: counters[1],
      setNumber: index + 1,
    };
    
    // Check if set has tiebreak
    const lastGame = set.lastChild ? set.lastChild() : null;
    if (lastGame && lastGame.format.tiebreak && lastGame.format.tiebreak()) {
      const tiebreakScore = lastGame.score().counters.local;
      factorySet.side1TiebreakScore = tiebreakScore[0];
      factorySet.side2TiebreakScore = tiebreakScore[1];
    }
    
    // Add winningSide if set is complete
    if (set.complete && set.complete()) {
      factorySet.winningSide = set.winner() === 0 ? 1 : 2;  // Factory uses 1-based
    }
    
    return factorySet;
  });
  
  // Get format code (code is a property, not a function)
  const formatCode = match.format.code || match.format.values?.code;
  
  // Validate using Factory validator
  return validateMatchUpScore(factorySets, formatCode, matchUpStatus);
}

/**
 * Validate a single set score
 * 
 * @param set - UMO Set object
 * @param matchUpFormat - Format code (e.g., 'SET3-S:6/TB7-F:TB10')
 * @param isDecidingSet - Whether this is the final/deciding set
 * @param allowIncomplete - Whether to allow incomplete scores
 * @returns Validation result
 */
export function validateUMOSetScore(
  set: any,
  matchUpFormat?: string,
  isDecidingSet?: boolean,
  allowIncomplete?: boolean
): ValidationResult {
  const setScore = set.score();
  const counters = setScore.counters.local;
  
  const factorySet: any = {
    side1Score: counters[0],
    side2Score: counters[1],
  };
  
  // Check for tiebreak
  const lastGame = set.lastChild ? set.lastChild() : null;
  if (lastGame && lastGame.format.tiebreak && lastGame.format.tiebreak()) {
    const tiebreakScore = lastGame.score().counters.local;
    factorySet.side1TiebreakScore = tiebreakScore[0];
    factorySet.side2TiebreakScore = tiebreakScore[1];
  }
  
  return validateSetScore(factorySet, matchUpFormat, isDecidingSet, allowIncomplete);
}

// Re-export Factory validators for direct use
export { validateMatchUpScore, validateSetScore };
