import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { CloseIcon } from '../Icons';

type Props = { text: string; kind?: 'danger' | 'info'; onDismiss?: () => void };

export function Banner({ text, kind = 'danger', onDismiss }: Props) {
  return (
    <View style={[styles.banner, kind === 'info' ? styles.info : styles.danger]} accessibilityRole="alert">
      <Text style={[styles.text, kind === 'danger' && styles.dangerText]}>{text}</Text>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={10} accessibilityLabel="Dismiss notification">
          <CloseIcon size={18} color={kind === 'danger' ? colors.danger : colors.inkMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  danger: { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder },
  info: { backgroundColor: colors.brandBone, borderColor: colors.border },
  text: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.ink },
  dangerText: { color: colors.danger },
});
