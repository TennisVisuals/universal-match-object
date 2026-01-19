import { describe, it, expect } from 'vitest';
import matchObject from '../../src/matchObject';

/**
 * Tests for matchUpFormat parameter
 * 
 * This test suite was added after discovering a critical bug where the
 * function parameter was still named 'matchFormat' but code checked 'matchUpFormat',
 * causing formatStructure to always be undefined.
 * 
 * Bug: Third set would count total match points (25-24, 26-24...) instead of
 * using tennis scoring (15-0, 30-0, 40-0).
 */
describe('matchUpFormat Parameter (Bug Coverage)', () => {
  
  it('should accept matchUpFormat parameter and apply format correctly', () => {
    const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    // Verify format was applied
    expect(match.format.values.code).toBe('SET3-S:6/TB7');
    expect(match.format.values.formatStructure).toBeDefined();
    expect(match.format.values.childFormatStructure).toBeDefined();
  });
  
  it('should use tennis scoring in third set (not match point counting)', () => {
    const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    // Play to 1-1 in sets
    for (let i = 0; i < 24; i++) match.addPoint(0); // First set 6-0
    for (let i = 0; i < 24; i++) match.addPoint(1); // Second set 0-6
    
    // Check third set uses tennis scoring
    match.addPoint(0);
    expect(match.score().points).toBe('15-0'); // Not '25-24'
    
    match.addPoint(0);
    expect(match.score().points).toBe('30-0'); // Not '26-24'
    
    match.addPoint(0);
    expect(match.score().points).toBe('40-0'); // Not '27-24'
    
    match.addPoint(0);
    expect(match.score().points).toBe('0-0'); // Game won
    expect(match.score().games).toBe('1-0');
  });
  
  it('should parse format structure correctly', () => {
    const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    const structure = match.format.values.formatStructure;
    
    expect(structure).toBeDefined();
    expect(structure.bestOf).toBe(3);
    expect(structure.setFormat).toBeDefined();
    expect(structure.setFormat.setTo).toBe(6);
    expect(structure.setFormat.tiebreakAt).toBe(6);
    expect(structure.setFormat.tiebreakFormat.tiebreakTo).toBe(7);
  });
  
  it('should handle no-ad format correctly', () => {
    const match = matchObject.Match({ matchUpFormat: 'SET3-S:6NOAD/TB7' });
    
    expect(match.format.values.code).toBe('SET3-S:6NOAD/TB7');
    expect(match.format.values.formatStructure.setFormat.NoAD).toBe(true);
  });
  
  it('should handle final set tiebreak correctly', () => {
    const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7-F:TB10' });
    
    expect(match.format.values.code).toBe('SET3-S:6/TB7-F:TB10');
    expect(match.format.values.decidingChildFormatStructure).toBeDefined();
    expect(match.format.values.decidingChildFormatStructure.tiebreakSet?.tiebreakTo).toBe(10);
  });
  
  it('should handle best of 5 format', () => {
    const match = matchObject.Match({ matchUpFormat: 'SET5-S:6/TB7' });
    
    expect(match.format.values.formatStructure.bestOf).toBe(5);
  });
  
  it('should apply format to all sets consistently', () => {
    const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    // Play complete match
    for (let i = 0; i < 24; i++) match.addPoint(0); // Set 1: 6-0
    expect(match.sets().length).toBe(1);
    expect(match.sets()[0]!.format.values.formatStructure).toBeDefined();
    
    for (let i = 0; i < 24; i++) match.addPoint(1); // Set 2: 0-6
    expect(match.sets().length).toBe(2);
    expect(match.sets()[1]!.format.values.formatStructure).toBeDefined();
    
    match.addPoint(0); // Start set 3
    expect(match.sets().length).toBe(3);
    expect(match.sets()[2]!.format.values.formatStructure).toBeDefined();
  });
  
  it('should work with matchUp alias', () => {
    const matchUp = matchObject.matchUp({ matchUpFormat: 'SET3-S:6/TB7' });
    
    expect(matchUp.format.values.code).toBe('SET3-S:6/TB7');
    expect(matchUp.format.values.formatStructure).toBeDefined();
  });
});
