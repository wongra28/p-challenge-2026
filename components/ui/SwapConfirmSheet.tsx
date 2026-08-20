import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, type as typeStyles } from '../../lib/theme';
import type { SessionAttendee, TeamId, ProposalMetrics } from '../../lib/types';
import { Button } from './Button';

interface SwapConfirmSheetProps {
  visible: boolean;
  playerA: SessionAttendee | null;
  playerB: SessionAttendee | null;
  teamA: TeamId | null;
  teamB: TeamId | null;
  metricsBefore: ProposalMetrics | null;
  metricsAfter: ProposalMetrics | null;
  consequence: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

function MetricDelta({ label, before, after }: { label: string; before: string; after: string }) {
  const changed = before !== after;
  return (
    <View style={styles.deltaRow}>
      <Text style={[typeStyles.textXs, styles.deltaLabel]}>{label}</Text>
      <View style={styles.deltaValues}>
        <Text style={[typeStyles.labelSm, { color: colors.textTertiary }]}>{before}</Text>
        {changed && (
          <>
            <Feather name="arrow-right" size={12} color={colors.textTertiary} />
            <Text style={[typeStyles.labelSm, { color: colors.amber }]}>{after}</Text>
          </>
        )}
      </View>
    </View>
  );
}

export function SwapConfirmSheet({
  visible,
  playerA,
  playerB,
  teamA,
  teamB,
  metricsBefore,
  metricsAfter,
  consequence,
  onConfirm,
  onCancel,
}: SwapConfirmSheetProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onCancel();
  };

  if (!visible || !playerA || !playerB || !teamA || !teamB) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={handleCancel} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.titleRow}>
            <Text style={typeStyles.labelLg}>Swap players</Text>
          </View>

          {/* Swap summary */}
          <View style={styles.swapSummary}>
            <View style={styles.swapPlayer}>
              <Text style={[typeStyles.labelMd, { color: colors.textPrimary }]}>
                {playerA.displayName}
              </Text>
              <Text style={[typeStyles.textXs, { color: colors.textSecondary }]}>
                Team {teamA}
              </Text>
            </View>
            <Feather name="repeat" size={20} color={colors.textBrand} />
            <View style={[styles.swapPlayer, { alignItems: 'flex-end' }]}>
              <Text style={[typeStyles.labelMd, { color: colors.textPrimary }]}>
                {playerB.displayName}
              </Text>
              <Text style={[typeStyles.textXs, { color: colors.textSecondary }]}>
                Team {teamB}
              </Text>
            </View>
          </View>

          {/* Consequence */}
          {consequence.length > 0 && (
            <View style={styles.consequenceBox}>
              <Feather name="alert-circle" size={14} color={colors.amber} />
              <Text style={[typeStyles.textSm, { color: colors.amber, flex: 1 }]}>
                {consequence}
              </Text>
            </View>
          )}

          {/* Metric deltas */}
          {metricsBefore && metricsAfter && (
            <View style={styles.deltasContainer}>
              <MetricDelta
                label="Largest gap"
                before={metricsBefore.largestGap.toFixed(1)}
                after={metricsAfter.largestGap.toFixed(1)}
              />
              <MetricDelta
                label="Newcomer buddied"
                before={metricsBefore.newcomerBuddied ? 'yes' : 'no'}
                after={metricsAfter.newcomerBuddied ? 'yes' : 'no'}
              />
              <MetricDelta
                label="Friend pairs"
                before={`${metricsBefore.friendPairsSatisfied} of ${metricsBefore.friendPairsTotal}`}
                after={`${metricsAfter.friendPairsSatisfied} of ${metricsAfter.friendPairsTotal}`}
              />
            </View>
          )}

          {/* Reason input */}
          <View style={styles.reasonSection}>
            <Text style={[typeStyles.labelSm, { color: colors.textSecondary }]}>
              Reason (optional)
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Briefly explain the reason"
              placeholderTextColor={colors.textTertiary}
              value={reason}
              onChangeText={setReason}
              multiline
            />
          </View>

          {/* Note */}
          <Text style={[typeStyles.textXs, styles.note]}>
            This does not change anyone's rating.
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              label="Swap anyway"
              onPress={handleConfirm}
              hierarchy="primary"
              size="lg"
              fullWidth
            />
            <Button
              label="Cancel"
              onPress={handleCancel}
              hierarchy="secondary-gray"
              size="lg"
              fullWidth
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '80%',
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
  titleRow: {
    marginBottom: spacing.xl,
  },
  swapSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  swapPlayer: {
    gap: spacing.xs,
    flex: 1,
  },
  consequenceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.amberBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  deltasContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  deltaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deltaLabel: {
    color: colors.textSecondary,
  },
  deltaValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reasonSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  reasonInput: {
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    color: colors.textPrimary,
    minHeight: spacing['9xl'],
    textAlignVertical: 'top',
    ...typeStyles.textSm,
  },
  note: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actions: {
    gap: spacing.lg,
  },
});
