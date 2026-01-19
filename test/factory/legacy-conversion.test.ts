/**
 * Tests for legacy format conversion
 * 
 * These tests ensure that legacy match formats from older UMO versions
 * are correctly converted to Factory format codes when loaded.
 */

import { describe, it, expect } from 'vitest';
import { 
  convertLegacyToFactory, 
  parseFormat,
  isLegacyFormat,
  isFactoryFormat 
} from '../../src/formatConverter';

describe('Legacy Format Conversion', () => {
  describe('Match-Level Legacy Codes', () => {
    it('should convert 3_6a_7 to SET3-S:6/TB7', () => {
      const result = convertLegacyToFactory('3_6a_7');
      expect(result).toBe('SET3-S:6/TB7');
    });

    it('should convert 3_6n_7 to SET3-S:6NOAD/TB7', () => {
      const result = convertLegacyToFactory('3_6n_7');
      expect(result).toBe('SET3-S:6NOAD/TB7');
    });

    it('should convert 3_6n_10 (Fast4) to SET3-S:6NOAD/TB7-F:TB10', () => {
      const result = convertLegacyToFactory('3_6n_10');
      expect(result).toBe('SET3-S:6NOAD/TB7-F:TB10');
    });

    it('should convert 5_6a_7 to SET5-S:6/TB7', () => {
      const result = convertLegacyToFactory('5_6a_7');
      expect(result).toBe('SET5-S:6/TB7');
    });

    it('should convert 5_6a_7_long to SET5-S:6/TB7-F:6', () => {
      const result = convertLegacyToFactory('5_6a_7_long');
      expect(result).toBe('SET5-S:6/TB7-F:6');
    });

    it('should convert 1_8a_7 (pro set) to SET1-S:8/TB7', () => {
      const result = convertLegacyToFactory('1_8a_7');
      expect(result).toBe('SET1-S:8/TB7');
    });
  });

  describe('Format Detection', () => {
    it('should identify legacy format codes', () => {
      expect(isLegacyFormat('3_6a_7')).toBe(true);
      expect(isLegacyFormat('5_6a_7_long')).toBe(true);
      expect(isLegacyFormat('3_6n_10')).toBe(true);
    });

    it('should identify Factory format codes', () => {
      expect(isFactoryFormat('SET3-S:6/TB7')).toBe(true);
      expect(isFactoryFormat('SET5-S:6/TB7-F:6')).toBe(true);
      expect(isFactoryFormat('SET3-S:4NOAD/TB7-F:TB10')).toBe(true);
    });

    it('should not confuse legacy and Factory formats', () => {
      expect(isLegacyFormat('SET3-S:6/TB7')).toBe(false);
      expect(isFactoryFormat('3_6a_7')).toBe(false);
    });
  });

  describe('Loading Legacy Matches', () => {
    it('should parse and convert legacy format when loading match', () => {
      const parsed = parseFormat('3_6a_7');
      
      expect(parsed.isValid).toBe(true);
      expect(parsed.type).toBe('legacy');
      expect(parsed.factoryCode).toBe('SET3-S:6/TB7');
      
      // Verify the parsed structure is correct Factory format
      expect(parsed.format.bestOf).toBe(3);
      expect(parsed.format.setFormat.setTo).toBe(6);
      expect(parsed.format.setFormat.tiebreakAt).toBe(6);
      expect(parsed.format.setFormat.tiebreakFormat.tiebreakTo).toBe(7);
    });

    it('should handle Fast4 legacy format', () => {
      const parsed = parseFormat('3_6n_10');
      
      expect(parsed.isValid).toBe(true);
      expect(parsed.factoryCode).toBe('SET3-S:6NOAD/TB7-F:TB10');
      
      // Verify Fast4 attributes
      expect(parsed.format.setFormat.NoAD).toBe(true);
      expect(parsed.format.finalSetFormat?.tiebreakSet?.tiebreakTo).toBe(10);
    });
  });
});
