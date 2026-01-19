// @ts-nocheck - Gradual TypeScript migration in progress
// Universal Match Object - TypeScript Version
// Import types for type safety
import type { UMO } from "./types";

// Import format converter and adapter for Factory format support
import {
  isFactoryFormat,
  isLegacyFormat,
  convertLegacyToFactory,
  parseFormat,
} from "./formatConverter";
import { defaultPointParser } from "./scoring/pointParser";
import { createFormatObject } from "./formats/formatObject";
import { createMatchUpFormat } from "./formats/matchUpFormat";
import { createSetFormat } from "./formats/setFormat";
import { createGameFormat } from "./formats/gameFormat";
import { createCommon } from "./core/common";
import { createStateObject } from "./state/stateObject";
import { SINGLES, DOUBLES, TO_BE_PLAYED, COMPLETED } from "./constants";

// Version - inline to avoid import issues with bundler
const umoVersion = "@VERSION@";

const umo = function () {} as any as UMO;

// these events will propagate to all objects created with factory functions
umo.addPoint_events = [];
umo.undo_events = [];
umo.reset_events = [];

umo.pointParser = defaultPointParser;

// LEGACY FORMATS REMOVED: All formats now use Factory format codes
// Legacy formats are auto-converted via convertLegacyToFactory()
// No more format lookup object needed!

// State object extracted to src/state/stateObject.ts
umo.stateObject = createStateObject;

// Make UMO available globally for stateObject to access child factories (Set, Game)
(globalThis as any).umo = umo;

umo.Match = ({
  index,
  matchUpFormat,
  matchUpId,
  participants,
  isDoubles,
  matchUp,
  common = umo.common(),
} = {}) => {
  // If full matchUp provided, use MatchUpAdapter to extract parameters
  if (matchUp) {
    const MatchUpAdapter = (globalThis as any).MatchUpAdapter;
    if (MatchUpAdapter) {
      const extracted = MatchUpAdapter.fromMatchUp(matchUp);
      matchUpFormat = extracted.matchUpFormat;
      matchUpId = extracted.matchUpId;
      participants = extracted.participants;
      isDoubles = extracted.isDoubles;
    }
  }

  let child = { object: "Set", label: "set", plural: "sets" };

  // NEW ARCHITECTURE: Parse format ONCE at entry point, pass structure down
  let formatStructure;
  let formatCode;
  if (matchUpFormat) {
    // Convert legacy to Factory if needed
    if (isLegacyFormat(matchUpFormat)) {
      formatCode = convertLegacyToFactory(matchUpFormat);
    } else {
      formatCode = matchUpFormat;
    }

    // Parse ONCE to get complete JSON structure
    if (isFactoryFormat(formatCode)) {
      const parsed = parseFormat(formatCode);
      if (parsed.isValid && parsed.format) {
        formatStructure = parsed.format;
      }
    }
  }

  // Pass structure directly to matchUpFormat (no type() calls!)
  let format = umo.matchUpFormat({ formatStructure, formatCode, common });
  let match = umo.stateObject({
    index,
    object: "Match",
    format,
    child,
    common,
  });

  // IMPORTANT: Set metadata AFTER stateObject (which calls reset())

  // Set matchUpId if provided
  if (matchUpId) {
    common.metadata.defineMatch({ id: matchUpId });
  }

  // Set participants if provided - use TODS format to preserve all properties
  if (participants && Array.isArray(participants)) {
    // Access the todsMetadata instance from common
    const todsMetadata = (common.metadata as any)._todsMetadata;

    participants.forEach((participant: any, idx: number) => {
      // If it's a full TODS participant with person object, add it directly
      if (
        participant.person ||
        participant.participantType ||
        participant.participantRole
      ) {
        if (todsMetadata) {
          todsMetadata.addParticipant(participant);
        }
      } else {
        // Legacy format - use definePlayer
        common.metadata.definePlayer({
          index: idx,
          name: participant.participantName || participant.name,
          puid: participant.participantId || participant.id,
        });
      }
    });
  }

  // Set doubles if provided
  if (isDoubles) {
    common.doubles(true);
  }

  match.scoreboard = (perspective) => {
    if (!match.children.length) return "0-0";
    perspective ??= match.set.perspectiveScore()
      ? match.nextService()
      : undefined;
    return match.children
      .map((child) => child.scoreboard(perspective))
      .join(", ");
  };

  // Build match object with all APIs
  const matchObj: any = {
    set: match.set,
    reset: match.reset,
    format: match.format,
    events: common.events,
    assignParser: common.assignParser,
    metadata: common.metadata,
    nextService: match.nextService,
    nextTeamServing: match.nextTeamServing,
    nextTeamReceiving: match.nextTeamReceiving,
    change: match.change,
    undo: match.undo,
    addPoint: match.addPoint,
    addPoints: match.addPoints,
    decoratePoint: match.decoratePoint,
    addScore: match.addScore,
    addScores: match.addScores,
    complete: match.complete,
    winner: match.winner,
    score: match.score,
    scoreboard: match.scoreboard,
    [match.child.plural]: match.accessChildren,
    history: match.history,
    stats: common.stats,
    // Add common APIs that tests expect
    participants: (value?: any) => {
      if (value !== undefined) {
        // players() in common expects an array and sets metadata.players
        if (Array.isArray(value)) {
          // Access todsMetadata directly to preserve person objects
          const todsMetadata = (common.metadata as any)._todsMetadata;

          value.forEach((player: any, index: number) => {
            // If it's a full TODS participant with person object, add it directly
            if (
              player.person ||
              player.participantType ||
              player.participantRole
            ) {
              if (todsMetadata) {
                todsMetadata.addParticipant(player);
              }
            } else {
              // Preserve participantId/id when defining player (legacy)
              const playerDef: any = {
                index,
                name: player.participantName || player.name,
              };
              // Preserve ID if present
              if (player.participantId) {
                playerDef.puid = player.participantId;
              } else if (player.id) {
                playerDef.puid = player.id;
              }
              // Add other properties
              if (player.seed) playerDef.seed = player.seed;
              if (player.rank) playerDef.rank = player.rank;

              common.metadata.definePlayer(playerDef);
            }
          });
        }
        return matchObj;
      }
      return common.metadata.players();
    },
    team: (player: number) => common.metadata.playerTeam(player),
    teams: () => common.metadata.teams(),
    points: () => match.history.action("addPoint").map((m: any) => m.point),
    doubles: function (value?: boolean) {
      if (arguments.length === 0) return common.doubles();
      return common.doubles(value);
    },
    singles: function (value?: boolean) {
      if (arguments.length === 0) return common.singles();
      return common.singles(value);
    },

    // TODS-NATIVE: Direct access to internal TODS structures
    todsParticipants: () => {
      const todsMeta = (common.metadata as any)._todsMetadata;
      return todsMeta ? todsMeta.getParticipants() : [];
    },

    todsSides: () => {
      const todsMeta = (common.metadata as any)._todsMetadata;
      return todsMeta ? todsMeta.getSides() : [];
    },

    todsMatchUp: () => {
      const todsMeta = (common.metadata as any)._todsMetadata;
      return todsMeta ? todsMeta.getMatchUp() : {};
    },
  };

  // Add TODS MatchUp export methods (v3.1.0+)
  matchObj.toMatchUp = () => {
    // Dynamic import to avoid circular dependency
    // For sync access, we'll use the global reference set by matchUpAdapter
    if (globalThis.MatchUpAdapter !== undefined) {
      return globalThis.MatchUpAdapter.toMatchUp(matchObj);
    }
    // Fallback: return a basic structure
    const isDoubles = matchObj.doubles ? matchObj.doubles() : false;
    const matchUpType = isDoubles ? DOUBLES : SINGLES;
    return {
      matchUpId: matchObj.metadata?.match?.id || "unknown",
      matchUpFormat: matchObj.format?.code,
      matchUpType,
      matchUpStatus: matchObj.complete?.() ? COMPLETED : TO_BE_PLAYED,
    };
  };

  // Add matchUp getter for current TODS state
  Object.defineProperty(matchObj, "matchUp", {
    get: () => matchObj.toMatchUp(),
    enumerable: true,
  });

  return matchObj;
};
// TODS-NATIVE: Modern matchUp API (alias for Match with TODS nomenclature)
umo.matchUp = umo.Match;

umo.Set = ({
  index,
  parent_object,
  common = umo.common(),
  formatStructure,
} = {}) => {
  let child = { object: "Game", label: "game", plural: "games" };
  let format = umo.setFormat({ common, formatStructure });
  let set = umo.stateObject({
    index,
    parent_object,
    object: "Set",
    format,
    child,
    common,
  });

  set.pointsNeeded = () => {
    let threshold = set.format.threshold();
    if (set.complete()) {
      let points_to_set = [];
      points_to_set[set.winner()] = 0;
      let loser = 1 - set.winner();
      let pts = set.history
        .action("addPoint")
        .filter((episode) => episode.point.set == index)
        .map((episode) => episode.needed.points_to_set)
        .filter(Boolean);
      points_to_set[loser] = Math.max(...pts.map((p) => p[loser]));
      return { points_to_set };
    }
    let deciding_game = set.format.hasDecider();
    let score_difference = set.scoreDifference();
    let min_diff = set.format.minDiff();
    let deciding_game_format_required = [false, false];
    let games_to_set = set.counter.map((player_score, player) => {
      let opponent_score = set.counter[1 - player];
      if (player_score > opponent_score) {
        if (opponent_score == threshold && deciding_game) return 0;
        if (player_score >= threshold && score_difference >= min_diff) return 0;
        if (player_score >= threshold - 1) return 1;
        return threshold - player_score;
      } else if (opponent_score > player_score) {
        deciding_game_format_required[player] =
          deciding_game && threshold == opponent_score;
        if (player_score == threshold && deciding_game) return 0;
        if (opponent_score >= threshold && score_difference >= min_diff)
          return 0;
        if (deciding_game_format_required[player]) return score_difference + 1;
        if (opponent_score >= threshold - 1) return score_difference + min_diff;
        return threshold - player_score;
      } else {
        deciding_game_format_required[player] =
          (deciding_game &&
            threshold == player_score &&
            threshold == opponent_score) ||
          (min_diff == 1 &&
            threshold == player_score &&
            threshold == opponent_score) ||
          (min_diff == 0 &&
            threshold - 1 == player_score &&
            threshold - 1 == opponent_score);
        if (deciding_game_format_required[player]) return 1;
        if (player_score >= threshold - 1) return min_diff;
        return threshold - player_score;
      }
    });

    let last_game = set.lastChild();
    let points_to_set = games_to_set.map((player_games_to_set, player) => {
      let points_needed = 0;
      if (last_game && !last_game.complete()) {
        points_needed += last_game.pointsToGame()[player];
        player_games_to_set -= 1;
      }
      if (!player_games_to_set) return points_needed;

      if (deciding_game_format_required[player]) {
        points_needed += set.format.decidingChild.threshold();
        player_games_to_set -= 1;
      }

      for (let i = player_games_to_set; i; i--) {
        points_needed += set.format.children.threshold();
      }
      return points_needed;
    });

    return { points_to_set, games_to_set };
  };

  let formatScore = ([p0score, p1score], [t0score, t1score]) => {
    if (t0score || t1score) {
      if (t0score > t1score) p1score += `(${t1score})`;
      if (t1score > t0score) p0score += `(${t0score})`;
    }
    return `${p0score}-${p1score}`;
  };

  set.scoreboard = (perspective) => {
    let last_game = set.lastChild();
    let score = set.perspectiveScore(set.counter, perspective);
    if (!last_game) return score.join("-");
    let tiebreak = last_game.format.tiebreak();
    if (last_game.complete() && !tiebreak) return score.join("-");
    if (!last_game.complete())
      return `${score.join("-")} (${last_game.scoreboard(perspective)})`;
    let last_game_score = last_game.score().counters.local;
    let tiebreak_score = set.perspectiveScore(last_game_score, perspective);
    if (tiebreak && set.complete() && set.children.length == 1)
      return tiebreak_score.join("-");
    return formatScore(score, tiebreak_score);
  };

  return {
    set: set.set,
    reset: set.reset,
    format: set.format,
    events: common.events,
    assignParser: common.assignParser,
    metadata: common.metadata,
    nextService: set.nextService,
    nextTeamServing: set.nextTeamServing,
    nextTeamReceiving: set.nextTeamReceiving,
    change: set.change,
    undo: set.undo,
    addPoint: set.addPoint,
    addPoints: set.addPoints,
    decoratePoint: set.decoratePoint,
    addScore: set.addScore,
    addScores: set.addScores,
    complete: set.complete,
    winner: set.winner,
    score: set.score,
    scoreboard: set.scoreboard,
    [set.child.plural]: set.accessChildren,
    children: set.accessChildren,
    lastChild: set.lastChild,
    newChild: set.newChild,
    history: set.history,
    pointsNeeded: set.pointsNeeded,
  };
};

umo.Game = ({
  index,
  parent_object,
  common = umo.common(),
  formatStructure,
} = {}) => {
  let child = { object: "Point", label: "point", plural: "points" };
  let format = umo.gameFormat({ common, formatStructure });
  let game = umo.stateObject({
    index,
    object: "Game",
    parent_object,
    format,
    child,
    common,
  });

  game.pointsToGame = () => {
    if (game.complete()) return undefined;
    let threshold = game.format.threshold();
    let deciding_point = game.format.hasDecider();
    let score_difference = game.scoreDifference();
    let min_diff = game.format.minDiff();
    let points_to_game = game.counter.map((player_score, player) => {
      let opponent_score = game.counter[1 - player];
      if (player_score > opponent_score) {
        if (opponent_score == threshold && deciding_point) return 0;
        if (player_score >= threshold && score_difference >= min_diff) return 0;
        if (player_score >= threshold - 1) return 1;
        return threshold - player_score;
      } else if (opponent_score > player_score) {
        if (player_score == threshold && deciding_point) return 0;
        if (opponent_score >= threshold && score_difference >= min_diff)
          return 0;
        if (opponent_score == threshold && deciding_point)
          return score_difference + 1;
        if (opponent_score >= threshold - 1) return score_difference + min_diff;
        return threshold - player_score;
      } else {
        if (
          deciding_point &&
          threshold == player_score &&
          threshold == opponent_score
        )
          return 1;
        if (player_score >= threshold - 1) return min_diff;
        return threshold - player_score;
      }
    });
    return points_to_game;
  };

  game.scoreboard = (perspective) => {
    let scoreboard;
    let threshold = game.format.threshold();
    let min_diff = game.format.minDiff();
    let score = game.perspectiveScore(game.counter, perspective);
    let tiebreak = threshold != 4 || game.format.tiebreak();
    if (tiebreak) return score.join("-");
    if (
      !game.thresholdMet() ||
      (game.singleThresholdMet() && game.minDifferenceMet()) ||
      (game.singleThresholdMet() && game.format.hasDecider() && min_diff == 1)
    ) {
      let progression = ["0", "15", "30", "40", "G", "G"];
      scoreboard = score.map((points, _player) => progression[points]).join("-");
    } else {
      scoreboard = score
        .map((points, player) => {
          let opponent_points = score[1 - player];
          let point = points - threshold;
          let opponent_point = opponent_points - threshold;
          if (point > opponent_point && game.minDifferenceMet()) return "G";
          return point > opponent_point ? "A" : "40";
        })
        .join("-");
    }
    return scoreboard.includes("G") ? "0-0" : scoreboard;
  };

  return {
    set: game.set,
    reset: game.reset,
    format: game.format,
    events: common.events,
    assignParser: common.assignParser,
    metadata: common.metadata,
    nextService: game.nextService,
    nextTeamServing: game.nextTeamServing,
    nextTeamReceiving: game.nextTeamReceiving,
    change: game.change,
    undo: game.undo,
    addPoint: game.addPoint,
    addPoints: game.addPoints,
    decoratePoint: game.decoratePoint,
    addScore: game.addScore,
    addScores: game.addScores,
    complete: game.complete,
    winner: game.winner,
    score: game.score,
    scoreboard: game.scoreboard,
    history: game.history,
    lastChild: game.lastChild,
    pointsToGame: game.pointsToGame,
  };
};

// Point parser now imported from separate module
umo.defaultPointParser = defaultPointParser;

// Format factories now imported from separate modules
umo.matchUpFormat = createMatchUpFormat;
umo.setFormat = createSetFormat;
umo.gameFormat = createGameFormat;
umo.formatObject = createFormatObject;

// Common factory extracted to src/core/common.ts
umo.common = () => createCommon(umo);

// Version API method
umo.version = () => umoVersion;

// TODS MatchUp Import (v3.2.0+)
umo.fromMatchUp = (matchUp: any) => {
  // Use global MatchUpAdapter (registered at module load)
  const MatchUpAdapter = (globalThis as any).MatchUpAdapter;
  if (!MatchUpAdapter) {
    throw new Error(
      "MatchUpAdapter not available. Import matchUpAdapter to use this feature.",
    );
  }
  const init = MatchUpAdapter.fromMatchUp(matchUp);
  const match = umo.Match(init);

  // Import score if present (future enhancement)
  // if (matchUp.score?.sets) {
  //    MatchUpAdapter.importScore(match, matchUp);
  // }

  return match;
};

// ES Module exports
export default umo;

// Named exports for convenience
export const {
  Match,
  matchUp,
  Set,
  Game,
  gameFormat,
  setFormat,
  matchUpFormat,
} = umo;
export const fromMatchUp = umo.fromMatchUp;

// TODS-NATIVE: Modern matchUp API (alias for Match with TODS nomenclature)
