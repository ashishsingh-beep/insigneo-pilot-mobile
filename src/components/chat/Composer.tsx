// ---------------------------------------------------------------------------
// Message composer: text box, attachment chips, attach / web-search / model
// controls, and Send (or Stop while a reply is streaming).
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useModels } from '../../hooks/useModels';
import { useChatStore } from '../../stores/chatStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { pickDocuments, pickFromCamera, pickFromPhotos, type PickResult } from '../../utils/pickers';
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

  async function attach(picker: () => Promise<PickResult>) {
    const { files, error } = await picker();
    setAttachError(error);
    if (files.length) {
      addAttachments(
        files.map((f) => {
          seq += 1;
          return { ...f, key: `att_${seq}` };
        }),
      );
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
          { key: 'camera', label: 'Camera', icon: <CameraIcon color={colors.ink} />, onPress: () => attach(pickFromCamera) },
          { key: 'photos', label: 'Photos', icon: <ImageIcon color={colors.ink} />, onPress: () => attach(pickFromPhotos) },
          {
            key: 'files',
            label: 'Files',
            description: 'PDF, Word, Excel, PowerPoint, CSV, TXT',
            icon: <DocumentIcon color={colors.ink} />,
            onPress: () => attach(pickDocuments),
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
