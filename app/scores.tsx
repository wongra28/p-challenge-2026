import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, type as typeStyles, bandColor } from '../lib/theme';
import { useSession } from '../lib/context';

export default function ScoresScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useSession();

  const proposal =
    state.finalized && state.finalizedProposalIndex !== null
      ? state.proposals?.[state.finalizedProposalIndex]
      : null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={[typeStyles.labelMd, { color: colors.textPrimary }]}>
          Record scores
        </Text>
        <View style={{ width: spacing['3xl'] + spacing.xs }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {proposal ? (
          <>
            {/* Team cards */}
            {proposal.teams.map((team) => (
              <View key={team.id} style={styles.teamCard}>
                <Text style={[typeStyles.labelMd, { color: colors.textPrimary }]}>
                  Team {team.id}
                </Text>
                <View style={styles.teamPlayers}>
                  {team.players.map((p) => {
                    const bColor = bandColor(p.band);
                    return (
                      <View key={p.id} style={styles.playerRow}>
                        <Text style={[typeStyles.textSm, { color: colors.textPrimary, flex: 1 }]}>
                          {p.displayName}
                        </Text>
                        <View style={[styles.posChip, { backgroundColor: bColor + '1A' }]}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: bColor }}>
                            {p.signedUpPosition ?? '?'} {p.band === null ? 'new' : p.band}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Scoring stub */}
            <View style={styles.placeholder}>
              <Feather name="edit-3" size={spacing['4xl']} color={colors.textTertiary} />
              <Text style={[typeStyles.textLg, { color: colors.textSecondary }]}>
                Score recording
              </Text>
              <Text
                style={[
                  typeStyles.textSm,
                  { color: colors.textTertiary, textAlign: 'center' },
                ]}
              >
                Record set scores for each matchup here. Ratings update after the
                session, not between sets.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <Feather name="alert-circle" size={spacing['4xl']} color={colors.textTertiary} />
            <Text style={[typeStyles.textMd, { color: colors.textSecondary, textAlign: 'center' }]}>
              Finalize teams from the session screen first.
            </Text>
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
    gap: spacing.xl,
  },
  teamCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  teamPlayers: {
    gap: spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  posChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  placeholder: {
    alignItems: 'center',
    gap: spacing.xl,
    padding: spacing['4xl'],
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    borderStyle: 'dashed',
  },
});
