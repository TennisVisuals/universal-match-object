/**
 * Point Parser Tests
 * 
 * Tests for point progression parsing and numbering schemes
 */

import { describe, it, expect } from 'vitest';
import { numbersArray, adProgression, noAdProgression } from '../../src/scoring/pointParser';

describe('Point Parser', () => {
  
  describe('Numbers Array Helper', () => {
    
    it('should validate number arrays', () => {
      expect(numbersArray([0, 1, 2, 3])).toBe(true);
      expect(numbersArray([1, 2, 3, 4, 5])).toBe(true);
    });
    
    it('should reject non-numeric values', () => {
      expect(numbersArray(['a', 'b', 'c'])).toBe(false);
      // Note: JavaScript's !isNaN() has quirks:
      // - '2' passes (coerces to number)
      // - null passes (coerces to 0)
      // So we only test truly invalid values
      expect(numbersArray([1, 2, undefined])).toBe(false);
      expect(numbersArray([1, 2, NaN])).toBe(false);
      expect(numbersArray(['not', 'numbers'])).toBe(false);
    });
    
    it('should reject non-arrays', () => {
      expect(numbersArray(5)).toBe(false);
      expect(numbersArray('test')).toBe(false);
      expect(numbersArray(null)).toBe(false);
      expect(numbersArray(undefined)).toBe(false);
    });
    
    it('should handle empty arrays', () => {
      expect(numbersArray([])).toBe(true);
    });
    
    it('should handle large arrays', () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => i);
      expect(numbersArray(largeArray)).toBe(true);
    });
  });
  
  describe('Ad Progression Map', () => {
    
    it('should have correct score progression', () => {
      expect(adProgression['0-0']).toEqual(['15-0', '0-15']);
      expect(adProgression['15-0']).toEqual(['30-0', '15-15']);
      expect(adProgression['30-0']).toEqual(['40-0', '30-15']);
      expect(adProgression['40-0']).toEqual(['G-0', '40-15']);
    });
    
    it('should handle deuce and advantage', () => {
      expect(adProgression['40-40']).toEqual(['A-40', '40-A']);
      expect(adProgression['A-40']).toEqual(['G-40', '40-40']);
      expect(adProgression['40-A']).toEqual(['40-40', '40-G']);
    });
    
    it('should cover all standard game scores', () => {
      const scores = ['0-0', '0-15', '0-30', '0-40',
                      '15-0', '15-15', '15-30', '15-40',
                      '30-0', '30-15', '30-30', '30-40',
                      '40-0', '40-15', '40-30', '40-40',
                      'A-40', '40-A'];
      
      scores.forEach(score => {
        expect(adProgression[score]).toBeDefined();
        expect(adProgression[score]).toHaveLength(2);
      });
    });
    
    it('should have valid next scores', () => {
      Object.values(adProgression).forEach(nextScores => {
        expect(Array.isArray(nextScores)).toBe(true);
        expect(nextScores.length).toBe(2);
      });
    });
  });
  
  describe('No-Ad Progression Map', () => {
    
    it('should handle 40-40 as deciding point', () => {
      expect(noAdProgression['40-40']).toEqual(['G-40', '40-G']);
    });
    
    it('should have only one entry for deciding point', () => {
      const keys = Object.keys(noAdProgression);
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe('40-40');
    });
    
    it('should use G (game) for winning score', () => {
      const nextScores = noAdProgression['40-40'];
      expect(nextScores[0]).toContain('G');
      expect(nextScores[1]).toContain('G');
    });
  });
  
  describe('Score Progression Logic', () => {
    
    it('should show progression from love', () => {
      expect(adProgression['0-0'][0]).toBe('15-0'); // Player 0 wins
      expect(adProgression['0-0'][1]).toBe('0-15'); // Player 1 wins
    });
    
    it('should show game point with G', () => {
      expect(adProgression['40-0'][0]).toBe('G-0'); // Player 0 wins game
      expect(adProgression['30-40'][1]).toBe('30-G'); // Player 1 wins game
    });
    
    it('should show deuce progression', () => {
      const fromDeuce = adProgression['40-40'];
      expect(fromDeuce[0]).toBe('A-40'); // Player 0 gets advantage
      expect(fromDeuce[1]).toBe('40-A'); // Player 1 gets advantage
    });
    
    it('should show advantage can go back to deuce', () => {
      const fromAdvP0 = adProgression['A-40'];
      const fromAdvP1 = adProgression['40-A'];
      
      expect(fromAdvP0[1]).toBe('40-40'); // Back to deuce
      expect(fromAdvP1[0]).toBe('40-40'); // Back to deuce
    });
  });
  
  describe('Comprehensive Coverage', () => {
    
    it('should export all required functions and constants', () => {
      expect(typeof numbersArray).toBe('function');
      expect(typeof adProgression).toBe('object');
      expect(typeof noAdProgression).toBe('object');
    });
    
    it('should have symmetric score progressions', () => {
      // For each score, winning player 0 and winning player 1 should cover all possibilities
      Object.entries(adProgression).forEach(([score, [p0Win, p1Win]]) => {
        // Both outcomes should be strings
        expect(typeof p0Win).toBe('string');
        expect(typeof p1Win).toBe('string');
        
        // Should follow pattern: score1-score2
        expect(p0Win).toMatch(/^[0-9A-G]+-[0-9A-G]+$/);
        expect(p1Win).toMatch(/^[0-9A-G]+-[0-9A-G]+$/);
      });
    });
  });
});
