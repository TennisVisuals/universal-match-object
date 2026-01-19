/**
 * TODS (Tennis Open Data Standards) Type Definitions
 * 
 * Core types from tods-competition-factory for participant and matchUp structures.
 * These types enable UMO to export/import standard TODS format data.
 * 
 * Source: https://github.com/CourtHive/tods-competition-factory
 * Spec: https://itftennis.atlassian.net/wiki/spaces/TODS/overview
 */

// ============================================================================
// PARTICIPANT TYPES
// ============================================================================

export interface Participant {
  participantId?: string;                        // REQUIRED - Unique identifier
  participantName?: string;                     // Display name
  participantOtherName?: string;                // Alternative name
  participantType?: ParticipantTypeUnion;       // INDIVIDUAL | PAIR | TEAM | GROUP
  participantRole?: ParticipantRoleUnion;       // COMPETITOR | ALTERNATE | ...
  participantStatus?: ParticipantStatusUnion;   // ACTIVE | WITHDRAWN
  
  // Person details (for INDIVIDUAL)
  person?: Person;
  personId?: string;
  
  // Team/Pair composition
  individualParticipantIds?: string[];          // For PAIR/TEAM types
  teamId?: string;
  
  // Metadata
  representing?: string;                        // Country code (ISO 3166-1 alpha-3)
  homeVenueIds?: string[];                      // Relevant for TEAM type
  
  // Additional data
  contacts?: Contact[];
  onlineResources?: OnlineResource[];
  penalties?: Penalty[];
  extensions?: Extension[];
  timeItems?: TimeItem[];
  
  // System fields
  notes?: string;
  isMock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type ParticipantTypeUnion = 'GROUP' | 'INDIVIDUAL' | 'PAIR' | 'TEAM';
export type ParticipantRoleUnion = 
  | 'ADMINISTRATION'
  | 'CAPTAIN'
  | 'COACH'
  | 'COMPETITOR'
  | 'MEDIA'
  | 'MEDICAL'
  | 'OFFICIAL'
  | 'OTHER'
  | 'SECURITY';
export type ParticipantStatusUnion = 'ACTIVE' | 'WITHDRAWN';

export interface Person {
  personId?: string;
  standardGivenName?: string;
  standardFamilyName?: string;
  otherGivenNames?: string[];
  otherFamilyNames?: string[];
  nativeFamilyName?: string;
  nativeGivenName?: string;
  nationalityCode?: string;                     // ISO 3166-1 alpha-3
  birthDate?: string;                           // ISO 8601 date
  sex?: SexUnion;                               // MALE | FEMALE
  onlineResources?: OnlineResource[];
  contacts?: Contact[];
  addresses?: Address[];
  extensions?: Extension[];
  timeItems?: TimeItem[];
  notes?: string;
  isMock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type SexUnion = 'MALE' | 'FEMALE';

export interface Contact {
  contactId?: string;
  contactType?: string;
  emailAddress?: string;
  mobileTelephone?: string;
  telephone?: string;
  name?: string;
  isPublic?: boolean;
  notes?: string;
  extensions?: Extension[];
  timeItems?: TimeItem[];
  isMock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface OnlineResource {
  identifier?: string;
  name?: string;
  resourceType?: OnlineResourceTypeUnion;
  resourceSubType?: string;
  provider?: string;
  extensions?: Extension[];
  timeItems?: TimeItem[];
  notes?: string;
  isMock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type OnlineResourceTypeUnion = 'EMAIL' | 'OTHER' | 'SOCIAL_MEDIA' | 'URL';

export interface Address {
  addressId?: string;
  addressType?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;                         // ISO 3166-1 alpha-3
  latitude?: number;
  longitude?: number;
  extensions?: Extension[];
  timeItems?: TimeItem[];
  notes?: string;
  isMock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Penalty {
  penaltyId: string;
  penaltyType: PenaltyTypeUnion;
  penaltyCode?: string;
  matchUpId?: string;
  issuedAt?: string;
  refereeParticipantId?: string;
  notes?: string;
  extensions?: Extension[];
  timeItems?: TimeItem[];
  isMock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type PenaltyTypeUnion = 
  | 'BALL_ABUSE'
  | 'COACHING'
  | 'DRESS_CODE_VIOLATION'
  | 'OTHER'
  | 'PHYSICAL_ABUSE'
  | 'PROFANITY'
  | 'REFUSAL'
  | 'TIME_VIOLATION'
  | 'UNSPORTSMANLIKE_CONDUCT'
  | 'VERBAL_ABUSE';

// ============================================================================
// MATCHUP TYPES
// ============================================================================

export interface MatchUp {
  matchUpId: string;                            // REQUIRED - Unique identifier
  matchUpFormat?: string;                       // Factory format code (e.g., 'SET3-S:6/TB7')
  matchUpStatus?: MatchUpStatusUnion;
  matchUpType?: EventTypeUnion;                 // SINGLES | DOUBLES | TEAM
  
  // Participants
  sides?: Side[];                               // Participant assignments (side 1, side 2)
  
  // Score
  score?: Score;                                // TODS score structure
  winningSide?: number;                         // 1 or 2
  
  // Match details
  roundNumber?: number;
  roundName?: string;
  roundPosition?: number;
  startDate?: string;                           // ISO 8601
  endDate?: string;                             // ISO 8601
  matchUpDuration?: string;                     // ISO 8601 duration
  
  // Team events
  tieFormat?: TieFormat;
  tieFormatId?: string;
  tieMatchUps?: MatchUp[];                      // Nested team match structure
  
  // Collection (team event grouping)
  collectionId?: string;
  collectionPosition?: number;
  
  // Court/venue
  indoorOutdoor?: IndoorOutdoorUnion;
  surfaceCategory?: string;
  
  // Draw context
  drawPositions?: number[];
  finishingPositionRange?: MatchUpFinishingPositionRange;
  finishingRound?: number;
  orderOfFinish?: number;
  loserMatchUpId?: string;
  winnerMatchUpId?: string;
  
  // Status codes
  matchUpStatusCodes?: any[];
  processCodes?: string[];
  
  // Extensions and time tracking
  extensions?: Extension[];
  timeItems?: TimeItem[];
  notes?: string;
  
  // System fields
  isMock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type MatchUpStatusUnion =
  | 'ABANDONED'
  | 'AWAITING_RESULT'
  | 'BYE'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'DEAD_RUBBER'
  | 'DEFAULTED'
  | 'DOUBLE_DEFAULT'
  | 'DOUBLE_WALKOVER'
  | 'IN_PROGRESS'
  | 'INCOMPLETE'
  | 'NOT_PLAYED'
  | 'RETIRED'
  | 'SUSPENDED'
  | 'TO_BE_PLAYED'
  | 'WALKOVER';

export type EventTypeUnion = 'SINGLES' | 'DOUBLES' | 'TEAM';
export type IndoorOutdoorUnion = 'INDOOR' | 'MIXED' | 'OUTDOOR';

export interface MatchUpFinishingPositionRange {
  winner: number[];
  loser: number[];
}

export interface Side {
  sideNumber?: number;                          // 1 or 2
  participantId?: string;                       // Reference to Participant
  participant?: Participant;                    // Hydrated participant (optional)
  lineUp?: TeamCompetitor[];                    // For TEAM events
  extensions?: Extension[];
  timeItems?: TimeItem[];
  notes?: string;
  isMock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface TeamCompetitor {
  participantId: string;
  collectionAssignments?: CollectionAssignment[];
  extensions?: Extension[];
  timeItems?: TimeItem[];
  notes?: string;
  isMock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CollectionAssignment {
  collectionId: string;
  collectionPosition?: number;
}

// ============================================================================
// SCORE TYPES
// ============================================================================

export interface Score {
  scoreStringSide1?: string;                    // e.g., "6-4 6-3"
  scoreStringSide2?: string;                    // e.g., "4-6 3-6"
  sets?: Set[];                                 // Detailed set-by-set structure
  extensions?: Extension[];
  timeItems?: TimeItem[];
  notes?: string;
  isMock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Set {
  setNumber?: number;                           // 1, 2, 3, etc.
  side1Score?: number;                          // Games won by side 1
  side2Score?: number;                          // Games won by side 2
  side1TiebreakScore?: number;                  // Tiebreak points side 1
  side2TiebreakScore?: number;                  // Tiebreak points side 2
  side1PointScore?: number;                     // For timed sets
  side2PointScore?: number;                     // For timed sets
  setFormat?: string;                           // Format code for this set
  setDuration?: string;                         // ISO 8601 duration
  games?: Game[];                               // Game-by-game detail
  extensions?: Extension[];
  timeItems?: TimeItem[];
  notes?: string;
  isMock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Game {
  gameNumber?: number;
  side1Score?: number;                          // Points in game
  side2Score?: number;                          // Points in game
  winningSide?: number;                         // 1 or 2
  gameDuration?: string;                        // ISO 8601 duration
  extensions?: Extension[];
  timeItems?: TimeItem[];
  notes?: string;
  isMock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ============================================================================
// TIE FORMAT (TEAM EVENTS)
// ============================================================================

export interface TieFormat {
  tieFormatId?: string;
  tieFormatName?: string;
  winCriteria?: WinCriteria;
  collectionDefinitions?: CollectionDefinition[];
  extensions?: Extension[];
  timeItems?: TimeItem[];
  notes?: string;
  isMock?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface WinCriteria {
  aggregateValue?: boolean;
  valueGoal?: number;
  tallyDirectives?: TallyDirective[];
}

export interface TallyDirective {
  [key: string]: any;
}

export interface CollectionDefinition {
  collectionId: string;
  collectionName?: string;
  collectionOrder?: number;
  matchUpFormat?: string;
  matchUpType?: EventTypeUnion;
  matchUpCount?: number;
  matchUpValue?: number;
  gender?: GenderUnion;
  collectionGroupNumber?: number;
  extensions?: Extension[];
  timeItems?: TimeItem[];
  notes?: string;
}

export type GenderUnion = 'MALE' | 'FEMALE' | 'MIXED' | 'ANY';

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface Extension {
  name: string;
  value: any;
}

export interface TimeItem {
  itemType?: string;
  itemValue?: string;
  itemDate?: string;                            // ISO 8601
  createdAt?: Date | string;
}
