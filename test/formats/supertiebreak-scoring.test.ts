// Test for 3rd Set Supertiebreak Scoring Issue
// Tests that the 3rd/deciding set in formats like SET3-S:4NOAD/TB7-F:TB10
// displays points as 1, 2, 3... instead of 15, 30, 40...

import { describe, it, expect } from "vitest";
import matchObject from "../../src/matchObject";
import { parseFormat, isFactoryFormat } from "../../src/formatConverter";

describe("Supertiebreak Scoring in Final Set", () => {
  it("should parse SET3-S:4NOAD/TB7-F:TB10 format correctly", () => {
    const parsed = parseFormat("SET3-S:4NOAD/TB7-F:TB10");
    console.log("Parsed format:", JSON.stringify(parsed, null, 2));
    console.log(
      "finalSetFormat:",
      JSON.stringify(parsed.format?.finalSetFormat, null, 2),
    );
    expect(parsed.isValid).toBe(true);
    expect(parsed.format?.finalSetFormat?.tiebreakSet?.tiebreakTo).toBe(10);
  });

  it("should recognize SET3-S:4NOAD/TB7-F:TB10 as Factory format", () => {
    const isFactory = isFactoryFormat("SET3-S:4NOAD/TB7-F:TB10");
    console.log("isFactoryFormat result:", isFactory);
    expect(isFactory).toBe(true);
  });

  it("should check what formatStructure decidingChild receives", () => {
    const match = matchObject.Match({
      matchUpFormat: "SET3-S:4NOAD/TB7-F:TB10",
    });

    const decidingChild = match.format.decidingChild as any;
    console.log(
      "decidingChild.values.formatStructure:",
      JSON.stringify(decidingChild.values?.formatStructure, null, 2),
    );
    console.log(
      "decidingChild.threshold():",
      match.format.decidingChild?.threshold(),
    );
    console.log(
      "decidingChild!.settings():",
      JSON.stringify(match.format.decidingChild!.settings(), null, 2),
    );
  });

  it("should debug why type() returns undefined", () => {
    const match = matchObject.Match();

    // Check what type() actually is
    console.log("typeof match.format.type:", typeof match.format.type);
    console.log("match.format.type.name:", match.format.type?.name);
    console.log("match.format.type.length:", match.format.type?.length);

    // Try with just one argument
    console.log("Calling with format_type argument...");
    try {
      const result = match.format.type("SET3-S:4NOAD/TB7-F:TB10");
      console.log("type() returned:", result, "type:", typeof result);
    } catch (err) {
      console.log("type() threw error:", err);
    }

    // Check what was set
    console.log(
      "decidingChildFormatStructure type:",
      typeof match.format.decidingChildFormatStructure,
    );
    console.log(
      "decidingChildFormatStructure value:",
      match.format.decidingChildFormatStructure,
    );
  });

  describe("SET3-S:4NOAD/TB7-F:TB10 (Fast4 with Supertiebreak)", () => {
    it("should use point-based scoring (1,2,3...) in 3rd set, not tennis scoring (15,30,40)", () => {
      const match = matchObject.Match({
        matchUpFormat: "SET3-S:4NOAD/TB7-F:TB10",
      });

      // Win first set 4-1 (Fast4 to 4 games)
      for (let i = 0; i < 4; i++) match.addPoints("0000"); // 4-0
      match.addPoints("1111"); // 4-1
      expect(match.score().sets).toBe("1-0");

      // Lose second set 1-4
      match.addPoints("0000"); // 1-0 in set 2
      for (let i = 0; i < 3; i++) match.addPoints("1111"); // 1-3
      // Note: 3rd addPoints('1111') completes set 2 mid-call, so don't add a 4th
      expect(match.score().sets).toBe("1-1");

      // Add first point of supertiebreak - this should create the 3rd set and first game
      match.addPoint(0);

      // Now get the 3rd set that was just created
      const sets = match.sets();
      expect(sets.length).toBe(3);
      const thirdSet = sets[2];

      // Check the game that was created
      const games = thirdSet?.games();
      expect(games?.length).toBe(1);
      const game = games?.[0]!;

      // The game threshold should be 10 for a supertiebreak
      expect(game!.format.threshold()).toBe(10);

      // The game should NOT have a tiebreak child (it IS the tiebreak)
      expect(game!.format.tiebreak?.()).toBe(true);

      // Score should show as "1-0" (points) not "15-0" (tennis)
      const gameScore = game.score().points;
      expect(gameScore).toBe("1-0");

      // Add more points
      match.addPoints("111"); // Now 1-3
      expect(game!.score().points).toBe("1-3");

      // Complete the supertiebreak 1-10
      match.addPoints("1111111"); // 1-10
      expect(match.complete()).toBe(true);
      expect(match.score().sets).toBe("1-2");
    });

    it("should have correct format structure for 3rd set", () => {
      const match = matchObject.Match({
        matchUpFormat: "SET3-S:4NOAD/TB7-F:TB10",
      });

      // Check the deciding child format
      const decidingChild = match.format.decidingChild!;
      const settings = decidingChild.settings();

      console.log(
        "Deciding child settings:",
        JSON.stringify(settings, null, 2),
      );

      // Should have threshold of 1 (one game - the supertiebreak)
      expect(decidingChild.threshold()).toBe(1);

      // Should have tiebreak
      expect(decidingChild.hasDecider()).toBe(true);
    });
  });

  describe("SET3-S:6/TB7-F:TB10 (Standard with Supertiebreak)", () => {
    it("should use point-based scoring in 3rd set supertiebreak", () => {
      const match = matchObject.Match({ matchUpFormat: "SET3-S:6/TB7-F:TB10" });

      // First set: 6-0 (player 0 wins)
      for (let i = 0; i < 6; i++) match.addPoints("0000");
      expect(match.score().sets).toBe("1-0");

      // Second set: 0-6 (player 1 wins)
      for (let i = 0; i < 6; i++) match.addPoints("1111");
      expect(match.score().sets).toBe("1-1");

      // Add first point to supertiebreak - this creates the 3rd set and game
      match.addPoint(0);

      // Now access the 3rd set that was just created
      const sets = match.sets();
      expect(sets.length).toBe(3);
      const thirdSet = sets[2];

      const games = thirdSet?.games();
      expect(games?.length).toBe(1);
      const game = games?.[0]!;

      // Should be a tiebreak to 10
      expect(game!.format.threshold()).toBe(10);
      expect(game!.format.tiebreak?.()).toBe(true);

      // Score format should be point-based
      expect(game!.score().points).toBe("1-0");

      // Win 10-5
      match.addPoints("00000111100000"); // 6-5 -> 10-5
      expect(match.complete()).toBe(true);
    });
  });
});
