/**
 * Test Factory validator integration with UMO
 */
import { describe, it, expect } from 'vitest';
import matchObject from '../../src/matchObject';
import { validateUMOScore, validateMatchUpScore } from '../../src/scoreValidator';

describe('Factory Validator Integration', () => {
  describe('validateUMOScore', () => {
    it('should validate a valid supertiebreak match', () => {
      const match = matchObject.Match({matchUpFormat: 'SET3-S:6/TB7-F:TB10'});
      
      // Set 1: 6-0
      for (let i = 0; i < 6; i++) match.addPoints('0000');
      
      // Set 2: 0-6
      for (let i = 0; i < 6; i++) match.addPoints('1111');
      
      // Set 3: Supertiebreak 10-8
      match.addPoints('0000000011'); // 10-0
      match.addPoints('11111111'); // 10-8
      
      const validation = validateUMOScore(match);
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });
    
    it('should detect invalid supertiebreak score (insufficient margin)', () => {
      const match = matchObject.Match({matchUpFormat: 'SET3-S:6/TB7-F:TB10'});
      
      // Set 1: 6-0 (player 0 wins)
      for (let i = 0; i < 6; i++) match.addPoints('0000');
      
      // Set 2: 0-6 (player 1 wins)
      for (let i = 0; i < 6; i++) match.addPoints('1111');
      
      // Set 3 (supertiebreak): Get to 10-11 (insufficient margin for completion)
      // Reach 10-10 by alternating, then add 1 point for player 1
      match.addPoints('01010101010101010101'); // 10-10
      match.addPoints('1'); // 10-11
      
      // With F:TB10 and winBy=2, score of 10-11 should NOT complete the match
      // Player 1 has 11 points but only a 1-point margin (needs 2)
      expect(match.complete()).toBe(false);
    });
    
    it('should validate Fast4 format', () => {
      const match = matchObject.Match({matchUpFormat: 'SET3-S:4NOAD/TB7-F:TB10'});
      
      // Set 1: 4-1
      for (let i = 0; i < 4; i++) match.addPoints('0000');
      for (let i = 0; i < 1; i++) match.addPoints('1111');
      
      // Set 2: 1-4
      for (let i = 0; i < 1; i++) match.addPoints('0000');
      for (let i = 0; i < 3; i++) match.addPoints('1111');
      
      // Set 3: Supertiebreak 10-5
      match.addPoints('0000000000'); // 10-0
      match.addPoints('11111'); // 10-5
      
      const validation = validateUMOScore(match);
      expect(validation.isValid).toBe(true);
      expect(match.complete()).toBe(true);
      expect(match.score().sets).toBe('2-1');
    });
  });
  
  describe('validateMatchUpScore - direct Factory validator', () => {
    it('should validate standard set scores', () => {
      const sets = [
        { side1Score: 6, side2Score: 4, winningSide: 1 },
        { side1Score: 4, side2Score: 6, winningSide: 2 },
        { side1Score: 6, side2Score: 3, winningSide: 1 },
      ];
      
      const result = validateMatchUpScore(sets, 'SET3-S:6/TB7');
      expect(result.isValid).toBe(true);
    });
    
    
    it('should validate supertiebreak scores', () => {
      const sets = [
        { side1Score: 6, side2Score: 4, winningSide: 1 },
        { side1Score: 3, side2Score: 6, winningSide: 2 },
        { 
          side1Score: 0, 
          side2Score: 0, 
          side1TiebreakScore: 10, 
          side2TiebreakScore: 12, 
          winningSide: 2 
        },
      ];
      
      const result = validateMatchUpScore(sets, 'SET3-S:6/TB7-F:TB10');
      expect(result.isValid).toBe(true);
    });
  });
  

});
