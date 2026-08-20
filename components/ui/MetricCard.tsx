import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, type as typeStyles } from '../../lib/theme';

interface MetricCardProps {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  amber?: boolean;
  compact?: boolean;
  tooltip?: string;
}

export function MetricCard({ label, value, trend, amber, compact, tooltip }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const valueColor = amber ? colors.amber : colors.textPrimary;
  const trendIcon = trend === 'up' ? 'arrow-up' : trend === 'down' ? 'arrow-down' : null;
  const trendColor = trend === 'down' ? colors.amber : colors.success;

  const content = (
    <>
      <View style={styles.labelRow}>
        <Text style={[typeStyles.textXs, styles.label]}>{label}</Text>
        {tooltip && (
          <Feather name="info" size={12} color={colors.textTertiary} />
        )}
      </View>
      <View style={styles.valueRow}>
        <Text
          style={[
            compact ? typeStyles.labelMd : typeStyles.displaySm,
            { color: valueColor },
          ]}
        >
          {value}
        </Text>
        {trendIcon && (
          <Feather
            name={trendIcon}
            size={compact ? 12 : 16}
            color={trendColor}
            style={styles.trendIcon}
          />
        )}
      </View>
      {showTooltip && tooltip && (
        <Text style={[typeStyles.textXs, styles.tooltipText]}>{tooltip}</Text>
      )}
    </>
  );

  if (tooltip) {
    return (
      <Pressable
        onPress={() => setShowTooltip((v) => !v)}
        style={[styles.card, compact && styles.cardCompact]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  cardCompact: {
    padding: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trendIcon: {
    marginTop: spacing.xxs,
  },
  tooltipText: {
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
