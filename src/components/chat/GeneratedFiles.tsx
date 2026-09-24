// Cards for files the assistant generated (docx / xlsx / pptx / pdf / csv).
// Tap opens the in-app preview; the preview screen has "Open in…" for
// saving or sharing through the phone's own viewer.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import type { GeneratedFile } from '../../types/api';
import { formatBytes } from '../../utils/files';
import { ChevronRightIcon, FileTypeIcon } from '../Icons';

type Props = { files: GeneratedFile[]; onOpen: (file: GeneratedFile) => void };

export function GeneratedFiles({ files, onOpen }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Generated files</Text>
      {files.map((file) => (
        <Pressable
          key={file.id}
          onPress={() => onOpen(file)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          accessibilityLabel={`Preview ${file.filename}`}
        >
          <View style={styles.icon}>
            <FileTypeIcon filename={file.filename} size={20} color={colors.accent} />
          </View>
          <View style={styles.text}>
            <Text style={styles.name} numberOfLines={1}>
              {file.filename}
            </Text>
            <Text style={styles.size}>{formatBytes(file.size)}</Text>
          </View>
          <ChevronRightIcon size={18} color={colors.inkMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 4, marginBottom: 8 },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted, letterSpacing: 0.5 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  pressed: { backgroundColor: colors.hoverBg },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.brandBone,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  size: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkMuted, marginTop: 2 },
});
