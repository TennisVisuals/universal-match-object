/**
 * MatchUp Export Tests
 * 
 * Test conversion from UMO internal structure to TODS MatchUp format.
 */

import { describe, it, expect } from 'vitest';
import matchObject from '../../src/matchObject';
import '../../src/matchUpAdapter'; // IMPORTANT: Import to register globally
import { MatchUpAdapter } from '../../src/matchUpAdapter';
import type { Participant } from '../../src/types/tods';
import { INDIVIDUAL, COMPETITOR, SINGLES, DOUBLES, TO_BE_PLAYED, IN_PROGRESS, COMPLETED } from '../../src/constants';

describe('MatchUp Export (UMO → TODS)', () => {
  
  describe('Basic Export', () => {
    
    it('should export match to TODS MatchUp', () => {
      const p1: Participant = {
        participantId: 'p1',
        participantName: 'Roger Federer',
        participantType: INDIVIDUAL,
        participantRole: COMPETITOR
      };
      
      const p2: Participant = {
        participantId: 'p2',
        participantName: 'Rafael Nadal',
        participantType: INDIVIDUAL,
        participantRole: COMPETITOR
      };
      
      const match = matchObject.Match({
        matchUpFormat: 'SET3-S:6/TB7',
        matchUpId: 'match-123'
      });
      
      match.participants([p1, p2]);
      
      const matchUp = match.toMatchUp();
      
      expect(matchUp.matchUpId).toBe('match-123');
      expect(matchUp.matchUpFormat).toBe('SET3-S:6/TB7');
      expect(matchUp.matchUpType).toBe(SINGLES);
      expect(matchUp.matchUpStatus).toBe(TO_BE_PLAYED);
      expect(matchUp.sides).toHaveLength(2);
    });
    
    it('should include participant details in sides', () => {
      const p1: Participant = {
        participantId: 'p1',
        participantName: 'Roger Federer',
        participantType: INDIVIDUAL
      };
      
      const p2: Participant = {
        participantId: 'p2',
        participantName: 'Rafael Nadal',
        participantType: INDIVIDUAL
      };
      
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      match.participants([p1, p2]);
      
      const matchUp = match.toMatchUp();
      
      expect(matchUp.sides![0].sideNumber).toBe(1);
      expect(matchUp.sides![0].participantId).toBe('p1');
      expect(matchUp.sides![0].participant?.participantName).toBe('Roger Federer');
      
      expect(matchUp.sides![1].sideNumber).toBe(2);
      expect(matchUp.sides![1].participantId).toBe('p2');
      expect(matchUp.sides![1].participant?.participantName).toBe('Rafael Nadal');
    });
    
    it('should detect DOUBLES matchUpType', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      match.doubles(true); // Set doubles mode on (true argument required)
      
      const matchUp = match.toMatchUp();
      
      expect(matchUp.matchUpType).toBe(DOUBLES);
    });
  });
  
  describe('Status Detection', () => {
    
    it('should set status to TO_BE_PLAYED for new match', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      const matchUp = match.toMatchUp();
      
      expect(matchUp.matchUpStatus).toBe(TO_BE_PLAYED);
    });
    
    it('should set status to IN_PROGRESS after first point', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      match.addPoint(0);
      
      const matchUp = match.toMatchUp();
      
      expect(matchUp.matchUpStatus).toBe(IN_PROGRESS);
    });
    
    it('should set status to COMPLETED when match is complete', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      // Win first set 6-0
      match.addPoints('000000 000000 000000 000000 000000 000000');
      
      // Win second set 6-0
      match.addPoints('000000 000000 000000 000000 000000 000000');
      
      const matchUp = match.toMatchUp();
      
      expect(matchUp.matchUpStatus).toBe(COMPLETED);
      expect(matchUp.winningSide).toBe(1); // Side 1 (player index 0)
    });
  });
  
  describe('Score Export', () => {
    
    it('should export score with set-by-set details', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      // Set 1: 6-3 (point string actually produces 6-3)
      match.addPoints('0000 1111 0000 1111 0000 0000 0000 1111 0000 0000');
      
      const matchUp = match.toMatchUp();
      
      expect(matchUp.score).toBeDefined();
      expect(matchUp.score!.sets).toHaveLength(1);
      expect(matchUp.score!.sets![0].setNumber).toBe(1);
      expect(matchUp.score!.sets![0].side1Score).toBe(6);
      expect(matchUp.score!.sets![0].side2Score).toBe(3);
    });
    
    it('should export score strings', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      // Set 1: 6-3
      match.addPoints('0000 1111 0000 1111 0000 0000 0000 1111 0000 0000');
      
      // Set 2: 6-2 (actual point string produces 6-2, not 6-3)
      match.addPoints('0000 1111 0000 1111 0000 0000 0000');
      
      const matchUp = match.toMatchUp();
      
      // scoreGovernor.generateScoreString() returns '6-3 6-2' format
      expect(matchUp.score!.scoreStringSide1).toBe('6-3 6-2');
      expect(matchUp.score!.scoreStringSide2).toBe('3-6 2-6');
    });
    
    it('should export tiebreak scores', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      // Get to 6-6
      match.addPoints('0000 1111 0000 1111 0000 1111 0000 1111 0000 1111 0000 1111');
      
      // Win tiebreak 7-5
      match.addPoints('0 1 0 1 0 1 0 1 0 1 0 0');
      
      const matchUp = match.toMatchUp();
      
      expect(matchUp.score!.sets![0].side1Score).toBe(7);
      expect(matchUp.score!.sets![0].side2Score).toBe(6);
      expect(matchUp.score!.sets![0].side1TiebreakScore).toBe(7);
      expect(matchUp.score!.sets![0].side2TiebreakScore).toBe(5);
    });
  });
  
  describe('matchUp Getter', () => {
    
    it('should provide current matchUp via getter', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      const matchUp1 = match.matchUp;
      expect(matchUp1.matchUpStatus).toBe('TO_BE_PLAYED');
      
      match.addPoint(0);
      
      const matchUp2 = match.matchUp;
      expect(matchUp2.matchUpStatus).toBe('IN_PROGRESS');
    });
  });
  
  describe('MatchUpAdapter Static Methods', () => {
    
    it('should validate valid TODS MatchUp', () => {
      const matchUp = {
        matchUpId: 'match-123',
        matchUpFormat: 'SET3-S:6/TB7',
        matchUpStatus: 'COMPLETED',
        matchUpType: 'SINGLES'
      };
      
      const result = MatchUpAdapter.validate(matchUp);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject invalid matchUpStatus', () => {
      const invalid = {
        matchUpId: 'match-123',
        matchUpStatus: 'INVALID_STATUS'
      };
      
      const result = MatchUpAdapter.validate(invalid);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid matchUpStatus: INVALID_STATUS');
    });
    
    it('should reject missing matchUpId', () => {
      const invalid = {
        matchUpFormat: 'SET3-S:6/TB7'
      };
      
      const result = MatchUpAdapter.validate(invalid);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: matchUpId');
    });
  });
  
  describe('Legacy Player Support', () => {
    
    it('should convert legacy players to TODS in export', () => {
      const match = matchObject.Match({ matchUpFormat: 'SET3-S:6/TB7' });
      
      // Use legacy format
      match.participants([
        { name: 'Roger Federer', id: 'p1' },
        { name: 'Rafael Nadal', id: 'p2' }
      ]);
      
      const matchUp = match.toMatchUp();
      
      expect(matchUp.sides![0].participant?.participantId).toBe('p1');
      expect(matchUp.sides![0].participant?.participantName).toBe('Roger Federer');
      expect(matchUp.sides![0].participant?.participantType).toBe(INDIVIDUAL);
    });
  });
});
