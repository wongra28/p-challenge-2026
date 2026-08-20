import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Proposal, SwapOverride, SessionAttendee, ProposalMetrics, Session } from './types';
import { getSessionAttendees, getSession, allSessions } from './data';
import { assign, computeMetrics, checkComposition } from './solver';
import { generateRationale } from './rationale';
import { friendshipSet } from './data';

// --- State ---
interface SessionState {
  currentSessionId: number;
  currentSession: Session;
  attendees: SessionAttendee[];
  proposals: Proposal[] | null;
  originalProposals: Proposal[] | null;
  proposalOverrides: SwapOverride[][];
  activeProposalIndex: number;
  finalized: boolean;
  finalizedProposalIndex: number | null;
  phase: 'roster' | 'proposals' | 'game';
  solverError: string | null;
}

function buildInitialState(sessionId: number): SessionState {
  const session = getSession(sessionId) ?? allSessions[0];
  return {
    currentSessionId: session.id,
    currentSession: session,
    attendees: getSessionAttendees(session.id),
    proposals: null,
    originalProposals: null,
    proposalOverrides: [[], [], []],
    activeProposalIndex: 0,
    finalized: false,
    finalizedProposalIndex: null,
    phase: 'roster',
    solverError: null,
  };
}

const initialState: SessionState = buildInitialState(1);

// --- Actions ---
type Action =
  | { type: 'LOAD_SESSION'; sessionId: number }
  | { type: 'GENERATE_PROPOSALS' }
  | { type: 'SWAP_PLAYERS'; proposalIndex: number; playerAId: number; playerBId: number; reason: string }
  | { type: 'REVERT_PROPOSAL'; proposalIndex: number }
  | { type: 'FINALIZE_PROPOSAL'; proposalIndex: number; reason?: string }
  | { type: 'RESET' };

// --- Helper: get relevant friend pairs for attendees ---
function getRelevantFriendPairs(attendees: SessionAttendee[]): [number, number][] {
  const ids = new Set(attendees.map((p) => p.id));
  const pairs: [number, number][] = [];
  for (const key of friendshipSet) {
    const [a, b] = key.split('-').map(Number);
    if (ids.has(a) && ids.has(b)) {
      pairs.push([a, b]);
    }
  }
  return pairs;
}

// --- Format shortfall messages ---
function formatShortfalls(attendees: SessionAttendee[], teamCount: number): string {
  const shortfalls = checkComposition(attendees, teamCount);
  if (shortfalls.length === 0) return '';
  const LABELS: Record<string, string> = { S: 'setter', OH: 'outside hitter', MB: 'middle blocker', OP: 'opposite', L: 'libero' };
  return shortfalls
    .map((s) => `${teamCount} teams need ${s.required} ${LABELS[s.position]}s. ${s.available} signed up.`)
    .join(' ');
}

// --- Reducer ---
function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'LOAD_SESSION': {
      return buildInitialState(action.sessionId);
    }

    case 'GENERATE_PROPOSALS': {
      const result = assign(state.attendees, state.currentSession.teamCount);
      if (!result) {
        return {
          ...state,
          proposals: null,
          originalProposals: null,
          solverError: formatShortfalls(state.attendees, state.currentSession.teamCount),
          phase: 'proposals',
        };
      }
      const originals = JSON.parse(JSON.stringify(result)) as Proposal[];
      return {
        ...state,
        proposals: result,
        originalProposals: originals,
        proposalOverrides: [[], [], []],
        activeProposalIndex: 0,
        finalized: false,
        finalizedProposalIndex: null,
        phase: 'proposals',
        solverError: null,
      };
    }

    case 'SWAP_PLAYERS': {
      if (!state.proposals) return state;
      const { proposalIndex, playerAId, playerBId, reason } = action;
      const proposal = state.proposals[proposalIndex];
      if (!proposal) return state;

      const wp = JSON.parse(JSON.stringify(state.proposals)) as Proposal[];
      const p = wp[proposalIndex];

      let teamAIdx = -1;
      let teamBIdx = -1;
      let playerAIdx = -1;
      let playerBIdx = -1;

      for (let ti = 0; ti < p.teams.length; ti++) {
        for (let pi = 0; pi < p.teams[ti].players.length; pi++) {
          if (p.teams[ti].players[pi].id === playerAId) {
            teamAIdx = ti;
            playerAIdx = pi;
          }
          if (p.teams[ti].players[pi].id === playerBId) {
            teamBIdx = ti;
            playerBIdx = pi;
          }
        }
      }

      if (teamAIdx === -1 || teamBIdx === -1 || teamAIdx === teamBIdx) return state;

      const metricsBefore = { ...p.metrics };
      const playerA = p.teams[teamAIdx].players[playerAIdx];
      const playerB = p.teams[teamBIdx].players[playerBIdx];

      p.teams[teamAIdx].players[playerAIdx] = playerB;
      p.teams[teamBIdx].players[playerBIdx] = playerA;

      const friendPairs = getRelevantFriendPairs(state.attendees);
      const newMetrics = computeMetrics(
        p.teams.map((t) => t.players),
        friendPairs
      );
      p.metrics = newMetrics;
      p.rationale = generateRationale(p.teams, newMetrics, friendPairs);

      const override: SwapOverride = {
        timestamp: new Date().toISOString(),
        playerAId,
        playerAName: playerA.displayName,
        playerBId,
        playerBName: playerB.displayName,
        teamA: p.teams[teamAIdx].id,
        teamB: p.teams[teamBIdx].id,
        reason,
        metricsBefore,
        metricsAfter: newMetrics,
      };

      const newOverrides = [...state.proposalOverrides];
      newOverrides[proposalIndex] = [...newOverrides[proposalIndex], override];

      return {
        ...state,
        proposals: wp,
        proposalOverrides: newOverrides,
      };
    }

    case 'REVERT_PROPOSAL': {
      if (!state.originalProposals || !state.proposals) return state;
      const { proposalIndex } = action;

      const wp = JSON.parse(JSON.stringify(state.proposals)) as Proposal[];
      wp[proposalIndex] = JSON.parse(JSON.stringify(state.originalProposals[proposalIndex]));

      const newOverrides = [...state.proposalOverrides];
      newOverrides[proposalIndex] = [];

      return {
        ...state,
        proposals: wp,
        proposalOverrides: newOverrides,
      };
    }

    case 'FINALIZE_PROPOSAL': {
      let overrides = state.proposalOverrides;
      if (action.reason) {
        const updated = [...overrides];
        updated[action.proposalIndex] = overrides[action.proposalIndex].map((o) => ({
          ...o,
          reason: action.reason!,
        }));
        overrides = updated;
      }
      return {
        ...state,
        finalized: true,
        finalizedProposalIndex: action.proposalIndex,
        proposalOverrides: overrides,
        phase: 'game',
      };
    }

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// --- Context ---
const SessionContext = createContext<{
  state: SessionState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
