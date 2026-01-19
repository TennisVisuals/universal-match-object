/**
 * MatchUpAdapter
 * 
 * Handles conversion between UMO internal structure and TODS MatchUp format.
 * Enables export/import of matches in standard TODS format.
 * 
 * UMO Internal → TODS MatchUp: toMatchUp()
 * TODS MatchUp → UMO Internal: fromMatchUp()
 */

import type { MatchUp, Side, Score, Set, Game, Participant } from './types/tods';
import { ParticipantAdapter } from './participantAdapter';
import { utilities, scoreGovernor } from 'tods-competition-factory';

// Register globally for matchObject to use
if (typeof globalThis !== 'undefined') {
  (globalThis as any).MatchUpAdapter = null; // Will be set below
}

export class MatchUpAdapter {
  
  /**
   * Convert UMO match to TODS MatchUp
   * 
   * @param match - UMO match object
   * @returns TODS MatchUp
   */
  static toMatchUp(match: any): MatchUp {
    const matchUpId = match.metadata?.match?.id || match.id || utilities.UUID();
    const matchUpFormat = match.format?.code || match.format?.settings?.()?.code;
    // Check doubles() function result, not isDoubles property which might not be set yet
    const doublesFunc = typeof match.doubles === 'function' ? match.doubles() : false;
    const isDoubles = match.format?.isDoubles ?? doublesFunc;
    
    // Determine matchUpType
    const matchUpType = isDoubles ? 'DOUBLES' : 'SINGLES';
    
    // Determine matchUpStatus
    const matchUpStatus = this._getMatchUpStatus(match);
    
    // Get winningSide (1 or 2)
    const winner = match.winner?.();
    const winningSide = winner !== undefined ? winner + 1 : undefined;
    
    // Build sides
    const sides = this._buildSides(match);
    
    // Build score
    const score = this._buildScore(match);
    
    return {
      matchUpId,
      matchUpFormat: matchUpFormat || 'SET3-S:6/TB7', // Ensure non-undefined
      matchUpStatus: matchUpStatus as any,
      matchUpType,
      winningSide,
      sides,
      score,
      createdAt: new Date().toISOString()
    };
  }
  
  /**
   * Import TODS MatchUp into UMO match
   * 
   * @param matchUp - TODS MatchUp
   * @returns UMO-compatible initialization object
   */
  static fromMatchUp(matchUp: MatchUp): any {
    // Extract format code
    const formatCode = matchUp.matchUpFormat || 'SET3-S:6/TB7';
    
    // Extract participants from sides - preserve ALL TODS properties including person
    const participants: Participant[] = [];
    if (matchUp.sides) {
      for (const side of matchUp.sides) {
        if (side.participant) {
          // Spread to preserve all properties (person, extensions, etc.)
          participants.push({
            ...side.participant,
            participantId: side.participant.participantId || side.participantId,
            participantType: side.participant.participantType || 'INDIVIDUAL',
            participantRole: side.participant.participantRole || 'COMPETITOR'
          });
        } else if (side.participantId) {
          // Create minimal participant if only ID provided
          participants.push({
            participantId: side.participantId,
            participantType: 'INDIVIDUAL',
            participantRole: 'COMPETITOR'
          });
        }
      }
    }
    
    // Check if doubles
    const isDoubles = matchUp.matchUpType === 'DOUBLES';
    
    // Return UMO initialization object
    return {
      matchUpId: matchUp.matchUpId,
      matchUpFormat: formatCode || 'SET3-S:6/TB7',
      participants,
      isDoubles,
      matchUp: matchUp  // Store original TODS matchUp for reference
    };
  }
  
  /**
   * Import score from TODS MatchUp into UMO match
   * 
   * @param match - UMO match object
   * @param matchUp - TODS MatchUp with score
   */
  static importScore(match: any, matchUp: MatchUp): void {
    if (!matchUp.score?.sets) return;
    
    for (const todsSet of matchUp.score.sets) {
      // const setNumber = todsSet.setNumber || 1; // Unused currently
      const side1Score = todsSet.side1Score || 0;
      const side2Score = todsSet.side2Score || 0;
      const side1TiebreakScore = todsSet.side1TiebreakScore;
      const side2TiebreakScore = todsSet.side2TiebreakScore;
      
      // Determine winner of set
      const setWinner = side1Score > side2Score ? 0 : 1;
      
      // Add points to recreate score
      // This is a simplified version - full reconstruction would require game-by-game data
      this._reconstructSet(match, side1Score, side2Score, side1TiebreakScore, side2TiebreakScore, setWinner);
    }
  }
  
  // ============================================================================
  // PRIVATE HELPERS - EXPORT (UMO → TODS)
  // ============================================================================
  
  /**
   * Determine matchUpStatus from UMO match
   */
  private static _getMatchUpStatus(match: any): string {
    if (match.complete?.()) {
      return 'COMPLETED';
    }
    
    // Check if match has started
    // history can be either a function or an object with action method
    const history = typeof match.history === 'function' ? match.history() : match.history;
    const points = history?.action ? history.action('addPoint') : (history?.points || []);
    const hasPoints = points.length > 0;
    if (hasPoints) {
      return 'IN_PROGRESS';
    }
    
    return 'TO_BE_PLAYED';
  }
  
  /**
   * Build TODS Sides from UMO match
   */
  private static _buildSides(match: any): Side[] {
    const sides: Side[] = [];
    
    // Get participants (could be TODS or legacy format)
    const participants = match.participants?.() || [];
    
    // Normalize to TODS if needed
    const todsParticipants = ParticipantAdapter.normalizeToTODS(participants);
    
    // Create sides (1 and 2)
    todsParticipants.forEach((participant, index) => {
      sides.push({
        sideNumber: index + 1,
        participantId: participant.participantId,
        participant: participant
      });
    });
    
    return sides;
  }
  
  /**
   * Build TODS Score from UMO match
   */
  private static _buildScore(match: any): Score | undefined {
    const score = match.score?.();
    if (!score) return undefined;
    
    // Build detailed set structure first
    const todsSets = this._buildSets(match);
    
    // Create score object with sets
    const scoreObject: Score = {
      sets: todsSets
    };
    
    // Generate score strings using Factory's scoreGovernor.generateScoreString()
    if (todsSets.length > 0) {
      try {
        // scoreGovernor.generateScoreString({ sets }) returns a STRING
        // Example: '6-3 6-3' (hyphenated within sets, space between sets)
        
        // Generate side 1 score string
        const side1String = scoreGovernor.generateScoreString({ sets: todsSets });
        if (typeof side1String === 'string') {
          scoreObject.scoreStringSide1 = side1String;
        }
        
        // Generate side 2 score string (reversed perspective)
        const side2String = scoreGovernor.generateScoreString({ 
          sets: todsSets,
          reversed: true 
        });
        if (typeof side2String === 'string') {
          scoreObject.scoreStringSide2 = side2String;
        }
      } catch (err) {
        // If Factory method fails, scoreStrings remain undefined
        console.warn('Failed to generate score strings:', err);
      }
    }
    
    return scoreObject;
  }
  
  /**
   * Build TODS Set array from UMO sets
   */
  private static _buildSets(match: any): Set[] {
    const sets = match.sets?.() || [];
    
    // Filter to only include completed sets (not the current in-progress set)
    const completedSets = sets.filter((umoSet: any) => {
      return umoSet.complete?.() === true;
    });
    
    return completedSets.map((umoSet: any, index: number) => {
      const score = umoSet.score?.();
      
      // CRITICAL: UMO stores game counts in score.counters.local, NOT in score.games string!
      // score.counters.local = [side1Games, side2Games]
      const counters = score?.counters?.local || [0, 0];
      const side1Score = counters[0] || 0;
      const side2Score = counters[1] || 0;
      
      // Extract tiebreak scores from the last game if this was a tiebreak set
      let side1TiebreakScore: number | undefined;
      let side2TiebreakScore: number | undefined;
      
      // Check if set went to tiebreak (score is 7-6 or 6-7)
      const isTiebreakSet = (side1Score === 7 && side2Score === 6) || (side1Score === 6 && side2Score === 7);
      
      if (isTiebreakSet) {
        // Get the last game (the tiebreak game)
        const games = umoSet.games?.();
        if (games && games.length > 0) {
          const tiebreakGame = games[games.length - 1];
          const tiebreakScore = tiebreakGame.score?.();
          
          // Tiebreak points are stored in the game's counters.local
          if (tiebreakScore?.counters?.local) {
            side1TiebreakScore = tiebreakScore.counters.local[0];
            side2TiebreakScore = tiebreakScore.counters.local[1];
          }
        }
      }
      
      const todsSet: Set = {
        setNumber: index + 1,
        side1Score,
        side2Score
      };
      
      if (side1TiebreakScore !== undefined) {
        todsSet.side1TiebreakScore = side1TiebreakScore;
      }
      if (side2TiebreakScore !== undefined) {
        todsSet.side2TiebreakScore = side2TiebreakScore;
      }
      
      // Add game-by-game detail if available
      const games = this._buildGames(umoSet);
      if (games.length > 0) {
        todsSet.games = games;
      }
      
      return todsSet;
    });
  }
  
  /**
   * Build TODS Game array from UMO set
   */
  private static _buildGames(umoSet: any): Game[] {
    const games: Game[] = [];
    const umoGames = umoSet.games?.() || [];
    
    umoGames.forEach((umoGame: any, index: number) => {
      const score = umoGame.score?.();
      if (!score) return;
      
      const points = score.points || '0-0';
      const [side1Points, side2Points] = points.split('-').map((p: string) => {
        // Convert tennis points (0, 15, 30, 40, A) to numeric
        switch(p.toUpperCase()) {
          case '0': return 0;
          case '15': return 1;
          case '30': return 2;
          case '40': return 3;
          case 'A': return 4;
          default: return parseInt(p) || 0;
        }
      });
      
      const winner = umoGame.winner?.();
      
      games.push({
        gameNumber: index + 1,
        side1Score: side1Points,
        side2Score: side2Points,
        winningSide: winner !== undefined ? winner + 1 : undefined
      });
    });
    
    return games;
  }
  
  // ============================================================================
  // PRIVATE HELPERS - IMPORT (TODS → UMO)
  // ============================================================================
  
  /**
   * Reconstruct a set by adding points
   * This is a simplified version - full game-by-game reconstruction would be ideal
   */
  private static _reconstructSet(
    _match: any,
    _side1Games: number,
    _side2Games: number,
    _side1TiebreakScore?: number,
    _side2TiebreakScore?: number,
    _winner?: number
  ): void {
    // This is a placeholder for set reconstruction logic
    // Full implementation would require point-by-point recreation
    // For now, we'll just note that this is where the logic would go
    
    // TODO: Implement full set reconstruction from TODS Set structure
    // This would involve:
    // 1. Adding points to reach each game score
    // 2. Handling tiebreaks if present
    // 3. Completing the set with the correct winner
  }
  
  /**
   * Create a minimal TODS MatchUp with required fields
   * Useful for testing or creating new matches
   */
  static createMinimal(params: {
    participants: Participant[];
    matchUpFormat?: string;
    matchUpType?: 'SINGLES' | 'DOUBLES' | 'TEAM';
  }): MatchUp {
    const { participants, matchUpFormat = 'SET3-S:6/TB7', matchUpType = 'SINGLES' } = params;
    
    const sides: Side[] = participants.map((participant, index) => ({
      sideNumber: index + 1,
      participantId: participant.participantId,
      participant
    }));
    
    return {
      matchUpId: utilities.UUID(),
      matchUpFormat,
      matchUpType,
      matchUpStatus: 'TO_BE_PLAYED' as any,
      sides,
      createdAt: new Date().toISOString()
    };
  }
  
  /**
   * Validate TODS MatchUp structure
   */
  static validate(matchUp: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!matchUp) {
      errors.push('MatchUp is null or undefined');
      return { valid: false, errors };
    }
    
    // Required field: matchUpId
    if (!matchUp.matchUpId) {
      errors.push('Missing required field: matchUpId');
    }
    
    // Validate matchUpStatus if present
    const validStatuses = [
      'ABANDONED', 'AWAITING_RESULT', 'BYE', 'CANCELLED', 'COMPLETED',
      'DEAD_RUBBER', 'DEFAULTED', 'DOUBLE_DEFAULT', 'DOUBLE_WALKOVER',
      'IN_PROGRESS', 'INCOMPLETE', 'NOT_PLAYED', 'RETIRED', 'SUSPENDED',
      'TO_BE_PLAYED', 'WALKOVER'
    ];
    if (matchUp.matchUpStatus && !validStatuses.includes(matchUp.matchUpStatus)) {
      errors.push(`Invalid matchUpStatus: ${matchUp.matchUpStatus}`);
    }
    
    // Validate matchUpType if present
    const validTypes = ['SINGLES', 'DOUBLES', 'TEAM'];
    if (matchUp.matchUpType && !validTypes.includes(matchUp.matchUpType)) {
      errors.push(`Invalid matchUpType: ${matchUp.matchUpType}`);
    }
    
    // Validate sides if present
    if (matchUp.sides) {
      if (!Array.isArray(matchUp.sides)) {
        errors.push('sides must be an array');
      } else if (matchUp.sides.length > 0) {
        matchUp.sides.forEach((side: any, index: number) => {
          if (!side.participantId && !side.participant) {
            errors.push(`Side ${index + 1}: Missing participantId or participant`);
          }
        });
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
}

/**
 * Convenience function to check if object is TODS MatchUp
 */
export function isTODSMatchUp(obj: any): obj is MatchUp {
  return obj && typeof obj === 'object' && 'matchUpId' in obj;
}

// Register globally for matchObject to use (after class definition)
if (typeof globalThis !== 'undefined') {
  (globalThis as any).MatchUpAdapter = MatchUpAdapter;
}
