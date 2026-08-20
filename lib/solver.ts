import type { SessionAttendee, Team, TeamId, Proposal, ProposalMetrics, Position } from './types';
import { friendshipSet } from './data';
import { generateRationale } from './rationale';

// --- 5-1 composition requirement per team ---
export const REQUIRED_PER_TEAM: Record<Position, number> = {
  S: 1,
  OH: 2,
  MB: 1,
  OP: 1,
  L: 1,
};

// --- Resolve a player's effective position ---
// Uses signedUpPosition if set, otherwise first position_pref that matches an
// unfilled slot. Returns null if no valid assignment exists.
function resolvePosition(
  player: SessionAttendee,
  availableSlots: Map<Position, number>
): Position | null {
  if (player.signedUpPosition) {
    const remaining = availableSlots.get(player.signedUpPosition) ?? 0;
    if (remaining > 0) return player.signedUpPosition;
    return null; // Position is full, can't place
  }
  // Fall back to position_prefs order
  for (const pref of player.positionPrefs) {
    const remaining = availableSlots.get(pref) ?? 0;
    if (remaining > 0) return pref;
  }
  return null;
}

// --- Check composition feasibility ---
export interface CompositionShortfall {
  position: Position;
  required: number;
  available: number;
}

export function checkComposition(
  attendees: SessionAttendee[],
  teamCount: number
): CompositionShortfall[] {
  const shortfalls: CompositionShortfall[] = [];

  for (const [pos, perTeam] of Object.entries(REQUIRED_PER_TEAM) as [Position, number][]) {
    const required = perTeam * teamCount;
    // Count players who can fill this position:
    // 1. Players signed up for this position
    // 2. Players with null signedUpPosition whose first viable pref is this position
    //    (conservative: count only direct sign-ups + null-position with this as first pref)
    let available = attendees.filter((p) => p.signedUpPosition === pos).length;
    // Add players with no signed_up_position whose first pref is this position
    const unassigned = attendees.filter((p) => p.signedUpPosition === null);
    for (const p of unassigned) {
      if (p.positionPrefs[0] === pos) available++;
    }
    if (available < required) {
      shortfalls.push({ position: pos, required, available });
    }
  }

  return shortfalls;
}

// --- Team strength (uses band, treating null as 0) ---
function teamStrength(team: SessionAttendee[]): number {
  const bands = team.map((p) => p.band ?? 0);
  const mean = bands.reduce((a, b) => a + b, 0) / bands.length;

  // Min band among OH and L (passing positions)
  const passers = team.filter(
    (p) => p.signedUpPosition === 'OH' || p.signedUpPosition === 'L'
  );
  const minPassing = passers.length > 0
    ? Math.min(...passers.map((p) => p.band ?? 0))
    : mean;

  return 1.0 * mean + 0.4 * minPassing;
}

const STRENGTH_WEIGHT_SUM = 1.4;

/** Normalized team rating on the band scale (1-7). */
export function teamRating(team: SessionAttendee[]): number {
  return Math.round((teamStrength(team) / STRENGTH_WEIGHT_SUM) * 10) / 10;
}

// --- Hard constraints ---
function isValid(teams: SessionAttendee[][]): boolean {
  for (const team of teams) {
    // Check exact 5-1 composition
    const posCounts = new Map<Position, number>();
    for (const p of team) {
      const pos = p.signedUpPosition;
      if (pos) posCounts.set(pos, (posCounts.get(pos) ?? 0) + 1);
    }
    for (const [pos, required] of Object.entries(REQUIRED_PER_TEAM) as [Position, number][]) {
      if ((posCounts.get(pos) ?? 0) !== required) return false;
    }

    // No injured player at OP or MB
    for (const p of team) {
      if (
        p.declaredState === 'injured' &&
        (p.signedUpPosition === 'OP' || p.signedUpPosition === 'MB')
      ) {
        return false;
      }
    }
  }

  // Team sizes must all be 6
  if (!teams.every((t) => t.length === 6)) return false;

  return true;
}

// --- Compute metrics ---
export function computeMetrics(
  teams: SessionAttendee[][],
  relevantFriendPairs: [number, number][]
): ProposalMetrics {
  const strengths = teams.map(teamStrength);
  const largestGap = Math.max(...strengths) - Math.min(...strengths);

  // Friend pairs
  let friendPairsSatisfied = 0;
  for (const [a, b] of relevantFriendPairs) {
    const sameTeam = teams.some(
      (t) => t.some((p) => p.id === a) && t.some((p) => p.id === b)
    );
    if (sameTeam) friendPairsSatisfied++;
  }

  // Newcomer buddied: every 'new' player shares a team with a 'solid' player
  let newcomerBuddied = true;
  for (const team of teams) {
    const hasNew = team.some((p) => p.confidence === 'new');
    const hasSolid = team.some((p) => p.confidence === 'solid');
    if (hasNew && !hasSolid) {
      newcomerBuddied = false;
      break;
    }
  }

  return {
    largestGap: Math.round(largestGap * 100) / 100,
    newcomerBuddied,
    friendPairsSatisfied,
    friendPairsTotal: relevantFriendPairs.length,
  };
}

// --- Objective score (lower is better) ---
function objectiveScore(
  teams: SessionAttendee[][],
  relevantFriendPairs: [number, number][]
): number {
  const strengths = teams.map(teamStrength);
  const gap = Math.max(...strengths) - Math.min(...strengths);

  let penalty = 0;

  // Unsatisfied friend pairs: weight 3
  for (const [a, b] of relevantFriendPairs) {
    const sameTeam = teams.some(
      (t) => t.some((p) => p.id === a) && t.some((p) => p.id === b)
    );
    if (!sameTeam) penalty += 3;
  }

  // Variance in peer_points_rate totals: weight 2
  const peerTotals = teams.map((t) =>
    t.reduce((sum, p) => sum + p.peerPointsRate, 0)
  );
  const peerMean = peerTotals.reduce((a, b) => a + b, 0) / peerTotals.length;
  const peerVar =
    peerTotals.reduce((sum, v) => sum + (v - peerMean) ** 2, 0) /
    peerTotals.length;
  penalty += 2 * peerVar;

  // Newcomer without solid teammate: weight 5
  for (const team of teams) {
    const newPlayers = team.filter((p) => p.confidence === 'new');
    const hasSolid = team.some((p) => p.confidence === 'solid');
    if (newPlayers.length > 0 && !hasSolid) {
      penalty += 5 * newPlayers.length;
    }
  }

  return gap * 10 + penalty;
}

// --- Resolve positions for all attendees ---
// Assigns signedUpPosition to players with null based on positionPrefs,
// ensuring total slots are met. Modifies attendees in place (on copies).
function resolveAllPositions(
  attendees: SessionAttendee[],
  teamCount: number
): SessionAttendee[] | null {
  const resolved = attendees.map((a) => ({ ...a }));

  // Count what we need total
  const totalNeeded = new Map<Position, number>();
  for (const [pos, perTeam] of Object.entries(REQUIRED_PER_TEAM) as [Position, number][]) {
    totalNeeded.set(pos, perTeam * teamCount);
  }

  // Subtract already-assigned players
  const filled = new Map<Position, number>();
  for (const p of resolved) {
    if (p.signedUpPosition) {
      filled.set(p.signedUpPosition, (filled.get(p.signedUpPosition) ?? 0) + 1);
    }
  }

  // Available slots
  const availableSlots = new Map<Position, number>();
  for (const [pos, needed] of totalNeeded) {
    availableSlots.set(pos, needed - (filled.get(pos) ?? 0));
  }

  // Assign unassigned players by their pref order
  const unassigned = resolved.filter((p) => !p.signedUpPosition);
  for (const p of unassigned) {
    const pos = resolvePosition(p, availableSlots);
    if (!pos) return null; // Can't place this player
    p.signedUpPosition = pos;
    availableSlots.set(pos, (availableSlots.get(pos) ?? 0) - 1);
  }

  // Check all slots are filled
  for (const [pos, remaining] of availableSlots) {
    if (remaining > 0) return null;
  }

  return resolved;
}

// --- Initial assignment respecting composition ---
function createInitialAssignment(
  attendees: SessionAttendee[],
  teamCount: number
): SessionAttendee[][] | null {
  const teams: SessionAttendee[][] = Array.from({ length: teamCount }, () => []);

  // Group by position
  const byPosition = new Map<Position, SessionAttendee[]>();
  for (const pos of Object.keys(REQUIRED_PER_TEAM) as Position[]) {
    byPosition.set(pos, []);
  }
  for (const p of attendees) {
    const pos = p.signedUpPosition;
    if (pos && byPosition.has(pos)) {
      byPosition.get(pos)!.push(p);
    }
  }

  // Shuffle each position group and distribute exactly the required count per team
  for (const [pos, perTeam] of Object.entries(REQUIRED_PER_TEAM) as [Position, number][]) {
    const players = [...(byPosition.get(pos) ?? [])].sort(() => Math.random() - 0.5);
    if (players.length < perTeam * teamCount) return null;

    let idx = 0;
    for (let t = 0; t < teamCount; t++) {
      for (let n = 0; n < perTeam; n++) {
        teams[t].push(players[idx++]);
      }
    }
  }

  return teams;
}

function cloneTeams(teams: SessionAttendee[][]): SessionAttendee[][] {
  return teams.map((t) => [...t]);
}

function hammingDistance(a: SessionAttendee[][], b: SessionAttendee[][]): number {
  let diff = 0;
  for (const team of a) {
    for (const player of team) {
      const teamIdxInA = a.findIndex((t) => t.some((p) => p.id === player.id));
      const teamIdxInB = b.findIndex((t) => t.some((p) => p.id === player.id));
      if (teamIdxInA !== teamIdxInB) diff++;
    }
  }
  return diff;
}

export function assign(
  attendees: SessionAttendee[],
  teamCount: number = 3
): Proposal[] | null {
  // Step 1: Resolve positions for players with null signedUpPosition
  const resolved = resolveAllPositions(attendees, teamCount);
  if (!resolved) return null;

  // Step 2: Check composition feasibility
  const shortfalls = checkComposition(resolved, teamCount);
  if (shortfalls.length > 0) return null;

  // Find relevant friend pairs
  const attendeeIds = new Set(resolved.map((p) => p.id));
  const relevantFriendPairs: [number, number][] = [];
  for (const key of friendshipSet) {
    const [a, b] = key.split('-').map(Number);
    if (attendeeIds.has(a) && attendeeIds.has(b)) {
      relevantFriendPairs.push([a, b]);
    }
  }

  const allSolutions: { teams: SessionAttendee[][]; score: number }[] = [];

  // 10 random restarts
  for (let restart = 0; restart < 10; restart++) {
    const initial = createInitialAssignment(resolved, teamCount);
    if (!initial) continue;

    let current = initial;
    if (!isValid(current)) continue;

    let currentScore = objectiveScore(current, relevantFriendPairs);

    // 1000 iterations of local search with simulated annealing
    for (let iter = 0; iter < 1000; iter++) {
      const temperature = 1.0 * (1 - iter / 1000);
      const next = cloneTeams(current);

      // Pick two random teams
      const t1 = Math.floor(Math.random() * teamCount);
      let t2 = Math.floor(Math.random() * (teamCount - 1));
      if (t2 >= t1) t2++;

      // Only swap same-position players to maintain composition
      const p1Idx = Math.floor(Math.random() * next[t1].length);
      const p1 = next[t1][p1Idx];
      const p1Pos = p1.signedUpPosition;

      // Find a player with the same position on the other team
      const candidates = next[t2]
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.signedUpPosition === p1Pos);
      if (candidates.length === 0) continue;

      const { i: p2Idx } = candidates[Math.floor(Math.random() * candidates.length)];

      // Swap
      const tmp = next[t1][p1Idx];
      next[t1][p1Idx] = next[t2][p2Idx];
      next[t2][p2Idx] = tmp;

      if (!isValid(next)) continue;

      const nextScore = objectiveScore(next, relevantFriendPairs);
      const delta = nextScore - currentScore;

      if (delta < 0 || Math.random() < Math.exp(-delta / Math.max(temperature, 0.01))) {
        current = next;
        currentScore = nextScore;
      }
    }

    allSolutions.push({ teams: current, score: currentScore });
  }

  if (allSolutions.length === 0) return null;

  // Sort by score
  allSolutions.sort((a, b) => a.score - b.score);

  // Pick 3 diverse solutions
  const diverse: { teams: SessionAttendee[][]; score: number }[] = [];
  for (const sol of allSolutions) {
    if (diverse.length >= 3) break;
    const isDiverse = diverse.every(
      (d) => hammingDistance(d.teams, sol.teams) >= 4
    );
    if (isDiverse || diverse.length === 0) {
      diverse.push(sol);
    }
  }

  // Pad with best remaining if we don't have 3
  for (const sol of allSolutions) {
    if (diverse.length >= 3) break;
    if (!diverse.includes(sol)) {
      diverse.push(sol);
    }
  }

  const teamIds: TeamId[] = ['A', 'B', 'C'];

  return diverse.map((sol) => {
    const teams: Team[] = sol.teams.map((players, i) => ({
      id: teamIds[i],
      players,
    }));
    const metrics = computeMetrics(sol.teams, relevantFriendPairs);
    return {
      teams,
      metrics,
      rationale: generateRationale(teams, metrics, relevantFriendPairs),
      score: sol.score,
    };
  });
}
