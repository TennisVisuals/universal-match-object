/**
 * ParticipantAdapter Tests
 * 
 * Test conversion between legacy UMO player format and TODS Participant format.
 */

import { describe, it, expect } from 'vitest';
import { ParticipantAdapter, isTODSParticipant, isLegacyPlayer } from '../../src/participantAdapter';
import type { Participant } from '../../src/types/tods';

describe('ParticipantAdapter', () => {
  
  describe('Format Detection', () => {
    
    it('should detect TODS format', () => {
      const tods: Participant = {
        participantId: 'p1',
        participantName: 'Roger Federer',
        participantType: 'INDIVIDUAL'
      };
      
      expect(ParticipantAdapter.detect(tods)).toBe('tods');
      expect(isTODSParticipant(tods)).toBe(true);
      expect(isLegacyPlayer(tods)).toBe(false);
    });
    
    it('should detect legacy format', () => {
      const legacy = {
        name: 'Roger Federer',
        id: 'p1',
        team: 0
      };
      
      expect(ParticipantAdapter.detect(legacy)).toBe('legacy');
      expect(isLegacyPlayer(legacy)).toBe(true);
      expect(isTODSParticipant(legacy)).toBe(false);
    });
    
    it('should return unknown for invalid objects', () => {
      expect(ParticipantAdapter.detect(null)).toBe('unknown');
      expect(ParticipantAdapter.detect(undefined)).toBe('unknown');
      expect(ParticipantAdapter.detect({})).toBe('unknown');
      expect(ParticipantAdapter.detect('string')).toBe('unknown');
      expect(ParticipantAdapter.detect(123)).toBe('unknown');
    });
  });
  
  describe('Legacy → TODS Conversion', () => {
    
    it('should convert legacy player to TODS participant', () => {
      const legacy = {
        name: 'Roger Federer',
        id: 'p1',
        team: 0
      };
      
      const tods = ParticipantAdapter.toTODS(legacy);
      
      expect(tods.participantId).toBe('p1');
      expect(tods.participantName).toBe('Roger Federer');
      expect(tods.participantType).toBe('INDIVIDUAL');
      expect(tods.participantRole).toBe('COMPETITOR');
      expect(tods.participantStatus).toBe('ACTIVE');
    });
    
    it('should generate participantId if not provided', () => {
      const legacy = {
        name: 'Rafael Nadal'
      };
      
      const tods = ParticipantAdapter.toTODS(legacy);
      
      expect(tods.participantId).toBeDefined();
      expect(tods.participantId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
      expect(tods.participantName).toBe('Rafael Nadal');
    });
    
    it('should parse single name', () => {
      const legacy = {
        name: 'Federer',
        id: 'p1'
      };
      
      const tods = ParticipantAdapter.toTODS(legacy);
      
      expect(tods.person).toBeDefined();
      expect(tods.person!.standardFamilyName).toBe('Federer');
      expect(tods.person!.standardGivenName).toBeUndefined();
    });
    
    it('should parse full name into given/family names', () => {
      const legacy = {
        name: 'Roger Federer',
        id: 'p1'
      };
      
      const tods = ParticipantAdapter.toTODS(legacy);
      
      expect(tods.person).toBeDefined();
      expect(tods.person!.standardGivenName).toBe('Roger');
      expect(tods.person!.standardFamilyName).toBe('Federer');
    });
    
    it('should handle multi-part family names', () => {
      const legacy = {
        name: 'Juan Martin del Potro',
        id: 'p1'
      };
      
      const tods = ParticipantAdapter.toTODS(legacy);
      
      expect(tods.person).toBeDefined();
      expect(tods.person!.standardGivenName).toBe('Juan');
      expect(tods.person!.standardFamilyName).toBe('Martin del Potro');
    });
  });
  
  describe('TODS → Legacy Conversion', () => {
    
    it('should convert TODS participant to legacy player', () => {
      const tods: Participant = {
        participantId: 'p1',
        participantName: 'Roger Federer',
        participantType: 'INDIVIDUAL',
        participantRole: 'COMPETITOR'
      };
      
      const legacy = ParticipantAdapter.fromTODS(tods);
      
      expect(legacy.id).toBe('p1');
      expect(legacy.name).toBe('Roger Federer');
    });
    
    it('should include team index if provided', () => {
      const tods: Participant = {
        participantId: 'p1',
        participantName: 'Roger Federer',
        participantType: 'INDIVIDUAL'
      };
      
      const legacy = ParticipantAdapter.fromTODS(tods, 1);
      
      expect(legacy.team).toBe(1);
    });
    
    it('should handle missing participantName', () => {
      const tods: Participant = {
        participantId: 'p1',
        participantType: 'INDIVIDUAL'
      };
      
      const legacy = ParticipantAdapter.fromTODS(tods);
      
      expect(legacy.name).toBe('');
    });
  });
  
  describe('Array Normalization', () => {
    
    it('should normalize mixed array to TODS', () => {
      const mixed = [
        // Legacy
        { name: 'Roger Federer', id: 'p1' },
        // TODS
        {
          participantId: 'p2',
          participantName: 'Rafael Nadal',
          participantType: 'INDIVIDUAL' as const
        }
      ];
      
      const normalized = ParticipantAdapter.normalizeToTODS(mixed);
      
      expect(normalized).toHaveLength(2);
      expect(normalized[0]!.participantId).toBe('p1');
      expect(normalized[0]!.participantName).toBe('Roger Federer');
      expect(normalized[1]!.participantId).toBe('p2');
      expect(normalized[1]!.participantName).toBe('Rafael Nadal');
    });
    
    it('should convert TODS array to legacy', () => {
      const tods: Participant[] = [
        {
          participantId: 'p1',
          participantName: 'Roger Federer',
          participantType: 'INDIVIDUAL'
        },
        {
          participantId: 'p2',
          participantName: 'Rafael Nadal',
          participantType: 'INDIVIDUAL'
        }
      ];
      
      const legacy = ParticipantAdapter.normalizeTODSToLegacy(tods);
      
      expect(legacy).toHaveLength(2);
      expect(legacy[0]!.id).toBe('p1');
      expect(legacy[0]!.name).toBe('Roger Federer');
      expect(legacy[0]!.team).toBe(0);
      expect(legacy[1]!.id).toBe('p2');
      expect(legacy[1]!.name).toBe('Rafael Nadal');
      expect(legacy[1]!.team).toBe(1);
    });
  });
  
  describe('Validation', () => {
    
    it('should validate valid TODS participant', () => {
      const tods: Participant = {
        participantId: 'p1',
        participantName: 'Roger Federer',
        participantType: 'INDIVIDUAL',
        participantRole: 'COMPETITOR',
        participantStatus: 'ACTIVE'
      };
      
      const result = ParticipantAdapter.validate(tods);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject participant without participantId', () => {
      const invalid = {
        participantName: 'Roger Federer'
      };
      
      const result = ParticipantAdapter.validate(invalid);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: participantId');
    });
    
    it('should reject invalid participantType', () => {
      const invalid = {
        participantId: 'p1',
        participantType: 'INVALID'
      };
      
      const result = ParticipantAdapter.validate(invalid);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid participantType: INVALID');
    });
    
    it('should reject invalid participantRole', () => {
      const invalid = {
        participantId: 'p1',
        participantRole: 'INVALID'
      };
      
      const result = ParticipantAdapter.validate(invalid);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid participantRole: INVALID');
    });
    
    it('should reject invalid participantStatus', () => {
      const invalid = {
        participantId: 'p1',
        participantStatus: 'INVALID'
      };
      
      const result = ParticipantAdapter.validate(invalid);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid participantStatus: INVALID');
    });
  });
  
  describe('PAIR Creation', () => {
    
    it('should create PAIR participant from two individuals', () => {
      const p1: Participant = {
        participantId: 'p1',
        participantName: 'Roger Federer',
        participantType: 'INDIVIDUAL'
      };
      
      const p2: Participant = {
        participantId: 'p2',
        participantName: 'Rafael Nadal',
        participantType: 'INDIVIDUAL'
      };
      
      const pair = ParticipantAdapter.createPair(p1, p2);
      
      expect(pair.participantType).toBe('PAIR');
      expect(pair.participantName).toBe('Roger Federer / Rafael Nadal');
      expect(pair.individualParticipantIds).toEqual(['p1', 'p2']);
    });
    
    it('should use custom pair name if provided', () => {
      const p1: Participant = {
        participantId: 'p1',
        participantName: 'Roger Federer',
        participantType: 'INDIVIDUAL'
      };
      
      const p2: Participant = {
        participantId: 'p2',
        participantName: 'Rafael Nadal',
        participantType: 'INDIVIDUAL'
      };
      
      const pair = ParticipantAdapter.createPair(p1, p2, 'Team Europe');
      
      expect(pair.participantName).toBe('Team Europe');
    });
  });
});
