// ---------------------------------------------------------------------------
// The chat screen: header, the thread (or the new-chat greeting), composer.
// ---------------------------------------------------------------------------

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Composer } from '../../components/chat/Composer';
import { EmptyState } from '../../components/chat/EmptyState';
import { MessageItem, type OpenFile } from '../../components/chat/MessageItem';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { MenuIcon, PlusIcon } from '../../components/Icons';
import { Banner } from '../../components/ui/Banner';
import type { AppStackParamList, DrawerParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore, type ChatMessage } from '../../stores/chatStore';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

type Props = CompositeScreenProps<
  DrawerScreenProps<DrawerParamList, 'Chat'>,
  NativeStackScreenProps<AppStackParamList>
>;

type Row = ChatMessage | { id: '__typing__'; role: 'typing' };

export function ChatScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const blocked = useAuthStore((s) => s.blocked);
  const dismissBlocked = useAuthStore((s) => s.dismissBlocked);

  const title = useChatStore((s) => s.title);
  const messages = useChatStore((s) => s.messages);
  const loadingMessages = useChatStore((s) => s.loadingMessages);
  const sending = useChatStore((s) => s.sending);
  const streamStatus = useChatStore((s) => s.streamStatus);
  const hasStreamedContent = useChatStore((s) => s.hasStreamedContent);

  const [draft, setDraft] = useState('');

  // A stream cut off while the app was in the background: the server kept
  // going and saved the reply, so reload the conversation on return.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') useChatStore.getState().resyncIfNeeded();
    });
    return () => sub.remove();
  }, []);

  const openFile: OpenFile = useCallback((file) => navigation.navigate('FilePreview', file), [navigation]);

  const showTyping = sending && (!hasStreamedContent || streamStatus === 'generating_file');

  // Inverted list: newest at the bottom, and the view stays pinned to the
  // bottom while a reply grows.
  const rows: Row[] = useMemo(() => {
    const list: Row[] = [...messages].reverse();
    if (showTyping) list.unshift({ id: '__typing__', role: 'typing' });
    return list;
  }, [messages, showTyping]);

  const inThread = messages.length > 0 || loadingMessages;
  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'there';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => navigation.openDrawer()} accessibilityLabel="Open chats">
          <MenuIcon size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {inThread ? title || 'Chat' : 'InsigneoAI'}
        </Text>
        <Pressable
          style={styles.headerBtn}
          onPress={() => useChatStore.getState().newChat()}
          accessibilityLabel="New chat"
        >
          <PlusIcon size={24} color={colors.ink} />
        </Pressable>
      </View>

      {blocked ? (
        <View style={styles.banner}>
          <Banner
            text="Your account has been deactivated. You are not authorized to use this service. Please contact your administrator."
            onDismiss={dismissBlocked}
          />
        </View>
      ) : null}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {!inThread ? (
          <EmptyState firstName={firstName} onSuggestion={setDraft} />
        ) : loadingMessages ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.inkMuted} />
          </View>
        ) : (
          <FlatList
            inverted
            data={rows}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.thread}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) =>
              item.role === 'typing' ? (
                <TypingIndicator status={streamStatus} />
              ) : (
                <MessageItem message={item as ChatMessage} onOpenFile={openFile} />
              )
            }
          />
        )}

        <View style={styles.composer}>
          <Composer value={draft} onChangeText={setDraft} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.ink,
  },
  banner: { paddingHorizontal: 12, paddingTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  thread: { paddingHorizontal: 16, paddingVertical: 12 },
  composer: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 8 },
});
