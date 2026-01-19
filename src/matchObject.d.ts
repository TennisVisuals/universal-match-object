// Manual Type Declarations for Universal Match Object
// This file provides correct TypeScript types that match the UMO interface
// Until the full static restructure is complete, this ensures proper type checking

import type {
  UMO,
  MatchObject,
  SetObject,
  GameObject,
  FormatObject,
  PointParser
} from './types';

// Main UMO singleton with correct TODS-compliant types
declare const umo: UMO;

// Default export
export default umo;

// Named exports for convenience
export const Match: UMO['Match'];
export const matchUp: UMO['matchUp'];
export const Set: UMO['Set'];
export const Game: UMO['Game'];
export const gameFormat: UMO['gameFormat'];
export const setFormat: UMO['setFormat'];
export const matchUpFormat: UMO['matchUpFormat'];
export const fromMatchUp: UMO['fromMatchUp'];

// Re-export types for convenience
export type {
  UMO,
  MatchObject,
  SetObject,
  GameObject,
  FormatObject,
  PointParser
};
