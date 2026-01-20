/**
 * UMO v4.0 - Functional API + PointsEngine
 *
 * Pure functional library for TODS matchUp scoring
 * + Stateful engine for point management with undo/redo
 */

// Types
export type * from "./types";

// PointsEngine - Stateful engine for point management (RECOMMENDED)
export { PointsEngine } from "./engine/PointsEngine";
export type { PointsEngineOptions } from "./engine/PointsEngine";

// Core functions (Pure functional alternative)
export { createMatchUp } from "./core/createMatchUp";

// Scoring functions
export { addPoint } from "./scoring/addPoint";
// export { addPoints } from './scoring/addPoints';

// Query functions
export { getScore } from "./query/getScore";
export type { GetScoreOptions } from "./query/getScore";
export { getScoreboard } from "./query/getScoreboard";
export { getWinner } from "./query/getWinner";
export { isComplete } from "./query/isComplete";
export { deduceMatchUpFormat } from "./query/deduceMatchUpFormat";
// export { getNextServer } from './query/getNextServer';

// Validation functions
export {
  validateMatchUp,
  validateSet,
  getSetScoreString,
} from "./validation/validateMatchUp";
export type {
  ValidateMatchUpOptions,
  ValidationDetails,
} from "./validation/validateMatchUp";

// PBP Validator - Main API
export { pbpValidator } from "./validation/pbpValidator";
export type {
  PBPValidationOptions,
  PBPValidationResult,
} from "./validation/pbpValidator";

// Query functions (continued)

// Metadata functions (TODO)
// export { setParticipants } from './metadata/setParticipants';
// export { setMatchUpStatus } from './metadata/setMatchUpStatus';
// export { setWinningSide } from './metadata/setWinningSide';
