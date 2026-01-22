// @ts-nocheck
/**
 * Common Factory
 * Creates shared context for Match/Set/Game objects including:
 * - Event management
 * - Metadata (TODS-native)
 * - History tracking
 * - Stats system
 * - Service order
 */

import { TODSMetadata } from "../metadata/todsMetadata";
import { INDIVIDUAL } from "../constants";

export function createCommon(umo: any) {
  let number_of_players = 2;
  let addPoint_events = umo.addPoint_events.slice();
  let undo_events = umo.undo_events.slice();
  let reset_events = umo.reset_events.slice();

  // TODS-NATIVE: Use TODSMetadata for internal storage
  let todsMetadata = new TODSMetadata();

  let stat_points;
  let last_episode;
  let filtered_stats;

  let accessors: any = {
    resetStats() {
      stat_points = undefined;
      last_episode = undefined;
      filtered_stats = undefined;
      todsMetadata.resetStats();
    },
    reset() {
      todsMetadata.reset();
      todsMetadata.setServiceOrder([0, 1]);
      todsMetadata.setReceiveOrder([1, 0]);
    },
    timestamps(value) {
      if (!arguments.length) return todsMetadata.getTimestamps();
      if ([true, false].includes(value)) todsMetadata.setTimestamps(value);
      return accessors;
    },
    serviceOrder(order) {
      if (!arguments.length) return todsMetadata.getServiceOrder().slice();
      return changeOrder(order, "service_order", "receive_order");
    },
    doublesServiceChange() {
      if (number_of_players != 4) return false;
      // FIXME: Not allowed if not the end of a set; how to determine within common?
    },
    receiveOrder(order) {
      if (!arguments.length) return todsMetadata.getReceiveOrder().slice();
      return changeOrder(order, "receive_order", "service_order");
    },
    teams() {
      let teams = [];
      const serviceOrder = todsMetadata.getServiceOrder();
      teams[0] = serviceOrder
        .filter((service, i) => (i + 1) % 2)
        .sort((a, b) => a - b);
      teams[1] = serviceOrder
        .filter((service, i) => i % 2)
        .sort((a, b) => a - b);
      teams.sort((a, b) => a[0] - b[0]);
      return teams;
    },
    playerTeam(player) {
      return accessors
        .teams()
        .map((team) => team.includes(player))
        .indexOf(true);
    },
    teamPlayers() {
      return accessors
        .teams()
        .map((team) => team.map((i) => accessors.players(i).name));
    },
    // TODS-NATIVE: Return TODS Participants
    players(index) {
      if (!arguments.length) {
        const participants = todsMetadata.getParticipants();
        const serviceOrder = todsMetadata.getServiceOrder();
        // Return TODS participants in service order
        return serviceOrder.map((i) => {
          const participant = todsMetadata.getParticipantByIndex(i);
          return (
            participant || {
              participantId: `player_${i}`,
              participantName: `Player ${["One", "Two", "Three", "Four"][i]}`,
              participantType: INDIVIDUAL,
            }
          );
        });
      }
      if (isNaN(index) || index < 0 || index > 3) return false;
      const participant = todsMetadata.getParticipantByIndex(index);
      if (participant) return participant;
      // Return TODS-formatted default
      return {
        participantId: `player_${index}`,
        participantName: `Player ${["One", "Two", "Three", "Four"][index]}`,
        participantType: INDIVIDUAL,
      };
    },
    // TODS-NATIVE: Update participant (modern API)
    updateParticipant(update: any) {
      return todsMetadata.updateParticipant(update);
    },
    // LEGACY: definePlayer - deprecated, use updateParticipant()
    definePlayer({
      index,
      name,
      firstName,
      lastName,
      birth,
      puid,
      hand,
      seed,
      rank,
      age,
      entry,
      ioc,
      draw_position,
    } = {}) {
      const result = todsMetadata.definePlayer({
        index,
        name,
        firstName,
        lastName,
        birth,
        puid,
        hand,
        seed,
        rank,
        age,
        entry,
        ioc,
        draw_position,
      });
      // Return TODS Participant
      return todsMetadata.getParticipantByIndex(result.index);
    },
    defineTournament({
      name,
      tuid,
      start_date,
      tour,
      rank,
      surface,
      in_out,
      draw,
      draw_size,
      round,
      level,
    } = {}) {
      const current = todsMetadata.getTournament();
      const definition = {
        name,
        tuid,
        start_date,
        tour,
        rank,
        surface,
        in_out,
        draw,
        draw_size,
        round,
        level,
      };
      const updated = { ...current };
      Object.keys(definition).forEach((key) => {
        if (definition[key]) updated[key] = definition[key];
      });
      todsMetadata.setTournament(updated);
      return updated;
    },
    defineMatch({
      id,
      muid,
      date,
      gender,
      year,
      court,
      start_time,
      end_time,
      duration,
      status,
      umpire,
      official_score,
    } = {}) {
      const current = todsMetadata.getMatchUp();
      const definition = {
        id,
        muid,
        date,
        gender,
        year,
        court,
        start_time,
        end_time,
        duration,
        status,
        umpire,
        official_score,
      };
      const updated = { ...current };
      Object.keys(definition).forEach((key) => {
        if (definition[key]) updated[key] = definition[key];
      });
      if (id) updated.matchUpId = id;
      if (muid) updated.matchUpId = muid;
      todsMetadata.updateMatchUp(updated);
      return updated;
    },
    get match() {
      return todsMetadata.getMatchUp();
    },
    get tournament() {
      return todsMetadata.getTournament();
    },
    showTiebreakOrder(first_service) {
      return calcTiebreakService(12, first_service);
    },
  };

  // Expose todsMetadata for direct TODS access
  accessors._todsMetadata = todsMetadata;

  function changeOrder(order, submitted, counterpart) {
    let sameOrder = (a, b) => !a.filter((o, i) => o != b[i]).length;
    let notXinY = (x, y) =>
      y.filter((n) => x.indexOf(n) != -1).length != y.length;
    if (
      !Array.isArray(order) ||
      order.length != number_of_players ||
      notXinY(order, [0, 1]) ||
      notXinY([0, 1, 2, 3], order)
    )
      return false;

    const currentSubmitted =
      submitted === "service_order"
        ? todsMetadata.getServiceOrder()
        : todsMetadata.getReceiveOrder();
    let no_format_change = order.length == currentSubmitted.length;
    if (sameOrder(order, currentSubmitted) && no_format_change)
      return accessors;

    let teams = accessors.teams();
    if (submitted === "service_order") todsMetadata.setServiceOrder(order);
    else todsMetadata.setReceiveOrder(order);
    let new_teams = accessors.teams();

    const currentCounterpart =
      counterpart === "receive_order"
        ? todsMetadata.getReceiveOrder()
        : todsMetadata.getServiceOrder();
    if (
      order.length == 4 &&
      sameOrder(teams[0], new_teams[0]) &&
      no_format_change &&
      serviceToOpponent(order, currentCounterpart, new_teams)
    )
      return accessors;

    const counterpartOrder = order.map((o) => order.length - 1 - o);
    if (counterpart === "receive_order")
      todsMetadata.setReceiveOrder(counterpartOrder);
    else todsMetadata.setServiceOrder(counterpartOrder);
    return accessors;
  }

  function serviceToOpponent(players, opponents, teams) {
    let sameTeam = (p, o) =>
      teams.filter(
        (team) =>
          team.filter((player) => [p, o].indexOf(player) >= 0).length > 1,
      ).length;
    return !players.filter((s, i) => sameTeam(s, opponents[i])).length;
  }

  function calcTiebreakService(number, first_service) {
    let progression = [];
    return [...Array(number).keys()].map(() => {
      let result = calcNext(progression, first_service);
      progression.push(result);
      return result;
    });
  }

  function calcNext(progression, first_service) {
    let last_position = pos(progression.length);
    let next_position = (progression.length + 1) % 4 < 2;
    let last_score = progression[progression.length - 1];
    const serviceOrder = todsMetadata.getServiceOrder();
    let last_service =
      last_score != undefined
        ? last_score
        : first_service != undefined
          ? first_service
          : serviceOrder[0];
    let next_service =
      next_position == last_position
        ? last_service
        : pub.advanceService(last_service);
    return next_service;
  }

  function pos(number) {
    let iterations = [true].concat(
      [...Array(number).keys()].map((i) => (i + 1) % 4 < 2),
    );
    return iterations[number];
  }

  function setServiceOrder() {
    if (number_of_players == 2) {
      let existing_order = pub.metadata.serviceOrder();
      if (existing_order.length == 2) return;
      pub.metadata.serviceOrder(
        existing_order.filter((f) => [0, 1].indexOf(f) >= 0),
      );
    } else {
      let existing_order = pub.metadata.serviceOrder();
      if (existing_order.length == 4) return;
      let new_order = existing_order.slice();
      existing_order.forEach((o) => new_order.push(o + 2));
      pub.metadata.serviceOrder(new_order);
    }
  }

  let addEvent = (add_event) => {
    if (!add_event) return addPoint_events;
    if (typeof add_event == "function") {
      if (!addPoint_events.includes(add_event)) addPoint_events.push(add_event);
    } else if (Array.isArray(add_event)) {
      add_event.foreach(e)((e) => {
        if (typeof e == "function") addPoint_events.push(c);
      });
    }
  };

  let undoEvent = (undo_event) => {
    if (!undo_event) return undo_events;
    if (typeof undo_event == "function") {
      if (!undo_events.includes(undo_event)) undo_events.push(undo_event);
    } else if (Array.isArray(undo_event)) {
      undo_event.foreach(e)((e) => {
        if (typeof e == "function") undo_events.push(c);
      });
    }
  };

  let resetEvent = (reset_event) => {
    if (!reset_event) return reset_events;
    if (typeof reset_event == "function") {
      if (!reset_events.includes(reset_event)) reset_events.push(reset_event);
    } else if (Array.isArray(reset_event)) {
      reset_event.foreach(e)((e) => {
        if (typeof e == "function") reset_events.push(c);
      });
    }
  };

  let clearEvents = () => {
    addPoint_events = [];
    undo_events = [];
    reset_events = [];
  };

  let pub = {
    metadata: accessors,
    pointParser: umo.pointParser,
    events: {
      addPoint: addEvent,
      undo: undoEvent,
      clearEvents,
      reset: resetEvent,
    },
    history: [],
    live_stats: false,
    perspective_score: false,
    assignParser(parser) {
      pub.pointParser = parser;
    },
    advanceService(service) {
      const serviceOrder = todsMetadata.getServiceOrder();
      let index = serviceOrder.indexOf(service) + 1;
      return serviceOrder[index < accessors.players().length ? index : 0];
    },
    nextTiebreakService(history, first_service) {
      let so = calcTiebreakService(history.length + 1, first_service);
      return so[so.length - 1];
    },
    singles(value) {
      if (!arguments.length) return number_of_players == 2 ? true : false;
      number_of_players = value ? 2 : 4;
      setServiceOrder();
      return pub;
    },
    doubles(value) {
      if (!arguments.length) return number_of_players == 4 ? true : false;
      number_of_players = value ? 4 : 2;
      setServiceOrder();
      return pub;
    },
    stats: {
      calculated(set_filter) {
        console.log('[UMO-V3] stats.calculated called with set_filter:', set_filter);
        // V4 STATS ENGINE: Use v4 statistics for accurate counting
        // Dynamically import v4 stats functions (available at runtime)
        try {
          const v4Stats = (globalThis as any).__UMO_V4_STATS__;
          
          if (!v4Stats) {
            console.warn('V4 stats engine not loaded, using fallback');
            return calculatedStats(pub.stats.counters(set_filter));
          }
          
          // Get points from history
          const episodes = pub.history.filter((episode: any) => episode.action == "addPoint");
          const points = set_filter !== undefined
            ? episodes.filter((episode: any) => episode.point.set == set_filter).map((e: any) => e.point)
            : episodes.map((e: any) => e.point);
          
          // Use v4 engine
          const counters = v4Stats.buildCounters(points, { setFilter: set_filter });
          return v4Stats.calculateStats(counters);
        } catch (error) {
          console.error('Error in v4 stats calculation, using fallback:', error);
          return calculatedStats(pub.stats.counters(set_filter));
        }
      },
      counters(set_filter) {
        console.log('[UMO-V3] stats.counters called with set_filter:', set_filter);
        if (
          (set_filter != undefined && filtered_stats != set_filter) ||
          (set_filter == undefined && filtered_stats != undefined)
        ) {
          accessors.resetStats();
        }
        if (!stat_points) {
          pub.live_stats = true;
          let episodes = pub.history.filter(
            (episode) => episode.action == "addPoint",
          );
          if (set_filter != undefined) {
            episodes = episodes.filter(
              (episode) => episode.point.set == set_filter,
            );
            filtered_stats = set_filter;
          }
          episodes.forEach((episode) => pub.addStatPoint(episode));
        }
        return stat_points;
      },
    },
    addStatPoint(episode) {
      if (!pub.live_stats) return;
      let point = episode.point;
      if (!stat_points) stat_points = { players: {}, teams: {} };
      let server_team = accessors.playerTeam(point.server);
      let team_winner = accessors.playerTeam(point.winner);
      let team_loser = 1 - team_winner;

      function addStat({ player, team, stat, episode }) {
        if (player != undefined) {
          if (!stat_points.players[player]) stat_points.players[player] = {};
          if (!stat_points.players[player][stat])
            stat_points.players[player][stat] = [];
          stat_points.players[player][stat].push(episode);
        }
        if (team != undefined) {
          if (!stat_points.teams[team]) stat_points.teams[team] = {};
          if (!stat_points.teams[team][stat])
            stat_points.teams[team][stat] = [];
          stat_points.teams[team][stat].push(episode);
        }
      }

      addStat({ player: point.winner, episode, stat: "pointsWon" });
      addStat({ team: team_winner, episode, stat: "pointsWon" });

      if (point.server == point.winner) {
        addStat({ player: point.server, episode, stat: "servesWon" });
        addStat({ team: server_team, episode, stat: "servesWon" });
      } else {
        addStat({ player: point.server, episode, stat: "servesLost" });
        addStat({ team: server_team, episode, stat: "servesLost" });
        addStat({ player: point.winner, episode, stat: "returns" });
        addStat({ team: team_loser, episode, stat: "returns" });
      }
      if (point.breakpoint) {
        addStat({ player: point.server, undefined, stat: "breakpointsSaved" });
        addStat({ player: point.server, episode, stat: "breakpointsFaced" });
      }
      if (
        last_episode &&
        last_episode.point.breakpoint &&
        last_episode.point.server == point.winner
      ) {
        addStat({ player: point.server, episode, stat: "breakpointsSaved" });
      }

      if (episode.game && episode.game.complete) {
        addStat({ team: team_winner, episode, stat: "gamesWon" });
      }
      last_episode = episode;
    },
    removeStatPoint(episode) {
      if (!pub.live_stats) return;
      Object.keys(stat_points).forEach((grouping) => {
        Object.keys(stat_points[grouping]).forEach((group) => {
          Object.keys(stat_points[grouping][group]).forEach((stat) => {
            if (stat_points[grouping][group][stat].length) {
              stat_points[grouping][group][stat] = stat_points[grouping][group][
                stat
              ].filter((f) => f.point.index != episode.point.index);
            }
          });
        });
      });
      let points = pub.history.filter(
        (episode) => episode.action == "addPoint",
      );
      last_episode = points.length ? points[points.length - 1] : undefined;
    },
  };

  function calculatedStats(stats) {
    if (!stats || !stats.teams) return [];

    // prefix of '-' indicates that value for opposing team should be used
    // '*' indicates that value is optional
    let calculated_stats = {
      Aces: { numerators: ["aces"], calc: "number" },
      "Double Faults": { numerators: ["doubleFaults"], calc: "number" },
      "First Serve %": {
        numerators: ["serves1stIn"],
        denominators: ["pointsServed"],
        calc: "percentage",
      },
      "Unforced Errors": { numerators: ["unforcedErrors"], calc: "number" },
      "Forced Errors": { numerators: ["forcedErrors"], calc: "number" },
      Winners: { numerators: ["winners"], calc: "number" },
      "Total Points Won": { numerators: ["pointsWon"], calc: "number" },
      "Max Pts/Row": {
        numerators: ["pointsWon"],
        calc: "maxConsecutive",
        attribute: "index",
      },
      "Max Games/Row": {
        numerators: ["gamesWon"],
        calc: "maxConsecutive",
        attribute: "game",
      },
      "Points Won 1st": {
        numerators: ["serves1stWon"],
        denominators: ["serves1stIn"],
        calc: "percentage",
      },
      "Points Won 2nd": {
        numerators: ["serves2ndWon"],
        denominators: ["serves2ndIn"],
        calc: "percentage",
      },
      "Points Won Receiving": {
        numerators: ["received1stWon", "received2ndWon"],
        denominators: ["-pointsServed"],
        calc: "percentage",
      },
      "Breakpoints Saved": {
        numerators: ["breakpointsSaved"],
        denominators: ["breakpointsFaced"],
        calc: "percentage",
      },
      "Breakpoints Converted": {
        numerators: ["-breakpointsSaved"],
        denominators: ["-breakpointsFaced"],
        calc: "difference",
      },
      "Aggressive Margin": {
        calc: "aggressiveMargin",
        numerators: ["*doubleFaults", "*unforcedErrors"],
        denominators: ["*aces", "*winners", "-*forcedErrors"],
      },
    };

    let reduceComponents = (components, teams, team) => {
      if (!components) return undefined;
      if (!teams?.[team]) return 0; // Defensive check
      let values = components.map((component) => {
        let counter = component.split("-").reverse()[0].split("*").join("");
        let component_team =
          teams[component.indexOf("-") == 0 ? 1 - team : team];
        return component_team?.[counter] ? component_team[counter].length : 0;
      });
      return [].concat(0, 0, ...values).reduce((a, b) => a + b, 0);
    };

    let numeratorDenominator = (stat_obj, teams, team) => {
      let numerator = reduceComponents(stat_obj.numerators, teams, team);
      let denominator = reduceComponents(stat_obj.denominators, teams, team);
      return { numerator, denominator };
    };

    let displayPct = (numerator, denominator) => {
      let pct = Math.round((numerator / denominator) * 100);
      return { value: pct, display: `${pct}% (${numerator}/${denominator})` };
    };

    let stat_calcs = {
      number(stat_obj, teams, team) {
        const { numerator } = numeratorDenominator(stat_obj, teams, team);
        return {
          display: numerator,
          value: numerator,
          numerators: stat_obj.numerators,
        };
      },
      maxConsecutive(stat_obj, teams, team) {
        let stat = stat_obj.numerators[0];
        let attribute = stat_obj.attribute;
        // Defensive: check if teams[team] exists before accessing
        if (!teams?.[team]) return { value: 0, display: 0 };
        let episodes = teams[team][stat];
        if (!episodes) return { value: 0, display: 0 };
        let current = undefined;
        let max_consecutive = 0;
        let consecutive = episodes.length ? 1 : 0;
        episodes.forEach((episode) => {
          if (current + 1 == episode.point[attribute]) {
            consecutive += 1;
          } else {
            if (consecutive > max_consecutive) max_consecutive = consecutive;
            consecutive = 1;
          }
          current = episode.point[attribute];
        });
        if (consecutive > max_consecutive) max_consecutive = consecutive;
        return { display: max_consecutive, value: max_consecutive };
      },
      percentage(stat_obj, teams, team) {
        const { numerator, denominator } = numeratorDenominator(
          stat_obj,
          teams,
          team,
        );
        if (numerator == undefined || !denominator)
          return { value: 0, display: 0 };
        return Object.assign(displayPct(numerator, denominator), {
          numerators: stat_obj.numerators,
        });
      },
      difference(stat_obj, teams, team) {
        const { numerator, denominator } = numeratorDenominator(
          stat_obj,
          teams,
          team,
        );
        if (numerator == undefined || !denominator)
          return { value: 0, display: 0 };
        let diff = Math.abs(denominator - numerator);
        return Object.assign(displayPct(diff, denominator), {
          numerators: stat_obj.numerators,
        });
      },
      aggressiveMargin(stat_obj, teams, team) {
        let positives = reduceComponents(stat_obj.denominators, teams, team);
        let negatives = reduceComponents(stat_obj.numerators, teams, team);
        let margin = positives - negatives;
        return { value: margin, display: margin };
      },
    };

    let keys = Object.keys(calculated_stats);
    return keys.map((key) => {
      let stat = calculated_stats[key];
      let calc = stat_calcs[stat.calc];
      let teams = [
        stat_calcs[stat.calc](stat, stats.teams, 0),
        stat_calcs[stat.calc](stat, stats.teams, 1),
      ];
      return { category: key, teams };
    });
  }

  // Initialize
  setServiceOrder();
  accessors.reset();

  return pub;
}
