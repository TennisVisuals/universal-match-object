import { describe, it, expect } from 'vitest';
import umo from '../../src/index';

describe('Player Name Update Tests', () => {
  it('should update player name when calling definePlayer with new firstName/lastName', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    // Define initial player
    match.metadata.definePlayer({
      index: 0,
      firstName: 'Roger',
      lastName: 'Federer',
    });
    
    // Get initial player
    const initialPlayer = match.metadata.players(0);
    expect(initialPlayer.participantName).toBe('Roger Federer');
    expect(initialPlayer.person?.standardGivenName).toBe('Roger');
    expect(initialPlayer.person?.standardFamilyName).toBe('Federer');
    
    // Update player name
    match.metadata.definePlayer({
      index: 0,
      firstName: 'Rafael',
      lastName: 'Nadal',
    });
    
    // Get updated player
    const updatedPlayer = match.metadata.players(0);
    expect(updatedPlayer.participantName).toBe('Rafael Nadal');
    expect(updatedPlayer.person?.standardGivenName).toBe('Rafael');
    expect(updatedPlayer.person?.standardFamilyName).toBe('Nadal');
  });

  it('should update player name when calling definePlayer with existing index', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    // Define initial players
    match.metadata.definePlayer({ index: 0, firstName: 'Player', lastName: '1' });
    match.metadata.definePlayer({ index: 1, firstName: 'Player', lastName: '2' });
    
    const initialPlayers = match.metadata.players();
    expect(initialPlayers[0].participantName).toBe('Player 1');
    expect(initialPlayers[1].participantName).toBe('Player 2');
    
    // Update second player
    match.metadata.definePlayer({
      index: 1,
      firstName: 'New',
      lastName: 'Name',
    });
    
    const updatedPlayers = match.metadata.players();
    expect(updatedPlayers[0].participantName).toBe('Player 1'); // Unchanged
    expect(updatedPlayers[1].participantName).toBe('New Name'); // Updated!
    expect(updatedPlayers[1].person?.standardGivenName).toBe('New');
    expect(updatedPlayers[1].person?.standardFamilyName).toBe('Name');
  });

  it('should preserve participantId when updating player name', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    // Define initial player
    match.metadata.definePlayer({
      index: 0,
      firstName: 'Initial',
      lastName: 'Name',
    });
    
    const initialPlayer = match.metadata.players(0);
    const originalId = initialPlayer.participantId;
    
    // Update name
    match.metadata.definePlayer({
      index: 0,
      firstName: 'Updated',
      lastName: 'Name',
    });
    
    const updatedPlayer = match.metadata.players(0);
    expect(updatedPlayer.participantId).toBe(originalId); // Should be same
    expect(updatedPlayer.participantName).toBe('Updated Name');
  });

  it('should update only firstName', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    match.metadata.definePlayer({
      index: 0,
      firstName: 'Roger',
      lastName: 'Federer',
    });
    
    // Update only firstName
    match.metadata.definePlayer({
      index: 0,
      firstName: 'Rafael',
      lastName: 'Federer', // Keep same
    });
    
    const updatedPlayer = match.metadata.players(0);
    expect(updatedPlayer.participantName).toBe('Rafael Federer');
  });

  it('should update only lastName', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    match.metadata.definePlayer({
      index: 0,
      firstName: 'Roger',
      lastName: 'Federer',
    });
    
    // Update only lastName
    match.metadata.definePlayer({
      index: 0,
      firstName: 'Roger', // Keep same
      lastName: 'Nadal',
    });
    
    const updatedPlayer = match.metadata.players(0);
    expect(updatedPlayer.participantName).toBe('Roger Nadal');
  });

  it('should handle single-name updates', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    match.metadata.definePlayer({
      index: 0,
      firstName: 'Roger',
      lastName: '',
    });
    
    expect(match.metadata.players(0).participantName).toBe('Roger');
    
    // Update to full name
    match.metadata.definePlayer({
      index: 0,
      firstName: 'Roger',
      lastName: 'Federer',
    });
    
    expect(match.metadata.players(0).participantName).toBe('Roger Federer');
  });
});
