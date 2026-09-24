// One message in the thread. User messages are navy bubbles on the right;
// assistant replies are full-width markdown with sources, file progress,
// generated files and a copy action — the layout of Claude's mobile app.
import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import type { ChatMessage } from '../../stores/chatStore';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import type { GeneratedFile } from '../../types/api';
import { CheckIcon, CopyIcon } from '../Icons';
import { AssistantMarkdown } from './AssistantMarkdown';
import { FileProgressStepper } from './FileProgressStepper';
import { GeneratedFiles } from './GeneratedFiles';
import { MessageAttachments } from './MessageAttachments';
import { MessageSources } from './MessageSources';

export type OpenFile = (file: { source: 'uploaded' | 'generated'; id: string; filename: string; size?: number | null }) => void;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Pressable
      hitSlop={8}
      style={styles.action}
      accessibilityLabel="Copy reply"
      onPress={() => {
        Clipboard.setString(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <CheckIcon size={16} color={colors.success} /> : <CopyIcon size={16} color={colors.inkMuted} />}
      <Text style={styles.actionText}>{copied ? 'Copied' : 'Copy'}</Text>
    </Pressable>
  );
}

export const MessageItem = memo(function MessageItemView({ message, onOpenFile }: { message: ChatMessage; onOpenFile: OpenFile }) {
  if (message.role === 'user') {
    return (
      <View style={styles.userRow}>
        <MessageAttachments message={message} onOpen={(f) => onOpenFile({ source: 'uploaded', ...f })} />
        {/* An attachment-only turn has no bubble to draw. */}
        {message.content ? (
          <Pressable
            style={styles.userBubble}
            onLongPress={() => Clipboard.setString(message.content)}
            delayLongPress={350}
            accessibilityHint="Long press to copy"
          >
            <Text style={styles.userText} selectable>
              {message.content}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const openGenerated = (file: GeneratedFile) =>
    onOpenFile({ source: 'generated', id: file.id, filename: file.filename, size: file.size });
  const showFiles = !!message.generatedFiles?.length;

  return (
    <View style={styles.assistantRow}>
      {message.content ? <AssistantMarkdown content={message.content} streaming={message.streaming} /> : null}
      <MessageSources citations={message.citations} content={message.content} />
      {message.fileProgress && !showFiles ? <FileProgressStepper progress={message.fileProgress} /> : null}
      {showFiles ? <GeneratedFiles files={message.generatedFiles!} onOpen={openGenerated} /> : null}
      {message.error ? <Text style={styles.error}>{message.error}</Text> : null}
      {message.stopped ? <Text style={styles.stopped}>Stopped</Text> : null}
      {!message.streaming && message.content ? (
        <View style={styles.actions}>
          <CopyButton text={message.content} />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  userRow: { alignItems: 'flex-end', marginVertical: 8 },
  userBubble: {
    maxWidth: '85%',
    backgroundColor: colors.accent,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  userText: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.white },
  assistantRow: { marginVertical: 8 },
  error: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  stopped: { fontFamily: fonts.medium, fontSize: 13, color: colors.inkFaint, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  actionText: { fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted },
});
