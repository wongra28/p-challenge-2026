import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, type as typeStyles, bandColor, bandLabel } from '../../lib/theme';
import { playersById, getFriends } from '../../lib/data';
import { Badge } from '../../components/ui/Badge';
import { MetricCard } from '../../components/ui/MetricCard';
import { PositionBreakdown } from '../../components/player/PositionBreakdown';
import type { Position } from '../../lib/types';

function peerPointsRatio(sessions: number, rate: number): string {
  const points = Math.round(sessions * rate);
  return `${sessions} : ${points}`;
}

function confidenceExplanation(confidence: string, sessions: number): string {
  switch (confidence) {
    case 'solid':
      return `solid: ${sessions} sessions recorded`;
    case 'thin':
      return `thin: only ${sessions} session${sessions !== 1 ? 's' : ''} recorded`;
    case 'new':
      return sessions === 0
        ? 'new: no sessions played yet'
        : `new: ${sessions} session${sessions !== 1 ? 's' : ''} so far`;
    default:
      return '';
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'never';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const player = playersById.get(Number(id));
  if (!player) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Text style={[typeStyles.textMd, { color: colors.textSecondary }]}>
          Player not found.
        </Text>
      </View>
    );
  }

  const friends = getFriends(player.id);
  const color = bandColor(player.band);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={[typeStyles.labelMd, { color: colors.textPrimary }]}>
          Player
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Name + band hero */}
        <View style={styles.hero}>
          <Badge variant="band" value={player.band} large />
          <View style={styles.heroText}>
            <Text style={typeStyles.displaySm}>{player.displayName}</Text>
            <Text style={[typeStyles.textSm, { color }]}>
              {player.band === null ? 'New player' : `Band ${player.band} · ${bandLabel(player.band)}`}
            </Text>
          </View>
        </View>

        {/* Confidence */}
        <View style={styles.confidenceRow}>
          <Badge variant="confidence" value={player.confidence} />
          <Text style={[typeStyles.textSm, { color: colors.textSecondary }]}>
            {confidenceExplanation(player.confidence, player.sessionsPlayed)}
          </Text>
        </View>

        {/* Position breakdown */}
        <View style={styles.section}>
          <Text style={[typeStyles.labelSm, styles.sectionLabel]}>
            Position ratings
          </Text>
          <PositionBreakdown
            positionRatings={player.positionRatings}
            positionPrefs={player.positionPrefs as Position[]}
            overallBand={player.band}
          />
        </View>

        {/* Stats grid */}
        <View style={styles.section}>
          <Text style={[typeStyles.labelSm, styles.sectionLabel]}>Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCell}>
              <MetricCard
                label="Sessions played"
                value={String(player.sessionsPlayed)}
                compact
              />
            </View>
            <View style={styles.statCell}>
              <MetricCard
                label="Peer points"
                value={peerPointsRatio(player.sessionsPlayed, player.peerPointsRate)}
                compact
              />
            </View>
            <View style={styles.statCell}>
              <MetricCard
                label="Member since"
                value={formatDate(player.memberSince)}
                compact
              />
            </View>
            <View style={styles.statCell}>
              <MetricCard
                label="Last played"
                value={formatDate(player.lastPlayedAt)}
                compact
              />
            </View>
          </View>
        </View>

        {/* Friends */}
        {friends.length > 0 && (
          <View style={styles.section}>
            <Text style={[typeStyles.labelSm, styles.sectionLabel]}>
              Connections
            </Text>
            <View style={styles.friendsList}>
              {friends.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => router.replace(`/player/${f.id}`)}
                  style={styles.friendChip}
                >
                  <Feather
                    name="heart"
                    size={12}
                    color={colors.textBrand}
                  />
                  <Text
                    style={[typeStyles.textSm, { color: colors.textPrimary }]}
                  >
                    {f.displayName}
                  </Text>
                  <Text
                    style={[typeStyles.textXs, { color: colors.textTertiary }]}
                  >
                    {f.band === null ? 'new' : `band ${f.band}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPrimary,
  },
  backButton: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing['9xl'],
    gap: spacing['3xl'],
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  heroText: {
    flex: 1,
    gap: spacing.xs,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  section: {
    gap: spacing.xl,
  },
  sectionLabel: {
    ...typeStyles.labelXs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCell: {
    width: '48%',
    flexGrow: 1,
  },
  friendsList: {
    gap: spacing.md,
  },
  friendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
  },
});
