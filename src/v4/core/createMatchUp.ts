/**
 * createMatchUp - Create a new TODS matchUp
 * 
 * Pure function that creates a matchUp with TODS-compliant structure
 */

import type { 
  MatchUp, 
  CreateMatchUpOptions, 
  Side,
  Score 
} from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new matchUp
 * 
 * @param options - Creation options
 * @returns New matchUp object
 */
export function createMatchUp(options: CreateMatchUpOptions): MatchUp {
  const {
    matchUpId = uuidv4(),
    matchUpFormat,
    participants = [],
    isDoubles = false,
    matchUpType,
  } = options;

  // Determine matchUpType
  const type = matchUpType || (isDoubles ? 'DOUBLES' : 'SINGLES');

  // Create sides from participants
  const sides: Side[] = participants.map((participant, index) => ({
    sideNumber: index + 1,
    participantId: participant.participantId,
    participant,
  }));

  // If no participants provided, create empty sides
  if (sides.length === 0) {
    sides.push(
      { sideNumber: 1 },
      { sideNumber: 2 }
    );
  }

  // Initialize empty score
  const score: Score = {
    sets: [],
  };

  // Create matchUp
  const matchUp: MatchUp = {
    matchUpId,
    matchUpFormat,
    matchUpStatus: 'TO_BE_PLAYED',
    matchUpType: type,
    sides,
    score,
    createdAt: new Date().toISOString(),
  };

  return matchUp;
}
