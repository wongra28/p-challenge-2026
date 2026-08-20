import { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, fonts, type as typeStyles } from '../lib/theme';
import { useSession } from '../lib/context';
import { computeMetrics, teamRating } from '../lib/solver';
import { friendshipSet } from '../lib/data';
import { CourtView } from '../components/session/CourtView';
import { Button } from '../components/ui/Button';
import type { SessionAttendee, TeamId, ProposalMetrics, Team } from '../lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRelevantFriendPairs(attendees: SessionAttendee[]): [number, number][] {
  const ids = new Set(attendees.map((p) => p.id));
  const pairs: [number, number][] = [];
  for (const key of friendshipSet) {
    const [a, b] = key.split('-').map(Number);
    if (ids.has(a) && ids.has(b)) pairs.push([a, b]);
  }
  return pairs;
}

function buildDisplayNames(attendees: SessionAttendee[]): Map<number, string> {
  const nameMap = new Map<number, string>();
  const byFirst = new Map<string, SessionAttendee[]>();
  for (const p of attendees) {
    const first = p.displayName.split(' ')[0];
    if (!byFirst.has(first)) byFirst.set(first, []);
    byFirst.get(first)!.push(p);
  }
  for (const [first, players] of byFirst) {
    if (players.length === 1) {
      nameMap.set(players[0].id, first);
    } else {
      for (const p of players) {
        const parts = p.displayName.split(' ');
        const surname = parts.length > 1 ? parts[parts.length - 1] : '';
        nameMap.set(p.id, `${first} ${surname[0]}.`);
      }
    }
  }
  return nameMap;
}

function findPlayerTeam(teams: Team[], playerId: number): TeamId | null {
  for (const team of teams) {
    if (team.players.some((p) => p.id === playerId)) return team.id;
  }
  return null;
}

function computeTeamRating(team: Team): string {
  return teamRating(team.players).toFixed(1);
}

/** Build preview teams by swapping two players. Returns deep clone. */
function buildPreviewTeams(teams: Team[], playerAId: number, playerBId: number): Team[] {
  const preview: Team[] = JSON.parse(JSON.stringify(teams));
  let aTeamIdx = -1, aPlayerIdx = -1, bTeamIdx = -1, bPlayerIdx = -1;
  for (let ti = 0; ti < preview.length; ti++) {
    for (let pi = 0; pi < preview[ti].players.length; pi++) {
      if (preview[ti].players[pi].id === playerAId) { aTeamIdx = ti; aPlayerIdx = pi; }
      if (preview[ti].players[pi].id === playerBId) { bTeamIdx = ti; bPlayerIdx = pi; }
    }
  }
  if (aTeamIdx !== -1 && bTeamIdx !== -1) {
    const temp = preview[aTeamIdx].players[aPlayerIdx];
    preview[aTeamIdx].players[aPlayerIdx] = preview[bTeamIdx].players[bPlayerIdx];
    preview[bTeamIdx].players[bPlayerIdx] = temp;
  }
  return preview;
}

/** Generate at most one warning for a preview swap. Priority: newcomer > friend pair. */
function generateWarning(
  teamsBefore: Team[],
  teamsAfter: Team[],
  metricsBefore: ProposalMetrics,
  metricsAfter: ProposalMetrics,
  attendees: SessionAttendee[],
  friendPairs: [number, number][],
): string | null {
  // P1: Newcomer stranded
  if (metricsBefore.newcomerBuddied && !metricsAfter.newcomerBuddied) {
    for (const team of teamsAfter) {
      const newcomers = team.players.filter((p) => p.confidence === 'new');
      const hasSolid = team.players.some((p) => p.confidence === 'solid');
      if (newcomers.length > 0 && !hasSolid) {
        const name = newcomers[0].displayName.split(' ')[0];
        return `${name} has no history and would be the only new player on team ${team.id}.`;
      }
    }
  }

  // P2: Friend pair split
  if (metricsAfter.friendPairsSatisfied < metricsBefore.friendPairsSatisfied) {
    for (const [a, b] of friendPairs) {
      const wasTogetherBefore = teamsBefore.some(
        (t) => t.players.some((p) => p.id === a) && t.players.some((p) => p.id === b)
      );
      const isTogetherAfter = teamsAfter.some(
        (t) => t.players.some((p) => p.id === a) && t.players.some((p) => p.id === b)
      );
      if (wasTogetherBefore && !isTogetherAfter) {
        const nameA = attendees.find((p) => p.id === a)?.displayName.split(' ')[0] ?? '?';
        const nameB = attendees.find((p) => p.id === b)?.displayName.split(' ')[0] ?? '?';
        return `${nameA} asked to play with ${nameB}. This splits them up.`;
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProposalsScreen() {
  const { state, dispatch } = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // --- State ---
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<SessionAttendee | null>(null);
  const [selectedFromTeam, setSelectedFromTeam] = useState<TeamId | null>(null);
  const [previewTarget, setPreviewTarget] = useState<SessionAttendee | null>(null);
  const [previewTargetTeam, setPreviewTargetTeam] = useState<TeamId | null>(null);
  const [showShuffleConfirm, setShowShuffleConfirm] = useState(false);
  const [showFinalizeSheet, setShowFinalizeSheet] = useState(false);
  const [finalizeReason, setFinalizeReason] = useState('');

  const proposals = state.proposals;
  const currentProposal = proposals?.[activeIndex] ?? null;
  const currentOverrides = state.proposalOverrides[activeIndex] ?? [];
  const hasOverrides = currentOverrides.length > 0;
  const isInPreview = selectedPlayer !== null && previewTarget !== null;

  const displayNames = useMemo(() => buildDisplayNames(state.attendees), [state.attendees]);
  const friendPairs = useMemo(() => getRelevantFriendPairs(state.attendees), [state.attendees]);

  // --- Swap target IDs (same position, other teams) ---
  const swapTargetIds = useMemo(() => {
    if (!selectedPlayer || !currentProposal || !selectedFromTeam || isInPreview) return new Set<number>();
    const targetPos = selectedPlayer.signedUpPosition;
    const targets = new Set<number>();
    for (const team of currentProposal.teams) {
      if (team.id === selectedFromTeam) continue;
      for (const p of team.players) {
        if (p.signedUpPosition === targetPos) targets.add(p.id);
      }
    }
    return targets;
  }, [selectedPlayer, selectedFromTeam, currentProposal, isInPreview]);

  // --- Preview computation ---
  const previewData = useMemo(() => {
    if (!isInPreview || !currentProposal || !selectedPlayer || !previewTarget) return null;
    const previewTeams = buildPreviewTeams(currentProposal.teams, selectedPlayer.id, previewTarget.id);
    const previewMetrics = computeMetrics(
      previewTeams.map((t) => t.players),
      friendPairs,
    );
    // Compute per-team avg changes
    const avgBefore = new Map<TeamId, string>();
    const avgAfter = new Map<TeamId, string>();
    const affectedTeamIds = new Set<TeamId>();
    for (let i = 0; i < currentProposal.teams.length; i++) {
      const beforeAvg = computeTeamRating(currentProposal.teams[i]);
      const afterAvg = computeTeamRating(previewTeams[i]);
      avgBefore.set(currentProposal.teams[i].id, beforeAvg);
      avgAfter.set(previewTeams[i].id, afterAvg);
      if (beforeAvg !== afterAvg) affectedTeamIds.add(currentProposal.teams[i].id);
    }
    const warning = generateWarning(
      currentProposal.teams, previewTeams,
      currentProposal.metrics, previewMetrics,
      state.attendees, friendPairs,
    );
    return { previewTeams, previewMetrics, avgAfter, affectedTeamIds, warning };
  }, [isInPreview, currentProposal, selectedPlayer, previewTarget, friendPairs, state.attendees]);

  // --- Handlers ---
  const clearSelection = useCallback(() => {
    setSelectedPlayer(null);
    setSelectedFromTeam(null);
    setPreviewTarget(null);
    setPreviewTargetTeam(null);
  }, []);

  const handlePlayerPress = (player: SessionAttendee) => {
    if (!currentProposal) return;

    const playerTeam = findPlayerTeam(currentProposal.teams, player.id);

    // Tapping the selected player always deselects (even in preview)
    if (selectedPlayer?.id === player.id) {
      clearSelection();
      return;
    }

    // Tapping the preview target exits preview back to selection
    if (previewTarget?.id === player.id) {
      setPreviewTarget(null);
      setPreviewTargetTeam(null);
      return;
    }

    // In preview, block other taps
    if (isInPreview) return;

    // If a player is selected and this is a legal target → enter preview
    if (selectedPlayer && swapTargetIds.has(player.id)) {
      setPreviewTarget(player);
      setPreviewTargetTeam(playerTeam);
      return;
    }

    // Otherwise move selection to this player
    setPreviewTarget(null);
    setPreviewTargetTeam(null);
    setSelectedPlayer(player);
    setSelectedFromTeam(playerTeam);
  };

  const handleMakeSwap = () => {
    if (!selectedPlayer || !previewTarget) return;
    dispatch({
      type: 'SWAP_PLAYERS',
      proposalIndex: activeIndex,
      playerAId: selectedPlayer.id,
      playerBId: previewTarget.id,
      reason: '',
    });
    clearSelection();
  };

  const handleShuffle = () => {
    if (hasOverrides) {
      setShowShuffleConfirm(true);
    } else {
      doShuffle();
    }
  };

  const doShuffle = () => {
    clearSelection();
    setShowShuffleConfirm(false);
    setActiveIndex((prev) => (prev + 1) % (proposals?.length ?? 3));
  };

  const handleRevert = () => {
    if (!hasOverrides) return;
    dispatch({ type: 'REVERT_PROPOSAL', proposalIndex: activeIndex });
    clearSelection();
  };

  const handleFinalize = () => {
    if (hasOverrides) {
      setShowFinalizeSheet(true);
      setFinalizeReason('');
    } else {
      dispatch({ type: 'FINALIZE_PROPOSAL', proposalIndex: activeIndex });
      router.push('/scores');
    }
  };

  const handleFinalizeConfirm = () => {
    setShowFinalizeSheet(false);
    dispatch({ type: 'FINALIZE_PROPOSAL', proposalIndex: activeIndex, reason: finalizeReason });
    router.push('/scores');
  };

  // --- Hint text ---
  const hintText = (() => {
    if (isInPreview) return 'Preview only. Nothing is saved yet.';
    if (selectedPlayer) {
      const pos = selectedPlayer.signedUpPosition ?? 'player';
      return `Tap another ${pos} to swap, or pick someone else`;
    }
    if (hasOverrides) {
      const n = currentOverrides.length;
      return `${n} ${n === 1 ? 'swap' : 'swaps'} made`;
    }
    return 'Tap a player to start a swap';
  })();

  // --- Error state ---
  if (state.phase === 'proposals' && !proposals) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color={colors.textSecondary} />
          </Pressable>
          <Text style={[typeStyles.displaySm, styles.headerTitle]}>Teams</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={spacing['4xl']} color={colors.amber} />
          <Text style={[typeStyles.labelLg, { color: colors.textPrimary, textAlign: 'center' }]}>
            Can't form valid teams
          </Text>
          <Text style={[typeStyles.textSm, { color: colors.amber, textAlign: 'center' }]}>
            {state.solverError}
          </Text>
        </View>
      </View>
    );
  }

  if (!proposals || !currentProposal) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Text style={[typeStyles.textMd, { color: colors.textSecondary, padding: spacing.xl }]}>
          No proposals generated yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ─── Fixed header ─── */}
      <View style={styles.headerBlock}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={selectedPlayer ? clearSelection : () => router.back()}
            style={styles.backBtn}
          >
            <Feather name="chevron-left" size={22} color={colors.textSecondary} />
          </Pressable>
          <Text style={[typeStyles.displaySm, styles.headerTitle]}>
            {selectedPlayer ? 'Swap players' : 'Proposed teams'}
          </Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleShuffle}
              disabled={!!selectedPlayer}
              style={[styles.iconBtn, !!selectedPlayer && styles.iconDimmed]}
            >
              <Feather name="refresh-cw" size={18} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              onPress={handleRevert}
              disabled={!hasOverrides}
              style={[styles.iconBtn, !hasOverrides && styles.iconDimmed]}
            >
              <Feather name="rotate-ccw" size={18} color={colors.amber} />
            </Pressable>
          </View>
        </View>

        {/* Hint */}
        <Text style={[typeStyles.textXs, styles.hint]}>{hintText}</Text>

        {/* Warning banner (preview only, sticky) */}
        {isInPreview && previewData?.warning && (
          <View style={styles.warningBanner}>
            <Feather name="alert-circle" size={14} color={colors.textAmber} />
            <Text style={[typeStyles.textSm, { color: colors.textAmber, flex: 1 }]}>
              {previewData.warning}
            </Text>
          </View>
        )}
      </View>

      {/* ─── Scrollable team cards ─── */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentProposal.teams.map((team) => {
          const isAffected = previewData?.affectedTeamIds.has(team.id) ?? false;
          const previewAvg = isAffected ? (previewData?.avgAfter.get(team.id) ?? null) : null;
          return (
            <CourtView
              key={team.id}
              team={team}
              teamLabel={`Team ${team.id}`}
              selectedPlayerId={selectedPlayer?.id ?? null}
              previewPlayerId={previewTarget?.id ?? null}
              swapTargetIds={isInPreview ? undefined : swapTargetIds}
              onPlayerPress={handlePlayerPress}
              displayNames={displayNames}
              previewAvgBand={previewAvg}
              isAffected={isAffected}
              dimInactive={!!selectedPlayer && !isInPreview}
              friendPairIds={friendPairs}
            />
          );
        })}

        {/* ─── Tradeoffs panel ─── */}
        {currentProposal.metrics && (() => {
          const m = currentProposal.metrics;

          // Gap between highest and lowest team ratings (matches values shown on cards)
          const ratings = currentProposal.teams.map((t) => teamRating(t.players));
          const gapVal = ratings.length >= 2
            ? Math.round((Math.max(...ratings) - Math.min(...ratings)) * 10) / 10
            : 0;

          function gapStyle(val: number) {
            if (val <= 0.3) return { qualifier: 'Great', color: colors.textSuccess };
            if (val <= 0.7) return { qualifier: 'Fine', color: colors.textSuccess };
            return { qualifier: 'Poor', color: colors.textError };
          }

          const { qualifier: gapQualifier, color: gapColor } = gapStyle(gapVal);

          // Preview gap (when swap is being previewed)
          let previewGapVal: number | null = null;
          let previewGapQualifier: string | null = null;
          let previewGapColor: string | null = null;
          if (isInPreview && previewData) {
            const previewRatings = previewData.previewTeams.map((t) => teamRating(t.players));
            previewGapVal = previewRatings.length >= 2
              ? Math.round((Math.max(...previewRatings) - Math.min(...previewRatings)) * 10) / 10
              : 0;
            if (previewGapVal !== gapVal) {
              const ps = gapStyle(previewGapVal);
              previewGapQualifier = ps.qualifier;
              previewGapColor = ps.color;
            }
          }

          // Friend pairs
          const friendsOk = m.friendPairsSatisfied >= m.friendPairsTotal;
          const friendColor = friendsOk ? colors.textPrimary : colors.amber;

          // Build split warnings for confirmed swaps
          const splitWarnings: string[] = [];
          if (!friendsOk && currentProposal.teams) {
            for (const [a, b] of friendPairs) {
              const together = currentProposal.teams.some(
                (t) => t.players.some((p) => p.id === a) && t.players.some((p) => p.id === b)
              );
              if (!together) {
                const nameA = state.attendees.find((p) => p.id === a)?.displayName.split(' ')[0] ?? '?';
                const nameB = state.attendees.find((p) => p.id === b)?.displayName.split(' ')[0] ?? '?';
                splitWarnings.push(`${nameA} asked to play with ${nameB}. This splits them up.`);
              }
            }
          }

          return (
            <View style={styles.metricsSection}>
              <Text style={typeStyles.labelLg}>Tradeoffs</Text>
              <View style={styles.metricsGrid}>
                {/* Band gap */}
                <View style={styles.tradeoffCard}>
                  <View style={styles.tradeoffLeft}>
                    <Text style={typeStyles.labelMd}>Team balance</Text>
                    <Text style={[typeStyles.textXs, { color: colors.textTertiary }]}>
                      Rating gap between strongest and weakest team. Lower is fairer.
                    </Text>
                  </View>
                  <View style={styles.tradeoffRight}>
                    {previewGapVal !== null && previewGapColor ? (
                      <>
                        <View style={styles.previewGapRow}>
                          <Text style={[typeStyles.textSm, styles.gapOld]}>
                            {gapVal.toFixed(1)}
                          </Text>
                          <Text style={[typeStyles.displaySm, { color: previewGapColor }]}>
                            {previewGapVal.toFixed(1)}
                          </Text>
                        </View>
                        <Text style={[typeStyles.labelSm, { color: previewGapColor }]}>
                          {previewGapQualifier}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={[typeStyles.displaySm, { color: gapColor }]}>
                          {gapVal.toFixed(1)}
                        </Text>
                        <Text style={[typeStyles.labelSm, { color: gapColor }]}>
                          {gapQualifier}
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Newcomers buddied */}
                <View style={styles.tradeoffCard}>
                  <View style={styles.tradeoffLeft}>
                    <Text style={typeStyles.labelMd}>Newcomers buddied</Text>
                    <Text style={[typeStyles.textXs, { color: colors.textTertiary }]}>
                      Every new player is on a team with an experienced player who can show them the ropes.
                    </Text>
                  </View>
                  <Text style={[typeStyles.displaySm, { color: m.newcomerBuddied ? colors.textPrimary : colors.amber }]}>
                    {m.newcomerBuddied ? 'Yes' : 'No'}
                  </Text>
                </View>

                {/* Friend pairs */}
                <View style={styles.tradeoffCard}>
                  <View style={styles.tradeoffLeft}>
                    <Text style={typeStyles.labelMd}>Friend pairs</Text>
                    <Text style={[typeStyles.textXs, { color: colors.textTertiary }]}>
                      Players who asked to play together and ended up on the same team.
                    </Text>
                    {splitWarnings.map((w, i) => (
                      <View key={i} style={styles.splitWarning}>
                        <Feather name="alert-circle" size={12} color={colors.textAmber} />
                        <Text style={[typeStyles.textXs, { color: colors.textAmber, flex: 1 }]}>{w}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[typeStyles.displaySm, { color: friendColor }]}>
                    {m.friendPairsSatisfied}/{m.friendPairsTotal}
                  </Text>
                </View>
              </View>
            </View>
          );
        })()}
      </ScrollView>

      {/* ─── Fixed CTA bar ─── */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        {isInPreview ? (
          <>
            <Text style={styles.swapLabel}>
              Swapping{' '}
              <Text style={styles.swapName}>
                {selectedPlayer ? displayNames.get(selectedPlayer.id) ?? selectedPlayer.displayName.split(' ')[0] : ''}
              </Text>
              {' '}and{' '}
              <Text style={styles.swapName}>
                {previewTarget ? displayNames.get(previewTarget.id) ?? previewTarget.displayName.split(' ')[0] : ''}
              </Text>
            </Text>
            <Button label="Make the swap" onPress={handleMakeSwap} hierarchy="primary" size="lg" fullWidth />
            <Button label="Cancel" onPress={clearSelection} hierarchy="tertiary" size="lg" fullWidth />
          </>
        ) : (
          <Button
            label="Confirm teams and start game"
            onPress={handleFinalize}
            hierarchy="primary"
            size="lg"
            fullWidth
          />
        )}
      </View>

      {/* ─── Preview vignette overlay ─── */}
      {isInPreview && (
        <View
          pointerEvents="none"
          style={[
            styles.vignette,
            { boxShadow: 'inset 0 0 56px rgba(247,144,9,0.40)' } as any,
          ]}
        />
      )}

      {/* ─── Shuffle confirm dialog ─── */}
      {showShuffleConfirm && (
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowShuffleConfirm(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={typeStyles.labelLg}>Shuffle teams?</Text>
            <Text style={[typeStyles.textSm, { color: colors.textSecondary, marginTop: spacing.lg }]}>
              You've made {currentOverrides.length} {currentOverrides.length === 1 ? 'swap' : 'swaps'}.
              Shuffling starts from a fresh proposal and those changes will be lost.
            </Text>
            <View style={styles.sheetActions}>
              <Button label="Shuffle anyway" onPress={doShuffle} hierarchy="primary" size="lg" fullWidth />
              <Button label="Keep my changes" onPress={() => setShowShuffleConfirm(false)} hierarchy="tertiary" size="lg" fullWidth />
            </View>
          </View>
        </View>
      )}

      {/* ─── Finalize reason capture ─── */}
      {showFinalizeSheet && (
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowFinalizeSheet(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={typeStyles.displaySm}>Confirm teams and start game</Text>

            <View style={styles.swapList}>
              {currentOverrides.map((o, i) => (
                <View key={i} style={styles.swapListItem}>
                  <Feather name="repeat" size={14} color={colors.textBrand} />
                  <Text style={[typeStyles.textSm, { color: colors.textSecondary, flex: 1 }]}>
                    {o.playerAName} (Team {o.teamA}) ↔ {o.playerBName} (Team {o.teamB})
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.reasonSection}>
              <Text style={[typeStyles.labelMd, { color: colors.textSecondary }]}>
                Why were these swaps made?
              </Text>
              <Text style={[typeStyles.textSm, { color: colors.textTertiary }]}>
                This helps us improve our rating system and player matching in future games.
              </Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Briefly explain the reason (optional)"
                placeholderTextColor={colors.textTertiary}
                value={finalizeReason}
                onChangeText={setFinalizeReason}
                multiline
              />
            </View>

            <View style={styles.sheetActions}>
              <Button
                label="Start game"
                onPress={handleFinalizeConfirm}
                hierarchy="primary"
                size="lg"
                fullWidth
              />
              <Button
                label="Go back"
                onPress={() => setShowFinalizeSheet(false)}
                hierarchy="tertiary"
                size="lg"
                fullWidth
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },

  // Header block (fixed)
  headerBlock: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerTitle: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconBtn: {
    padding: spacing.md,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDimmed: {
    opacity: 0.4,
  },
  hint: {
    color: colors.textTertiary,
    textAlign: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: 'rgba(247,144,9,0.16)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },

  // Scrollable content
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing['6xl'],
    gap: spacing.xl,
  },

  // Tradeoffs
  metricsSection: {
    gap: spacing.lg,
  },
  metricsGrid: {
    gap: spacing.md,
  },
  tradeoffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  tradeoffLeft: {
    flex: 1,
    gap: spacing.xxs,
  },
  tradeoffRight: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  previewGapRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  gapOld: {
    color: colors.textDisabled,
    textDecorationLine: 'line-through',
  },
  splitWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },

  // CTA bar (fixed)
  ctaBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    backgroundColor: colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.borderPrimary,
    gap: spacing.md,
  },
  swapLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  swapName: {
    fontFamily: fonts.bodySemibold,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Vignette
  vignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: spacing.xxs,
    borderColor: colors.amber,
    zIndex: 50,
  },

  // Overlay sheets (shuffle confirm, finalize)
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bgOverlay,
  },
  sheet: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  handle: {
    width: spacing['4xl'] + spacing.xs,
    height: spacing.xs,
    backgroundColor: colors.borderPrimary,
    borderRadius: radius.xxs,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  sheetActions: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  swapList: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  swapListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  reasonSection: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  reasonInput: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    minHeight: spacing['9xl'],
    textAlignVertical: 'top',
  },

  // Error state
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['4xl'],
    gap: spacing.xl,
  },
});
