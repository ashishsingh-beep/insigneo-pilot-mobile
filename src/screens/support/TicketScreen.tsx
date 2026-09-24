// ---------------------------------------------------------------------------
// One ticket's conversation with support. New replies arrive by polling every
// 20s while this screen is open (see hooks/useSupport.ts).
// ---------------------------------------------------------------------------

import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRIORITY_LABELS } from '../../api/support';
import { CheckCircleIcon, SendIcon } from '../../components/Icons';
import { StatusBadge } from '../../components/support/StatusBadge';
import { Button } from '../../components/ui/Button';
import { useReopenTicket, useSendTicketMessage, useTicket } from '../../hooks/useSupport';
import type { AppStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import type { TicketMessage } from '../../types/api';
import { fullTime } from '../../utils/time';

type Props = NativeStackScreenProps<AppStackParamList, 'Ticket'>;

function MessageRow({ m }: { m: TicketMessage }) {
  if (m.sender_role === 'system') {
    return (
      <View style={styles.system}>
        <Text style={styles.systemText}>{m.body}</Text>
        <Text style={styles.systemTime}>{fullTime(m.created_at)}</Text>
      </View>
    );
  }
  const mine = m.sender_role === 'user';
  return (
    <View style={[styles.msg, mine ? styles.mine : styles.theirs]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]} selectable>
          {m.body}
        </Text>
      </View>
      <Text style={styles.msgMeta}>
        {mine ? 'You' : m.sender_name} · {fullTime(m.created_at)}
      </Text>
    </View>
  );
}

export function TicketScreen({ navigation, route }: Props) {
  const { ticketId } = route.params;
  const { data: ticket, isLoading, error, refetch } = useTicket(ticketId);
  const send = useSendTicketMessage(ticketId);
  const reopen = useReopenTicket(ticketId);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const headerHeight = useHeaderHeight();

  useLayoutEffect(() => {
    navigation.setOptions({ title: ticket?.subject || route.params.subject || 'Ticket' });
  }, [navigation, ticket?.subject, route.params.subject]);

  // Inverted list keeps the newest message at the bottom, in view.
  const messages = useMemo(() => [...(ticket?.messages || [])].reverse(), [ticket?.messages]);

  async function handleSend() {
    const body = draft.trim();
    if (!body || send.isPending) return;
    setSendError(null);
    try {
      await send.mutateAsync(body);
      setDraft('');
    } catch (err: any) {
      setSendError(err?.message || 'Could not send your message.');
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.inkMuted} />
      </View>
    );
  }
  if (!ticket) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{(error as Error)?.message || 'Could not open this ticket.'}</Text>
        <Button title="Try again" variant="secondary" onPress={() => refetch()} style={styles.retry} />
      </View>
    );
  }

  const closed = ticket.status === 'closed';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        <View style={styles.head}>
          <View style={styles.headRow}>
            <StatusBadge status={ticket.status} />
            <Text style={styles.headMeta}>{PRIORITY_LABELS[ticket.priority] || ticket.priority} priority</Text>
            {ticket.reference ? <Text style={styles.headMeta}>{ticket.reference}</Text> : null}
          </View>
          <Text style={styles.headMeta}>
            Raised {fullTime(ticket.created_at)}
            {ticket.assigned_to_name ? ` · Handled by ${ticket.assigned_to_name}` : ''}
          </Text>
        </View>

        <FlatList
          inverted
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.thread}
          keyboardDismissMode="interactive"
          renderItem={({ item }) => <MessageRow m={item} />}
        />

        {ticket.status === 'resolved' ? (
          <View style={styles.resolved}>
            <CheckCircleIcon size={17} color={colors.success} />
            <Text style={styles.resolvedText}>
              Marked resolved. Reply below if the issue is still there — that reopens the ticket.
            </Text>
          </View>
        ) : null}

        {closed ? (
          <View style={styles.closed}>
            <Text style={styles.closedText}>This ticket is closed.</Text>
            <Button
              title="Reopen ticket"
              onPress={() =>
                reopen.mutate(undefined, {
                  onError: (err: any) => setSendError(err?.message || 'Could not reopen this ticket.'),
                })
              }
              loading={reopen.isPending}
            />
            {sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}
          </View>
        ) : (
          <View style={styles.composer}>
            {sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}
            <View style={styles.composerRow}>
              <TextInput
                style={styles.input}
                placeholder="Write a reply…"
                placeholderTextColor={colors.inkFaint}
                multiline
                value={draft}
                onChangeText={setDraft}
              />
              <Pressable
                style={[styles.send, (!draft.trim() || send.isPending) && styles.sendDisabled]}
                onPress={handleSend}
                disabled={!draft.trim() || send.isPending}
                accessibilityLabel="Send reply"
              >
                {send.isPending ? <ActivityIndicator color={colors.white} /> : <SendIcon size={18} color={colors.white} />}
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bgApp },
  errorText: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger, textAlign: 'center' },
  retry: { marginTop: 16 },
  head: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkMuted },
  thread: { padding: 16, gap: 12 },
  system: { alignItems: 'center', paddingVertical: 4 },
  systemText: { fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted, textAlign: 'center' },
  systemTime: { fontFamily: fonts.regular, fontSize: 11, color: colors.inkFaint, marginTop: 2 },
  msg: { maxWidth: '85%' },
  mine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 16, paddingVertical: 9, paddingHorizontal: 13 },
  bubbleMine: { backgroundColor: colors.accent, borderBottomRightRadius: 5 },
  bubbleTheirs: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 5 },
  bubbleText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.ink },
  bubbleTextMine: { color: colors.white },
  msgMeta: { fontFamily: fonts.regular, fontSize: 11, color: colors.inkFaint, marginTop: 3 },
  resolved: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#e7f3e2',
  },
  resolvedText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.ink },
  closed: { padding: 16, gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  closedText: { fontFamily: fonts.medium, fontSize: 14, color: colors.inkMuted, textAlign: 'center' },
  composer: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8 },
  sendError: { fontFamily: fonts.regular, fontSize: 13, color: colors.danger, paddingHorizontal: 4, paddingBottom: 6 },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: colors.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
    maxHeight: 140,
    paddingVertical: 6,
  },
  send: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { backgroundColor: colors.borderStrong },
});
