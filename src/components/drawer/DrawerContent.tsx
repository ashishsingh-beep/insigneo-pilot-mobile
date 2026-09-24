// ---------------------------------------------------------------------------
// Sidebar drawer: new chat, the chat history grouped by date, and the account
// row. Long-press (or the ⋯ button) on a chat opens Rename / Delete.
// ---------------------------------------------------------------------------

import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConversations, useDeleteConversation, useRenameConversation } from '../../hooks/useConversations';
import { useAuthStore } from '../../stores/authStore';
import { isStreamingInto, useChatStore } from '../../stores/chatStore';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import type { Conversation } from '../../types/api';
import { groupConversationsByDate } from '../../utils/chatHistory';
import { ChevronRightIcon, PencilIcon, PlusIcon, TrashIcon, UserIcon } from '../Icons';
import { Logo } from '../Logo';
import { Sheet } from '../ui/Sheet';
import { RenameDialog } from './RenameDialog';

export function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const activeId = useChatStore((s) => s.conversationId);
  const { data: conversations, isLoading, isRefetching, refetch, error } = useConversations();
  const rename = useRenameConversation();
  const remove = useDeleteConversation();

  const [menuFor, setMenuFor] = useState<Conversation | null>(null);
  const [renaming, setRenaming] = useState<Conversation | null>(null);

  const sections = useMemo(() => groupConversationsByDate(conversations || []), [conversations]);

  function open(id: string) {
    useChatStore.getState().openConversation(id);
    navigation.closeDrawer();
  }

  function newChat() {
    useChatStore.getState().newChat();
    navigation.closeDrawer();
  }

  function confirmDelete(conv: Conversation) {
    // The reply in flight is still writing to this chat.
    if (isStreamingInto(conv.id)) {
      Alert.alert('Chat is busy', 'This chat is still receiving a reply. Try again once it finishes.');
      return;
    }
    Alert.alert(
      'Delete this chat?',
      `“${conv.title}” and its messages will be permanently deleted, along with any files generated in it. Documents you uploaded are kept. This can’t be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete chat',
          style: 'destructive',
          onPress: () =>
            remove.mutate(conv.id, {
              onError: (err: any) => Alert.alert('Could not delete the chat', err?.message || 'Please try again.'),
            }),
        },
      ],
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.brand}>
        <Logo height={36} />
      </View>

      <Pressable style={({ pressed }) => [styles.newChat, pressed && styles.pressed]} onPress={newChat}>
        <View style={styles.newChatIcon}>
          <PlusIcon size={18} color={colors.white} strokeWidth={2} />
        </View>
        <Text style={styles.newChatText}>New Chat</Text>
      </Pressable>

      <Text style={styles.recentLabel}>RECENT</Text>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} color={colors.inkMuted} />
      ) : (
        <SectionList
          style={styles.list}
          sections={sections}
          keyExtractor={(c) => c.id}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {error ? 'Could not load your chats. Pull to retry.' : 'Your chats will appear here once you start one.'}
            </Text>
          }
          renderSectionHeader={({ section }) => <Text style={styles.groupLabel}>{section.title}</Text>}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => open(item.id)}
              onLongPress={() => setMenuFor(item)}
              delayLongPress={350}
              style={({ pressed }) => [styles.row, item.id === activeId && styles.rowActive, pressed && styles.pressed]}
            >
              <Text style={styles.rowText} numberOfLines={1}>
                {item.title}
              </Text>
              <Pressable hitSlop={10} onPress={() => setMenuFor(item)} accessibilityLabel={`Actions for ${item.title}`}>
                <Text style={styles.more}>⋯</Text>
              </Pressable>
            </Pressable>
          )}
        />
      )}

      <Pressable
        style={({ pressed }) => [styles.account, { paddingBottom: insets.bottom + 12 }, pressed && styles.pressed]}
        onPress={() => {
          navigation.closeDrawer();
          navigation.getParent()?.navigate('Account');
        }}
      >
        <View style={styles.avatar}>
          <UserIcon size={22} color={colors.white} />
        </View>
        <View style={styles.accountText}>
          <Text style={styles.accountName} numberOfLines={1}>
            {user?.name || 'Account'}
          </Text>
          <Text style={styles.accountEmail} numberOfLines={1}>
            {user?.email}
          </Text>
        </View>
        <ChevronRightIcon size={18} color={colors.inkMuted} />
      </Pressable>

      <Sheet
        visible={!!menuFor}
        title={menuFor?.title}
        onClose={() => setMenuFor(null)}
        options={
          menuFor
            ? [
                {
                  key: 'rename',
                  label: 'Rename',
                  icon: <PencilIcon color={colors.ink} />,
                  onPress: () => setRenaming(menuFor),
                },
                {
                  key: 'delete',
                  label: 'Delete',
                  destructive: true,
                  icon: <TrashIcon color={colors.danger} />,
                  onPress: () => confirmDelete(menuFor),
                },
              ]
            : []
        }
      />
      <RenameDialog
        visible={!!renaming}
        initialTitle={renaming?.title || ''}
        onCancel={() => setRenaming(null)}
        onSave={(title) => {
          if (renaming) {
            rename.mutate(
              { id: renaming.id, title },
              { onError: (err: any) => Alert.alert('Could not rename the chat', err?.message || 'Please try again.') },
            );
          }
          setRenaming(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPanel },
  brand: { paddingHorizontal: 18, paddingVertical: 10 },
  newChat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    marginTop: 6,
    padding: 10,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newChatIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  recentLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.inkFaint,
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 4,
  },
  loading: { marginTop: 20 },
  list: { flex: 1 },
  groupLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  rowActive: { backgroundColor: colors.activeBg },
  pressed: { backgroundColor: colors.hoverBg },
  rowText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  more: { fontFamily: fonts.bold, fontSize: 18, color: colors.inkMuted, paddingLeft: 10 },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.inkMuted, paddingHorizontal: 20, paddingTop: 8 },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountText: { flex: 1 },
  accountName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  accountEmail: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkMuted },
});
