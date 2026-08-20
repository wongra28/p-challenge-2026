import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, type as typeStyles } from '../../lib/theme';
import { Badge } from '../ui/Badge';
import type { Player, SessionAttendee, Position } from '../../lib/types';

interface PlayerRowProps {
  player: Player | SessionAttendee;
  onPress?: () => void;
  compact?: boolean;
  showTeamIndicator?: string;
  selected?: boolean;
}

function isAttendee(p: Player | SessionAttendee): p is SessionAttendee {
  return 'signedUpPosition' in p;
}

export function PlayerRow({
  player,
  onPress,
  compact,
  showTeamIndicator,
  selected,
}: PlayerRowProps) {
  const attendee = isAttendee(player) ? player : null;
  const primaryPosition = attendee?.signedUpPosition ?? player.positionPrefs[0];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        compact && styles.containerCompact,
        selected && styles.containerSelected,
        pressed && onPress && styles.containerPressed,
      ]}
    >
      <View style={styles.left}>
        <Text style={[typeStyles.labelSm, { color: colors.textTertiary }]}>
          {player.gender === 'M' ? '♂' : '♀'}
        </Text>
        <View style={styles.nameColumn}>
          <Text style={[typeStyles.labelMd, styles.name]} numberOfLines={1}>
            {player.displayName}
          </Text>
          {!compact && (
            <Text style={[typeStyles.textXs, styles.sub]}>
              {player.sessionsPlayed} sessions
            </Text>
          )}
        </View>
      </View>

      <View style={styles.right}>
        {attendee?.declaredState && (
          <Badge variant="state" value={attendee.declaredState} />
        )}
        {primaryPosition && (
          <Badge variant="position-band" position={primaryPosition as Position} band={player.band} />
        )}
        {showTeamIndicator && (
          <View style={styles.teamDot}>
            <Text style={[typeStyles.labelSm, { color: colors.textSecondary }]}>
              {showTeamIndicator}
            </Text>
          </View>
        )}
        {onPress && (
          <Feather name="chevron-right" size={16} color={colors.textTertiary} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSecondary,
  },
  containerCompact: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  containerSelected: {
    backgroundColor: colors.bgBrandSolid + '1A',
    borderColor: colors.borderBrand,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xxs,
  },
  containerPressed: {
    backgroundColor: colors.bgTertiary,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flex: 1,
  },
  nameColumn: {
    flex: 1,
    gap: spacing.xxs,
  },
  name: {
    color: colors.textPrimary,
  },
  sub: {
    color: colors.textTertiary,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teamDot: {
    width: spacing['3xl'],
    height: spacing['3xl'],
    borderRadius: radius.xl,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
