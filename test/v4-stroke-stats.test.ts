/**
 * V4 Stroke Statistics Tests
 * 
 * Tests forehand/backhand tracking in v4 statistics engine
 */

import { describe, it, expect } from 'vitest';
import { createV3Adapter } from '../src/v4/adapter/v3Adapter';

describe('V4 Stroke Statistics', () => {
  
  const testPoints = [
    // Game 1: Player 0 serving - forehand winners
    { winner: 0, result: "Ace", code: "A", server: 0 },
    { winner: 0, result: "Winner", code: "S", server: 0, hand: "Forehand", stroke: "Drive" },
    { winner: 0, result: "Winner", code: "S", server: 0, hand: "Forehand", stroke: "Volley" },
    { winner: 0, result: "Unforced Error", code: "S", server: 0, hand: "Forehand" },
    
    // Game 2: Player 1 serving - backhand shots
    { winner: 1, result: "Ace", code: "A", server: 1 },
    { winner: 1, result: "Winner", code: "S", server: 1, hand: "Backhand", stroke: "Drive" },
    { winner: 0, result: "Winner", code: "R", server: 1, hand: "Backhand", stroke: "Slice" },
    { winner: 1, result: "Unforced Error", code: "S", server: 1, hand: "Backhand" },
    
    // Game 3: Mixed strokes
    { winner: 0, result: "Winner", code: "R", server: 1, hand: "Forehand", stroke: "Drive" },
    { winner: 0, result: "Winner", code: "R", server: 1, hand: "Backhand", stroke: "Volley" },
    { winner: 1, result: "Winner", code: "S", server: 1, hand: "Forehand", stroke: "Overhead" },
    { winner: 0, result: "Unforced Error", code: "R", server: 1, hand: "Forehand" },
  ];

  it('should track forehand shots in counters', () => {
    const adapter = createV3Adapter();
    const match = adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    testPoints.forEach(point => {
      match.addPoint(point);
    });
    
    const counters = match.stats.counters();
    
    // Check if Forehand tracking exists
    expect(counters.teams[0].Forehand).toBeDefined();
    expect(counters.teams[1].Forehand).toBeDefined();
    
    // Count forehand shots
    const player0Forehand = counters.teams[0].Forehand?.length || 0;
    const player1Forehand = counters.teams[1].Forehand?.length || 0;
    
    console.log('Player 0 Forehand shots:', player0Forehand);
    console.log('Player 1 Forehand shots:', player1Forehand);
    
    // Player 0: 4 forehand shots (3 winners + 1 error)
    expect(player0Forehand).toBe(4);
    
    // Player 1: 1 forehand shot (1 overhead winner)
    expect(player1Forehand).toBe(1);
  });

  it('should track backhand shots in counters', () => {
    const adapter = createV3Adapter();
    const match = adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    testPoints.forEach(point => {
      match.addPoint(point);
    });
    
    const counters = match.stats.counters();
    
    // Check if Backhand tracking exists
    expect(counters.teams[0].Backhand).toBeDefined();
    expect(counters.teams[1].Backhand).toBeDefined();
    
    // Count backhand shots
    const player0Backhand = counters.teams[0].Backhand?.length || 0;
    const player1Backhand = counters.teams[1].Backhand?.length || 0;
    
    console.log('Player 0 Backhand shots:', player0Backhand);
    console.log('Player 1 Backhand shots:', player1Backhand);
    
    // Player 0: 1 backhand shot (1 volley winner)
    expect(player0Backhand).toBe(1);
    
    // Player 1: 2 backhand shots (1 drive winner + 1 error)
    expect(player1Backhand).toBe(2);
  });

  it('should preserve hand and stroke metadata in points', () => {
    const adapter = createV3Adapter();
    const match = adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    testPoints.forEach(point => {
      match.addPoint(point);
    });
    
    const counters = match.stats.counters();
    
    // Check forehand array has correct metadata
    const forehandPoints = counters.teams[0].Forehand || [];
    expect(forehandPoints.length).toBeGreaterThan(0);
    
    // First forehand point should have hand and stroke
    const firstForehand = forehandPoints[0]?.point;
    expect(firstForehand.hand).toBe('Forehand');
    expect(firstForehand.stroke).toBeDefined();
    
    console.log('First forehand point:', {
      hand: firstForehand.hand,
      stroke: firstForehand.stroke,
      result: firstForehand.result
    });
  });

  it('should track strokes by type (Drive, Volley, etc)', () => {
    const adapter = createV3Adapter();
    const match = adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    testPoints.forEach(point => {
      match.addPoint(point);
    });
    
    const counters = match.stats.counters();
    
    // Get all forehand shots
    const forehandShots = [
      ...(counters.teams[0].Forehand || []),
      ...(counters.teams[1].Forehand || [])
    ];
    
    // Check stroke types
    const drives = forehandShots.filter(s => s.point.stroke === 'Drive');
    const volleys = forehandShots.filter(s => s.point.stroke === 'Volley');
    
    console.log('Forehand Drives:', drives.length);
    console.log('Forehand Volleys:', volleys.length);
    
    expect(drives.length).toBeGreaterThan(0);
    expect(volleys.length).toBeGreaterThan(0);
  });

  it('should track stroke breakdown with results (Winner, Error, etc)', () => {
    const adapter = createV3Adapter();
    const match = adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    testPoints.forEach(point => {
      match.addPoint(point);
    });
    
    const counters = match.stats.counters();
    
    // Get all forehand shots for player 0
    const forehandShots = counters.teams[0].Forehand || [];
    
    // Break down by result
    const forehandWinners = forehandShots.filter(s => s.point.result === 'Winner');
    const forehandErrors = forehandShots.filter(s => s.point.result === 'Unforced Error');
    
    console.log('Player 0 Forehand Winners:', forehandWinners.length);
    console.log('Player 0 Forehand Errors:', forehandErrors.length);
    
    // Player 0: 3 forehand winners, 1 forehand error
    expect(forehandWinners.length).toBe(3);
    expect(forehandErrors.length).toBe(1);
  });
});
