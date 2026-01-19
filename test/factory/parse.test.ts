// Factory Parse Tests
// Tests Factory's matchUpFormatCode.parse() function

import { describe, it, expect } from 'vitest';
import { matchUpFormatCode } from 'tods-competition-factory';

describe('Factory parse() Function', () => {
  describe('Standard Formats', () => {
    it('should parse SET3-S:6/TB7 (standard best of 3)', () => {
      const result = matchUpFormatCode.parse('SET3-S:6/TB7');
      
      expect(result).toBeDefined();
      expect(result?.bestOf).toBe(3);
      expect(result?.setFormat).toMatchObject({
        setTo: 6,
        tiebreakAt: 6,
        tiebreakFormat: { tiebreakTo: 7 }
      });
    });

    it('should parse SET5-S:6/TB7 (best of 5)', () => {
      const result = matchUpFormatCode.parse('SET5-S:6/TB7');
      
      expect(result).toBeDefined();
      expect(result?.bestOf).toBe(5);
      expect(result?.setFormat?.setTo).toBe(6);
    });

    it('should parse SET1-S:8/TB7 (pro set)', () => {
      const result = matchUpFormatCode.parse('SET1-S:8/TB7');
      
      expect(result).toBeDefined();
      expect(result?.bestOf).toBe(1);
      expect(result?.setFormat?.setTo).toBe(8);
    });

    it('should parse SET3-S:4/TB7 (short sets)', () => {
      const result = matchUpFormatCode.parse('SET3-S:4/TB7');
      
      expect(result).toBeDefined();
      expect(result?.setFormat?.setTo).toBe(4);
    });

    it('should parse SET3-S:6NOAD/TB7 (no-ad)', () => {
      const result = matchUpFormatCode.parse('SET3-S:6NOAD/TB7');
      
      expect(result).toBeDefined();
      expect(result?.setFormat?.NoAD).toBe(true);
    });
  });

  describe('Formats with Different Final Sets', () => {
    it('should parse SET5-S:6/TB7-F:6 (no tiebreak in 5th)', () => {
      const result = matchUpFormatCode.parse('SET5-S:6/TB7-F:6');
      
      expect(result).toBeDefined();
      expect(result?.bestOf).toBe(5);
      expect(result?.setFormat?.setTo).toBe(6);
      expect(result?.finalSetFormat?.setTo).toBe(6);
      expect(result?.finalSetFormat?.noTiebreak).toBe(true);
    });

    it('should parse SET3-S:6/TB7-F:TB10 (match tiebreak 3rd)', () => {
      const result = matchUpFormatCode.parse('SET3-S:6/TB7-F:TB10');
      
      expect(result).toBeDefined();
      expect(result?.finalSetFormat?.tiebreakSet?.tiebreakTo).toBe(10);
    });

    it('should parse SET5-S:6/TB7-F:6/TB7@12 (Wimbledon 2019)', () => {
      const result = matchUpFormatCode.parse('SET5-S:6/TB7-F:6/TB7@12');
      
      expect(result).toBeDefined();
      expect(result?.finalSetFormat?.tiebreakAt).toBe(12);
      expect(result?.finalSetFormat?.tiebreakFormat?.tiebreakTo).toBe(7);
    });
  });

  describe('Timed Formats', () => {
    it('should parse T120 (120 minutes, games-based)', () => {
      const result = matchUpFormatCode.parse('T120');
      
      expect(result).toBeDefined();
      expect(result?.setFormat?.timed).toBe(true);
      expect(result?.setFormat?.minutes).toBe(120);
      expect(result?.simplified).toBe(true);
      expect(result?.bestOf).toBe(1);
    });

    it('should parse T120P (points-based)', () => {
      const result = matchUpFormatCode.parse('T120P');
      
      expect(result).toBeDefined();
      expect(result?.setFormat?.timed).toBe(true);
      expect(result?.setFormat?.minutes).toBe(120);
      expect(result?.setFormat?.based).toBe('P');
    });

    it('should parse T120G (games-based explicit)', () => {
      const result = matchUpFormatCode.parse('T120G');
      
      expect(result).toBeDefined();
      expect(result?.setFormat?.based).toBe('G');
    });

    it('should parse T120A (advantage-based)', () => {
      const result = matchUpFormatCode.parse('T120A');
      
      expect(result).toBeDefined();
      expect(result?.setFormat?.based).toBe('A');
    });

    it('should parse T10/TB1 (timed with set tiebreak)', () => {
      const result = matchUpFormatCode.parse('T10/TB1');
      
      expect(result).toBeDefined();
      expect(result?.setFormat?.tiebreakFormat?.tiebreakTo).toBe(1);
    });

    it('should parse SET3-S:T20-F:T60 (timed sets in match)', () => {
      const result = matchUpFormatCode.parse('SET3-S:T20-F:T60');
      
      expect(result).toBeDefined();
      expect(result?.setFormat?.timed).toBe(true);
      expect(result?.setFormat?.minutes).toBe(20);
      expect(result?.finalSetFormat?.minutes).toBe(60);
    });
  });

  describe('Special Formats', () => {
    it('should parse SET3-S:TB10 (tiebreak-only sets)', () => {
      const result = matchUpFormatCode.parse('SET3-S:TB10');
      
      expect(result).toBeDefined();
      expect(result?.setFormat?.tiebreakSet?.tiebreakTo).toBe(10);
    });

    it('should parse SET1-S:4NOAD/TB7@3 (Fast4 style)', () => {
      const result = matchUpFormatCode.parse('SET1-S:4NOAD/TB7@3');
      
      expect(result).toBeDefined();
      expect(result?.setFormat?.setTo).toBe(4);
      expect(result?.setFormat?.tiebreakAt).toBe(3);
      expect(result?.setFormat?.NoAD).toBe(true);
    });

    it('should parse SET3-S:6/TB7@12 (tiebreak at 12-12)', () => {
      const result = matchUpFormatCode.parse('SET3-S:6/TB7@12');
      
      expect(result).toBeDefined();
      expect(result?.setFormat?.tiebreakAt).toBe(12);
    });
  });

  describe('Invalid Formats', () => {
    it('should return undefined for empty string', () => {
      const result = matchUpFormatCode.parse('');
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid format', () => {
      const result = matchUpFormatCode.parse('INVALID');
      expect(result).toBeUndefined();
    });

    it('should return undefined for malformed SET code', () => {
      const result = matchUpFormatCode.parse('SET-S:6/TB7');
      expect(result).toBeUndefined();
    });

    it('should return undefined for malformed tiebreak', () => {
      const result = matchUpFormatCode.parse('SET3-S:6/TB');
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid numbers', () => {
      const result = matchUpFormatCode.parse('SETX-S:6/TB7');
      expect(result).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle SET1 (single set, no X suffix)', () => {
      const result = matchUpFormatCode.parse('SET1-S:6/TB7');
      
      expect(result).toBeDefined();
      expect(result?.bestOf).toBe(1);
    });

    it('should handle SET1X (exactly 1 set)', () => {
      const result = matchUpFormatCode.parse('SET1X-S:6/TB7');
      
      expect(result).toBeDefined();
      // Both treated as bestOf: 1
      expect(result?.bestOf).toBe(1);
    });

    // SET2X format removed - Factory doesn't support "exactly X sets" format
    // This is a Factory limitation, not a UMO issue

    it('should handle no tiebreak format', () => {
      const result = matchUpFormatCode.parse('SET3-S:6');
      
      expect(result).toBeDefined();
      expect(result?.setFormat?.setTo).toBe(6);
      expect(result?.setFormat?.noTiebreak).toBe(true);
    });
  });

  describe('Round-Trip Conversion', () => {
    const testFormats = [
      'SET3-S:6/TB7',
      'SET5-S:6/TB7-F:6',
      'SET3-S:6NOAD/TB7-F:TB10',
      'SET1-S:8/TB7',
      'T120P',
      'SET3-S:TB10'
    ];

    testFormats.forEach(format => {
      it(`should parse and stringify ${format}`, () => {
        const parsed = matchUpFormatCode.parse(format);
        expect(parsed).toBeDefined();
        
        const stringified = matchUpFormatCode.stringify(parsed);
        expect(stringified).toBe(format);
      });
    });
  });
});
