/**
 * TODS-Native Metadata Storage
 *
 * Stores participants, match, and tournament data in TODS format internally.
 * Provides backward compatibility for legacy imports.
 */

import type { Participant, Side, MatchUp, Person } from "../types/tods";
import { utilities } from "tods-competition-factory";
import { INDIVIDUAL, COMPETITOR, ACTIVE } from "../constants";

export interface TODSMetadataConfig {
  participants?: Participant[];
  sides?: Side[];
  matchUp?: Partial<MatchUp>;
  tournament?: any;
  timestamps?: boolean;
  liveStats?: boolean;
}

/**
 * TODS-Native Metadata Manager
 *
 * Core principle: Store everything in TODS format internally.
 * Legacy format only accepted on input, immediately converted to TODS.
 */
export class TODSMetadata {
  private readonly _participants: Map<string, Participant> = new Map();
  private _sides: Side[] = [];
  private _matchUp: Partial<MatchUp> = {};
  private _tournament: any = {};
  private _serviceOrder: number[] = [];
  private _receiveOrder: number[] = [];
  private _timestamps: boolean = false;
  private _stats: any = {};

  constructor(config?: TODSMetadataConfig) {
    if (config?.participants) {
      config.participants.forEach((p) => this.addParticipant(p));
    }
    if (config?.sides) {
      this._sides = config.sides;
    }
    if (config?.matchUp) {
      this._matchUp = config.matchUp;
    }
    if (config?.tournament) {
      this._tournament = config.tournament;
    }
    if (config?.timestamps !== undefined) {
      this._timestamps = config.timestamps;
    }
  }

  // ============================================================================
  // TODS PARTICIPANT MANAGEMENT (Native)
  // ============================================================================

  /**
   * Add participant in TODS format (native)
   */
  addParticipant(participant: Participant): void {
    const participantId = participant.participantId || utilities.UUID();
    this._participants.set(participantId, {
      ...participant,
      participantId,
      participantType: participant.participantType || INDIVIDUAL,
      participantRole: participant.participantRole || COMPETITOR,
      participantStatus: participant.participantStatus || ACTIVE,
    });
  }

  /**
   * Get participant by ID
   */
  getParticipant(participantId: string): Participant | undefined {
    return this._participants.get(participantId);
  }

  /**
   * Get all participants (TODS format)
   */
  getParticipants(): Participant[] {
    return Array.from(this._participants.values());
  }

  /**
   * Get participant by index (for backward compatibility with service order)
   */
  getParticipantByIndex(index: number): Participant | undefined {
    const participants = this.getParticipants();
    return participants[index];
  }

  // ============================================================================
  // LEGACY COMPATIBILITY (Auto-convert to TODS)
  // ============================================================================

  /**
   * Update participant (TODS-native)
   * Updates existing participant on a side (identified by sideNumber: 1 or 2)
   * Accepts partial Participant object - only updates provided fields
   */
  updateParticipant(update: {
    sideNumber?: number;
    participantId?: string;
    person?: Partial<Person>;
    participantName?: string;
  }): { sideNumber: number; participant: Participant } {
    const { sideNumber, participantId, person, participantName } = update;
    
    // Determine which participant to update
    let targetParticipant: Participant | undefined;
    let targetSideNumber: number;
    
    if (participantId) {
      // Find by participantId
      targetParticipant = Array.from(this._participants.values()).find(
        p => p.participantId === participantId
      );
      if (!targetParticipant) {
        throw new Error(`Participant with ID ${participantId} not found`);
      }
      // Find which side this participant is on
      const sides = this.getSides();
      const side = sides.find(s => s.participantId === participantId);
      targetSideNumber = side?.sideNumber || 1;
    } else if (sideNumber !== undefined) {
      // Find by sideNumber (1 or 2) - convert to index (0 or 1)
      const index = sideNumber - 1;
      targetParticipant = this.getParticipantByIndex(index);
      targetSideNumber = sideNumber;
      
      if (!targetParticipant) {
        throw new Error(`No participant found on side ${sideNumber}`);
      }
    } else {
      throw new Error('Must provide either sideNumber or participantId');
    }
    
    // Build updated participant
    const updatedParticipant: Participant = {
      ...targetParticipant,
      participantName: participantName || targetParticipant.participantName,
    };
    
    // Update person if provided
    if (person) {
      updatedParticipant.person = {
        ...targetParticipant.person,
        ...person,
      } as Person;
      
      // Auto-generate participantName from person if not explicitly provided
      if (!participantName && person.standardGivenName !== undefined || person.standardFamilyName !== undefined) {
        const givenName = person.standardGivenName || targetParticipant.person?.standardGivenName || '';
        const familyName = person.standardFamilyName || targetParticipant.person?.standardFamilyName || '';
        updatedParticipant.participantName = [givenName, familyName].filter(Boolean).join(' ').trim();
      }
    }
    
    // Update in the Map
    this._participants.set(updatedParticipant.participantId, updatedParticipant);
    
    return { sideNumber: targetSideNumber, participant: updatedParticipant };
  }

  /**
   * Define player (legacy format) - DEPRECATED, use updateParticipant()
   * @deprecated Use updateParticipant() with TODS Participant format
   */
  definePlayer(playerDef: any): { index: number; participant: Participant } {
    const {
      index,
      name,           // Legacy format
      firstName,      // Modern TODS format (preferred)
      lastName,       // Modern TODS format (preferred)
      birth,
      puid,
      hand,
      seed,
      rank,
      age,
      entry,
      ioc,
      draw_position,
    } = playerDef;

    // Determine firstName/lastName from input (prefer explicit firstName/lastName)
    let givenName = firstName;
    let familyName = lastName;
    
    // Fallback to splitting 'name' if firstName/lastName not provided (legacy support)
    if (!givenName && !familyName && name) {
      const nameParts = name.trim().split(/\s+/);
      if (nameParts.length > 1) {
        givenName = nameParts.slice(0, -1).join(' ');
        familyName = nameParts[nameParts.length - 1];
      } else {
        givenName = name;
        familyName = '';
      }
    }

    if (!givenName && !familyName && index === undefined)
      return { index: 0, participant: {} as Participant };

    // Generate participantName using TODS factory pattern: firstName + lastName
    const participantName = [givenName, familyName].filter(Boolean).join(' ').trim();

    // Check if participant at this index already exists
    const existingParticipant = this.getParticipantByIndex(index || 0);
    
    // Determine participantId - use existing ID if updating, otherwise use provided or generate new
    const participantId = existingParticipant?.participantId || 
                         puid || 
                         playerDef.id || 
                         playerDef.participantId || 
                         utilities.UUID();

    // Build updated/new participant
    const participant: Participant = {
      participantId,
      participantName,
      participantType: INDIVIDUAL,
      participantRole: COMPETITOR,
      participantStatus: ACTIVE,
    };

    // Add person details if available
    if (birth || hand || ioc || givenName !== undefined || familyName !== undefined) {
      participant.person = {} as Person;
      if (givenName !== undefined) participant.person.standardGivenName = givenName;
      if (familyName !== undefined) participant.person.standardFamilyName = familyName;
      if (birth) participant.person.birthDate = birth;
      if (ioc) participant.person.nationalityCode = ioc;
    }

    // Add extensions for additional metadata
    if (hand || seed || rank || age || entry || draw_position) {
      participant.extensions = participant.extensions || [];
      participant.extensions.push({
        name: "UMO_LEGACY_METADATA",
        value: { hand, seed, rank, age, entry, draw_position },
      });
    }

    if (existingParticipant) {
      // Update: Replace existing participant in the Map
      this._participants.set(participantId, participant);
    } else {
      // Add: New participant
      this.addParticipant(participant);
    }

    return { index: index || 0, participant };
  }

  /**
   * Get players in legacy format (for backward compatibility)
   * @deprecated Use getParticipants() for TODS format
   */
  getPlayersLegacy(): any[] {
    return this.getParticipants().map((p) => ({
      name: p.participantName || "",
      id: p.participantId,
      puid: p.participantId,
      ioc: p.person?.nationalityCode,
      birth: p.person?.birthDate,
      // Extract from extensions
      ...p.extensions?.find((e) => e.name === "UMO_LEGACY_METADATA")?.value,
    }));
  }

  // ============================================================================
  // SIDES MANAGEMENT (TODS)
  // ============================================================================

  /**
   * Get sides (TODS format)
   */
  getSides(): Side[] {
    if (this._sides.length > 0) return this._sides;

    // Auto-generate sides from participants if not explicitly set
    const participants = this.getParticipants();
    if (participants.length >= 2) {
      return [
        {
          sideNumber: 1,
          participantId: participants[0]?.participantId,
          participant: participants[0],
        },
        {
          sideNumber: 2,
          participantId: participants[1]?.participantId,
          participant: participants[1],
        },
      ];
    }
    return [];
  }

  /**
   * Set sides explicitly
   */
  setSides(sides: Side[]): void {
    this._sides = sides;
  }

  /**
   * Get participant team/side (0 or 1)
   */
  getParticipantTeam(participantId: string): number {
    const sides = this.getSides();
    const sideIndex = sides.findIndex(
      (side) =>
        side.participantId === participantId ||
        side.participant?.participantId === participantId,
    );
    return Math.max(sideIndex, 0);
  }

  // ============================================================================
  // SERVICE ORDER (Compatible with existing UMO)
  // ============================================================================

  setServiceOrder(order: number[]): void {
    this._serviceOrder = order;
  }

  getServiceOrder(): number[] {
    if (this._serviceOrder.length > 0) return this._serviceOrder;

    // Default: singles [0, 1], doubles [0, 1, 2, 3]
    const participantCount = this._participants.size;
    return participantCount <= 2 ? [0, 1] : [0, 1, 2, 3];
  }

  setReceiveOrder(order: number[]): void {
    this._receiveOrder = order;
  }

  getReceiveOrder(): number[] {
    if (this._receiveOrder.length > 0) return this._receiveOrder;

    // Default: singles [1, 0], doubles [1, 0, 3, 2]
    const participantCount = this._participants.size;
    return participantCount <= 2 ? [1, 0] : [1, 0, 3, 2];
  }

  // ============================================================================
  // MATCH METADATA
  // ============================================================================

  updateMatchUp(update: Partial<MatchUp>): void {
    this._matchUp = { ...this._matchUp, ...update };
  }

  getMatchUp(): Partial<MatchUp> {
    return this._matchUp;
  }

  // ============================================================================
  // TOURNAMENT METADATA
  // ============================================================================

  setTournament(tournament: any): void {
    this._tournament = tournament;
  }

  getTournament(): any {
    return this._tournament;
  }

  // ============================================================================
  // STATS & TIMESTAMPS
  // ============================================================================

  setTimestamps(enabled: boolean): void {
    this._timestamps = enabled;
  }

  getTimestamps(): boolean {
    return this._timestamps;
  }

  getStats(): any {
    return this._stats;
  }

  resetStats(): void {
    this._stats = {};
  }

  reset(): void {
    this._participants.clear();
    this._sides = [];
    this._matchUp = {};
    this._tournament = {};
    this._serviceOrder = [];
    this._receiveOrder = [];
    this._stats = {};
  }
}
