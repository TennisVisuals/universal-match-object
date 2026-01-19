import { describe, it, expect } from 'vitest';
import umo from '../../src/index';

describe('Participant Update Tests (TODS-native)', () => {
  it('should update participant by sideNumber', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    // Define initial participants
    match.metadata.definePlayer({ index: 0, firstName: 'Player', lastName: '1' });
    match.metadata.definePlayer({ index: 1, firstName: 'Player', lastName: '2' });
    
    // Update using TODS-native API with sideNumber
    match.metadata.updateParticipant({
      sideNumber: 1,  // Side 1 = index 0
      person: {
        standardGivenName: 'Roger',
        standardFamilyName: 'Federer',
      }
    });
    
    const players = match.metadata.players();
    expect(players[0].participantName).toBe('Roger Federer');
    expect(players[0].person?.standardGivenName).toBe('Roger');
    expect(players[0].person?.standardFamilyName).toBe('Federer');
    expect(players[1].participantName).toBe('Player 2'); // Unchanged
  });

  it('should update participant by participantId', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    match.metadata.definePlayer({ index: 0, firstName: 'Player', lastName: '1' });
    match.metadata.definePlayer({ index: 1, firstName: 'Player', lastName: '2' });
    
    const players = match.metadata.players();
    const playerId = players[1].participantId;
    
    // Update by participantId
    match.metadata.updateParticipant({
      participantId: playerId,
      person: {
        standardGivenName: 'Rafael',
        standardFamilyName: 'Nadal',
      }
    });
    
    const updated = match.metadata.players();
    expect(updated[1].participantName).toBe('Rafael Nadal');
    expect(updated[1].person?.standardGivenName).toBe('Rafael');
    expect(updated[1].person?.standardFamilyName).toBe('Nadal');
  });

  it('should update only standardGivenName', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    match.metadata.definePlayer({ index: 0, firstName: 'Roger', lastName: 'Federer' });
    
    match.metadata.updateParticipant({
      sideNumber: 1,
      person: {
        standardGivenName: 'Rafael',
      }
    });
    
    const player = match.metadata.players(0);
    expect(player.participantName).toBe('Rafael Federer');
    expect(player.person?.standardGivenName).toBe('Rafael');
    expect(player.person?.standardFamilyName).toBe('Federer'); // Preserved
  });

  it('should update only standardFamilyName', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    match.metadata.definePlayer({ index: 0, firstName: 'Roger', lastName: 'Federer' });
    
    match.metadata.updateParticipant({
      sideNumber: 1,
      person: {
        standardFamilyName: 'Nadal',
      }
    });
    
    const player = match.metadata.players(0);
    expect(player.participantName).toBe('Roger Nadal');
    expect(player.person?.standardGivenName).toBe('Roger'); // Preserved
    expect(player.person?.standardFamilyName).toBe('Nadal');
  });

  it('should add optional person fields', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    match.metadata.definePlayer({ index: 0, firstName: 'Roger', lastName: 'Federer' });
    
    match.metadata.updateParticipant({
      sideNumber: 1,
      person: {
        nationalityCode: 'SUI',
        sex: 'M',
      }
    });
    
    const player = match.metadata.players(0);
    expect(player.person?.nationalityCode).toBe('SUI');
    expect(player.person?.sex).toBe('M');
    expect(player.participantName).toBe('Roger Federer'); // Unchanged
  });

  it('should preserve participantId when updating', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    match.metadata.definePlayer({ index: 0, firstName: 'Initial', lastName: 'Name' });
    
    const originalId = match.metadata.players(0).participantId;
    
    match.metadata.updateParticipant({
      sideNumber: 1,
      person: {
        standardGivenName: 'Updated',
        standardFamilyName: 'Name',
      }
    });
    
    const updated = match.metadata.players(0);
    expect(updated.participantId).toBe(originalId); // Same ID
    expect(updated.participantName).toBe('Updated Name');
  });

  it('should throw error if sideNumber not found', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    // No participants defined yet
    expect(() => {
      match.metadata.updateParticipant({
        sideNumber: 1,
        person: { standardGivenName: 'Test' }
      });
    }).toThrow('No participant found on side 1');
  });

  it('should throw error if participantId not found', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    expect(() => {
      match.metadata.updateParticipant({
        participantId: 'nonexistent-id',
        person: { standardGivenName: 'Test' }
      });
    }).toThrow('Participant with ID nonexistent-id not found');
  });

  it('should throw error if neither sideNumber nor participantId provided', () => {
    const match = umo.Match({ matchUpFormat: 'SET3-S:6/TB7' });
    
    expect(() => {
      match.metadata.updateParticipant({
        person: { standardGivenName: 'Test' }
      } as any);
    }).toThrow('Must provide either sideNumber or participantId');
  });
});
