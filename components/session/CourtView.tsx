import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, fonts, type as typeStyles, bandColor } from '../../lib/theme';
import { teamRating } from '../../lib/solver';
import type { Team, SessionAttendee, Position } from '../../lib/types';

interface CourtViewProps {
  team: Team;
  teamLabel: string;
  selectedPlayerId?: number | null;
  previewPlayerId?: number | null;
  swapTargetIds?: Set<number>;
  onPlayerPress?: (player: SessionAttendee) => void;
  displayNames?: Map<number, string>;
  previewAvgBand?: string | null;
  isAffected?: boolean;
  dimInactive?: boolean;
  friendPairIds?: [number, number][];
}

const AVATAR_SIZE = 45;
const AVATAR_RADIUS = AVATAR_SIZE / 2;
const INITIALS_SIZE = 14;
const NAME_SIZE = 14;
const AVG_NUMERAL_SIZE = 20;
const ITEM_WIDTH = AVATAR_SIZE + 20; // matches avatarContainer width
const AVATAR_OUTER = AVATAR_SIZE + 2 * 2 + 2 * 2; // 53
const FRIEND_COLOR = '#F9A8D4'; // light pink

/** Blend a foreground hex color at a given alpha over a background hex, returning an opaque hex. */
function blendOpaque(fg: string, alpha: number, bg: string): string {
  const fR = parseInt(fg.slice(1, 3), 16);
  const fG = parseInt(fg.slice(3, 5), 16);
  const fB = parseInt(fg.slice(5, 7), 16);
  const bR = parseInt(bg.slice(1, 3), 16);
  const bG = parseInt(bg.slice(3, 5), 16);
  const bB = parseInt(bg.slice(5, 7), 16);
  const r = Math.round(bR * (1 - alpha) + fR * alpha);
  const g = Math.round(bG * (1 - alpha) + fG * alpha);
  const b = Math.round(bB * (1 - alpha) + fB * alpha);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
const BADGE_BG_ALPHA = 0.18; // slightly stronger than 0x1A for readability on opaque
const BADGE_BORDER_ALPHA = 0.35;
const AVG_NUMERAL_SMALL = Math.round(AVG_NUMERAL_SIZE * 0.72);
const RING_WIDTH = spacing.xxs;
const RING_OFFSET = spacing.xxs;

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getShortName(name: string, displayNames?: Map<number, string>, id?: number): string {
  if (displayNames && id !== undefined) {
    const mapped = displayNames.get(id);
    if (mapped) return mapped;
  }
  return name.split(' ')[0];
}

// 5-1 base rotation ordering
interface SlotAssignment {
  z4: SessionAttendee | null;
  z3: SessionAttendee | null;
  z2: SessionAttendee | null;
  z5: SessionAttendee | null;
  z6: SessionAttendee | null;
  z1: SessionAttendee | null;
}

function assignSlots(players: SessionAttendee[]): SlotAssignment {
  const slots: SlotAssignment = {
    z4: null, z3: null, z2: null,
    z5: null, z6: null, z1: null,
  };
  const remaining = [...players];

  function tryAssign(slotKey: keyof SlotAssignment, position: Position) {
    if (slots[slotKey]) return;
    const idx = remaining.findIndex((p) => p.signedUpPosition === position);
    if (idx !== -1) {
      slots[slotKey] = remaining[idx];
      remaining.splice(idx, 1);
    }
  }

  tryAssign('z1', 'S');
  tryAssign('z6', 'L');
  tryAssign('z3', 'MB');
  tryAssign('z4', 'OP');
  tryAssign('z2', 'OH');
  tryAssign('z5', 'OH');

  const slotKeys: (keyof SlotAssignment)[] = ['z4', 'z3', 'z2', 'z5', 'z6', 'z1'];
  for (const key of slotKeys) {
    if (!slots[key] && remaining.length > 0) {
      slots[key] = remaining.shift()!;
    }
  }
  return slots;
}

function PlayerAvatar({
  player,
  isSelected,
  isSwapTarget,
  isDimmed,
  onPress,
  displayNames,
}: {
  player: SessionAttendee;
  isSelected: boolean;
  isSwapTarget: boolean;
  isDimmed: boolean;
  onPress: () => void;
  displayNames?: Map<number, string>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.avatarContainer, isDimmed && styles.avatarDimmed]}
    >
      <View style={styles.avatarOuter}>
        <View
          style={[
            styles.avatar,
            isSelected && styles.avatarSelected,
            isSwapTarget && styles.avatarSwapTarget,
          ]}
        >
          <Text style={styles.initials}>
            {getInitials(player.displayName)}
          </Text>
        </View>
        {(() => {
          const bc = bandColor(player.band);
          const pos = player.signedUpPosition ?? '?';
          const isShort = pos.length <= 1;
          const bgOpaque = blendOpaque(bc, BADGE_BG_ALPHA, colors.bgSecondary);
          const borderOpaque = blendOpaque(bc, BADGE_BORDER_ALPHA, colors.bgSecondary);
          return (
            <View style={[styles.badgeWrap, isShort && styles.badgeWrapShort, { backgroundColor: bgOpaque, borderColor: borderOpaque }]}>
              <Text style={[styles.badgeText, { color: bc }]}>
                {pos} {player.band === null ? 'new' : player.band}
              </Text>
            </View>
          );
        })()}
      </View>
      <Text style={styles.playerName} numberOfLines={1}>
        {getShortName(player.displayName, displayNames, player.id)}
      </Text>
    </Pressable>
  );
}

export function CourtView({
  team,
  teamLabel,
  selectedPlayerId,
  previewPlayerId,
  swapTargetIds,
  onPlayerPress,
  displayNames,
  previewAvgBand,
  isAffected,
  dimInactive,
  friendPairIds,
}: CourtViewProps) {
  const [gridWidth, setGridWidth] = useState(0);
  const slots = assignSlots(team.players);
  const rating = teamRating(team.players).toFixed(1);

  const orderedPlayers = [slots.z4, slots.z3, slots.z2, slots.z5, slots.z6, slots.z1];

  // Map player IDs to slot indices for friend line rendering
  const playerSlotMap = new Map<number, number>();
  orderedPlayers.forEach((p, i) => { if (p) playerSlotMap.set(p.id, i); });

  // Friend pairs where both players are on this team
  const teamFriendPairs = (friendPairIds ?? []).filter(
    ([a, b]) => playerSlotMap.has(a) && playerSlotMap.has(b)
  );

  const onGridLayout = (e: LayoutChangeEvent) => {
    setGridWidth(e.nativeEvent.layout.width);
  };

  // Compute avatar center position for a slot index (0-5)
  function getSlotCenter(idx: number) {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    // space-around: equal space on each side of each item
    const totalSpace = gridWidth - 3 * ITEM_WIDTH;
    const halfSpace = totalSpace / 6;
    const x = halfSpace + col * (ITEM_WIDTH + 2 * halfSpace) + ITEM_WIDTH / 2;
    // Row Y: grid paddingVertical(8) + avatarOuter center
    const rowHeight = AVATAR_OUTER + spacing.xs + NAME_SIZE + 6; // avatar + gap + name line
    const paddingV = spacing.md;
    const gap = spacing.md;
    const y = paddingV + row * (rowHeight + gap) + AVATAR_OUTER / 2;
    return { x, y };
  }

  const renderPlayer = (player: SessionAttendee | null) => {
    if (!player) return <View style={styles.emptySlot} />;
    const isSelected = selectedPlayerId === player.id || previewPlayerId === player.id;
    const isSwapTarget = swapTargetIds?.has(player.id) ?? false;
    const isDimmed = dimInactive === true && !isSelected && !isSwapTarget;
    return (
      <PlayerAvatar
        key={player.id}
        player={player}
        isSelected={isSelected}
        isSwapTarget={isSwapTarget}
        isDimmed={isDimmed}
        onPress={() => onPlayerPress?.(player)}
        displayNames={displayNames}
      />
    );
  };

  return (
    <View style={[styles.card, isAffected && styles.cardAffected]}>
      <View style={styles.header}>
        <Text style={styles.teamLabel}>{teamLabel}</Text>
        <View style={styles.avgContainer}>
          {previewAvgBand ? (
            <>
              <Text style={styles.avgOld}>{rating}</Text>
              <Text style={styles.avgPreview}>{previewAvgBand}</Text>
            </>
          ) : (
            <View style={styles.avgLabelGroup}>
              <Text style={styles.avgNumeral}>{rating}</Text>
              <Text style={styles.avgLabel}>team rating</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.grid} onLayout={onGridLayout}>
        <View style={styles.gridRow}>
          {renderPlayer(orderedPlayers[0])}
          {renderPlayer(orderedPlayers[1])}
          {renderPlayer(orderedPlayers[2])}
        </View>
        <View style={styles.gridRow}>
          {renderPlayer(orderedPlayers[3])}
          {renderPlayer(orderedPlayers[4])}
          {renderPlayer(orderedPlayers[5])}
        </View>

        {/* Friend pair connectors */}
        {gridWidth > 0 && teamFriendPairs.map(([aId, bId]) => {
          const aSlot = playerSlotMap.get(aId)!;
          const bSlot = playerSlotMap.get(bId)!;
          const ac = getSlotCenter(aSlot);
          const bc = getSlotCenter(bSlot);
          const dx = bc.x - ac.x;
          const dy = bc.y - ac.y;
          const fullLength = Math.sqrt(dx * dx + dy * dy);
          if (fullLength === 0) return null;
          // Unit direction vector
          const ux = dx / fullLength;
          const uy = dy / fullLength;
          // Offset start/end to circle edges
          const startX = ac.x + ux * AVATAR_RADIUS;
          const startY = ac.y + uy * AVATAR_RADIUS;
          const endX = bc.x - ux * AVATAR_RADIUS;
          const endY = bc.y - uy * AVATAR_RADIUS;
          const lineLength = Math.max(0, fullLength - 2 * AVATAR_RADIUS);
          const angle = Math.atan2(dy, dx);
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          const HEART_SIZE = 18;

          return (
            <View key={`${aId}-${bId}`} pointerEvents="none" style={StyleSheet.absoluteFill}>
              {/* Dotted line */}
              <View
                style={{
                  position: 'absolute',
                  left: midX - lineLength / 2,
                  top: midY,
                  width: lineLength,
                  height: 0,
                  borderTopWidth: 1,
                  borderStyle: 'dotted',
                  borderColor: FRIEND_COLOR,
                  transform: [{ rotate: `${angle}rad` }],
                }}
              />
              {/* Heart badge */}
              <View
                style={{
                  position: 'absolute',
                  left: midX - HEART_SIZE / 2,
                  top: midY - HEART_SIZE / 2,
                  width: HEART_SIZE,
                  height: HEART_SIZE,
                  borderRadius: HEART_SIZE / 2,
                  backgroundColor: colors.bgSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="heart" size={10} color={FRIEND_COLOR} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.bgSecondary,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  cardAffected: {
    borderWidth: 1,
    borderColor: colors.amber,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  teamLabel: {
    fontFamily: fonts.display,
    fontSize: AVG_NUMERAL_SIZE,
    color: colors.textWhite,
  },
  avgContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  avgLabelGroup: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  avgNumeral: {
    fontFamily: fonts.display,
    fontSize: AVG_NUMERAL_SIZE,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  avgLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textTertiary,
  },
  avgOld: {
    fontFamily: fonts.display,
    fontSize: AVG_NUMERAL_SMALL,
    fontWeight: '600',
    color: colors.textDisabled,
    textDecorationLine: 'line-through',
  },
  avgPreview: {
    fontFamily: fonts.display,
    fontSize: AVG_NUMERAL_SIZE,
    fontWeight: '600',
    color: colors.textAmber,
  },
  grid: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    alignItems: 'center',
    gap: spacing.xs,
    width: AVATAR_SIZE + spacing['2xl'],
  },
  avatarDimmed: {
    opacity: 0.3,
  },
  avatarOuter: {
    width: AVATAR_SIZE + RING_WIDTH * 2 + RING_OFFSET * 2,
    height: AVATAR_SIZE + RING_WIDTH * 2 + RING_OFFSET * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: RING_WIDTH,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: colors.textBrand,
  },
  avatarSwapTarget: {
    borderColor: colors.amber,
    borderStyle: 'dashed',
  },
  initials: {
    fontSize: INITIALS_SIZE,
    fontFamily: fonts.bodyMedium,
    fontWeight: '500',
    color: colors.textWhite,
  },
  badgeWrap: {
    position: 'absolute',
    bottom: -3,
    right: -7,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeWrapShort: {
    right: -1,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.bodyMedium,
    fontWeight: '500',
  },
  playerName: {
    fontSize: NAME_SIZE,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySlot: {
    width: AVATAR_SIZE + spacing['2xl'],
    height: AVATAR_SIZE + spacing['2xl'],
  },
});
