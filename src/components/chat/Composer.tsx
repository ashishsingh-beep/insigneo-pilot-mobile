// ---------------------------------------------------------------------------
// Message composer: text box, attachment chips, attach / web-search / model
// controls, and Send (or Stop while a reply is streaming).
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { launchCamera, launchImageLibrary, type Asset, type PhotoQuality } from 'react-native-image-picker';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import { MAX_DOCUMENT_BYTES, MAX_IMAGE_BYTES } from '../../config';
import { useModels } from '../../hooks/useModels';
import { useChatStore, type PendingAttachment } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { formatBytes, isAttachable, isImageUpload, mimeTypeOf } from '../../utils/files';
import {
  ArrowUpIcon,
  CameraIcon,
  ChevronDownIcon,
  CloseIcon,
  DocumentIcon,
  FileTypeIcon,
  GlobeIcon,
  ImageIcon,
  ModelIcon,
  PaperclipIcon,
  StopIcon,
} from '../Icons';
import { Sheet } from '../ui/Sheet';

type Props = { value: string; onChangeText: (text: string) => void };

let seq = 0;

type Candidate = { uri: string; name: string; type: string | null; size: number | null };

// Validates picked files the same way the web app does: supported type, and
// under the backend's size limits.
function toAttachments(candidates: Candidate[]): { accepted: PendingAttachment[]; error: string | null } {
  const accepted: PendingAttachment[] = [];
  let error: string | null = null;
  for (const c of candidates) {
    if (!isAttachable(c.name, c.type)) {
      error = `${c.name} can't be uploaded. Supported formats are PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), CSV, TXT, and images (PNG, JPG, GIF, WEBP).`;
      continue;
    }
    const image = isImageUpload(c.name, c.type);
    const limit = image ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
    if (c.size != null && c.size > limit) {
      error = `${c.name} is too large — ${image ? 'images' : 'files'} must be under ${formatBytes(limit)}.`;
      continue;
    }
    seq += 1;
    accepted.push({
      key: `att_${seq}`,
      uri: c.uri,
      name: c.name,
      type: c.type || mimeTypeOf(c.name),
      size: c.size,
      isImage: image,
    });
  }
  return { accepted, error };
}

function fromImageAssets(assets: Asset[] | undefined): Candidate[] {
  return (assets || [])
    .filter((a) => a.uri)
    .map((a, i) => ({
      uri: a.uri!,
      name: a.fileName || `photo_${Date.now()}_${i}.jpg`,
      type: a.type || 'image/jpeg',
      size: a.fileSize ?? null,
    }));
}

// Phone photos are large; the backend downsizes to 1568px anyway, so a
// smaller upload loses nothing and saves the user's data.
const IMAGE_OPTIONS = { mediaType: 'photo' as const, maxWidth: 2048, maxHeight: 2048, quality: 0.8 as PhotoQuality };

export function Composer({ value, onChangeText }: Props) {
  const sending = useChatStore((s) => s.sending);
  const pending = useChatStore((s) => s.pending);
  const attachError = useChatStore((s) => s.attachError);
  const { send, stop, addAttachments, removeAttachment, setAttachError } = useChatStore.getState();

  const enableWebSearch = useSettingsStore((s) => s.enableWebSearch);
  const setEnableWebSearch = useSettingsStore((s) => s.setEnableWebSearch);
  const setSelectedModel = useSettingsStore((s) => s.setSelectedModel);
  const { models, selected } = useModels();

  const [attachOpen, setAttachOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const canSend = (value.trim().length > 0 || pending.length > 0) && !sending;

  function accept(candidates: Candidate[]) {
    const { accepted, error } = toAttachments(candidates);
    setAttachError(error);
    if (accepted.length) addAttachments(accepted);
  }

  async function takePhoto() {
    const res = await launchCamera({ ...IMAGE_OPTIONS, saveToPhotos: false });
    if (res.errorCode) setAttachError(res.errorMessage || 'Could not open the camera.');
    else accept(fromImageAssets(res.assets));
  }

  async function choosePhotos() {
    const res = await launchImageLibrary({ ...IMAGE_OPTIONS, selectionLimit: 0 });
    if (res.errorCode) setAttachError(res.errorMessage || 'Could not open your photos.');
    else accept(fromImageAssets(res.assets));
  }

  async function chooseFiles() {
    try {
      const files = await pick({
        allowMultiSelection: true,
        type: [types.pdf, types.docx, types.xlsx, types.pptx, types.csv, types.plainText, types.images],
      });
      accept(
        files.map((f) => ({
          uri: f.uri,
          name: f.name || 'file',
          type: f.type,
          size: f.size,
        })),
      );
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      setAttachError('Could not open the file picker.');
    }
  }

  function handleSend() {
    if (!canSend) return;
    const text = value;
    onChangeText('');
    send(text);
  }

  return (
    <View style={styles.wrap}>
      {pending.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {pending.map((a) => (
            <View key={a.key} style={styles.chip}>
              {a.isImage ? (
                <Image source={{ uri: a.uri }} style={styles.chipThumb} />
              ) : (
                <FileTypeIcon filename={a.name} size={16} color={colors.accent} />
              )}
              <Text style={styles.chipName} numberOfLines={1}>
                {a.name}
              </Text>
              <Pressable onPress={() => removeAttachment(a.key)} hitSlop={8} accessibilityLabel={`Remove ${a.name}`}>
                <CloseIcon size={14} color={colors.inkMuted} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
      {attachError ? (
        <Text style={styles.error} onPress={() => setAttachError(null)}>
          {attachError}
        </Text>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Ask anything, or attach a document…"
        placeholderTextColor={colors.inkFaint}
        value={value}
        onChangeText={onChangeText}
        multiline
        textAlignVertical="top"
      />

      <View style={styles.toolbar}>
        <Pressable style={styles.tool} onPress={() => setAttachOpen(true)} accessibilityLabel="Attach files or images">
          <PaperclipIcon size={20} color={colors.inkMuted} />
        </Pressable>
        <Pressable
          style={[styles.tool, enableWebSearch && styles.toolActive]}
          onPress={() => setEnableWebSearch(!enableWebSearch)}
          accessibilityLabel="Search the web"
          accessibilityState={{ selected: enableWebSearch }}
        >
          <GlobeIcon size={20} color={enableWebSearch ? colors.brandBlue600 : colors.inkMuted} />
        </Pressable>
        <Pressable style={styles.model} onPress={() => setModelOpen(true)} accessibilityLabel="Choose AI model">
          <ModelIcon size={16} color={colors.inkMuted} />
          <Text style={styles.modelText} numberOfLines={1}>
            {selected?.name || 'Model'}
          </Text>
          <ChevronDownIcon size={14} color={colors.inkMuted} />
        </Pressable>

        <View style={styles.spacer} />

        {sending ? (
          <Pressable style={[styles.send, styles.stop]} onPress={stop} accessibilityLabel="Stop reply">
            <StopIcon size={20} color={colors.white} />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.send, !canSend && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            accessibilityLabel="Send"
          >
            <ArrowUpIcon size={20} color={colors.white} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      <Sheet
        visible={attachOpen}
        title="Add to your message"
        onClose={() => setAttachOpen(false)}
        options={[
          { key: 'camera', label: 'Camera', icon: <CameraIcon color={colors.ink} />, onPress: takePhoto },
          { key: 'photos', label: 'Photos', icon: <ImageIcon color={colors.ink} />, onPress: choosePhotos },
          {
            key: 'files',
            label: 'Files',
            description: 'PDF, Word, Excel, PowerPoint, CSV, TXT',
            icon: <DocumentIcon color={colors.ink} />,
            onPress: chooseFiles,
          },
        ]}
      />
      <Sheet
        visible={modelOpen}
        title="Model"
        onClose={() => setModelOpen(false)}
        options={models.map((m) => ({
          key: m.id,
          label: m.name,
          description: m.description,
          selected: m.id === selected?.id,
          onPress: () => setSelectedModel(m.id),
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 8,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  chips: { gap: 8, paddingHorizontal: 2, paddingBottom: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 220,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipThumb: { width: 28, height: 28, borderRadius: 6 },
  chipName: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink, flexShrink: 1 },
  error: { fontFamily: fonts.regular, fontSize: 13, color: colors.danger, paddingHorizontal: 4, paddingBottom: 6 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
    minHeight: 40,
    maxHeight: 160,
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 6,
  },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  tool: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  toolActive: { backgroundColor: colors.brandBone },
  model: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    maxWidth: 150,
    paddingHorizontal: 10,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modelText: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink, flexShrink: 1 },
  spacer: { flex: 1 },
  send: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: colors.borderStrong },
  stop: { backgroundColor: colors.brandNavy700 },
});
