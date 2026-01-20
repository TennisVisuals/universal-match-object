/**
 * UMO v4.0 - TODS TypeScript Interfaces
 * 
 * Pure TypeScript types matching TODS specification
 * All structures are JSON-serializable
 */

// ============================================================================
// TODS Core Types
// ============================================================================

/**
 * TODS MatchUp - Central data structure
 */
export interface MatchUp {
  matchUpId: string;
  matchUpFormat: string;
  matchUpStatus: MatchUpStatus;
  matchUpType: MatchUpType;
  sides: Side[];
  score: Score;
  winningSide?: number;
  startTime?: string;
  endTime?: string;
  schedule?: Schedule;
  collectionPosition?: number;
  roundNumber?: number;
  roundPosition?: number;
  createdAt?: string;
  updatedAt?: string;
  
  // Optional: History for undo functionality
  history?: MatchUpHistory;
}

/**
 * Side represents one player or team
 */
export interface Side {
  sideNumber: number;
  participantId?: string;
  participant?: Participant;
}

/**
 * TODS Participant
 */
export interface Participant {
  participantId: string;
  participantName?: string;
  participantType: ParticipantType;
  participantRole: ParticipantRole;
  participantStatus?: ParticipantStatus;
  person?: Person;
  individualParticipants?: Participant[];
}

/**
 * Person information
 */
export interface Person {
  personId?: string;
  standardGivenName?: string;
  standardFamilyName?: string;
  nationalityCode?: string;
  sex?: 'MALE' | 'FEMALE' | 'OTHER';
}

/**
 * Score structure
 */
export interface Score {
  sets: SetScore[];
  scoreStringSide1?: string;
  scoreStringSide2?: string;
}

/**
 * Set score
 */
export interface SetScore {
  setNumber: number;
  side1Score?: number;
  side2Score?: number;
  side1TiebreakScore?: number;
  side2TiebreakScore?: number;
  side1GameScores?: number[];
  side2GameScores?: number[];
  winningSide?: number;
  setFormat?: string;
}

/**
 * Schedule information
 */
export interface Schedule {
  scheduledTime?: string;
  scheduledDate?: string;
  venueId?: string;
  courtId?: string;
}

/**
 * History for undo functionality
 */
export interface MatchUpHistory {
  points: Point[];
  states?: MatchUpState[];
}

/**
 * Point record stored in match history
 * 
 * @remarks
 * Points use 0-based player indices (NOT TODS sideNumber):
 * - 0 = side 1 (first player/team)  
 * - 1 = side 2 (second player/team)
 * 
 * **IMPORTANT - Data Loss Issue:**
 * ATP/WTA datasets contain rich point detail (aces, double faults, winners, errors)
 * in alpha code format (S/R/A/D). Currently this detail is DISCARDED during conversion
 * to numeric format. Only the winner (0/1) is captured.
 * 
 * Future enhancement: Add metadata field to preserve ace/fault/winner/error information.
 * See: docs/PBP_NOTATION.md for details.
 */
export interface Point {
  /** Sequential point number (1-indexed) */
  pointNumber: number;
  
  /** Winner of the point: 0 = side 1, 1 = side 2 (player index, not sideNumber) */
  winner: 0 | 1;
  
  /** Server of the point: 0 = side 1, 1 = side 2 (player index, not sideNumber) */
  server?: 0 | 1;
  
  /** ISO 8601 timestamp when point was played */
  timestamp?: string;
  
  /** Number of shots in the rally */
  rallyLength?: number;
  
  /** Score after this point (e.g., "15-0") */
  score?: string;
  
  // Future: Add metadata field to capture point detail from alpha codes
  // metadata?: {
  //   pointType?: 'ace' | 'doubleFault' | 'winner' | 'unforcedError' | 'forcedError';
  //   shotCount?: number;
  //   atNet?: boolean;
  //   breakPoint?: boolean;
  //   setPoint?: boolean;
  // };
}

/**
 * Saved state for undo
 */
export interface MatchUpState {
  score: Score;
  matchUpStatus: MatchUpStatus;
  winningSide?: number;
}

// ============================================================================
// Enums & Constants
// ============================================================================

export type MatchUpStatus = 
  | 'TO_BE_PLAYED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ABANDONED'
  | 'DEFAULTED'
  | 'RETIRED'
  | 'WALKOVER';

export type MatchUpType = 
  | 'SINGLES'
  | 'DOUBLES'
  | 'TEAM';

export type ParticipantType = 
  | 'INDIVIDUAL'
  | 'PAIR'
  | 'TEAM';

export type ParticipantRole = 
  | 'COMPETITOR'
  | 'ALTERNATE'
  | 'SEED';

export type ParticipantStatus = 
  | 'ACTIVE'
  | 'INACTIVE'
  | 'WITHDRAWN';

// ============================================================================
// Function Options
// ============================================================================

/**
 * Options for creating a matchUp
 */
export interface CreateMatchUpOptions {
  matchUpId?: string;
  matchUpFormat: string;
  participants?: Participant[];
  isDoubles?: boolean;
  matchUpType?: MatchUpType;
}

/**
 * Options for adding a point
 * 
 * @remarks
 * The winner and server use 0-based player indices (NOT TODS sideNumber):
 * - 0 = side 1 (first player/team)
 * - 1 = side 2 (second player/team)
 * 
 * This matches the common point-by-point notation used in tennis datasets
 * where points are represented as strings like "0011001100..." where each
 * character indicates the winner of that point (0 or 1).
 * 
 * @example
 * ```typescript
 * // Player 1 (side 1) wins the point
 * addPoint(matchUp, { winner: 0 });
 * 
 * // Player 2 (side 2) wins the point  
 * addPoint(matchUp, { winner: 1, server: 0 });
 * ```
 */
export interface AddPointOptions {
  /** Winner of the point: 0 = side 1, 1 = side 2 (player index, not sideNumber) */
  winner: 0 | 1;
  
  /** Server of the point: 0 = side 1, 1 = side 2 (player index, not sideNumber) */
  server?: 0 | 1;
  
  /** ISO 8601 timestamp when point was played */
  timestamp?: string;
  
  /** Number of shots in the rally (optional metadata) */
  rallyLength?: number;
}

/**
 * Options for getting scoreboard
 */
export interface GetScoreboardOptions {
  perspective?: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ============================================================================
// Internal Scoring Types (not exposed in TODS)
// ============================================================================

/**
 * Internal format structure (from parseFormat)
 */
export interface FormatStructure {
  bestOf?: number;
  setFormat?: SetFormatStructure;
  finalSetFormat?: any;
}

/**
 * Set format structure
 */
export interface SetFormatStructure {
  setTo?: number;
  tiebreakAt?: number;
  tiebreakFormat?: TiebreakFormatStructure;
  gameFormat?: GameFormatStructure;
  NoAD?: boolean;
}

/**
 * Tiebreak format structure
 */
export interface TiebreakFormatStructure {
  tiebreakTo?: number;
  NoAD?: boolean;
}

/**
 * Game format structure
 */
export interface GameFormatStructure {
  NoAD?: boolean;
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Score query result
 */
export interface ScoreResult {
  sets: SetScore[];
  scoreString: string;
  games?: number[];
  points?: number[];
}

/**
 * Statistics result
 */
export interface Statistics {
  totalPoints: number;
  pointsWon: number[];
  gamesWon: number[];
  setsWon: number[];
  aces?: number[];
  doubleFaults?: number[];
  breakPoints?: number[];
}
