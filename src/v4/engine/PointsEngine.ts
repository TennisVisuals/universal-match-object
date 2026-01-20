/**
 * PointsEngine - Mutation engine for point-by-point scoring
 * 
 * Manages internal matchUp state with native undo/redo support.
 * Follows tods-competition-factory pattern (governors/engines).
 * 
 * Usage:
 *   const engine = new PointsEngine({ matchUpFormat: 'SET3-S:6/TB7' });
 *   engine.addPoint({ winner: 0 });
 *   engine.addPoint({ winner: 1 });
 *   engine.undo();
 *   const matchUp = engine.getState();
 */

import type { MatchUp, AddPointOptions } from '../types';
import { createMatchUp } from '../core/createMatchUp';
import { addPoint } from '../scoring/addPoint';
import { getScore } from '../query/getScore';
import { getScoreboard } from '../query/getScoreboard';
import { getWinner } from '../query/getWinner';
import { isComplete } from '../query/isComplete';

export interface PointsEngineOptions {
  matchUpFormat?: string;
  matchUpId?: string;
  isDoubles?: boolean;
}

/**
 * PointsEngine - Stateful engine for point-by-point scoring
 * 
 * Holds internal matchUp state and provides mutation operations.
 * Supports undo/redo by manipulating the points array and reconstructing state.
 */
export class PointsEngine {
  private state!: MatchUp; // Definite assignment - initialized in constructor
  private undoStack: Point[] = [];  // Points that were undone
  private matchUpFormat: string;
  private matchUpId?: string;
  private isDoubles: boolean;

  /**
   * Create new PointsEngine
   * 
   * @param options - Engine configuration
   */
  constructor(options: PointsEngineOptions = {}) {
    this.matchUpFormat = options.matchUpFormat || 'SET3-S:6/TB7';
    this.matchUpId = options.matchUpId;
    this.isDoubles = options.isDoubles || false;
    
    this.state = createMatchUp({
      matchUpFormat: this.matchUpFormat,
      matchUpId: this.matchUpId,
      isDoubles: this.isDoubles,
    });
  }

  /**
   * Load matchUp state from JSON
   * 
   * @param matchUp - TODS matchUp object
   */
  setState(matchUp: MatchUp): void {
    this.state = matchUp;
    this.matchUpFormat = matchUp.matchUpFormat;
    this.matchUpId = matchUp.matchUpId;
    this.isDoubles = matchUp.matchUpType === 'DOUBLES';
    this.undoStack = [];
  }

  /**
   * Get current matchUp state as JSON
   * 
   * @returns TODS matchUp object (direct reference, not copy)
   */
  getState(): MatchUp {
    return this.state;
  }

  /**
   * Add a point to the match
   * 
   * @param options - Point options (winner, server, etc.)
   */
  addPoint(options: AddPointOptions): void {
    // Add point using pure function (returns new state)
    this.state = addPoint(this.state, options);
    
    // Clear undo stack (new branch - can't redo after new point)
    this.undoStack = [];
  }

  /**
   * Undo last N points
   * 
   * Removes points from history and reconstructs state from remaining points.
   * 
   * @param count - Number of points to undo (default: 1)
   * @returns True if undo succeeded, false if no points to undo
   */
  undo(count: number = 1): boolean {
    const points = this.state.history?.points || [];
    
    if (points.length === 0) {
      return false; // No points to undo
    }

    // Remove last N points and save to undo stack
    const pointsToUndo = Math.min(count, points.length);
    const removedPoints = points.splice(-pointsToUndo, pointsToUndo);
    this.undoStack.push(...removedPoints);

    // Reconstruct state from remaining points
    this.rebuildState();

    return true;
  }

  /**
   * Redo last N undone points
   * 
   * Re-adds points from undo stack and reconstructs state.
   * 
   * @param count - Number of points to redo (default: 1)
   * @returns True if redo succeeded, false if no points to redo
   */
  redo(count: number = 1): boolean {
    if (this.undoStack.length === 0) {
      return false;
    }

    // Take N points from undo stack
    const pointsToRedo = Math.min(count, this.undoStack.length);
    const pointsToAdd = this.undoStack.splice(-pointsToRedo, pointsToRedo);

    // Re-add points to history
    if (!this.state.history) {
      this.state.history = { points: [] };
    }
    this.state.history.points.push(...pointsToAdd);

    // Reconstruct state from all points
    this.rebuildState();

    return true;
  }

  /**
   * Rebuild state from current points array
   * 
   * Creates fresh matchUp and replays all points.
   */
  private rebuildState(): void {
    const currentPoints = this.state.history?.points || [];
    
    // Create fresh matchUp
    let newState = createMatchUp({
      matchUpFormat: this.matchUpFormat,
      matchUpId: this.matchUpId,
      isDoubles: this.isDoubles,
    });

    // Replay all points
    for (const point of currentPoints) {
      newState = addPoint(newState, {
        winner: point.winner,
        server: point.server,
        timestamp: point.timestamp,
        rallyLength: point.rallyLength,
      });
    }

    this.state = newState;
  }

  /**
   * Get current score
   * 
   * @returns Score object with sets and scoreString
   */
  getScore(): ReturnType<typeof getScore> {
    return getScore(this.state);
  }

  /**
   * Get scoreboard display string
   * 
   * @param options - Display options
   * @returns Formatted scoreboard string
   */
  getScoreboard(options?: Parameters<typeof getScoreboard>[1]): string {
    return getScoreboard(this.state, options);
  }

  /**
   * Get match winner
   * 
   * @returns Winning side number (1 or 2), or undefined if not complete
   */
  getWinner(): number | undefined {
    return getWinner(this.state);
  }

  /**
   * Check if match is complete
   * 
   * @returns True if match is complete
   */
  isComplete(): boolean {
    return isComplete(this.state);
  }

  /**
   * Get number of points played
   * 
   * @returns Point count
   */
  getPointCount(): number {
    return this.state.history?.points.length || 0;
  }

  /**
   * Get match format
   * 
   * @returns TODS matchUpFormat string
   */
  getFormat(): string {
    return this.state.matchUpFormat;
  }

  /**
   * Check if undo is available
   * 
   * @returns True if undo is possible
   */
  canUndo(): boolean {
    return (this.state.history?.points.length || 0) > 0;
  }

  /**
   * Check if redo is available
   * 
   * @returns True if redo is possible
   */
  canRedo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Get undo depth
   * 
   * @returns Number of points that can be undone
   */
  getUndoDepth(): number {
    return this.state.history?.points.length || 0;
  }

  /**
   * Get redo depth
   * 
   * @returns Number of points that can be redone
   */
  getRedoDepth(): number {
    return this.undoStack.length;
  }

  /**
   * Reset match to initial state
   * 
   * Clears all points and undo stack.
   */
  reset(): void {
    this.state = createMatchUp({
      matchUpFormat: this.matchUpFormat,
      matchUpId: this.matchUpId,
      isDoubles: this.isDoubles,
    });

    this.undoStack = [];
  }
}
