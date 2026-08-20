import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, type as typeStyles } from '../../lib/theme';
import { allPlayers } from '../../lib/data';
import { PlayerRow } from '../../components/session/PlayerRow';
import type { Player, Position, Confidence } from '../../lib/types';

type SortKey = 'name' | 'band' | 'sessions';

const POSITION_FILTERS: Position[] = ['S', 'OH', 'MB', 'OP', 'L'];

export default function RosterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [bandFilter, setBandFilter] = useState<number | null>(null);
  const [posFilter, setPosFilter] = useState<Position | null>(null);

  const filtered = useMemo(() => {
    let list = allPlayers;

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.displayName.toLowerCase().includes(q));
    }

    // Band filter
    if (bandFilter !== null) {
      list = list.filter((p) => p.band === bandFilter);
    }

    // Position filter
    if (posFilter !== null) {
      list = list.filter((p) => p.positionPrefs.includes(posFilter));
    }

    // Sort
    const sorted = [...list];
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
      case 'band':
        sorted.sort((a, b) => (b.band ?? -1) - (a.band ?? -1));
        break;
      case 'sessions':
        sorted.sort((a, b) => b.sessionsPlayed - a.sessionsPlayed);
        break;
    }

    return sorted;
  }, [search, sortBy, bandFilter, posFilter]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={typeStyles.displaySm}>Roster</Text>
        <Text style={[typeStyles.textSm, { color: colors.textSecondary }]}>
          {allPlayers.length} players
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Feather name="search" size={16} color={colors.textTertiary} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search by name"
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {/* Sort chips */}
        {(['name', 'band', 'sessions'] as SortKey[]).map((key) => (
          <Pressable
            key={key}
            onPress={() => setSortBy(key)}
            style={[
              styles.chip,
              sortBy === key && styles.chipActive,
            ]}
          >
            <Text
              style={[
                typeStyles.labelSm,
                {
                  color:
                    sortBy === key
                      ? colors.textWhite
                      : colors.textSecondary,
                },
              ]}
            >
              {key}
            </Text>
          </Pressable>
        ))}

        <View style={styles.filterDivider} />

        {/* Position filters */}
        {POSITION_FILTERS.map((pos) => (
          <Pressable
            key={pos}
            onPress={() => setPosFilter(posFilter === pos ? null : pos)}
            style={[
              styles.chip,
              posFilter === pos && styles.chipActive,
            ]}
          >
            <Text
              style={[
                typeStyles.labelSm,
                {
                  color:
                    posFilter === pos
                      ? colors.textWhite
                      : colors.textSecondary,
                },
              ]}
            >
              {pos}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => (
          <PlayerRow
            player={item}
            onPress={() => router.push(`/player/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <Text style={[typeStyles.textSm, styles.emptyText]}>
            No players match your filters.
          </Text>
        }
        contentContainerStyle={styles.listContent}
      />
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
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  searchRow: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    paddingHorizontal: spacing.xl,
    height: spacing['5xl'],
  },
  searchTextInput: {
    flex: 1,
    color: colors.textPrimary,
    ...typeStyles.textSm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPrimary,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
  },
  chipActive: {
    backgroundColor: colors.bgBrandSolid,
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.borderPrimary,
    marginHorizontal: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing['9xl'],
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing['5xl'],
  },
});
