import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, type as typeStyles, bandColor } from '../../lib/theme';
import type { Position, Confidence, DeclaredState } from '../../lib/types';

type BadgeVariant = 'band' | 'position' | 'position-band' | 'state' | 'confidence' | 'net-context';

interface BandBadgeProps {
  variant: 'band';
  value: number | null;
  large?: boolean;
}

interface PositionBadgeProps {
  variant: 'position';
  value: Position;
}

interface StateBadgeProps {
  variant: 'state';
  value: NonNullable<DeclaredState>;
}

interface ConfidenceBadgeProps {
  variant: 'confidence';
  value: Confidence;
}

interface PositionBandBadgeProps {
  variant: 'position-band';
  position: Position;
  band: number | null;
}

interface NetContextBadgeProps {
  variant: 'net-context';
  value: string;
}

type BadgeProps =
  | BandBadgeProps
  | PositionBadgeProps
  | PositionBandBadgeProps
  | StateBadgeProps
  | ConfidenceBadgeProps
  | NetContextBadgeProps;

export function Badge(props: BadgeProps) {
  switch (props.variant) {
    case 'band': {
      const color = bandColor(props.value);
      return (
        <View
          style={[
            styles.pill,
            {
              backgroundColor: color + '1A',
              borderColor: color + '40',
              borderWidth: 1,
            },
            props.large && styles.pillLarge,
          ]}
        >
          <Text
            style={[
              props.large ? typeStyles.labelLg : typeStyles.labelSm,
              { color },
            ]}
          >
            {props.value === null ? 'new' : props.value}
          </Text>
        </View>
      );
    }

    case 'position':
      return (
        <View style={[styles.pill, styles.positionPill]}>
          <Text style={[typeStyles.labelSm, { color: colors.textPrimary }]}>
            {props.value}
          </Text>
        </View>
      );

    case 'position-band': {
      const pbColor = bandColor(props.band);
      return (
        <View
          style={[
            styles.pill,
            {
              backgroundColor: pbColor + '1A',
              borderColor: pbColor + '40',
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[typeStyles.labelSm, { color: pbColor }]}>
            {props.position} {props.band === null ? 'new' : props.band}
          </Text>
        </View>
      );
    }

    case 'state': {
      const isInjured = props.value === 'injured';
      return (
        <View
          style={[
            styles.pill,
            {
              backgroundColor: colors.amberBg,
              borderColor: colors.amber + '40',
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[typeStyles.labelSm, { color: colors.amber }]}>
            {props.value}
          </Text>
        </View>
      );
    }

    case 'confidence': {
      const conf = props.value;
      const dotColor =
        conf === 'solid'
          ? colors.success
          : conf === 'thin'
            ? colors.amber
            : colors.textTertiary;
      return (
        <View style={styles.confidenceRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: dotColor },
              conf === 'new' && styles.dotOutline,
            ]}
          />
        </View>
      );
    }

    case 'net-context':
      return (
        <View style={[styles.pill, styles.netContextPill]}>
          <Text style={[typeStyles.labelSm, { color: colors.court }]}>
            {props.value}
          </Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  pillLarge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  positionPill: {
    backgroundColor: colors.bgTertiary,
  },
  netContextPill: {
    backgroundColor: colors.court + '1A',
    borderColor: colors.court + '40',
    borderWidth: 1,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: spacing.md,
    height: spacing.md,
    borderRadius: radius.xs,
  },
  dotOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.textTertiary,
  },
});
