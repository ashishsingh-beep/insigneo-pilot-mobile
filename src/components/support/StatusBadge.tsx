import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { STATUS_LABELS } from '../../api/support';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const TONES: Record<string, { bg: string; fg: string }> = {
  open: { bg: colors.brandBone, fg: colors.brandBlue600 },
  in_progress: { bg: '#fdf3e1', fg: '#8a5b12' },
  resolved: { bg: '#e7f3e2', fg: colors.success },
  closed: { bg: colors.bgPanel, fg: colors.inkMuted },
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONES[status] || TONES.closed;
  return <Text style={[styles.badge, { backgroundColor: tone.bg, color: tone.fg }]}>{STATUS_LABELS[status] || status}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
