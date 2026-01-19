/**
 * 8-Game Pro Set Tests
 * 
 * Verifies that SET1-S:8/TB7 format works correctly
 * and set doesn't end at 6 games
 */

import { describe, it, expect } from 'vitest';
import umo from '../../src/matchObject';

describe('8-Game Pro Set Format', () => {
  
  it('should initialize with correct format structure', () => {
    const match = umo.Match({ matchUpFormat: 'SET1-S:8/TB7' });
    
    match.metadata.definePlayer({ index: 0, name: 'Player 1' });
    match.metadata.definePlayer({ index: 1, name: 'Player 2' });
    
    expect(match.format.code).toBe('SET1-S:8/TB7');
    expect(match.format.bestOf).toBe(1);
    
    // Check format structure
    const structure = match.format.structure;
    expect(structure.bestOf).toBe(1);
    expect(structure.setFormat.setTo).toBe(8);
    expect(structure.setFormat.tiebreakAt).toBe(8);
    
    // For single-set format, there should be NO finalSetFormat
    // or it should be the same as setFormat
    expect(structure.finalSetFormat).toBeUndefined();
  });
  
  it('should NOT end set at 6 games', () => {
    const match = umo.Match({ matchUpFormat: 'SET1-S:8/TB7' });
    
    match.metadata.definePlayer({ index: 0, name: 'Player 1' });
    match.metadata.definePlayer({ index: 1, name: 'Player 2' });
    
    // Play 6 games to Player 0 (24 points)
    for (let i = 0; i < 24; i++) {
      match.addPoint(0);
    }
    
    expect(match.complete()).toBe(false);
    expect(match.scoreboard()).toBe('6-0');
    
    // Should be able to continue
    const sets = match.sets();
    expect(sets.length).toBe(1);
    expect(sets[0].complete()).toBe(false);
  });
  
  it('should end set at 8 games', () => {
    const match = umo.Match({ matchUpFormat: 'SET1-S:8/TB7' });
    
    match.metadata.definePlayer({ index: 0, name: 'Player 1' });
    match.metadata.definePlayer({ index: 1, name: 'Player 2' });
    
    // Play 8 games to Player 0 (32 points)
    for (let i = 0; i < 32; i++) {
      match.addPoint(0);
    }
    
    expect(match.complete()).toBe(true);
    expect(match.scoreboard()).toBe('8-0');
    expect(match.winner()).toBe(0);
  });
  
  it('should play tiebreak at 8-8', () => {
    const match = umo.Match({ matchUpFormat: 'SET1-S:8/TB7' });
    
    match.metadata.definePlayer({ index: 0, name: 'Player 1' });
    match.metadata.definePlayer({ index: 1, name: 'Player 2' });
    
    // Play to 8-8 (16 games alternating)
    for (let g = 0; g < 16; g++) {
      const winner = g % 2; // Alternate games
      for (let p = 0; p < 4; p++) {
        match.addPoint(winner);
      }
    }
    
    expect(match.scoreboard()).toBe('8-8');
    expect(match.complete()).toBe(false);
    
    // Next point should be in tiebreak
    match.addPoint(0);
    const score = match.scoreboard();
    expect(score).toContain('8-8'); // Tiebreak in progress
  });
  
  it('should inspect decidingChildFormatStructure for single-set format', () => {
    const match = umo.Match({ matchUpFormat: 'SET1-S:8/TB7' });
    
    match.metadata.definePlayer({ index: 0, name: 'Player 1' });
    match.metadata.definePlayer({ index: 1, name: 'Player 2' });
    
    // Check the format structures
    const childFormat = match.format.childFormatStructure();
    const decidingFormat = match.format.decidingChildFormatStructure();
    
    console.log('childFormatStructure:', JSON.stringify(childFormat, null, 2));
    console.log('decidingChildFormatStructure:', JSON.stringify(decidingFormat, null, 2));
    
    // For a single-set format, deciding child should be same as child
    // or should have setTo: 8, NOT setTo: 6
    expect(decidingFormat.setTo).toBe(8);
  });
  
  // REMOVED: changeFormat() is deprecated - create new Match instead
  // it('should update decidingChildFormatStructure when changing format', () => {
  //   const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
  //   ...test changeFormat()...
  // });
  
  // REMOVED: changeFormat() is deprecated - create new Match instead
  // it('should update decidingChildFormatStructure when changing from single-set to multi-set', () => {
  //   const match = umo.Match({ matchUpFormat: 'SET1-S:8/TB7' });
  //   ...test changeFormat()...
  // });
  
  // REMOVED: changeFormat() is deprecated - create new Match instead
  // it('should maintain correct decidingChildFormatStructure through multiple format changes', () => {
  //   const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
  //   ...test changeFormat()...
  // });
  
  it('should handle reset and changeFormat maintaining correct structure', () => {
    const match = umo.Match({ matchUpFormat: 'SET1-S:8/TB7' });
    
    match.metadata.definePlayer({ index: 0, name: 'Player 1' });
    match.metadata.definePlayer({ index: 1, name: 'Player 2' });
    
    // Play some points
    for (let i = 0; i < 8; i++) {
      match.addPoint(0);
    }
    
    expect(match.scoreboard()).toBe('2-0');
    
    // Reset the match
    match.reset();
    
    // Verify structure is correct after reset (changeFormat removed)
    expect(match.format.code).toBe('SET1-S:8/TB7');
    expect(match.format.decidingChildFormatStructure().setTo).toBe(8);
    expect(match.scoreboard()).toBe('0-0');
  });
});
