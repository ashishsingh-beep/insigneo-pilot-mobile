// Attachments above a user message: images as thumbnails, documents as
// badges. Both open the preview screen once the file is on the server.
import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { filePaths, toFileUri } from '../../api/files';
import { useCachedFile } from '../../hooks/useCachedFile';
import type { ChatMessage } from '../../stores/chatStore';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { isImageFile, previewKindOf } from '../../utils/files';
import { ImageIcon, PaperclipIcon } from '../Icons';

type Item = { name: string; id: string | null; localUri: string | null; isImage: boolean };

type Props = {
  message: ChatMessage;
  onOpen: (file: { id: string; filename: string }) => void;
};

function Thumb({ item, onOpen }: { item: Item; onOpen: () => void }) {
  // A just-sent image is already on the device; a reopened one is downloaded.
  const remote = useCachedFile(
    item.localUri || !item.id ? null : filePaths.uploadedContent(item.id),
    `up_${item.id}`,
    item.name,
  );
  const uri = item.localUri || (remote.path ? toFileUri(remote.path) : null);
  return (
    <Pressable onPress={item.id ? onOpen : undefined} disabled={!item.id} style={styles.thumb}>
      {uri ? (
        <Image source={{ uri }} style={styles.thumbImage} />
      ) : remote.loading ? (
        <ActivityIndicator color={colors.inkMuted} />
      ) : (
        <ImageIcon color={colors.inkMuted} />
      )}
    </Pressable>
  );
}

export function MessageAttachments({ message, onOpen }: Props) {
  const names = message.attachedFilenames || [];
  if (names.length === 0) return null;

  const ids = message.attachedFileIds || [];
  const locals = message.localAttachments || [];
  const items: Item[] = names.map((name, i) => ({
    name,
    id: ids[i] || null,
    localUri: locals[i]?.uri || null,
    isImage: locals[i]?.isImage ?? isImageFile(name),
  }));
  const images = items.filter((i) => i.isImage);
  const documents = items.filter((i) => !i.isImage);

  return (
    <View style={styles.wrap}>
      {images.length > 0 && (
        <View style={styles.row}>
          {images.map((item, i) => (
            <Thumb key={`${item.name}_${i}`} item={item} onOpen={() => item.id && onOpen({ id: item.id, filename: item.name })} />
          ))}
        </View>
      )}
      {documents.map((item, i) => {
        const openable = !!item.id && previewKindOf(item.name) !== 'unsupported';
        return (
          <Pressable
            key={`${item.name}_${i}`}
            style={styles.badge}
            disabled={!openable}
            onPress={() => item.id && onOpen({ id: item.id, filename: item.name })}
          >
            <PaperclipIcon size={13} color={colors.inkMuted} />
            <Text style={styles.badgeText} numberOfLines={1}>
              {item.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-end', gap: 6, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6 },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: { width: '100%', height: '100%' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 260,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink, flexShrink: 1 },
});
