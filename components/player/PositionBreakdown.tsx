import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, type as typeStyles, bandColor } from '../../lib/theme';
import type { Position } from '../../lib/types';
import { POSITION_LABELS } from '../../lib/types';

interface PositionBreakdownProps {
  positionRatings: Record<string, number>;
  positionPrefs: Position[];
  overallBand: number | null;
}

// Convert raw rating to a band-relative percentage for display.
// Never shows actual mu; just relative bar widths within band context.
function ratingToBarWidth(rating: number): number {
  // Clamp to 0-100 range based on typical rating spread (10-90)
  return Math.max(5, Math.min(100, ((rating - 10) / 80) * 100));
}

function ratingToBand(rating: number): number {
  if (rating >= 70) return 6;
  if (rating >= 58) return 5;
  if (rating >= 48) return 4;
  if (rating >= 38) return 3;
  if (rating >= 28) return 2;
  if (rating >= 18) return 1;
  return 1;
}

export function PositionBreakdown({
  positionRatings,
  positionPrefs,
  overallBand,
}: PositionBreakdownProps) {
  // Show positions in preference order
  const positions = positionPrefs.filter((p) => p in positionRatings);

  return (
    <View style={styles.container}>
      {positions.map((pos, i) => {
        const rating = positionRatings[pos];
        const band = ratingToBand(rating);
        const width = ratingToBarWidth(rating);
        const color = bandColor(band);
        const isPrimary = i === 0;

        return (
          <View key={pos} style={styles.row}>
            <View style={styles.labelCol}>
              <Text
                style={[
                  typeStyles.labelSm,
                  { color: isPrimary ? colors.textPrimary : colors.textSecondary },
                ]}
              >
                {pos}
              </Text>
              <Text style={[typeStyles.textXs, { color: colors.textTertiary }]}>
                {POSITION_LABELS[pos]}
              </Text>
            </View>
            <View style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${width}%`,
                      backgroundColor: color,
                      opacity: isPrimary ? 1 : 0.6,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  typeStyles.labelSm,
                  { color, minWidth: 28, textAlign: 'right' },
                ]}
              >
                {band}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  labelCol: {
    width: 80,
    gap: spacing.xxs,
  },
  barCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.bgTertiary,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
