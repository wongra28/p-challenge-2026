import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, type as typeStyles } from '../../lib/theme';
import type { SessionAttendee } from '../../lib/types';
import { friendshipSet } from '../../lib/data';

interface RosterSummaryProps {
  attendees: SessionAttendee[];
}

export function RosterSummary({ attendees }: RosterSummaryProps) {
  const setters = attendees.filter((p) => p.signedUpPosition === 'S').length;
  const injured = attendees.filter((p) => p.declaredState === 'injured').length;
  const tired = attendees.filter((p) => p.declaredState === 'tired').length;
  const newcomers = attendees.filter((p) => p.confidence === 'new').length;

  // Count friend pairs where both are attending
  const ids = new Set(attendees.map((p) => p.id));
  let friendPairs = 0;
  for (const key of friendshipSet) {
    const [a, b] = key.split('-').map(Number);
    if (ids.has(a) && ids.has(b)) friendPairs++;
  }

  const items = [
    {
      label: `${setters} setter${setters !== 1 ? 's' : ''}`,
      ok: setters >= 3,
      icon: 'check-circle' as const,
    },
    {
      label: `${injured} injured (not OP/MB)`,
      ok: true,
      icon: 'alert-circle' as const,
      show: injured > 0,
    },
    {
      label: `${tired} tired`,
      ok: true,
      icon: 'alert-circle' as const,
      show: tired > 0,
    },
    {
      label: `${newcomers} newcomer${newcomers !== 1 ? 's' : ''}`,
      ok: true,
      icon: 'user-plus' as const,
      show: newcomers > 0,
    },
    {
      label: `${friendPairs} friend pair${friendPairs !== 1 ? 's' : ''}`,
      ok: true,
      icon: 'heart' as const,
      show: friendPairs > 0,
    },
  ].filter((item) => item.show !== false);

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <Feather
            name={item.icon}
            size={14}
            color={item.ok ? colors.textSecondary : colors.amber}
          />
          <Text
            style={[
              typeStyles.textSm,
              { color: item.ok ? colors.textSecondary : colors.amber },
            ]}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.borderPrimary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
