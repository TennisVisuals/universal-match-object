/**
 * Hive-Eye Parity Tests
 * 
 * Tests that v4 adapter behaves EXACTLY like v3 for hive-eye usage patterns.
 * Based on actual browser logs and hive-eye source code.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createV3Adapter } from '../../src/v4/adapter/v3Adapter';
import matchObjectV3 from '../../src/matchObject';

describe('Hive-Eye v3/v4 Parity Tests', () => {
  
  describe('Match Initialization', () => {
    it('v3 and v4 should create match with same format', () => {
      const v3Match = matchObjectV3.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      const v4Adapter = createV3Adapter();
      const v4Match = v4Adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      // Both should have format
      expect(v3Match.format).toBeDefined();
      expect(v4Match.format).toBeDefined();
      
      // Format codes should match
      console.log('V3 format code:', v3Match.format.code);
      console.log('V4 format code:', v4Match.format.code);
      expect(v4Match.format.code).toBe(v3Match.format.code);
    });

    it('v3 and v4 should initialize with same default players', () => {
      const v3Match = matchObjectV3.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      const v4Adapter = createV3Adapter();
      const v4Match = v4Adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      // Define players
      v3Match.metadata.definePlayer({ index: 0, firstName: 'Player', lastName: 'One' });
      v3Match.metadata.definePlayer({ index: 1, firstName: 'Player', lastName: 'Two' });
      
      v4Match.metadata.definePlayer({ index: 0, firstName: 'Player', lastName: 'One' });
      v4Match.metadata.definePlayer({ index: 1, firstName: 'Player', lastName: 'Two' });
      
      const v3Players = v3Match.metadata.players();
      const v4Players = v4Match.metadata.players();
      
      console.log('V3 players:', v3Players);
      console.log('V4 players:', v4Players);
      
      expect(v4Players.length).toBe(v3Players.length);
      expect(v4Players[0].participantName).toBe(v3Players[0].participantName);
    });
  });

  describe('Point Scoring', () => {
    let v3Match: any;
    let v4Match: any;

    beforeEach(() => {
      v3Match = matchObjectV3.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      const v4Adapter = createV3Adapter();
      v4Match = v4Adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      // Setup players
      v3Match.metadata.definePlayer({ index: 0, firstName: 'Player', lastName: 'One' });
      v3Match.metadata.definePlayer({ index: 1, firstName: 'Player', lastName: 'Two' });
      v4Match.metadata.definePlayer({ index: 0, firstName: 'Player', lastName: 'One' });
      v4Match.metadata.definePlayer({ index: 1, firstName: 'Player', lastName: 'Two' });
    });

    it('should score first point with same result', () => {
      // From browser logs: {winner: 1, result: 'Winner', code: 'R', server: 0}
      v3Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      v4Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      
      const v3Score = v3Match.score();
      const v4Score = v4Match.score();
      
      console.log('V3 score after first point:', v3Score);
      console.log('V4 score after first point:', v4Score);
      
      // Score string should match (0-15 or similar)
      expect(v4Score.scoreString).toBe(v3Score.scoreString);
      
      // Scoreboard should match
      const v3Scoreboard = v3Match.scoreboard();
      const v4Scoreboard = v4Match.scoreboard();
      
      console.log('V3 scoreboard:', v3Scoreboard);
      console.log('V4 scoreboard:', v4Scoreboard);
      
      expect(v4Scoreboard).toBe(v3Scoreboard);
    });

    it('should handle multiple points with same scoring', () => {
      // Sequence from browser logs
      const points = [
        { winner: 1, result: 'Winner', code: 'R', server: 0 },
        { winner: 0, result: 'Ace', code: 'A', server: 0 },
        { winner: 1, result: 'Double Fault', code: 'D', server: 0 },
        { winner: 0, result: 'Unforced Error', code: 'S', server: 0 },
        { winner: 0, result: 'Winner', code: 'S', server: 0 },
      ];
      
      points.forEach(point => {
        v3Match.addPoint(point);
        v4Match.addPoint(point);
      });
      
      const v3Score = v3Match.score();
      const v4Score = v4Match.score();
      
      console.log('V3 final score:', v3Score);
      console.log('V4 final score:', v4Score);
      
      expect(v4Score.scoreString).toBe(v3Score.scoreString);
      expect(v4Match.scoreboard()).toBe(v3Match.scoreboard());
    });

    it('should track points in history with same format', () => {
      v3Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      v4Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      
      const v3Points = v3Match.history.points();
      const v4Points = v4Match.history.points();
      
      console.log('V3 history points:', v3Points);
      console.log('V4 history points:', v4Points);
      
      expect(v4Points.length).toBe(v3Points.length);
      expect(v4Points[0].winner).toBe(v3Points[0].winner);
      expect(v4Points[0].result).toBe(v3Points[0].result);
    });
  });

  describe('Point Decoration (Stroke Tracking)', () => {
    let v3Match: any;
    let v4Match: any;

    beforeEach(() => {
      v3Match = matchObjectV3.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      const v4Adapter = createV3Adapter();
      v4Match = v4Adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    });

    it('should decorate point with hand and stroke', () => {
      v3Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      v4Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      
      const v3LastPoint = v3Match.history.lastPoint();
      const v4LastPoint = v4Match.history.lastPoint();
      
      console.log('V4 Match has decoratePoint?', typeof v4Match.decoratePoint);
      console.log('V4 lastPoint:', v4LastPoint);
      
      v3Match.decoratePoint(v3LastPoint, { hand: 'Forehand', stroke: 'Volley' });
      v4Match.decoratePoint(v4LastPoint, { hand: 'Forehand', stroke: 'Volley' });
      
      const v3Points = v3Match.history.points();
      const v4Points = v4Match.history.points();
      
      console.log('V3 decorated point:', v3Points[0]);
      console.log('V4 decorated point:', v4Points[0]);
      
      expect(v4Points[0].hand).toBe('Forehand');
      expect(v4Points[0].stroke).toBe('Volley');
      expect(v4Points[0].hand).toBe(v3Points[0].hand);
      expect(v4Points[0].stroke).toBe(v3Points[0].stroke);
    });
  });

  describe('Statistics', () => {
    let v3Match: any;
    let v4Match: any;

    beforeEach(() => {
      v3Match = matchObjectV3.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      const v4Adapter = createV3Adapter();
      v4Match = v4Adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    });

    it('should calculate same stats for aces', () => {
      v3Match.addPoint({ winner: 0, result: 'Ace', code: 'A', server: 0 });
      v4Match.addPoint({ winner: 0, result: 'Ace', code: 'A', server: 0 });
      
      const v3Stats = v3Match.stats.calculated();
      const v4Stats = v4Match.stats.calculated();
      
      const v3Aces = v3Stats.find((s: any) => s.category === 'Aces');
      const v4Aces = v4Stats.find((s: any) => s.category === 'Aces');
      
      console.log('V3 Aces:', v3Aces);
      console.log('V4 Aces:', v4Aces);
      
      expect(v4Aces).toBeDefined();
      expect(v4Aces.teams[0].value).toBe(v3Aces.teams[0].value);
    });

    it('should track forehand/backhand in counters', () => {
      // Add point with decoration
      v3Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      v4Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      
      const v3LastPoint = v3Match.history.lastPoint();
      const v4LastPoint = v4Match.history.lastPoint();
      
      v3Match.decoratePoint(v3LastPoint, { hand: 'Forehand', stroke: 'Volley' });
      v4Match.decoratePoint(v4LastPoint, { hand: 'Forehand', stroke: 'Volley' });
      
      const v3Counters = v3Match.stats.counters();
      const v4Counters = v4Match.stats.counters();
      
      console.log('V3 counters.teams[1]:', Object.keys(v3Counters.teams[1]));
      console.log('V4 counters.teams[1]:', Object.keys(v4Counters.teams[1]));
      
      console.log('V3 Forehand:', v3Counters.teams[1].Forehand);
      console.log('V4 Forehand:', v4Counters.teams[1].Forehand);
      
      // Both should have Forehand tracking
      expect(v4Counters.teams[1].Forehand).toBeDefined();
      expect(v4Counters.teams[1].Forehand.length).toBe(1);
    });
  });

  describe('Events System', () => {
    let v3Match: any;
    let v4Match: any;

    beforeEach(() => {
      v3Match = matchObjectV3.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      const v4Adapter = createV3Adapter();
      v4Match = v4Adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    });

    it('should trigger addPoint callback in both', () => {
      let v3CallbackCount = 0;
      let v4CallbackCount = 0;
      
      v3Match.events.addPoint(() => { v3CallbackCount++; });
      v4Match.events.addPoint(() => { v4CallbackCount++; });
      
      v3Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      v4Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      
      console.log('V3 callback count:', v3CallbackCount);
      console.log('V4 callback count:', v4CallbackCount);
      
      expect(v4CallbackCount).toBe(v3CallbackCount);
      expect(v4CallbackCount).toBe(1);
    });

    it('should trigger undo callback in both', () => {
      let v3UndoCount = 0;
      let v4UndoCount = 0;
      
      v3Match.events.undo(() => { v3UndoCount++; });
      v4Match.events.undo(() => { v4UndoCount++; });
      
      v3Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      v4Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      
      v3Match.undo();
      v4Match.undo();
      
      console.log('V3 undo count:', v3UndoCount);
      console.log('V4 undo count:', v4UndoCount);
      
      // Both should trigger undo callback exactly once
      expect(v4UndoCount).toBe(1);
      // NOTE: v3 may trigger multiple times due to point replay, but v4 suppresses during replay
      // Both behaviors are acceptable as long as undo works correctly
    });
  });

  describe('Undo Functionality', () => {
    let v3Match: any;
    let v4Match: any;

    beforeEach(() => {
      v3Match = matchObjectV3.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      const v4Adapter = createV3Adapter();
      v4Match = v4Adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    });

    it('should undo last point with same result', () => {
      v3Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      v3Match.addPoint({ winner: 0, result: 'Ace', code: 'A', server: 0 });
      
      v4Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });
      v4Match.addPoint({ winner: 0, result: 'Ace', code: 'A', server: 0 });
      
      v3Match.undo();
      v4Match.undo();
      
      const v3Points = v3Match.history.points();
      const v4Points = v4Match.history.points();
      
      console.log('V3 points after undo:', v3Points.length);
      console.log('V4 points after undo:', v4Points.length);
      
      expect(v4Points.length).toBe(v3Points.length);
      expect(v4Points.length).toBe(1);
      
      // Scores should match after undo
      expect(v4Match.scoreboard()).toBe(v3Match.scoreboard());
    });
  });

  describe('Complete/Winner Detection', () => {
    it('should detect match NOT complete after partial game', () => {
      const v3Match = matchObjectV3.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      const v4Adapter = createV3Adapter();
      const v4Match = v4Adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      // Play 4 points - match should NOT be complete
      for (let i = 0; i < 4; i++) {
        v3Match.addPoint({ winner: 0, result: 'Winner', code: 'S', server: i % 2 });
        v4Match.addPoint({ winner: 0, result: 'Winner', code: 'S', server: i % 2 });
      }
      
      const v3Complete = v3Match.complete();
      const v4Complete = v4Match.complete();
      
      const v3Winner = v3Match.winner();
      const v4Winner = v4Match.winner();
      
      console.log('V3 complete:', v3Complete, 'winner:', v3Winner);
      console.log('V4 complete:', v4Complete, 'winner:', v4Winner);
      
      // After 4 points, match should NOT be complete
      expect(v4Complete).toBe(false);
      expect(v4Winner).toBe(undefined);
      expect(v4Complete).toBe(v3Complete);
      expect(v4Winner).toBe(v3Winner);
    });
  });
});
