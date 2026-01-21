/**
 * v3→v4 Adapter
 * 
 * Wraps v4.0 functional API to match v3.x object-oriented API
 * Allows existing v3.x tests to run against v4.0 implementation
 */

import type { MatchUp, AddPointOptions } from '../types';
import { createMatchUp, addPoint, getScore, getScoreboard, getWinner, isComplete } from '../index';
import { PointWithMetadata } from '../statistics/types';
import { enrichPoint } from '../statistics/pointParser';
import { buildCounters } from '../statistics/counters';
import { calculateStats } from '../statistics/calculator';

/**
 * Adapter that creates a v3-compatible API around v4 matchUp
 */
export function createV3Adapter() {
  // Log version on first load to confirm which code is running
  console.log('🔧 UMO v4 Adapter loaded - BUILD:', new Date().toISOString(), '- STATS FIX APPLIED');
  
  const adapter = {
    /**
     * Match factory - wraps v4.createMatchUp and provides v3 API
     */
    Match: (options: any = {}) => {
      // Create initial matchUp
      let matchUp = createMatchUp({
        matchUpId: options.matchUpId,
        matchUpFormat: options.matchUpFormat,
        participants: options.participants,
        isDoubles: options.isDoubles,
      });

      // Track first service and current server
      let firstService = 0;
      let currentServer = 0;
      
      // Track point history for statistics
      const pointHistory: PointWithMetadata[] = [];
      let pointIndex = 0;
      
      /**
       * Parse point code (S, R, A, D) to determine winner
       */
      function parsePointCode(code: string, server: number): AddPointOptions {
        const upper = code.toUpperCase();
        let winner: number;
        
        // S = Server wins, A = Ace (server wins)
        if (upper === 'S' || upper === 'A') {
          winner = server;
        }
        // R = Receiver wins, D = Double fault (receiver wins)
        else if (upper === 'R' || upper === 'D') {
          winner = 1 - server;
        }
        // P/Q = Penalty (assign to non-penalized player - assume receiver)
        else if (upper === 'P' || upper === 'Q') {
          winner = 1 - server;
        }
        else {
          throw new Error(`Unknown point code: ${code}`);
        }
        
        return { winner: winner as 0 | 1, server: server as 0 | 1 };
      }
      
      /**
       * Calculate "needed" metadata for current game state
       */
      function calculateNeeded(matchUp: any, score: any): any {
        const currentSet = score.sets?.[score.sets.length - 1];
        if (!currentSet) {
          return {
            points_to_game: undefined,
            points_to_set: undefined,
            is_breakpoint: false,
          };
        }
        
        const gameScore = currentSet.gameScore;
        if (!gameScore) {
          return {
            points_to_game: undefined,
            points_to_set: undefined,
            is_breakpoint: false,
          };
        }
        
        // Calculate points to game (simplified - doesn't handle all edge cases)
        const points_to_game = [
          gameScore.side1Points >= 3 && gameScore.side1Points > gameScore.side2Points ? 1 : undefined,
          gameScore.side2Points >= 3 && gameScore.side2Points > gameScore.side1Points ? 1 : undefined,
        ];
        
        // Calculate points to set (simplified)
        const side1GamesNeeded = 6 - (currentSet.side1Score || 0);
        const side2GamesNeeded = 6 - (currentSet.side2Score || 0);
        const points_to_set = [
          side1GamesNeeded <= 1 ? side1GamesNeeded : undefined,
          side2GamesNeeded <= 1 ? side2GamesNeeded : undefined,
        ];
        
        // Breakpoint detection (receiver is one point from winning game)
        const receiverIndex = 1 - currentServer;
        const is_breakpoint = points_to_game[receiverIndex] === 1;
        
        return {
          points_to_game,
          points_to_set,
          is_breakpoint,
        };
      }
      
      /**
       * Update service tracking based on game/set completion
       */
      function updateServiceTracking() {
        const score = getScore(matchUp);
        const totalPoints = matchUp.history?.points.length || 0;
        
        // In tiebreak, alternate every 2 points
        const currentSet = matchUp.score.sets[matchUp.score.sets.length - 1];
        if (currentSet) {
          const s1 = currentSet.side1Score || 0;
          const s2 = currentSet.side2Score || 0;
          
          // Check if in tiebreak (6-6)
          if (s1 === 6 && s2 === 6) {
            const tiebreakPoints = (currentSet.side1GameScores?.slice(-1)[0] || 0) + 
                                   (currentSet.side2GameScores?.slice(-1)[0] || 0);
            // Alternate every 2 points in tiebreak, starting with player who didn't serve last
            currentServer = Math.floor(tiebreakPoints / 2) % 2;
            return;
          }
        }
        
        // Regular games: alternate server each game
        const gamesCompleted = score.sets
          .flatMap(set => [(set.side1Score || 0), (set.side2Score || 0)])
          .reduce((a, b) => a + b, 0);
        
        currentServer = (firstService + gamesCompleted) % 2;
      }

      // Build v3-compatible match object
      const matchObj: any = {
        // State mutation methods (update internal matchUp)
        addPoint: (winner: number | any, metadata?: any) => {
          let pointOptions: AddPointOptions;
          
          if (typeof winner === 'number') {
            // Numeric input: 0 or 1
            pointOptions = { winner, ...metadata };
          } else if (typeof winner === 'string') {
            // Code-based input: 'S', 'R', 'A', 'D', etc.
            pointOptions = parsePointCode(winner, firstService);
          } else if (typeof winner === 'object') {
            // Object input: { winner: 0, code: 'S' }
            pointOptions = winner;
          } else {
            throw new Error(`Invalid point input: ${winner}`);
          }
          
          // Calculate metadata BEFORE adding the point
          const scoreBefore = getScore(matchUp);
          const currentSet = scoreBefore.sets?.length ? scoreBefore.sets.length - 1 : 0;
          const currentGame = scoreBefore.sets?.[currentSet]?.side1Score + scoreBefore.sets?.[currentSet]?.side2Score || 0;
          
          // Calculate "needed" metadata (points to game, points to set, etc.)
          const needed = calculateNeeded(matchUp, scoreBefore);
          
          matchUp = addPoint(matchUp, pointOptions);
          
          // Store point with metadata for statistics
          const enrichedPoint = enrichPoint(
            { ...pointOptions, ...metadata },
            {
              server: currentServer as 0 | 1,
              index: pointIndex++,
              set: currentSet,
              game: currentGame,
            }
          );
          // Add v3-specific metadata (not part of TODS Point type)
          (enrichedPoint as any).needed = needed;
          (enrichedPoint as any).breakpoint = needed.is_breakpoint || false;
          pointHistory.push(enrichedPoint);
          
          // Update service tracking after point
          updateServiceTracking();
          
          return matchObj; // Chainable
        },

        addPoints: (points: any[]) => {
          points.forEach(point => {
            // Use addPoint to ensure pointHistory is updated
            matchObj.addPoint(point);
          });
          return matchObj;
        },

        // Events API for v3 compatibility
        events: {
          addPoint: (callback: Function) => {
            // Store callback for point events
            // Note: In v3, this was used to register event listeners
            // For now, we'll store it but v4 doesn't have event system yet
            (matchObj as any)._pointCallback = callback;
          },
          undo: (callback: Function) => {
            (matchObj as any)._undoCallback = callback;
          },
          reset: (callback: Function) => {
            (matchObj as any)._resetCallback = callback;
          },
          clearEvents: () => {
            delete (matchObj as any)._pointCallback;
            delete (matchObj as any)._undoCallback;
            delete (matchObj as any)._resetCallback;
          },
        },

        // Query methods (read from matchUp)
        score: () => {
          const score = getScore(matchUp);
          
          // Count completed sets (sets with a winner)
          const completedSets = matchUp.score.sets.filter(s => s.winningSide !== undefined);
          const sets1 = completedSets.filter(s => s.winningSide === 1).length;
          const sets2 = completedSets.filter(s => s.winningSide === 2).length;
          
          return {
            scoreString: score.scoreString,
            counters: {
              points: score.points,
              games: score.games,
              sets: [sets1, sets2], // Array of set counts, not set details
              local: score.games,
            },
            points: `${score.points[0]}-${score.points[1]}`,
            games: `${score.games[0]}-${score.games[1]}`,
            sets: matchUp.score.sets.length > 0 
              ? `${matchUp.score.sets.filter(s => s.winningSide === 1).length}-${matchUp.score.sets.filter(s => s.winningSide === 2).length}`
              : '0-0',
            components: {
              sets: matchUp.score.sets.map(set => ({
                games: [set.side1Score || 0, set.side2Score || 0],
                tiebreak: set.side1TiebreakScore !== undefined 
                  ? [set.side1TiebreakScore, set.side2TiebreakScore]
                  : undefined,
              })),
            },
          };
        },

        scoreboard: (perspective?: number) => {
          return getScoreboard(matchUp, { perspective });
        },

        winner: () => {
          const winningSide = getWinner(matchUp);
          // Convert from 1-indexed to 0-indexed
          return winningSide !== undefined ? winningSide - 1 : undefined;
        },

        complete: () => {
          return isComplete(matchUp);
        },

        // Format access
        format: {
          code: matchUp.matchUpFormat,
          get structure() {
            // Return format structure (Factory-style)
            return (matchUp as any).formatStructure || {
              bestOf: 3,
              setFormat: {
                setTo: 6,
                tiebreakAt: 6,
                tiebreakFormat: { tiebreakTo: 7 },
                NoAD: false,
              },
            };
          },
          get setsToWin() {
            // Derive from matchUpFormat or default to 2 (best of 3)
            const structure = matchObj.format.structure;
            const bestOf = structure?.bestOf || 3;
            return Math.ceil(bestOf / 2);
          },
          settings: (formatConfig?: any) => {
            if (formatConfig) {
              // Update format
              if (formatConfig.code) {
                matchUp.matchUpFormat = formatConfig.code;
              }
              if (formatConfig.structure) {
                (matchUp as any).formatStructure = formatConfig.structure;
              }
            }
            return matchObj.format;
          },
          changeFormat: (newFormat: string) => {
            matchUp.matchUpFormat = newFormat;
            return matchObj;
          },
          pointsTo: 4, // Default for regular game
          winBy: 2,
          hasGoldenPoint: false,
          isTiebreak: false,
        },

        // Metadata access
        metadata: {
          match: { id: matchUp.matchUpId },
          get tournament() {
            // Tournament property access
            return (matchUp as any).tournamentName || '';
          },
          players: () => matchUp.sides.map(side => side.participant).filter(Boolean),
          definePlayer: (player: any) => {
            // Update matchUp sides with player info
            const sideIndex = player.index !== undefined ? player.index : matchUp.sides.length;
            if (sideIndex < matchUp.sides.length) {
              matchUp.sides[sideIndex].participant = {
                participantId: player.puid || player.id || `player-${sideIndex}`,
                participantName: player.firstName && player.lastName 
                  ? `${player.firstName} ${player.lastName}`
                  : player.name || `Player ${sideIndex + 1}`,
                participantType: 'INDIVIDUAL',
                participantRole: 'COMPETITOR',
                participantStatus: 'ACTIVE',
                person: {
                  standardGivenName: player.firstName || player.name || '',
                  standardFamilyName: player.lastName || '',
                  nationalityCode: player.ioc || player.nationality,
                  sex: player.sex,
                },
              };
            }
            return matchObj;
          },
          updateParticipant: (update: any) => {
            // Modern TODS-style update using sideNumber
            const { sideNumber, person, participantName, participantId } = update;
            const index = sideNumber - 1; // Convert to 0-based index
            
            // Ensure side exists
            if (!matchUp.sides[index]) {
              matchUp.sides[index] = {
                sideNumber,
              };
            }
            
            // Create or update participant
            if (!matchUp.sides[index].participant) {
              matchUp.sides[index].participant = {
                participantId: participantId || `player-${index}`,
                participantName: participantName || `${person?.standardGivenName || ''} ${person?.standardFamilyName || ''}`.trim(),
                participantType: 'INDIVIDUAL',
                participantRole: 'COMPETITOR',
                person: person || {},
              };
            } else {
              // Update existing participant
              if (participantName) {
                matchUp.sides[index].participant!.participantName = participantName;
              }
              if (participantId) {
                matchUp.sides[index].participant!.participantId = participantId;
              }
              if (person) {
                matchUp.sides[index].participant!.person = {
                  ...matchUp.sides[index].participant!.person,
                  ...person,
                };
                // Update participantName from person if not explicitly provided
                if (!participantName && person.standardGivenName && person.standardFamilyName) {
                  matchUp.sides[index].participant!.participantName = 
                    `${person.standardGivenName} ${person.standardFamilyName}`.trim();
                }
              }
            }
            
            return matchObj;
          },
          defineMatch: (match?: any) => {
            // When called without arguments, return current match metadata
            if (match === undefined) {
              return {
                id: matchUp.matchUpId,
                matchUpId: matchUp.matchUpId,
                date: (matchUp as any).scheduledDate,
                status: matchUp.matchUpStatus,
                court: (matchUp as any).court,
                umpire: (matchUp as any).umpire,
              };
            }
            
            // When called with arguments, set match metadata
            if (!match) return matchObj;
            if (match.id) {
              matchUp.matchUpId = match.id;
            }
            if (match.matchUpId) {
              matchUp.matchUpId = match.matchUpId;
            }
            if (match.date !== undefined) {
              // Store date in matchUp (TODS uses scheduledDate)
              (matchUp as any).scheduledDate = match.date;
            }
            if (match.status) {
              matchUp.matchUpStatus = match.status;
            }
            if (match.court) {
              (matchUp as any).court = match.court;
            }
            if (match.umpire) {
              (matchUp as any).umpire = match.umpire;
            }
            return matchObj;
          },
          defineTournament: (tournament?: any) => {
            // When called without arguments, return current tournament metadata
            if (tournament === undefined) {
              return {
                name: (matchUp as any).tournamentName,
                tournamentName: (matchUp as any).tournamentName,
                category: (matchUp as any).category,
                level: (matchUp as any).level,
              };
            }
            
            // When called with arguments, set tournament metadata
            if (!tournament) return matchObj;
            if (tournament.name) {
              (matchUp as any).tournamentName = tournament.name;
            }
            if (tournament.tournamentName) {
              (matchUp as any).tournamentName = tournament.tournamentName;
            }
            if (tournament.category) {
              (matchUp as any).category = tournament.category;
            }
            if (tournament.level) {
              (matchUp as any).level = tournament.level;
            }
            return matchObj;
          },
          serviceOrder: () => {
            // Return array of player indices in service order
            return [0, 1];
          },
          playerTeam: (player: number) => {
            // For singles, player is their own team
            return player;
          },
          teams: () => {
            // For singles, each player is a team
            return [[0], [1]];
          },
          timestamps: (value?: boolean) => {
            // Get/set timestamps flag
            if (value !== undefined) {
              (matchUp as any).useTimestamps = value;
              return matchObj;
            }
            return (matchUp as any).useTimestamps || false;
          },
          liveStats: (value?: boolean) => {
            // Get/set live stats flag (in metadata for consistency)
            if (value !== undefined) {
              (matchUp as any).liveStats = value;
              return matchObj.set;
            }
            return (matchUp as any).liveStats || false;
          },
          resetStats: () => {
            // Reset statistics
            (matchUp as any).stats = {};
            return matchObj;
          },
          reset: () => {
            // Reset metadata to defaults
            return matchObj;
          },
        },

        // History access
        history: {
          points: () => matchUp.history?.points || [],
          lastPoint: () => {
            const points = matchUp.history?.points || [];
            return points.length > 0 ? points[points.length - 1] : undefined;
          },
          common: () => {
            // Return common history (addPoint episodes)
            return (matchUp.history?.points || []).map((point: any, index) => ({
              action: 'addPoint',
              point: {
                ...point,
                index,
              },
              needed: point.needed || {},
            }));
          },
          action: (actionName: string) => {
            if (actionName === 'addPoint') {
              // Return addPoint episodes with point data and metadata
              return (matchUp.history?.points || []).map((point: any, index) => ({
                action: 'addPoint',
                point: {
                  ...point,
                  index,
                  breakpoint: point.breakpoint || false,
                  server: point.server !== undefined ? point.server : index % 2,
                },
                needed: point.needed || {},
              }));
            }
            return [];
          },
        },

        // State setters
        set: {
          firstService: (value?: number) => {
            if (value !== undefined) {
              firstService = value;
              return matchObj.set;
            }
            return firstService;
          },
          liveStats: (value?: boolean) => {
            // Get/set live stats flag
            if (value !== undefined) {
              (matchUp as any).liveStats = value;
              return matchObj.set;
            }
            return (matchUp as any).liveStats || false;
          },
          perspectiveScore: (value?: boolean) => {
            // v4 doesn't have global perspective, handled per-query
            return value !== undefined ? matchObj.set : false;
          },
        },

        // Set/Game access
        sets: () => {
          // Return array of set objects with v3 API
          return matchUp.score.sets.map((set, index) => ({
            score: () => ({
              counters: {
                local: [set.side1Score || 0, set.side2Score || 0],
              },
            }),
            scoreboard: () => {
              const s1 = set.side1Score || 0;
              const s2 = set.side2Score || 0;
              if (set.side1TiebreakScore !== undefined) {
                return s1 > s2 
                  ? `${s1}-${s2}(${set.side2TiebreakScore})`
                  : `${s1}(${set.side1TiebreakScore})-${s2}`;
              }
              return `${s1}-${s2}`;
            },
            games: () => {
              // Return game objects (simplified for now)
              const gameCount = Math.max(set.side1Score || 0, set.side2Score || 0);
              return Array.from({ length: gameCount }, (_, i) => ({
                index: i,
                score: () => ({ counters: { local: [0, 0] } }),
              }));
            },
            complete: () => set.winningSide !== undefined,
            winner: () => set.winningSide !== undefined ? set.winningSide - 1 : undefined,
          }));
        },

        games: () => {
          // Current set's games
          const currentSet = matchUp.score.sets[matchUp.score.sets.length - 1];
          if (!currentSet) return [];
          return matchObj.sets()[matchUp.score.sets.length - 1].games();
        },

        // Undo functionality
        undo: () => {
          if (!matchUp.history || matchUp.history.points.length === 0) {
            return matchObj;
          }
          
          // Recreate matchUp without last point
          const points = matchUp.history.points.slice(0, -1);
          matchUp = createMatchUp({
            matchUpFormat: matchUp.matchUpFormat,
            matchUpId: matchUp.matchUpId,
            participants: matchUp.sides.map(s => s.participant).filter(Boolean),
          });
          
          // Replay points
          points.forEach(point => {
            matchUp = addPoint(matchUp, point);
          });
          
          return matchObj;
        },

        // Additional methods that v3 tests might use
        reset: () => {
          matchUp = createMatchUp({
            matchUpFormat: matchUp.matchUpFormat,
            matchUpId: matchUp.matchUpId,
          });
          return matchObj;
        },
        
        nextService: () => {
          updateServiceTracking();
          return currentServer;
        },
        
        nextTeamServing: () => {
          return firstService % 2;
        },
        
        nextTeamReceiving: () => {
          return (firstService + 1) % 2;
        },

        participants: (value?: any) => {
          if (value !== undefined) {
            // Set participants
            return matchObj;
          }
          return matchUp.sides.map(side => side.participant);
        },

        doubles: (value?: boolean) => {
          if (value !== undefined) {
            // Set doubles mode
            return matchObj;
          }
          return matchUp.matchUpType === 'DOUBLES';
        },

        singles: (value?: boolean) => {
          if (value !== undefined) {
            // Set singles mode
            return matchObj;
          }
          return matchUp.matchUpType === 'SINGLES';
        },
        
        // Statistics API (v3 compatible)
        stats: {
          counters: (setFilter?: number) => {
            // Use matchUp.history.points directly since that has the data
            const points = (matchUp.history?.points || []) as unknown as PointWithMetadata[];
            return buildCounters(points, { setFilter });
          },
          calculated: (setFilter?: number) => {
            // Use matchUp.history.points directly since that has the data
            const points = (matchUp.history?.points || []) as unknown as PointWithMetadata[];
            const counters = buildCounters(points, { setFilter });
            return calculateStats(counters);
          },
        },
        
        // Export as TODS matchUp
        toMatchUp: () => {
          // Return full matchUp with all metadata
          return {
            ...matchUp,
            // Ensure metadata is preserved
            tournamentName: (matchUp as any).tournamentName,
            category: (matchUp as any).category,
            level: (matchUp as any).level,
            court: (matchUp as any).court,
            umpire: (matchUp as any).umpire,
            scheduledDate: (matchUp as any).scheduledDate,
          };
        },
        
        // Decorate point with additional metadata
        decoratePoint: (point: any, metadata: any) => {
          if (!point || point.index === undefined) return matchObj;
          
          // Find point in history and update it
          const pointInHistory = pointHistory.find(p => p.index === point.index);
          if (pointInHistory) {
            Object.assign(pointInHistory, metadata);
          }
          
          // Also update in matchUp history if exists
          if (matchUp.history?.points && matchUp.history.points[point.index]) {
            Object.assign(matchUp.history.points[point.index], metadata);
          }
          
          return matchObj;
        },
        
        // Match status property (getter/setter)
        get status() {
          return (matchUp as any).status || '';
        },
        set status(value: string) {
          (matchUp as any).status = value;
        },

        // Access internal matchUp for debugging
        _matchUp: () => matchUp,
        _pointHistory: () => pointHistory,
      };

      return matchObj;
    },
    /**
     * fromMatchUp - Convert TODS matchUp to v3 format (stub for now)
     * 
     * @param matchUp - TODS matchUp object
     * @returns Configuration object for v3 adapter
     */
    fromMatchUp: (matchUp: any) => {
      return {
        id: matchUp.matchUpId,
        type: matchUp.matchUpFormat,
        participants: matchUp.sides?.flatMap((side: any) => 
          side.participant ? [side.participant] : []
        ),
        isDoubles: matchUp.matchUpType === 'DOUBLES',
      };
    },
  };

  return adapter;
}
