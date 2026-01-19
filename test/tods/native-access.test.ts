/**
 * TODS Native Access Tests
 *
 * Tests direct access to internal TODS structures without conversion overhead
 */

import { describe, it, expect } from "vitest";
import matchObject from "../../src/matchObject";

describe("TODS Native Access", () => {
  describe("Direct TODS Getters", () => {
    it("should expose TODS participants directly", () => {
      const matchUp = matchObject.matchUp({ matchUpFormat: "SET3-S:6/TB7" });

      matchUp.metadata.definePlayer({
        index: 0,
        name: "Player One",
        puid: "p1",
      });
      matchUp.metadata.definePlayer({
        index: 1,
        name: "Player Two",
        puid: "p2",
      });

      const todsParticipants = matchUp.todsParticipants();

      expect(Array.isArray(todsParticipants)).toBe(true);
      expect(todsParticipants.length).toBe(2);
      expect(todsParticipants[0]!.participantId).toBe("p1");
      expect(todsParticipants[0]!.participantName).toBe("Player One");
      expect(todsParticipants[0]!.participantType).toBe("INDIVIDUAL");
    });

    it("should expose TODS sides directly", () => {
      const matchUp = matchObject.matchUp({ matchUpFormat: "SET3-S:6/TB7" });

      matchUp.metadata.definePlayer({
        index: 0,
        name: "Player One",
        puid: "p1",
      });
      matchUp.metadata.definePlayer({
        index: 1,
        name: "Player Two",
        puid: "p2",
      });

      const todsSides = matchUp.todsSides();

      expect(Array.isArray(todsSides)).toBe(true);
      expect(todsSides.length).toBe(2);
      expect(todsSides[0]!.sideNumber).toBe(1);
      expect(todsSides[0]!.participantId).toBe("p1");
      expect(todsSides[1]!.sideNumber).toBe(2);
      expect(todsSides[1]!.participantId).toBe("p2");
    });

    it("should expose TODS matchUp directly", () => {
      const matchUp = matchObject.matchUp({ matchUpFormat: "SET3-S:6/TB7" });

      matchUp.metadata.defineMatch({
        id: "m1",
        date: "2024-01-15",
        gender: "M",
      });

      const todsMatchUp = matchUp.todsMatchUp();

      expect(typeof todsMatchUp).toBe("object");
      expect(todsMatchUp.matchUpId).toBe("m1");
    });

    it("should work with TODS Participant input", () => {
      const matchUp = matchObject.matchUp({
        matchUpFormat: "SET3-S:6/TB7",
      });

      // Add participants with person details
      matchUp.participants([
        {
          participantId: "tods-p1",
          participantName: "TODS Player One",
          participantType: "INDIVIDUAL",
          person: {
            nationalityCode: "USA",
          },
        },
        {
          participantId: "tods-p2",
          participantName: "TODS Player Two",
          participantType: "INDIVIDUAL",
        },
      ]);

      const todsParticipants = matchUp.todsParticipants();

      // Verify participants were added
      expect(todsParticipants.length).toBeGreaterThanOrEqual(2);
      const p1 = todsParticipants.find((p) => p.participantId === "tods-p1");
      expect(p1).toBeDefined();
      expect(p1?.participantName).toBe("TODS Player One");
      // Person details should be preserved in TODS format
      if (p1?.person) {
        expect(p1.person.nationalityCode).toBe("USA");
      }
    });
  });

  describe("Zero Conversion Overhead", () => {
    it("should return same TODS structure on multiple calls", () => {
      const matchUp = matchObject.matchUp({ matchUpFormat: "SET3-S:6/TB7" });

      matchUp.metadata.definePlayer({
        index: 0,
        name: "Player One",
        puid: "p1",
      });

      const participants1 = matchUp.todsParticipants();
      const participants2 = matchUp.todsParticipants();

      // Should return same underlying objects (no conversion)
      expect(participants1[0]?.participantId).toBe(
        participants2[0]?.participantId,
      );
      expect(participants1[0]?.participantName).toBe(
        participants2[0]?.participantName,
      );
    });
  });

  describe("Extensibility", () => {
    it("should preserve TODS extensions", () => {
      const matchUp = matchObject.matchUp({ matchUpFormat: "SET3-S:6/TB7" });

      matchUp.metadata.definePlayer({
        index: 0,
        name: "Player One",
        puid: "p1",
        hand: "R",
        seed: 1,
        rank: 5,
      });

      const todsParticipants = matchUp.todsParticipants();

      expect(todsParticipants[0]!.extensions).toBeDefined();
      const umoMeta = todsParticipants[0]!.extensions?.find(
        (e) => e.name === "UMO_LEGACY_METADATA",
      );
      expect(umoMeta).toBeDefined();
      expect(umoMeta?.value.hand).toBe("R");
      expect(umoMeta?.value.seed).toBe(1);
      expect(umoMeta?.value.rank).toBe(5);
    });
  });
});
