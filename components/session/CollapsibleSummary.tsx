import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, type as typeStyles } from '../../lib/theme';
import type { SessionAttendee } from '../../lib/types';
import { friendshipSet } from '../../lib/data';

interface CollapsibleSummaryProps {
  attendees: SessionAttendee[];
  defaultExpanded?: boolean;
}

export function CollapsibleSummary({
  attendees,
  defaultExpanded = true,
}: CollapsibleSummaryProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const setters = attendees.filter((p) => p.signedUpPosition === 'S').length;
  const injured = attendees.filter((p) => p.declaredState === 'injured').length;
  const tired = attendees.filter((p) => p.declaredState === 'tired').length;
  const newcomers = attendees.filter((p) => p.confidence === 'new').length;

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
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="info" size={16} color={colors.textSecondary} />
          <Text style={[typeStyles.labelSm, { color: colors.textSecondary }]}>
            {attendees.length} confirmed
          </Text>
        </View>
        <Feather
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textTertiary}
        />
      </Pressable>

      {expanded && (
        <View style={styles.body}>
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  body: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
