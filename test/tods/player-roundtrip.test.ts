import { describe, it, expect } from 'vitest';
import umo from '../../src/index';

describe('Player Round-Trip Tests', () => {
  
  it('should round-trip players with firstName/lastName', () => {
    // Create match and define players with firstName/lastName
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    match.metadata.definePlayer({
      index: 0,
      firstName: 'Roger',
      lastName: 'Federer',
    });
    
    match.metadata.definePlayer({
      index: 1,
      firstName: 'Rafael',
      lastName: 'Nadal',
    });
    
    // Get players back
    const players = match.metadata.players();
    
    console.log('Players after definePlayer:', players);
    
    // Verify participantName was generated
    expect(players[0].participantName).toBe('Roger Federer');
    expect(players[1].participantName).toBe('Rafael Nadal');
    
    // Verify person details
    expect(players[0].person?.standardGivenName).toBe('Roger');
    expect(players[0].person?.standardFamilyName).toBe('Federer');
    expect(players[1].person?.standardGivenName).toBe('Rafael');
    expect(players[1].person?.standardFamilyName).toBe('Nadal');
  });
  
  it('should round-trip players with legacy name parameter', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    match.metadata.definePlayer({
      index: 0,
      name: 'Roger Federer',
    });
    
    match.metadata.definePlayer({
      index: 1,
      name: 'Rafael Nadal',
    });
    
    const players = match.metadata.players();
    
    console.log('Players after definePlayer with name:', players);
    
    // Verify participantName
    expect(players[0].participantName).toBe('Roger Federer');
    expect(players[1].participantName).toBe('Rafael Nadal');
    
    // Verify person details were split correctly
    expect(players[0].person?.standardGivenName).toBe('Roger');
    expect(players[0].person?.standardFamilyName).toBe('Federer');
    expect(players[1].person?.standardGivenName).toBe('Rafael');
    expect(players[1].person?.standardFamilyName).toBe('Nadal');
  });
  
  it('should export and import players correctly', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    match.metadata.definePlayer({
      index: 0,
      firstName: 'Player',
      lastName: 'One',
    });
    
    match.metadata.definePlayer({
      index: 1,
      firstName: 'Player',
      lastName: 'Two',
    });
    
    // Export to TODS format
    const exported = match.toMatchUp();
    
    console.log('Exported matchUp:', exported);
    console.log('Exported sides:', exported.sides);
    
    // Verify export has proper participant structure
    expect(exported.sides).toBeDefined();
    expect(exported.sides).toHaveLength(2);
    
    // Check participant structure
    if (exported.sides?.[0]?.participant) {
      console.log('Side 0 participant:', exported.sides[0].participant);
      expect(exported.sides[0].participant.participantName).toBe('Player One');
      expect(exported.sides[0].participant.person?.standardGivenName).toBe('Player');
      expect(exported.sides[0].participant.person?.standardFamilyName).toBe('One');
    }
    
    if (exported.sides?.[1]?.participant) {
      console.log('Side 1 participant:', exported.sides[1].participant);
      expect(exported.sides[1].participant.participantName).toBe('Player Two');
      expect(exported.sides[1].participant.person?.standardGivenName).toBe('Player');
      expect(exported.sides[1].participant.person?.standardFamilyName).toBe('Two');
    }
    
    // Import back
    const imported = umo.Match({ matchUp: exported });
    const importedPlayers = imported.metadata.players();
    
    console.log('Imported players:', importedPlayers);
    
    // Verify round-trip
    expect(importedPlayers[0].participantName).toBe('Player One');
    expect(importedPlayers[1].participantName).toBe('Player Two');
    expect(importedPlayers[0].person?.standardGivenName).toBe('Player');
    expect(importedPlayers[0].person?.standardFamilyName).toBe('One');
  });
  
  it('should handle single-name players correctly', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    match.metadata.definePlayer({
      index: 0,
      firstName: 'Novak',
      lastName: '',
    });
    
    const players = match.metadata.players();
    
    console.log('Single name player:', players[0]);
    
    expect(players[0].participantName).toBe('Novak');
    expect(players[0].person?.standardGivenName).toBe('Novak');
    expect(players[0].person?.standardFamilyName).toBe('');
  });
});
