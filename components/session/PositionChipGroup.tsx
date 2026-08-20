import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, type as typeStyles, bandColor } from '../../lib/theme';
import type { SessionAttendee, Position } from '../../lib/types';

interface PositionChipGroupProps {
  attendees: SessionAttendee[];
  onPlayerPress: (player: SessionAttendee) => void;
}

const POSITION_ORDER: (Position | null)[] = ['S', 'OH', 'MB', 'OP', 'L', null];
const POSITION_SECTION_LABELS: Record<string, string> = {
  S: 'Setters',
  OH: 'Outside hitters',
  MB: 'Middle blockers',
  OP: 'Opposites',
  L: 'Liberos',
  none: 'Unassigned',
};

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function PositionChipGroup({ attendees, onPlayerPress }: PositionChipGroupProps) {
  const grouped = new Map<string, SessionAttendee[]>();

  for (const pos of POSITION_ORDER) {
    const key = pos ?? 'none';
    const players = attendees.filter((p) => p.signedUpPosition === pos);
    if (players.length > 0) grouped.set(key, players);
  }

  return (
    <View style={styles.container}>
      {Array.from(grouped.entries()).map(([posKey, players]) => (
        <View key={posKey} style={styles.section}>
          <Text style={[typeStyles.labelSm, styles.sectionLabel]}>
            {POSITION_SECTION_LABELS[posKey] ?? posKey}
          </Text>
          <View style={styles.chipRow}>
            {players.map((player) => {
              const bColor = bandColor(player.band);
              const pos = player.signedUpPosition;
              return (
                <Pressable
                  key={player.id}
                  onPress={() => onPlayerPress(player)}
                  style={({ pressed }) => [
                    styles.chip,
                    { borderColor: bColor + '40' },
                    pressed && styles.chipPressed,
                  ]}
                >
                  <View style={[styles.chipBadge, { backgroundColor: bColor + '1A' }]}>
                    <Text style={[typeStyles.labelSm, { color: bColor }]}>
                      {pos ?? '?'} {player.band === null ? 'new' : player.band}
                    </Text>
                  </View>
                  <Text style={[typeStyles.textSm, styles.chipName]} numberOfLines={1}>
                    {player.displayName.split(' ')[0]}
                  </Text>
                  {player.declaredState && (
                    <Feather
                      name="alert-circle"
                      size={12}
                      color={colors.amber}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionLabel: {
    color: colors.textTertiary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingRight: spacing.lg,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
  },
  chipPressed: {
    backgroundColor: colors.bgTertiary,
  },
  chipBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  chipName: {
    color: colors.textPrimary,
    maxWidth: 100,
  },
});
