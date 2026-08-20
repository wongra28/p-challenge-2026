import type { Team, ProposalMetrics } from './types';

// Generate one plain-language sentence explaining the notable placement.
// PRD: specific and names players, not generic.
export function generateRationale(
  teams: Team[],
  metrics: ProposalMetrics,
  relevantFriendPairs: [number, number][]
): string {
  const parts: string[] = [];

  // Check for newcomers and who they're buddied with
  for (const team of teams) {
    const newcomers = team.players.filter((p) => p.confidence === 'new');
    const solidPlayers = team.players.filter((p) => p.confidence === 'solid');

    for (const newcomer of newcomers) {
      if (solidPlayers.length > 0) {
        const buddyNames = solidPlayers
          .sort((a, b) => b.peerPointsRate - a.peerPointsRate)
          .slice(0, 2)
          .map((p) => p.displayName.split(' ')[0]);
        parts.push(
          `${newcomer.displayName.split(' ')[0]} has no session history, so they're with ${buddyNames.join(' and ')} who ${buddyNames.length === 1 ? 'has' : 'have'} high peer points`
        );
      }
    }
  }

  // Check friend pairs that were satisfied
  const satisfiedPairs: string[] = [];
  for (const [a, b] of relevantFriendPairs) {
    const sameTeam = teams.some(
      (t) => t.players.some((p) => p.id === a) && t.players.some((p) => p.id === b)
    );
    if (sameTeam) {
      const allPlayers = teams.flatMap((t) => t.players);
      const nameA = allPlayers.find((p) => p.id === a)?.displayName.split(' ')[0] ?? String(a);
      const nameB = allPlayers.find((p) => p.id === b)?.displayName.split(' ')[0] ?? String(b);
      satisfiedPairs.push(`${nameA} and ${nameB}`);
    }
  }

  if (satisfiedPairs.length > 0 && parts.length === 0) {
    if (satisfiedPairs.length <= 2) {
      parts.push(`kept ${satisfiedPairs.join(', and ')} together as requested`);
    } else {
      parts.push(
        `kept ${satisfiedPairs.length} of ${relevantFriendPairs.length} friend pairs together`
      );
    }
  }

  // Check gap
  if (parts.length === 0) {
    if (metrics.largestGap < 0.5) {
      parts.push('teams are closely matched with less than half a band between them');
    } else {
      parts.push(
        `closest balance achievable; gap of ${metrics.largestGap.toFixed(1)} bands between strongest and weakest`
      );
    }
  }

  // Check injured player placement
  for (const team of teams) {
    const injured = team.players.find((p) => p.declaredState === 'injured');
    if (injured) {
      const pos = injured.signedUpPosition ?? injured.positionPrefs[0];
      if (pos === 'S' || pos === 'L') {
        parts.push(
          `${injured.displayName.split(' ')[0]} is carrying an injury and placed at ${pos} to reduce load`
        );
        break;
      }
    }
  }

  // Join with semicolons (PRD: no em dashes)
  const sentence = parts.slice(0, 2).join('; ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}
