import seedData from '../assets/seed/spark-seed.json';
import type { Player, SessionAttendee, Friendship, Session, Position, DeclaredState, Gender } from './types';

// --- Raw seed types ---
interface RawPlayer {
  id: number;
  display_name: string;
  mu: number;
  sigma: number;
  conservative_rating: number;
  band: number | null;
  confidence: 'new' | 'thin' | 'solid';
  sessions_played: number;
  mixed_net_sessions: number;
  position_prefs: string[];
  position_ratings: Record<string, number>;
  peer_points_rate: number;
  last_played_at: string | null;
}

interface RawSession {
  id: number;
  starts_at: string;
  venue: string;
  net_context: string;
  team_count: number;
  team_size: number;
  format: string;
}

interface RawAttendance {
  session_id: number;
  player_id: number;
  signed_up_position: string | null;
  declared_state: string | null;
  checked_in: boolean;
}

// --- Deterministic gender assignment (seeded from player ID) ---
function assignGender(id: number): Gender {
  // Simple deterministic hash to get roughly 50/50 split
  const hash = ((id * 2654435761) >>> 0) % 100;
  return hash < 50 ? 'M' : 'F';
}

// --- Deterministic member-since date (more sessions = earlier join) ---
function assignMemberSince(id: number, sessionsPlayed: number): string {
  const now = new Date(2026, 7, 19); // today: 2026-08-19
  const jitter = ((id * 31) % 30) - 15; // -15 to +14 days jitter
  const daysAgo = Math.max(30, sessionsPlayed * 3.5 + jitter);
  const date = new Date(now.getTime() - daysAgo * 86400000);
  return date.toISOString().split('T')[0];
}

// --- Transform raw player to app Player ---
function transformPlayer(raw: RawPlayer): Player {
  return {
    id: raw.id,
    displayName: raw.display_name,
    mu: raw.mu,
    sigma: raw.sigma,
    conservativeRating: raw.conservative_rating,
    band: raw.band,
    confidence: raw.confidence,
    sessionsPlayed: raw.sessions_played,
    mixedNetSessions: raw.mixed_net_sessions,
    positionPrefs: raw.position_prefs as Position[],
    positionRatings: raw.position_ratings,
    peerPointsRate: raw.peer_points_rate,
    lastPlayedAt: raw.last_played_at,
    gender: assignGender(raw.id),
    memberSince: assignMemberSince(raw.id, raw.sessions_played),
  };
}

// --- All players ---
const seed = seedData as { players: RawPlayer[]; friendships: { player_id: number; friend_id: number }[]; sessions: RawSession[]; session_attendance: RawAttendance[] };
const rawPlayers = seed.players;
export const allPlayers: Player[] = rawPlayers.map(transformPlayer);
export const playersById: Map<number, Player> = new Map(
  allPlayers.map((p) => [p.id, p])
);

// --- Friendships ---
const friendshipPairs: [number, number][] = seed.friendships.map((f) => [f.player_id, f.friend_id]);

export const friendships: Friendship[] = friendshipPairs.map(([a, b]) => ({
  playerId: a,
  friendId: b,
}));

// Adjacency set for quick lookup: key = "min-max"
export const friendshipSet: Set<string> = new Set(
  friendshipPairs.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`)
);

export function areFriends(a: number, b: number): boolean {
  return friendshipSet.has(`${Math.min(a, b)}-${Math.max(a, b)}`);
}

export function getFriends(playerId: number): Player[] {
  const friendIds: number[] = [];
  for (const [a, b] of friendshipPairs) {
    if (a === playerId) friendIds.push(b);
    else if (b === playerId) friendIds.push(a);
  }
  return friendIds.map((id) => playersById.get(id)).filter(Boolean) as Player[];
}

// --- Sessions ---
export const allSessions: Session[] = seed.sessions.map((raw) => ({
  id: raw.id,
  startsAt: raw.starts_at,
  venue: raw.venue,
  netContext: raw.net_context as Session['netContext'],
  teamCount: raw.team_count,
  teamSize: raw.team_size,
  format: raw.format,
}));

export function getSession(id: number): Session | undefined {
  return allSessions.find((s) => s.id === id);
}

// --- Session attendees ---
const rawAttendance = seed.session_attendance;

export function getSessionAttendees(sessionId: number): SessionAttendee[] {
  const rows = rawAttendance.filter((r) => r.session_id === sessionId);
  return rows.map((row) => {
    const player = playersById.get(row.player_id);
    if (!player) throw new Error(`Player ${row.player_id} not found`);
    return {
      ...player,
      signedUpPosition: (row.signed_up_position as Position) ?? null,
      declaredState: (row.declared_state as DeclaredState) ?? null,
      checkedIn: row.checked_in,
    };
  });
}

// Backwards compat: default session 1
export const session: Session = allSessions[0];
export const sessionAttendees: SessionAttendee[] = getSessionAttendees(1);

export const NET_CONTEXT_LABELS: Record<string, string> = {
  womens_224: "women's 2.24m",
  mixed_235: 'mixed 2.35m',
  mens_243: "men's 2.43m",
};
