import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, type as typeStyles } from '../../lib/theme';
import { allSessions, getSessionAttendees, NET_CONTEXT_LABELS } from '../../lib/data';
import { checkComposition } from '../../lib/solver';
import { Badge } from '../../components/ui/Badge';
import type { Session } from '../../lib/types';

const POSITION_LABELS: Record<string, string> = {
  S: 'setter',
  OH: 'outside hitter',
  MB: 'middle blocker',
  OP: 'opposite',
  L: 'libero',
};

// Sort sessions: solvable (live) first, then by date
function getSortedSessions() {
  return [...allSessions].sort((a, b) => {
    const aAttendees = getSessionAttendees(a.id);
    const bAttendees = getSessionAttendees(b.id);
    const aSolvable = checkComposition(aAttendees, a.teamCount).length === 0;
    const bSolvable = checkComposition(bAttendees, b.teamCount).length === 0;
    if (aSolvable !== bSolvable) return aSolvable ? -1 : 1;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });
}

function SessionCard({ session, isLive }: { session: Session; isLive: boolean }) {
  const router = useRouter();
  const attendees = getSessionAttendees(session.id);
  const shortfalls = checkComposition(attendees, session.teamCount);
  const solvable = shortfalls.length === 0;

  const date = new Date(session.startsAt);
  const dayDate = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const timeStr = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const shortfallText = shortfalls
    .map((s) => {
      const label = POSITION_LABELS[s.position] ?? s.position;
      return `Short ${s.required - s.available} ${label}${s.required - s.available > 1 ? 's' : ''}`;
    })
    .join(', ');

  const content = (
    <>
      <View style={styles.cardTop}>
        <View style={styles.cardDate}>
          <Text style={[typeStyles.labelMd, { color: colors.textPrimary }]}>
            {dayDate}
          </Text>
          <Text style={[typeStyles.textSm, { color: colors.textSecondary }]}>
            {timeStr} · {session.venue}
          </Text>
        </View>
        {isLive && (
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={[typeStyles.labelSm, styles.liveText]}>LIVE</Text>
          </View>
        )}
      </View>

      <View style={styles.cardMeta}>
        <Badge variant="net-context" value={NET_CONTEXT_LABELS[session.netContext]} />
        <Text style={[typeStyles.textSm, { color: colors.textSecondary }]}>
          {session.teamCount} teams of {session.teamSize}
        </Text>
        <Text style={[typeStyles.textSm, { color: colors.textSecondary }]}>
          {attendees.length} confirmed
        </Text>
      </View>

      <View style={styles.readinessRow}>
        <View
          style={[
            styles.readinessDot,
            { backgroundColor: solvable ? colors.success : colors.amber },
          ]}
        />
        <Text
          style={[
            typeStyles.labelSm,
            { color: solvable ? colors.textSuccess : colors.textAmber },
          ]}
        >
          {solvable ? 'Ready to play' : shortfallText}
        </Text>
      </View>
    </>
  );

  if (isLive) {
    return (
      <Pressable
        onPress={() => router.push(`/session?id=${session.id}`)}
        style={({ pressed }) => [
          styles.card,
          styles.cardLive,
          pressed && styles.cardPressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      {content}
    </View>
  );
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={typeStyles.displaySm}>Your sessions</Text>
        <Text style={[typeStyles.textSm, { color: colors.textSecondary }]}>
          {allSessions.length} upcoming
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {getSortedSessions().map((session) => {
          const attendees = getSessionAttendees(session.id);
          const solvable = checkComposition(attendees, session.teamCount).length === 0;
          return (
            <SessionCard key={session.id} session={session} isLive={solvable} />
          );
        })}
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPrimary,
  },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing['6xl'],
  },
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  cardLive: {
    borderWidth: 1,
    borderColor: colors.success + '66',
    ...Platform.select({
      web: {
        boxShadow: `0 0 ${spacing.xl}px ${colors.success}1A, 0 0 ${spacing['4xl']}px ${colors.success}0D`,
      },
      default: {
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: spacing.xl,
        elevation: 4,
      },
    }),
  },
  cardPressed: {
    backgroundColor: colors.bgTertiary,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    gap: spacing.xs,
    flex: 1,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success + '1A',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  liveDot: {
    width: spacing.md,
    height: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  liveText: {
    color: colors.textSuccess,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flexWrap: 'wrap',
  },
  readinessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  readinessDot: {
    width: spacing.md,
    height: spacing.md,
    borderRadius: radius.full,
  },
});
