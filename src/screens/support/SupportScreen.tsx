// The user's support tickets, newest activity first, with status filters.
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlusIcon, TicketIcon } from '../../components/Icons';
import { StatusBadge } from '../../components/support/StatusBadge';
import { Button } from '../../components/ui/Button';
import { useTickets } from '../../hooks/useSupport';
import type { AppStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import type { Ticket } from '../../types/api';
import { relativeTime } from '../../utils/time';

type Props = NativeStackScreenProps<AppStackParamList, 'Support'>;

const FILTERS: { id: string; label: string; statuses?: string[] }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Open', statuses: ['open', 'in_progress'] },
  { id: 'resolved', label: 'Resolved', statuses: ['resolved'] },
  { id: 'closed', label: 'Closed', statuses: ['closed'] },
];

function preview(ticket: Ticket) {
  const flat = (ticket.last_message?.body || ticket.description || '').replace(/\s+/g, ' ').trim();
  return flat.length > 90 ? `${flat.slice(0, 90)}…` : flat;
}

export function SupportScreen({ navigation }: Props) {
  const { data: tickets, isLoading, error, refetch, isRefetching } = useTickets();
  const [filter, setFilter] = useState('all');

  useLayoutEffect(() => {
    const headerRight = () => (
      <Pressable onPress={() => navigation.navigate('NewTicket')} hitSlop={10} accessibilityLabel="New ticket">
        <PlusIcon size={24} color={colors.ink} />
      </Pressable>
    );
    navigation.setOptions({ headerRight });
  }, [navigation]);

  const visible = useMemo(() => {
    const active = FILTERS.find((f) => f.id === filter);
    return active?.statuses ? (tickets || []).filter((t) => active.statuses!.includes(t.status)) : tickets || [];
  }, [tickets, filter]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.inkMuted} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable key={f.id} onPress={() => setFilter(f.id)} style={[styles.filter, filter === f.id && styles.filterActive]}>
            <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
        ListEmptyComponent={
          error ? (
            <Text style={styles.error}>{(error as Error).message || 'Could not load your tickets.'}</Text>
          ) : (
            <View style={styles.empty}>
              <TicketIcon size={38} color={colors.inkMuted} />
              <Text style={styles.emptyTitle}>{tickets?.length ? 'No tickets here' : 'No tickets yet'}</Text>
              <Text style={styles.emptyText}>Something not working, or a question for the team? Raise a ticket and we’ll reply here.</Text>
              <Button title="New ticket" onPress={() => navigation.navigate('NewTicket')} />
            </View>
          )
        }
        renderItem={({ item: t }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Ticket', { ticketId: t.id, subject: t.subject })}
          >
            <View style={styles.rowHead}>
              <Text style={[styles.subject, t.unread_count > 0 && styles.unread]} numberOfLines={1}>
                {t.subject}
              </Text>
              {t.unread_count > 0 ? (
                <View style={styles.dot}>
                  <Text style={styles.dotText}>{t.unread_count}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.preview} numberOfLines={2}>
              {preview(t)}
            </Text>
            <View style={styles.rowFoot}>
              <StatusBadge status={t.status} />
              {t.reference ? <Text style={styles.meta}>{t.reference}</Text> : null}
              <Text style={[styles.meta, styles.time]}>{relativeTime(t.last_message_at || t.created_at)}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgApp },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  filterActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterText: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink },
  filterTextActive: { color: colors.white },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  row: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.hoverBg },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subject: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  unread: { fontFamily: fonts.bold },
  dot: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.brandBlue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontFamily: fonts.bold, fontSize: 11, color: colors.white },
  preview: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.inkMuted, marginTop: 4 },
  rowFoot: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkFaint },
  time: { marginLeft: 'auto' },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger, textAlign: 'center', marginTop: 40 },
  empty: { alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 60 },
  emptyTitle: { fontFamily: fonts.serifSemibold, fontSize: 22, color: colors.inkStrong },
  emptyText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.inkMuted, textAlign: 'center', marginBottom: 8 },
});
