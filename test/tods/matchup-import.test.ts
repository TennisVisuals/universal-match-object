/**
 * MatchUp Import Tests
 * 
 * Test conversion from TODS MatchUp to UMO internal structure.
 */

import { describe, it, expect } from 'vitest';
import matchObject from '../../src/matchObject';
import '../../src/matchUpAdapter'; // IMPORTANT: Import to register globally
import type { MatchUp, Participant } from '../../src/types/tods';

describe('MatchUp Import (TODS → UMO)', () => {
  
  describe('Basic Import', () => {
    
    it('should import minimal TODS MatchUp', () => {
      const matchUp: MatchUp = {
        matchUpId: 'match-456',
        matchUpFormat: 'SET3-S:6/TB7',
        matchUpType: 'SINGLES',
        matchUpStatus: 'TO_BE_PLAYED',
        createdAt: new Date().toISOString()
      };
      
      const match = matchObject.fromMatchUp(matchUp);
      
      expect(match).toBeDefined();
      expect(match.metadata.match.id).toBe('match-456');
      expect(match.format.code).toBe('SET3-S:6/TB7');
    });
    
    it('should import MatchUp with participants', () => {
      const p1: Participant = {
        participantId: 'p1',
        participantName: 'Roger Federer',
        participantType: 'INDIVIDUAL',
        participantRole: 'COMPETITOR'
      };
      
      const p2: Participant = {
        participantId: 'p2',
        participantName: 'Rafael Nadal',
        participantType: 'INDIVIDUAL',
        participantRole: 'COMPETITOR'
      };
      
      const matchUp: MatchUp = {
        matchUpId: 'match-456',
        matchUpFormat: 'SET3-S:6/TB7',
        matchUpType: 'SINGLES',
        matchUpStatus: 'TO_BE_PLAYED',
        sides: [
          {
            sideNumber: 1,
            participantId: 'p1',
            participant: p1
          },
          {
            sideNumber: 2,
            participantId: 'p2',
            participant: p2
          }
        ]
      };
      
      const match = matchObject.fromMatchUp(matchUp);
      
      const participants = match.participants();
      expect(participants).toHaveLength(2);
      expect(participants[0].participantName).toBe('Roger Federer');
      expect(participants[1].participantName).toBe('Rafael Nadal');
    });
    
    it('should import DOUBLES matchUpType', () => {
      const matchUp: MatchUp = {
        matchUpId: 'match-456',
        matchUpFormat: 'SET3-S:6/TB7',
        matchUpType: 'DOUBLES',
        matchUpStatus: 'TO_BE_PLAYED'
      };
      
      const match = matchObject.fromMatchUp(matchUp);
      
      expect(match.doubles()).toBe(true);
    });
  });
  
  describe('Round-Trip Tests', () => {
    
    it('should preserve match data in round-trip (UMO → TODS → UMO)', () => {
      const p1: Participant = {
        participantId: 'p1',
        participantName: 'Roger Federer',
        participantType: 'INDIVIDUAL',
        participantRole: 'COMPETITOR'
      };
      
      const p2: Participant = {
        participantId: 'p2',
        participantName: 'Rafael Nadal',
        participantType: 'INDIVIDUAL',
        participantRole: 'COMPETITOR'
      };
      
      // Create original match
      const original = matchObject.Match({
        matchUpFormat: 'SET3-S:6/TB7',
        matchUpId: 'round-trip-test'
      });
      
      original.participants([p1, p2]);
      
      // Export to TODS
      const matchUp = original.toMatchUp();
      
      // Import back to UMO
      const reimported = matchObject.fromMatchUp(matchUp);
      
      // Verify
      expect(reimported.metadata.match.id).toBe('round-trip-test');
      expect(reimported.format.code).toBe('SET3-S:6/TB7');
      expect(reimported.participants()).toHaveLength(2);
    });
    
    it('should preserve format in round-trip', () => {
      const original = matchObject.Match({
        matchUpFormat: 'SET3-S:6/TB7',
        matchUpId: 'format-test'
      });
      
      const matchUp = original.toMatchUp();
      const reimported = matchObject.fromMatchUp(matchUp);
      
      expect(reimported.format.code).toBe('SET3-S:6/TB7');
      expect(original.format.bestOf).toBe(reimported.format.bestOf);
      expect(original.format.setsToWin).toBe(reimported.format.setsToWin);
    });
    
    it('should preserve doubles status in round-trip', () => {
      const original = matchObject.Match({
        matchUpFormat: 'SET3-S:6/TB7'
      });
      
      original.doubles(true); // Set doubles mode on (true argument required)
      
      const matchUp = original.toMatchUp();
      expect(matchUp.matchUpType).toBe('DOUBLES');
      
      const reimported = matchObject.fromMatchUp(matchUp);
      expect(reimported.doubles()).toBe(true);
    });
  });
  
  describe('Score Import', () => {
    
    it('should handle matchUp with completed score', () => {
      const matchUp: MatchUp = {
        matchUpId: 'completed-match',
        matchUpFormat: 'SET3-S:6/TB7',
        matchUpType: 'SINGLES',
        matchUpStatus: 'COMPLETED',
        winningSide: 1,
        score: {
          scoreStringSide1: '6 6',
          scoreStringSide2: '4 3',
          sets: [
            {
              setNumber: 1,
              side1Score: 6,
              side2Score: 4
            },
            {
              setNumber: 2,
              side1Score: 6,
              side2Score: 3
            }
          ]
        }
      };
      
      const match = matchObject.fromMatchUp(matchUp);
      
      expect(match).toBeDefined();
      expect(match.metadata.match.id).toBe('completed-match');
      // Note: Score reconstruction is not yet implemented
      // This test documents the current behavior
    });
  });
});
