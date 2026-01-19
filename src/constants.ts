/**
 * TODS Constants
 *
 * Re-exports commonly used constants from tods-competition-factory
 * for convenient usage throughout UMO.
 */

import { participantTypes, participantRoles, matchUpTypes, matchUpStatusConstants } from 'tods-competition-factory';

// Participant Types
export const INDIVIDUAL = participantTypes.INDIVIDUAL;
export const PAIR = participantTypes.PAIR;
export const GROUP = participantTypes.GROUP;
export const TEAM = participantTypes.TEAM;

// Participant Roles
export const COMPETITOR = participantRoles.COMPETITOR;

// Match Up Types
export const SINGLES = matchUpTypes.SINGLES;
export const DOUBLES = matchUpTypes.DOUBLES;

// Match Up Status
export const TO_BE_PLAYED = matchUpStatusConstants.TO_BE_PLAYED;
export const IN_PROGRESS = matchUpStatusConstants.IN_PROGRESS;
export const COMPLETED = matchUpStatusConstants.COMPLETED;

// Participant Status (hardcoded - these are standard TODS values)
export const ACTIVE = 'ACTIVE';
export const WITHDRAWN = 'WITHDRAWN';
