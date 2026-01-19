// Core Types for Universal Match Object

export type PlayerIndex = 0 | 1 | 2 | 3;
export type TeamIndex = 0 | 1;

export interface FormatSettings {
  description?: string;
  code?: string;
  name?: string;
  players?: number;
  threshold: number;
  has_decider: boolean;
  min_diff: number;
  tiebreak?: boolean;
}

export interface GameFormat {
  description: string;
  tiebreak: boolean;
  hasDecider: boolean;
  threshold: number;
  minDiff: number;
}

export interface SetFormat extends GameFormat {
  children: string;
  decidingChild: string;
}

export interface MatchFormat extends Omit<GameFormat, 'tiebreak'> {
  name: string;
  children: string;
  decidingChild: string;
}

export interface Point {
  winner: PlayerIndex;
  server: PlayerIndex;
  code?: string;
  score?: string;
  index?: number;
  game?: number;
  set?: number;
  tiebreak?: boolean;
  breakpoint?: boolean;
  result?: string;
  hand?: string;
  first_serve?: {
    error?: string;
    serves?: string[];
  };
  rally?: any[];
  uts?: number;
}

export interface AddPointResult {
  result: boolean;
  complete?: boolean;
  point?: Point;
  next_service?: PlayerIndex;
  needed?: {
    points_to_game?: number[];
    points_to_set?: number[];
    games_to_set?: number[];
  };
  game?: {
    complete: boolean;
    winner?: PlayerIndex;
    games?: number[];
    index?: number;
  };
  set?: {
    complete: boolean;
    winner?: PlayerIndex;
    sets?: number[];
    index?: number;
  };
}

export interface AddPointsResult {
  result: number;
  added: AddPointResult[];
  rejected: any[];
}

export interface Score {
  counters: {
    local?: number[];
    points: number[];
    games: number[];
    sets?: number[];
  };
  points: string;
  games: string;
  sets?: string;
  components?: {
    sets?: Array<{
      games: number[];
      tiebreak?: number[];
    }>;
  };
  display?: Record<string, any>;
}

export interface Player {
  name: string;
  birth?: string;
  puid?: string;
  hand?: 'L' | 'R';
  seed?: number;
  rank?: number;
  age?: number;
  entry?: string;
  ioc?: string;
  draw_position?: number;
  index?: number;
}

// ==========================================
// Factory/TODS Participant Types
// ==========================================

export type ParticipantType = 'INDIVIDUAL' | 'PAIR' | 'TEAM';
export type ParticipantRole = 'COMPETITOR' | 'ALTERNATE';
export type MatchUpType = 'SINGLES' | 'DOUBLES' | 'TEAM';

export interface Person {
  participantId?: string;
  personId?: string;
  standardFamilyName?: string;
  standardGivenName?: string;
  nationalityCode?: string;
  sex?: 'MALE' | 'FEMALE' | 'MIXED';
  birthDate?: string;
  // Other ITF TODS person fields can be added as needed
}

export interface Participant {
  participantId: string;
  participantType: ParticipantType;
  participantName?: string;
  participantRole?: ParticipantRole;
  
  // INDIVIDUAL only
  person?: Person;
  
  // PAIR/TEAM - IDs of individual participants
  individualParticipantIds?: string[];
  
  // PAIR/TEAM - Hydrated individual participants
  individualParticipants?: Participant[];
  
  // Additional optional fields
  participantRoleResponsibilities?: string[];
  representing?: any;
  teams?: any[];
  extensions?: any[];  // Custom extensions
}

export interface Side {
  sideNumber: 1 | 2;
  participantId?: string;  // Direct participant ID reference
  participant?: Participant;
  lineUp?: any[];
  
  // Optional fields
  servingFirst?: boolean;
  scoreString?: string;
  score?: any;
}

export interface FactoryMatchUp {
  matchUpId: string;
  matchUpType?: MatchUpType;
  matchUpFormat?: string;  // Factory format code (e.g., "SET3-S:6/TB7")
  matchUpStatus?: string;  // e.g., "COMPLETED", "IN_PROGRESS", "TO_BE_PLAYED"
  
  sides?: Side[];
  score?: any;
  
  // Optional context fields
  drawId?: string;
  eventId?: string;
  tournamentId?: string;
  structureId?: string;
  
  // Additional fields
  schedule?: any;
  timeItems?: any[];
  notes?: string;
  order?: number;
}

export interface Tournament {
  name?: string;
  tuid?: string;
  start_date?: string;
  tour?: string;
  rank?: string;
  surface?: string;
  in_out?: string;
  draw?: string;
  draw_size?: number;
  round?: string;
  level?: string;
}

export interface MatchMetadata {
  muid?: string;
  date?: number | null;
  gender?: string;
  year?: number;
  court?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  status?: string;
  umpire?: string;
  official_score?: string;
}

export interface Metadata {
  players: Player[];
  teams: number[][];
  service_order: PlayerIndex[];
  receive_order: PlayerIndex[];
  tournament: Tournament;
  match: MatchMetadata;
  timestamps: boolean;
  charter?: any;
}

export interface FormatObject {
  description: (value?: string) => string | FormatObject;
  settings: (options?: Partial<FormatSettings>) => FormatSettings | boolean;
  singles: (value?: boolean) => boolean | FormatObject;
  doubles: (value?: boolean) => boolean | FormatObject;
  type: (code: string | boolean) => boolean | undefined;
  types: (plural?: string) => string[];
  threshold: (value?: number) => number | FormatObject;
  hasDecider: (value?: boolean) => boolean | FormatObject;
  minDiff: (value?: number) => number | FormatObject;
  tiebreak?: (value?: boolean) => boolean | FormatObject;
  name?: (value?: string) => string | FormatObject;
  code?: () => string;
  children?: FormatObject;
  decidingChild?: FormatObject;
  
  // Internal properties
  values?: any;  // Internal values storage
  decidingChildFormatStructure?: any;  // Format structure for deciding child
  bestOf?: number;  // Best of N sets/games
  setsToWin?: number;  // Sets needed to win
}

export interface SetAccessors {
  index: (value?: number) => number | SetAccessors;
  liveStats: (value?: boolean) => boolean | SetAccessors;
  perspectiveScore: (value?: boolean) => boolean | SetAccessors;
  firstService: (value?: PlayerIndex) => PlayerIndex | SetAccessors | false;
}

export interface HistoryAccessors {
  local: () => any[];
  action: (action: string) => any[];
  points: (setIndex?: number) => Point[];
  score: () => string[];
  games?: () => any[];
  lastPoint: () => Point;
  common?: () => any[];
}

export interface CommonObject {
  set: SetAccessors;
  reset: (format?: string | boolean) => void;
  format: FormatObject;
  events: any;
  assignParser: (parser: PointParser) => void;
  metadata: any;
  nextService: () => PlayerIndex | false;
  nextTeamServing: () => TeamIndex;
  nextTeamReceiving: () => TeamIndex;
  change: any;
  undo: (count?: number) => any;
  addPoint: (point: any) => AddPointResult;
  addPoints: (points: any) => AddPointsResult;
  decoratePoint: (point: Point, decoration: Partial<Point>) => boolean;
  addScore: (score: string) => AddPointResult;
  addScores: (scores: string[]) => AddPointsResult;
  complete: () => boolean;
  winner: () => PlayerIndex | undefined;
  score: () => Score;
  scoreboard: (perspective?: PlayerIndex) => string;
  history: HistoryAccessors;
}

export interface GameObject extends CommonObject {
  pointsToGame: () => number[] | undefined;
  lastChild: () => undefined;
}

export interface SetObject extends CommonObject {
  games: () => GameObject[];
  children: () => GameObject[];
  lastChild: () => GameObject | undefined;
  newChild: () => GameObject;
  pointsNeeded: () => {
    points_to_set: number[];
    games_to_set: number[];
  };
}

export interface MatchObject extends CommonObject {
  sets: () => SetObject[];
  stats: any;
  
  // Participant/player methods
  participants: (value?: any) => any;
  team: (player: number) => number;
  teams: () => number[][];
  doubles: (value?: boolean) => boolean | MatchObject;
  singles: (value?: boolean) => boolean | MatchObject;
  
  // Match metadata access
  matchUp: any;  // Legacy property
  
  // TODS-native direct access methods
  todsParticipants: () => Participant[];
  todsSides: () => Side[];
  todsMatchUp: () => any;
  toMatchUp: () => any;
}

export type PointParser = (
  value: any,
  server: PlayerIndex,
  last_point: Point,
  format: FormatObject,
  teams: PlayerIndex[][],
  perspective: boolean,
  score_object: Score
) => Point | { result: false } | false;

export interface UMO {
  addPoint_events: Array<(point: any) => void>;
  undo_events: Array<(point: any) => void>;
  reset_events: Array<() => void>;
  pointParser: PointParser;
  formats: () => {
    games: Record<string, GameFormat>;
    sets: Record<string, SetFormat>;
    matches: Record<string, MatchFormat>;
  };
  newFormat: (options: {
    type: 'games' | 'sets' | 'matches';
    code: string;
    description: string;
    tiebreak?: boolean;
    hasDecider: boolean;
    threshold: number;
    minDiff: number;
    children?: string;
    decidingChild?: string;
  }) => boolean;
  Match: (options?: { index?: number; matchUpFormat?: string; matchUpId?: string; participants?: any[]; isDoubles?: boolean; common?: any }) => MatchObject;
  fromMatchUp: (matchUp: any, params?: any) => MatchObject;
  matchUp: (options?: { index?: number; matchUpFormat?: string; matchUpId?: string; participants?: any[]; isDoubles?: boolean; common?: any }) => MatchObject;
  Set: (options?: { index?: number; parent_object?: any; formatStructure?: string; common?: any }) => SetObject;
  Game: (options?: { index?: number; parent_object?: any; formatStructure?: string; common?: any }) => GameObject;
  matchUpFormat: (options?: { formatCode?: string; formatStructure?: string; common?: any }) => FormatObject;
  setFormat: (options?: { formatCode?: string; formatStructure?: string; common?: any }) => FormatObject;
  gameFormat: (options?: { formatCode?: string; formatStructure?: string; common?: any }) => FormatObject;
  stateObject: (options?: any) => any;
  formatObject: (options?: any) => FormatObject;
  common: () => any;
  defaultPointParser: PointParser;
}
