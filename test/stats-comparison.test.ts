/**
 * Stats Comparison Test
 * 
 * Tests that v3 and v4 produce equivalent statistics for the same point sequence.
 * Uses real point data from hive-eye browser testing.
 */

import { describe, it, expect } from 'vitest';
import matchObject from '../src/matchObject';
import { createV3Adapter } from '../src/v4/adapter/v3Adapter';

describe('Stats Comparison: v3 vs v4', () => {
  // Real point data from browser console
  const testPoints = [
    { code: "A", server: 0, result: "Ace", winner: 0 },
    { code: "A", server: 0, result: "Ace", winner: 0 },
    { code: "A", server: 0, result: "Ace", winner: 0 },
    { code: "A", server: 0, result: "Ace", winner: 0 },
    { code: "A", server: 1, result: "Ace", winner: 1 },
    { code: "A", server: 1, result: "Ace", winner: 1 },
    { code: "A", server: 1, result: "Ace", winner: 1 },
    { code: "A", server: 1, result: "Ace", winner: 1 },
    { code: "A", server: 0, result: "Ace", winner: 0 },
    { winner: 1, result: "Winner", code: "R", server: 0 },
    { winner: 1, result: "Winner", code: "R", server: 0 },
    { winner: 0, result: "Forced Error", code: "S", server: 0 },
    { winner: 0, result: "Unforced Error", code: "S", server: 0 },
    { winner: 0, result: "Forced Error", code: "S", server: 0 },
  ];

  it('v3 should calculate stats correctly', () => {
    const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    // Check what v3 stores for points
    testPoints.forEach((point, i) => {
      match.addPoint(point);
      if (i < 3) {
        const history = match.history.points();
        console.log(`V3 Point ${i}:`, history[i]);
      }
    });
    
    const stats = match.stats.calculated();
    console.log('V3 Stats:', JSON.stringify(stats.slice(0, 3), null, 2));
    
    // Find specific stats
    const aces = stats.find((s: any) => s.category === 'Aces');
    const winners = stats.find((s: any) => s.category === 'Winners');
    const unforcedErrors = stats.find((s: any) => s.category === 'Unforced Errors');
    const forcedErrors = stats.find((s: any) => s.category === 'Forced Errors');
    
    expect(aces).toBeDefined();
    expect(aces.teams[0].value).toBe(5); // Player 0: 5 aces
    expect(aces.teams[1].value).toBe(4); // Player 1: 4 aces
    
    expect(winners).toBeDefined();
    expect(winners.teams[0].value).toBeGreaterThan(0);
    expect(winners.teams[1].value).toBeGreaterThan(0);
  });

  it('v4 should calculate stats correctly', () => {
    const adapter = createV3Adapter();
    const match = adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    // Check what v4 stores for points
    testPoints.forEach((point, i) => {
      match.addPoint(point);
      if (i < 3) {
        const matchUp = match._matchUp();
        console.log(`V4 Point ${i}:`, matchUp.history?.points[i]);
      }
    });
    
    const stats = match.stats.calculated();
    console.log('V4 Stats:', JSON.stringify(stats.slice(0, 3), null, 2));
    
    // Find specific stats
    const aces = stats.find((s: any) => s.category === 'Aces');
    const winners = stats.find((s: any) => s.category === 'Winners');
    const unforcedErrors = stats.find((s: any) => s.category === 'Unforced Errors');
    const forcedErrors = stats.find((s: any) => s.category === 'Forced Errors');
    
    expect(aces).toBeDefined();
    expect(aces.teams[0].value).toBe(5); // Player 0: 5 aces
    expect(aces.teams[1].value).toBe(4); // Player 1: 4 aces
    
    expect(winners).toBeDefined();
    expect(winners.teams[0].value).toBeGreaterThan(0);
    expect(winners.teams[1].value).toBeGreaterThan(0);
  });

  it('v3 and v4 should produce identical stats', () => {
    // Create both matches
    const matchV3 = matchObject.Match();
    const adapter = createV3Adapter();
    const matchV4 = adapter.Match();
    
    // Add same points to both
    testPoints.forEach(point => {
      matchV3.addPoint(point);
      matchV4.addPoint(point);
    });
    
    // Get stats from both
    const statsV3 = matchV3.stats.calculated();
    const statsV4 = matchV4.stats.calculated();
    
    console.log('V3 Stats count:', statsV3.length);
    console.log('V4 Stats count:', statsV4.length);
    
    // Should have same number of stats
    expect(statsV4.length).toBe(statsV3.length);
    
    // Compare each stat category
    statsV3.forEach((statV3: any) => {
      const statV4 = statsV4.find((s: any) => s.category === statV3.category);
      
      console.log(`\nComparing ${statV3.category}:`);
      console.log('  V3:', statV3.teams.map((t: any) => t.value));
      console.log('  V4:', statV4?.teams.map((t: any) => t.value));
      
      expect(statV4).toBeDefined();
      expect(statV4.teams[0].value).toBe(statV3.teams[0].value);
      expect(statV4.teams[1].value).toBe(statV3.teams[1].value);
    });
  });

  it('v4 should have points in matchUp.history', () => {
    const adapter = createV3Adapter();
    const match = adapter.Match();
    
    // Add points
    testPoints.forEach(point => {
      match.addPoint(point);
    });
    
    // Check internal matchUp
    const matchUp = match._matchUp();
    console.log('matchUp.history.points length:', matchUp.history?.points?.length);
    console.log('First 3 points:', matchUp.history?.points?.slice(0, 3));
    
    expect(matchUp.history).toBeDefined();
    expect(matchUp.history.points).toBeDefined();
    expect(matchUp.history.points.length).toBe(testPoints.length);
    
    // Check that points have result field
    matchUp.history.points.forEach((p: any, i: number) => {
      console.log(`Point ${i}:`, { result: p.result, winner: p.winner, server: p.server });
      expect(p.result).toBeDefined();
      expect(p.winner).toBeDefined();
    });
  });
});
