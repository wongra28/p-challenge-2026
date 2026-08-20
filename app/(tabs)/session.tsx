import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, type as typeStyles } from '../../lib/theme';
import { NET_CONTEXT_LABELS } from '../../lib/data';
import { useSession } from '../../lib/context';
import { checkComposition } from '../../lib/solver';
import { CollapsibleSummary } from '../../components/session/CollapsibleSummary';
import { PositionChipGroup } from '../../components/session/PositionChipGroup';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function SessionScreen() {
  const { state, dispatch } = useSession();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();

  const sessionId = params.id ? parseInt(params.id, 10) : 1;

  // Load session when ID changes
  useEffect(() => {
    if (state.currentSessionId !== sessionId) {
      dispatch({ type: 'LOAD_SESSION', sessionId });
    }
  }, [sessionId, state.currentSessionId, dispatch]);

  const session = state.currentSession;
  const shortfalls = checkComposition(state.attendees, session.teamCount);
  const solvable = shortfalls.length === 0;

  // Compute band range for level badge
  const attendeeBands = state.attendees
    .map((a) => a.band)
    .filter((b): b is number => b !== null)
    .sort((a, b) => a - b);
  const minBand = attendeeBands.length > 0 ? attendeeBands[0] : null;
  const maxBand = attendeeBands.length > 0 ? attendeeBands[attendeeBands.length - 1] : null;

  function getLevelLabel(min: number, max: number): string {
    const mid = (min + max) / 2;
    if (mid <= 2.5) return 'Recreational';
    if (mid <= 4.5) return 'Intermediate';
    if (mid <= 5.5) return 'Competitive';
    return 'Elite';
  }

  const date = new Date(session.startsAt);
  const dateStr = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeStr = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePropose = () => {
    dispatch({ type: 'GENERATE_PROPOSALS' });
    router.push('/proposals');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={22} color={colors.textSecondary} />
          </Pressable>
          <Text style={typeStyles.displaySm}>Tonight's session</Text>
        </View>
        <View style={styles.headerMeta}>
          <Text style={[typeStyles.textSm, styles.metaText]}>
            {dateStr} · {timeStr}
          </Text>
          <Text style={[typeStyles.textSm, styles.metaText]}>
            {session.venue}
          </Text>
        </View>
        <View style={styles.headerBadges}>
          <Badge
            variant="net-context"
            value={NET_CONTEXT_LABELS[session.netContext]}
          />
          <Text style={[typeStyles.labelSm, styles.countText]}>
            {session.teamCount} teams of {session.teamSize}
          </Text>
        </View>
        {minBand !== null && maxBand !== null && (
          <Text style={[typeStyles.textSm, styles.metaText]}>
            Level: Bands {minBand}–{maxBand} ({getLevelLabel(minBand, maxBand)})
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Collapsible summary at top */}
        <CollapsibleSummary attendees={state.attendees} />

        {/* Players grouped by position as chips */}
        <PositionChipGroup
          attendees={state.attendees}
          onPlayerPress={(player) => router.push(`/player/${player.id}`)}
        />
      </ScrollView>

      {/* Action bar */}
      <View
        style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        {solvable ? (
          <Button
            label="Propose teams"
            onPress={handlePropose}
            hierarchy="primary"
            size="lg"
            fullWidth
          />
        ) : (
          <View style={styles.unsolvableBar}>
            <Text style={[typeStyles.labelSm, { color: colors.textAmber, textAlign: 'center' }]}>
              {shortfalls
                .map((s) => {
                  const labels: Record<string, string> = { S: 'setter', OH: 'outside hitter', MB: 'middle blocker', OP: 'opposite', L: 'libero' };
                  const label = labels[s.position] ?? s.position;
                  const missing = s.required - s.available;
                  return `${session.teamCount} teams need ${s.required} ${label}s. ${s.available} signed up.`;
                })
                .join(' ')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPrimary,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerMeta: {
    gap: spacing.xxs,
  },
  metaText: {
    color: colors.textSecondary,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  countText: {
    color: colors.textTertiary,
  },
  scrollContent: {
    paddingBottom: spacing['6xl'],
  },
  actionBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    backgroundColor: colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: colors.borderPrimary,
  },
  unsolvableBar: {
    paddingVertical: spacing.lg,
  },
});
