import { describe, it, expect } from 'vitest';
import matchObject from '../../src/matchObject';

/**
 * Edge case tests for format handling
 * 
 * These tests cover scenarios that might break during refactoring:
 * - Format application at different match states
 * - Format inheritance from match to set to game
 * - Deciding set format differences
 * - Format changes during match (not supported, but should handle gracefully)
 */
describe('Format Edge Cases', () => {
  
  describe('Format Inheritance', () => {
    it('should propagate format structure from match to sets', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      // Create first set
      match.addPoint(0);
      const firstSet = match.sets()[0]!;
      
      expect(firstSet?.format.values.formatStructure).toBeDefined();
      expect(firstSet?.format.values.formatStructure.setTo).toBe(6);
    });
    
    it('should propagate format structure from set to games', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      // Create first game
      match.addPoint(0);
      const firstSet = match.sets()[0]!;
      const firstGame = firstSet.games()[0];
      
      expect(firstGame?.format.values.formatStructure).toBeDefined();
    });
    
    it('should use deciding child format for final set', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7-F:TB10' });
      
      // Play to third set
      for (let i = 0; i < 24; i++) match.addPoint(0); // Set 1
      for (let i = 0; i < 24; i++) match.addPoint(1); // Set 2
      match.addPoint(0); // Start set 3
      
      const thirdSet = match.sets()[2];
      const format = thirdSet?.format.values.formatStructure;
      
      // Third set should have supertiebreak format
      expect(format).toBeDefined();
      expect(format.tiebreakSet?.tiebreakTo).toBe(10);
    });
  });
  
  describe('Tiebreak Handling', () => {
    it('should enter tiebreak at 6-6', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      // Play to 6-6
      // Game 1: 6 points to player 0
      for (let i = 0; i < 4; i++) match.addPoint(0);
      // Alternate games to reach 6-6
      for (let g = 1; g < 12; g++) {
        const winner = g % 2;
        for (let p = 0; p < 4; p++) match.addPoint(winner);
      }
      
      expect(match.score().games).toBe('6-6');
      
      // Next point should start tiebreak (point-based scoring)
      match.addPoint(0);
      // Tiebreak scoring should be 1-0, not 15-0
      expect(match.score().points).toBe('1-0');
    });
  });
  
  describe('No-AD Scoring', () => {
    it('should handle deuce correctly in no-ad format', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:4NOAD/TB7' });
      
      // Play to deuce (40-40)
      match.addPoint(0); // 15-0
      match.addPoint(1); // 15-15
      match.addPoint(0); // 30-15
      match.addPoint(1); // 30-30
      match.addPoint(0); // 40-30
      match.addPoint(1); // 40-40 (deuce)
      
      expect(match.score().points).toBe('40-40');
      
      // Next point should win (no advantage in no-ad)
      match.addPoint(0);
      expect(match.score().games).toBe('1-0');
      expect(match.score().points).toBe('0-0');
    });
  });
  
  describe('Format Validation', () => {
    it('should handle undefined format gracefully', () => {
      // Create match without format
      const match = matchObject.Match({});
      
      // Should still be playable with default tennis scoring
      match.addPoint(0);
      // Default format uses tennis scoring (15-30-40), not tiebreak (1-2-3)
      expect(match.score().points).toBe('15-0');
    });
    
    it('should preserve format through match completion', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      // Play complete match
      for (let i = 0; i < 48; i++) match.addPoint(0); // 6-0, 6-0
      
      expect(match.complete()).toBe(true);
      expect(match.format.values.code).toBe('SET3-S:6/TB7');
    });
  });
  
  describe('Multiple Match Formats', () => {
    it('should handle different formats independently', () => {
      const match1 = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      const match2 = matchObject.Match({ matchUpFormat: 'SET5-S:6/TB7' });
      
      expect(match1.format.values.formatStructure.bestOf).toBe(3);
      expect(match2.format.values.formatStructure.bestOf).toBe(5);
      
      // Verify they don't interfere with each other
      match1.addPoint(0);
      match2.addPoint(1);
      
      expect(match1.score().points).toBe('15-0');
      expect(match2.score().points).toBe('0-15');
    });
  });
  
  describe('Supertiebreak Final Set', () => {
    it('should use point-based scoring in supertiebreak', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7-F:TB10' });
      
      // Play to third set
      for (let i = 0; i < 24; i++) match.addPoint(0);
      for (let i = 0; i < 24; i++) match.addPoint(1);
      
      // Third set should be supertiebreak (1-0, not 15-0)
      match.addPoint(0);
      expect(match.score().points).toBe('1-0');
      
      match.addPoint(1);
      expect(match.score().points).toBe('1-1');
      
      // Should win at 10 points
      for (let i = 0; i < 9; i++) match.addPoint(0);
      expect(match.complete()).toBe(true);
    });
  });
});
