export type Position = 'S' | 'OH' | 'MB' | 'OP' | 'L';
export type Confidence = 'new' | 'thin' | 'solid';
export type DeclaredState = 'tired' | 'injured' | null;
export type TeamId = 'A' | 'B' | 'C';
export type Gender = 'M' | 'F';

export const POSITION_LABELS: Record<Position, string> = {
  S: 'setter',
  OH: 'outside hitter',
  MB: 'middle blocker',
  OP: 'opposite',
  L: 'libero',
};

export interface Player {
  id: number;
  displayName: string;
  mu: number;
  sigma: number;
  conservativeRating: number;
  band: number | null;
  confidence: Confidence;
  sessionsPlayed: number;
  mixedNetSessions: number;
  positionPrefs: Position[];
  positionRatings: Record<string, number>;
  peerPointsRate: number;
  lastPlayedAt: string | null;
  gender: Gender;
  memberSince: string;
}

export interface SessionAttendee extends Player {
  signedUpPosition: Position | null;
  declaredState: DeclaredState;
  checkedIn: boolean;
}

export interface Friendship {
  playerId: number;
  friendId: number;
}

export interface Session {
  id: number;
  startsAt: string;
  venue: string;
  netContext: 'womens_224' | 'mixed_235' | 'mens_243';
  teamCount: number;
  teamSize: number;
  format: string;
}

export interface Team {
  id: TeamId;
  players: SessionAttendee[];
}

export interface ProposalMetrics {
  largestGap: number;
  newcomerBuddied: boolean;
  friendPairsSatisfied: number;
  friendPairsTotal: number;
}

export interface Proposal {
  teams: Team[];
  metrics: ProposalMetrics;
  rationale: string;
  score: number;
}

export interface SwapOverride {
  timestamp: string;
  playerAId: number;
  playerAName: string;
  playerBId: number;
  playerBName: string;
  teamA: TeamId;
  teamB: TeamId;
  reason: string;
  metricsBefore: ProposalMetrics;
  metricsAfter: ProposalMetrics;
}
