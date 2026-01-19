/**
 * TODS Constants
 *
 * Re-exports commonly used constants from tods-competition-factory
 * for convenient usage throughout UMO
 * 
 * Note: TypeScript may show import errors during declaration generation,
 * but these imports work correctly at runtime.
 */

// @ts-expect-error - TypeScript can't resolve these during declaration generation, but they work at runtime
import { participantTypes, participantRoles, matchUpTypes, matchUpStatusConstants, tournamentConstants, entryStatusConstants } from 'tods-competition-factory';

// Participant Types
export const INDIVIDUAL = participantTypes.INDIVIDUAL;
export const PAIR = participantTypes.PAIR;
export const GROUP = participantTypes.GROUP;
export const TEAM = participantTypes.TEAM;

// Participant Roles
export const COMPETITOR = participantRoles.COMPETITOR;
export const COACH = participantRoles.COACH;
export const CAPTAIN = participantRoles.CAPTAIN;

// Match Up Types
export const SINGLES = matchUpTypes.SINGLES;
export const DOUBLES = matchUpTypes.DOUBLES;
export const TEAM_MATCHUP = matchUpTypes.TEAM;

// Match Up Status
export const TO_BE_PLAYED = matchUpStatusConstants.TO_BE_PLAYED;
export const IN_PROGRESS = matchUpStatusConstants.IN_PROGRESS;
export const COMPLETED = matchUpStatusConstants.COMPLETED;
export const ABANDONED = matchUpStatusConstants.ABANDONED;
export const CANCELLED = matchUpStatusConstants.CANCELLED;
export const WALKOVER = matchUpStatusConstants.WALKOVER;
export const RETIRED = matchUpStatusConstants.RETIRED;

// Tournament/Participant Status
export const ACTIVE = tournamentConstants.ACTIVE;
export const WITHDRAWN = entryStatusConstants.WITHDRAWN;
