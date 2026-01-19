// Factory Stringify Tests
// Tests Factory's matchUpFormatCode.stringify() function

import { describe, it, expect } from 'vitest';
import { matchUpFormatCode } from 'tods-competition-factory';

describe('Factory stringify() Function', () => {
  describe('Standard Format Objects to Strings', () => {
    it('should stringify best of 3 standard format', () => {
      const formatObj = {
        bestOf: 3,
        setFormat: {
          setTo: 6,
          tiebreakAt: 6,
          tiebreakFormat: { tiebreakTo: 7 }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('SET3-S:6/TB7');
    });

    it('should stringify best of 5 format', () => {
      const formatObj = {
        bestOf: 5,
        setFormat: {
          setTo: 6,
          tiebreakAt: 6,
          tiebreakFormat: { tiebreakTo: 7 }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('SET5-S:6/TB7');
    });

    it('should stringify pro set format', () => {
      const formatObj = {
        bestOf: 1,
        setFormat: {
          setTo: 8,
          tiebreakAt: 8,
          tiebreakFormat: { tiebreakTo: 7 }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('SET1-S:8/TB7');
    });

    it('should stringify no-ad format', () => {
      const formatObj = {
        bestOf: 3,
        setFormat: {
          setTo: 6,
          NoAD: true,
          tiebreakAt: 6,
          tiebreakFormat: { tiebreakTo: 7 }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('SET3-S:6NOAD/TB7');
    });
  });

  describe('Formats with Different Final Sets', () => {
    it('should stringify format with no tiebreak in final set', () => {
      const formatObj = {
        bestOf: 5,
        setFormat: {
          setTo: 6,
          tiebreakAt: 6,
          tiebreakFormat: { tiebreakTo: 7 }
        },
        finalSetFormat: {
          setTo: 6,
          noTiebreak: true
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('SET5-S:6/TB7-F:6');
    });

    it('should stringify format with match tiebreak as final set', () => {
      const formatObj = {
        bestOf: 3,
        setFormat: {
          setTo: 6,
          NoAD: true,
          tiebreakAt: 6,
          tiebreakFormat: { tiebreakTo: 7 }
        },
        finalSetFormat: {
          tiebreakSet: { tiebreakTo: 10 }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('SET3-S:6NOAD/TB7-F:TB10');
    });

    it('should stringify format with tiebreak at 12-12', () => {
      const formatObj = {
        bestOf: 5,
        setFormat: {
          setTo: 6,
          tiebreakAt: 6,
          tiebreakFormat: { tiebreakTo: 7 }
        },
        finalSetFormat: {
          setTo: 6,
          tiebreakAt: 12,
          tiebreakFormat: { tiebreakTo: 7 }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('SET5-S:6/TB7-F:6/TB7@12');
    });
  });

  describe('Timed Format Objects', () => {
    it('should stringify simple timed format', () => {
      const formatObj = {
        bestOf: 1,
        simplified: true,
        setFormat: {
          timed: true,
          minutes: 120
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('T120');
    });

    it('should stringify points-based timed format', () => {
      const formatObj = {
        bestOf: 1,
        simplified: true,
        setFormat: {
          timed: true,
          minutes: 120,
          based: 'P'
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('T120P');
    });

    it('should stringify games-based timed format', () => {
      const formatObj = {
        bestOf: 1,
        simplified: true,
        setFormat: {
          timed: true,
          minutes: 90,
          based: 'G'
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      // 'G' (games-based) is default, so Factory returns 'T90' not 'T90G'
      expect(result).toBe('T90');
    });

    it('should stringify advantage-based timed format', () => {
      const formatObj = {
        bestOf: 1,
        simplified: true,
        setFormat: {
          timed: true,
          minutes: 60,
          based: 'A'
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('T60A');
    });

    it('should stringify timed format with set tiebreak', () => {
      const formatObj = {
        bestOf: 1,
        simplified: true,
        setFormat: {
          timed: true,
          minutes: 10,
          tiebreakFormat: { tiebreakTo: 1 }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('T10/TB1');
    });
  });

  describe('Special Formats', () => {
    it('should stringify tiebreak-only format', () => {
      const formatObj = {
        bestOf: 3,
        setFormat: {
          tiebreakSet: { tiebreakTo: 10 }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('SET3-S:TB10');
    });

    it('should stringify format with tiebreak at custom point', () => {
      const formatObj = {
        bestOf: 1,
        setFormat: {
          setTo: 4,
          NoAD: true,
          tiebreakAt: 3,
          tiebreakFormat: { tiebreakTo: 7 }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('SET1-S:4NOAD/TB7@3');
    });

    it('should stringify format without tiebreak', () => {
      const formatObj = {
        bestOf: 3,
        setFormat: {
          setTo: 6,
          noTiebreak: true
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('SET3-S:6');
    });
  });

  describe('Round-Trip Conversion', () => {
    const testCases = [
      'SET3-S:6/TB7',
      'SET5-S:6/TB7',
      'SET1-S:8/TB7',
      'SET3-S:6NOAD/TB7',
      'SET5-S:6/TB7-F:6',
      'SET3-S:6NOAD/TB7-F:TB10',
      'SET5-S:6/TB7-F:6/TB7@12',
      'T120',
      'T120P',
      'T90',  // Changed from 'T90G' - 'G' is default and omitted by Factory
      'T60A',
      'SET3-S:TB10',
      'SET1-S:4NOAD/TB7@3',
      'SET3-S:6'
    ];

    testCases.forEach(originalFormat => {
      it(`should round-trip ${originalFormat}`, () => {
        const parsed = matchUpFormatCode.parse(originalFormat);
        expect(parsed).toBeDefined();
        
        const stringified = matchUpFormatCode.stringify(parsed);
        expect(stringified).toBe(originalFormat);
        
        // Parse again to ensure stability
        const reParsed = matchUpFormatCode.parse(stringified);
        expect(reParsed).toEqual(parsed);
      });
    });
  });

  describe('Invalid Input Handling', () => {
    it('should return undefined for empty object', () => {
      const result = matchUpFormatCode.stringify({});
      expect(result).toBeUndefined();
    });

    it('should return undefined for null', () => {
      const result = matchUpFormatCode.stringify(null);
      expect(result).toBeUndefined();
    });

    it('should return undefined for undefined', () => {
      const result = matchUpFormatCode.stringify(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined for invalid object', () => {
      const result = matchUpFormatCode.stringify({ invalid: true });
      expect(result).toBeUndefined();
    });

    it('should return undefined for object missing required fields', () => {
      const result = matchUpFormatCode.stringify({
        bestOf: 3
        // missing setFormat
      });
      expect(result).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly 1 set (no X suffix)', () => {
      const formatObj = {
        bestOf: 1,
        setFormat: {
          setTo: 6,
          tiebreakAt: 6,
          tiebreakFormat: { tiebreakTo: 7 }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('SET1-S:6/TB7');
    });

    it('should omit redundant tiebreakAt when equal to setTo', () => {
      const formatObj = {
        bestOf: 3,
        setFormat: {
          setTo: 6,
          tiebreakAt: 6,
          tiebreakFormat: { tiebreakTo: 7 }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('SET3-S:6/TB7');
      expect(result).not.toContain('@6');
    });

    it('should include tiebreakAt when different from setTo', () => {
      const formatObj = {
        bestOf: 1,
        setFormat: {
          setTo: 4,
          tiebreakAt: 3,
          tiebreakFormat: { tiebreakTo: 7 }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toContain('@3');
    });

    it('should handle format with false tiebreakTo', () => {
      const formatObj = {
        bestOf: 3,
        setFormat: {
          setTo: 6,
          noTiebreak: true,
          tiebreakAt: false,
          tiebreakFormat: { tiebreakTo: false }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      expect(result).toBe('SET3-S:6');
    });

    it('should not include final set code if equivalent to regular sets', () => {
      const formatObj = {
        bestOf: 3,
        setFormat: {
          setTo: 6,
          tiebreakAt: 6,
          tiebreakFormat: { tiebreakTo: 7 }
        },
        finalSetFormat: {
          setTo: 6,
          tiebreakAt: 6,
          tiebreakFormat: { tiebreakTo: 7 }
        }
      };
      
      const result = matchUpFormatCode.stringify(formatObj);
      // Should not include -F:6/TB7 since it's the same
      expect(result).toBe('SET3-S:6/TB7');
    });
  });
});
