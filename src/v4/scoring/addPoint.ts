/**
 * addPoint - Add a point to a matchUp (immutable)
 *
 * Pure function that returns a new matchUp with the point added
 */

import type { MatchUp, AddPointOptions, Point, SetScore } from "../types";
import { parseFormat } from "../../formatConverter";

/**
 * Add a point to the matchUp
 *
 * @param matchUp - Current matchUp state
 * @param options - Point options (winner, server, etc)
 * @returns New matchUp with point added
 */
export function addPoint(matchUp: MatchUp, options: AddPointOptions): MatchUp {
  // Clone matchUp for immutability
  const newMatchUp = structuredClone(matchUp);

  const { winner, server, timestamp } = options;

  // Initialize history if not present
  newMatchUp.history ??= { points: [] };

  // Parse format to get structure
  const formatParsed = parseFormat(matchUp.matchUpFormat);
  if (!formatParsed.isValid || !formatParsed.format) {
    throw new Error(`Invalid matchUpFormat: ${matchUp.matchUpFormat}`);
  }

  const formatStructure = formatParsed.format;
  const bestOf = formatStructure.bestOf || 3;
  const setsToWin = Math.ceil(bestOf / 2);

  // Create point record - preserve all metadata from options
  const pointNumber = newMatchUp.history.points.length + 1;
  const point: Point = {
    ...options, // Preserve all fields (result, code, etc.)
    pointNumber,
    winner,
    server,
    timestamp: timestamp || new Date().toISOString(),
  };
  
  // DEBUG: Log first point to confirm metadata preservation
  if (pointNumber === 1) {
    console.log('🔧 v4 addPoint - First point stored:', { 
      result: point.result, 
      code: point.code, 
      winner: point.winner,
      hasMetadata: !!point.result 
    });
  }

  // Add point to history
  newMatchUp.history.points.push(point);

  // Update match status if first point
  if (newMatchUp.matchUpStatus === "TO_BE_PLAYED") {
    newMatchUp.matchUpStatus = "IN_PROGRESS";
  }

  // Check if this is the final/deciding set
  const setsWon: [number, number] = [0, 0];
  newMatchUp.score.sets.forEach((set) => {
    if (set.winningSide !== undefined && set.winningSide === 1) setsWon[0]++;
    if (set.winningSide !== undefined && set.winningSide === 2) setsWon[1]++;
  });
  const isDecidingSet =
    setsWon[0] === setsToWin - 1 && setsWon[1] === setsToWin - 1;
  const isFinalSetTiebreak =
    isDecidingSet && formatStructure.finalSetFormat?.tiebreakSet;
  const finalSetNoTiebreak =
    isDecidingSet && formatStructure.finalSetFormat?.noTiebreak;

  // Get or create current set
  let currentSetIndex = newMatchUp.score.sets.length - 1;
  let currentSet: SetScore;

  if (
    currentSetIndex < 0 ||
    newMatchUp.score.sets[currentSetIndex]?.winningSide !== undefined
  ) {
    // Need new set
    currentSetIndex = newMatchUp.score.sets.length;
    currentSet = {
      setNumber: currentSetIndex + 1,
      side1Score: 0,
      side2Score: 0,
      side1GameScores: [],
      side2GameScores: [],
    };
    newMatchUp.score.sets.push(currentSet);
  } else {
    currentSet = newMatchUp.score.sets[currentSetIndex]!;
  }

  // Get current game scores
  const side1Games = currentSet.side1Score || 0;
  const side2Games = currentSet.side2Score || 0;
  const side1GameScores = currentSet.side1GameScores || [];
  const side2GameScores = currentSet.side2GameScores || [];

  // Get current game point scores
  const currentGameIndex =
    Math.max(side1GameScores.length, side2GameScores.length) - 1;
  let side1Points: number =
    currentGameIndex >= 0 ? (side1GameScores[currentGameIndex] ?? 0) : 0;
  let side2Points: number =
    currentGameIndex >= 0 ? (side2GameScores[currentGameIndex] ?? 0) : 0;

  // If no game started, initialize
  if (side1GameScores.length === 0 && side2GameScores.length === 0) {
    side1GameScores.push(0);
    side2GameScores.push(0);
  }

  // Add point to winner
  if (winner === 0) {
    side1Points++;
    side1GameScores[side1GameScores.length - 1] = side1Points;
  } else {
    side2Points++;
    side2GameScores[side2GameScores.length - 1] = side2Points;
  }

  // Update the set's game scores arrays
  currentSet.side1GameScores = side1GameScores;
  currentSet.side2GameScores = side2GameScores;

  // Check if game is won
  const setTo = formatStructure.setFormat?.setTo || 6;
  const tiebreakAt = formatStructure.setFormat?.tiebreakAt || setTo;

  // For final set tiebreak (match tiebreak), the entire set is one tiebreak game
  // BUT if final set has noTiebreak (advantage format), don't play tiebreak at 6-6
  const isTiebreak =
    isFinalSetTiebreak ||
    (!finalSetNoTiebreak &&
      side1Games === tiebreakAt &&
      side2Games === tiebreakAt);
  const gameWon = checkGameWon(
    side1Points,
    side2Points,
    formatStructure,
    isTiebreak,
    isFinalSetTiebreak,
  );

  if (gameWon !== undefined) {
    // Game won - increment game score
    if (gameWon === 0) {
      currentSet.side1Score = side1Games + 1;
    } else {
      currentSet.side2Score = side2Games + 1;
    }

    if (isTiebreak) {
      // Record tiebreak scores
      currentSet.side1TiebreakScore = side1Points;
      currentSet.side2TiebreakScore = side2Points;
    }

    // Check if set is won
    const setWon = isFinalSetTiebreak
      ? gameWon // In match tiebreak, winning the game wins the set
      : checkSetWon(
          currentSet.side1Score || 0,
          currentSet.side2Score || 0,
          formatStructure,
          isDecidingSet,
        );

    if (typeof setWon === "number") {
      currentSet.winningSide = setWon + 1; // TODS uses 1-indexed sides

      // Check if match is won
      const setsWon: [number, number] = [0, 0];
      newMatchUp.score.sets.forEach((set) => {
        if (set.winningSide === 1) setsWon[0]++;
        if (set.winningSide === 2) setsWon[1]++;
      });

      let matchWinner: number | undefined;
      if (setsWon[0] >= setsToWin) {
        matchWinner = 0;
      } else if (setsWon[1] >= setsToWin) {
        matchWinner = 1;
      } else {
        matchWinner = undefined;
      }

      if (matchWinner === undefined) {
        // Start new set (will be created on next point)
      } else {
        newMatchUp.matchUpStatus = "COMPLETED";
        newMatchUp.winningSide = matchWinner + 1; // Convert to 1-indexed
        newMatchUp.endTime = new Date().toISOString();
      }
    } else {
      // Start new game
      currentSet.side1GameScores.push(0);
      currentSet.side2GameScores.push(0);
    }
  }

  return newMatchUp;
}

/**
 * Check if game is won
 */
function checkGameWon(
  side1Points: number,
  side2Points: number,
  formatStructure: any,
  isTiebreak: boolean = false,
  isFinalSetTiebreak: boolean = false,
): number | undefined {
  // Get game format
  const gameFormat = formatStructure.setFormat?.gameFormat || {};
  const isNoAd = gameFormat.NoAD || formatStructure.setFormat?.NoAD || false;

  // Determine points needed based on game type
  let pointsTo: number;
  if (isFinalSetTiebreak) {
    // Match tiebreak (final set tiebreak)
    pointsTo = formatStructure.finalSetFormat?.tiebreakSet?.tiebreakTo || 10;
  } else if (isTiebreak) {
    // Regular tiebreak
    pointsTo = formatStructure.setFormat?.tiebreakFormat?.tiebreakTo || 7;
  } else {
    // Regular game
    pointsTo = 4;
  }

  const diff = Math.abs(side1Points - side2Points);

  // Tiebreak scoring
  if (isTiebreak) {
    if ((side1Points >= pointsTo || side2Points >= pointsTo) && diff >= 2) {
      return side1Points > side2Points ? 0 : 1;
    }
    return undefined;
  }

  // No-AD scoring (golden point)
  if (isNoAd) {
    // Win by 1 at threshold (4 points)
    if (side1Points >= pointsTo || side2Points >= pointsTo) {
      return side1Points > side2Points ? 0 : 1;
    }
    return undefined;
  }

  // Regular tennis scoring (deuce/advantage)
  if (side1Points >= pointsTo || side2Points >= pointsTo) {
    // Win by 2 points
    if (diff >= 2) {
      return side1Points > side2Points ? 0 : 1;
    }
  }

  return undefined;
}

/**
 * Check if set is won
 */
function checkSetWon(
  side1Games: number,
  side2Games: number,
  formatStructure: any,
  isDecidingSet: boolean = false,
): number | undefined {
  const setTo = formatStructure.setFormat?.setTo || 6;
  const tiebreakAt = formatStructure.setFormat?.tiebreakAt || setTo;
  const finalSetNoTiebreak =
    isDecidingSet && formatStructure.finalSetFormat?.noTiebreak;

  // For setTo === 1, first to 1 game wins (no win-by-2 required)
  if (setTo === 1) {
    if (side1Games >= 1 || side2Games >= 1) {
      return side1Games > side2Games ? 0 : 1;
    }
    return undefined;
  }

  // Extract winBy from the parsed format structure
  // Use finalSetFormat if this is the deciding set, otherwise use regular setFormat
  const setFormat = isDecidingSet && formatStructure.finalSetFormat 
    ? formatStructure.finalSetFormat 
    : formatStructure.setFormat;
  
  const winBy = setFormat?.winBy || 2; // Default to 2 (standard tennis) if not specified

  // Check if at tiebreak score (e.g., 7-6 after tiebreak at 6-6)
  // BUT if final set has noTiebreak (advantage), this doesn't apply - continue to advantage
  if (
    !finalSetNoTiebreak &&
    (side1Games === tiebreakAt + 1 || side2Games === tiebreakAt + 1)
  ) {
    // Tiebreak was played and won
    return side1Games > side2Games ? 0 : 1;
  }

  // Check regular set win (must meet threshold and win by margin)
  if (side1Games >= setTo || side2Games >= setTo) {
    const diff = Math.abs(side1Games - side2Games);
    if (diff >= winBy) {
      return side1Games > side2Games ? 0 : 1;
    }
  }

  return undefined;
}
