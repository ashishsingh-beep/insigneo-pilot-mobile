// ---------------------------------------------------------------------------
// Bottom sheet built on Modal — used for the attach menu, the model picker
// and the chat row actions. Same look on iOS and Android.
// ---------------------------------------------------------------------------

import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { CheckIcon } from '../Icons';

export type SheetOption = {
  key: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  destructive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title?: string;
  options: SheetOption[];
  onClose: () => void;
};

export function Sheet({ visible, title, options, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.handle} />
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {options.map((o) => (
          <Pressable
            key={o.key}
            disabled={o.disabled}
            onPress={() => {
              onClose();
              // iOS cannot present a picker/alert while this modal is still
              // animating out, so the action waits for the dismissal.
              setTimeout(o.onPress, Platform.OS === 'ios' ? 350 : 0);
            }}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed, o.disabled && styles.rowDisabled]}
          >
            {o.icon ? <View style={styles.rowIcon}>{o.icon}</View> : null}
            <View style={styles.rowText}>
              <Text style={[styles.label, o.destructive && styles.destructive]}>{o.label}</Text>
              {o.description ? <Text style={styles.description}>{o.description}</Text> : null}
            </View>
            {o.selected ? <CheckIcon color={colors.brandBlue600} /> : null}
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.inkMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
  },
  rowPressed: { backgroundColor: colors.hoverBg },
  rowDisabled: { opacity: 0.45 },
  rowIcon: { marginRight: 14 },
  rowText: { flex: 1 },
  label: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  destructive: { color: colors.danger },
  description: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkMuted, marginTop: 2 },
});
