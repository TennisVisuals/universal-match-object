/**
 * V3-V4 Parity Test
 * 
 * Direct comparison of V3 and V4 outputs to ensure they match exactly
 */

import { describe, test, expect } from 'vitest';
import { createV3Adapter } from '../../src/v4/adapter/v3Adapter';
import matchObject from '../../src/matchObject';

describe('V3-V4 Parity - sets().history.points()', () => {
  test('should have identical point scores between V3 and V4', () => {
    // Create V3 match
    const v3Match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    v3Match.metadata.definePlayer({ index: 0, firstName: 'Player', lastName: 'One' });
    v3Match.metadata.definePlayer({ index: 1, firstName: 'Player', lastName: 'Two' });

    // Create V4 match
    const umo = createV3Adapter();
    const v4Match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    v4Match.metadata.definePlayer({ index: 0, firstName: 'Player', lastName: 'One' });
    v4Match.metadata.definePlayer({ index: 1, firstName: 'Player', lastName: 'Two' });

    // Add points: '000011110000' pattern
    // This represents: Player 0 wins 4 points (game), Player 1 wins 4 points (game), Player 0 wins 4 points (game)
    const pattern = '000011110000';
    for (let i = 0; i < pattern.length; i++) {
      const winner = parseInt(pattern[i]);
      v3Match.addPoint(winner);
      v4Match.addPoint(winner);
    }

    // Get first set history from both
    const v3Sets = v3Match.sets();
    const v4Sets = v4Match.sets();

    expect(v3Sets.length).toBeGreaterThan(0);
    expect(v4Sets.length).toBeGreaterThan(0);

    const v3FirstSetPoints = v3Sets[0].history.points();
    const v4FirstSetPoints = v4Sets[0].history.points();

    console.log('\n=== V3 vs V4 Point History Comparison ===');
    console.log('V3 points count:', v3FirstSetPoints.length);
    console.log('V4 points count:', v4FirstSetPoints.length);
    
    // They should have the same number of points
    expect(v4FirstSetPoints.length).toBe(v3FirstSetPoints.length);

    // Compare each point's score attribute
    console.log('\n=== Score Comparison ===');
    for (let i = 0; i < v3FirstSetPoints.length; i++) {
      const v3Point = v3FirstSetPoints[i];
      const v4Point = v4FirstSetPoints[i];
      
      console.log(`Point ${i}:`, {
        v3Score: v3Point.score,
        v4Score: v4Point.score,
        v3Winner: v3Point.winner,
        v4Winner: v4Point.winner,
        v3Set: v3Point.set,
        v4Set: v4Point.set,
        v3Game: v3Point.game,
        v4Game: v4Point.game,
      });

      // Scores should match exactly
      expect(v4Point.score).toBe(v3Point.score);
      expect(v4Point.winner).toBe(v3Point.winner);
      expect(v4Point.set).toBe(v3Point.set);
      expect(v4Point.game).toBe(v3Point.game);
    }
  });

  test('should have correct scores at game boundaries', () => {
    // Create V4 match only to focus on the issue
    const umo = createV3Adapter();
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    match.metadata.definePlayer({ index: 0, firstName: 'Player', lastName: 'One' });
    match.metadata.definePlayer({ index: 1, firstName: 'Player', lastName: 'Two' });

    // First game: Player 0 wins 0-0, 15-0, 30-0, 40-0 (4 points)
    match.addPoint(0); // Should be 0-0 -> 15-0
    match.addPoint(0); // Should be 15-0 -> 30-0
    match.addPoint(0); // Should be 30-0 -> 40-0
    match.addPoint(0); // Should be 40-0 -> Game (0-0 for next game)

    // Second game: Player 1 wins
    match.addPoint(1); // Should be 0-0 -> 0-15 (NEW GAME - should start at 0-0)
    match.addPoint(1); // Should be 0-15 -> 0-30
    match.addPoint(1); // Should be 0-30 -> 0-40
    match.addPoint(1); // Should be 0-40 -> Game (0-0 for next game)

    // Third game: Player 0 wins
    match.addPoint(0); // Should be 0-0 -> 15-0 (NEW GAME - should start at 0-0)
    match.addPoint(0); // Should be 15-0 -> 30-0
    match.addPoint(0); // Should be 30-0 -> 40-0
    match.addPoint(0); // Should be 40-0 -> Game

    const sets = match.sets();
    const points = sets[0].history.points();

    console.log('\n=== Game Boundary Scores ===');
    points.forEach((point, i) => {
      console.log(`Point ${i}: game=${point.game}, score="${point.score}", winner=${point.winner}`);
    });

    // First point of first game should show 15-0
    expect(points[0].score).toBe('15-0');
    expect(points[0].game).toBe(0);

    // First point of second game (index 4) should have started from 0-0
    expect(points[4].score).toBe('0-15'); // After adding point to 0-0
    expect(points[4].game).toBe(1);

    // First point of third game (index 8) should have started from 0-0
    expect(points[8].score).toBe('15-0'); // After adding point to 0-0
    expect(points[8].game).toBe(2);
  });
});
