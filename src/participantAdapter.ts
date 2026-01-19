/**
 * ParticipantAdapter
 *
 * Handles conversion between legacy UMO player format and TODS Participant format.
 * Provides backward compatibility while enabling modern TODS interoperability.
 *
 * Legacy Format:
 *   { name: 'Roger Federer', id: 'p1', team: 0 }
 *
 * TODS Format:
 *   {
 *     participantId: 'p1',
 *     participantName: 'Roger Federer',
 *     participantType: 'INDIVIDUAL',
 *     participantRole: 'COMPETITOR',
 *     participantStatus: 'ACTIVE'
 *   }
 */

import { Participant, ParticipantTypeUnion, Person } from "./types/tods";
import { utilities } from "tods-competition-factory";

// Legacy player format (UMO v2.x)
export interface LegacyPlayer {
  name: string;
  id?: string;
  team?: number; // 0 or 1 (deprecated)
  [key: string]: any; // Allow additional properties
}

// Detection result
export type ParticipantFormat = "legacy" | "tods" | "unknown";

export class ParticipantAdapter {
  /**
   * Detect participant format
   *
   * @param obj - Object to check
   * @returns Format type: 'legacy' | 'tods' | 'unknown'
   */
  static detect(obj: any): ParticipantFormat {
    if (!obj || typeof obj !== "object") return "unknown";

    // TODS format has participantId (REQUIRED field)
    if ("participantId" in obj) return "tods";

    // Legacy format has name and optionally id/team
    if ("name" in obj) return "legacy";

    return "unknown";
  }

  /**
   * Convert legacy player to TODS Participant
   *
   * @param legacy - Legacy player object
   * @returns TODS Participant
   */
  static toTODS(legacy: LegacyPlayer): Participant {
    // Use existing participantId if available (check common TODS fields and UMO's puid field)
    const participantId =
      legacy.participantId ||
      legacy.id ||
      (legacy as any).puid ||
      utilities.UUID();

    // Parse name into given/family names if possible
    const person = this._parsePersonName(legacy.name);

    return {
      participantId,
      participantName: legacy.name,
      participantType: "INDIVIDUAL",
      participantRole: "COMPETITOR",
      participantStatus: "ACTIVE",
      person,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Convert TODS Participant to legacy player
   *
   * @param participant - TODS Participant
   * @param teamIndex - Optional team index (0 or 1) for backward compatibility
   * @returns Legacy player object
   */
  static fromTODS(participant: Participant, teamIndex?: number): LegacyPlayer {
    return {
      id: participant.participantId,
      name: participant.participantName || "",
      team: teamIndex, // Deprecated field for compatibility
    };
  }

  /**
   * Convert array of mixed format participants to TODS
   *
   * @param participants - Array of legacy or TODS participants
   * @returns Array of TODS Participants
   */
  static normalizeToTODS(
    participants: (LegacyPlayer | Participant)[],
  ): Participant[] {
    return participants.map((p) => {
      const format = this.detect(p);

      if (format === "tods") {
        return p as Participant;
      } else if (format === "legacy") {
        // Show deprecation warning (only once)
        if (!this._deprecationWarningShown) {
          console.warn(
            "⚠️  DEPRECATED: Legacy player format detected. Please use TODS Participant format.",
          );
          console.warn('   Legacy: { name: "...", id: "..." }');
          console.warn(
            '   TODS:   { participantId: "...", participantName: "...", participantType: "INDIVIDUAL" }',
          );
          this._deprecationWarningShown = true;
        }

        return this.toTODS(p as LegacyPlayer);
      } else {
        throw new Error("Unknown participant format");
      }
    });
  }

  /**
   * Convert array of TODS participants to legacy format
   *
   * @param participants - Array of TODS Participants
   * @returns Array of legacy players
   */
  static normalizeTODSToLegacy(participants: Participant[]): LegacyPlayer[] {
    return participants.map((p, index) => this.fromTODS(p, index % 2));
  }

  /**
   * Validate TODS Participant structure
   *
   * @param participant - Participant to validate
   * @returns Validation result with errors if invalid
   */
  static validate(participant: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!participant) {
      errors.push("Participant is null or undefined");
      return { valid: false, errors };
    }

    // Required field: participantId
    if (!participant.participantId) {
      errors.push("Missing required field: participantId");
    }

    // Validate participantType if present
    const validTypes: ParticipantTypeUnion[] = [
      "GROUP",
      "INDIVIDUAL",
      "PAIR",
      "TEAM",
    ];
    if (
      participant.participantType &&
      !validTypes.includes(participant.participantType)
    ) {
      errors.push(`Invalid participantType: ${participant.participantType}`);
    }

    // Validate participantRole if present
    const validRoles = [
      "ADMINISTRATION",
      "CAPTAIN",
      "COACH",
      "COMPETITOR",
      "MEDIA",
      "MEDICAL",
      "OFFICIAL",
      "OTHER",
      "SECURITY",
    ];
    if (
      participant.participantRole &&
      !validRoles.includes(participant.participantRole)
    ) {
      errors.push(`Invalid participantRole: ${participant.participantRole}`);
    }

    // Validate participantStatus if present
    const validStatuses = ["ACTIVE", "WITHDRAWN"];
    if (
      participant.participantStatus &&
      !validStatuses.includes(participant.participantStatus)
    ) {
      errors.push(
        `Invalid participantStatus: ${participant.participantStatus}`,
      );
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create a PAIR participant from two INDIVIDUAL participants
   *
   * @param participant1 - First individual
   * @param participant2 - Second individual
   * @param pairName - Optional custom pair name
   * @returns PAIR participant
   */
  static createPair(
    participant1: Participant,
    participant2: Participant,
    pairName?: string,
  ): Participant {
    if (!participant1.participantId || !participant2.participantId) {
      throw new Error("Both participants must have valid participantId");
    }

    return {
      participantId: utilities.UUID(),
      participantName:
        pairName ||
        `${participant1.participantName} / ${participant2.participantName}`,
      participantType: "PAIR",
      participantRole: "COMPETITOR",
      participantStatus: "ACTIVE",
      individualParticipantIds: [
        participant1.participantId,
        participant2.participantId,
      ],
      createdAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private static _deprecationWarningShown = false;

  /**
   * Parse a full name into given/family names
   *
   * @param fullName - Full name string
   * @returns Person object with parsed names
   */
  private static _parsePersonName(fullName: string): Person | undefined {
    if (!fullName || !fullName.trim()) return undefined;

    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 0) return undefined;

    if (parts.length === 1) {
      // Single name - use as family name
      return {
        standardFamilyName: parts[0],
      };
    }

    // Multiple parts - first is given name, rest is family name
    return {
      standardGivenName: parts[0],
      standardFamilyName: parts.slice(1).join(" "),
    };
  }
}

/**
 * Convenience function to detect participant format
 *
 * @param obj - Object to check
 * @returns true if TODS format, false if legacy
 */
export function isTODSParticipant(obj: any): obj is Participant {
  return ParticipantAdapter.detect(obj) === "tods";
}

/**
 * Convenience function to detect legacy format
 *
 * @param obj - Object to check
 * @returns true if legacy format
 */
export function isLegacyPlayer(obj: any): obj is LegacyPlayer {
  return ParticipantAdapter.detect(obj) === "legacy";
}
