// ---------------------------------------------------------------------------
// Support tickets with polling. The web app is pushed updates over a
// WebSocket; the production gateway does not forward WebSockets yet, so the
// app asks every POLL_* ms instead. TanStack Query only polls while the app is
// in the foreground and the screen using the hook is mounted.
// ---------------------------------------------------------------------------

import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, queryKeys } from '../api/queryClient';
import { createTicket, getMyTickets, getTicket, getUnreadSummary, postTicketMessage, reopenTicket } from '../api/support';
import type { Ticket, TicketDetail } from '../types/api';

const POLL_UNREAD_MS = 30_000; // badge
const POLL_LIST_MS = 30_000; // ticket list
const POLL_THREAD_MS = 20_000; // an open ticket

const byActivity = (a: Ticket, b: Ticket) =>
  new Date(b.last_message_at || b.created_at || 0).getTime() -
  new Date(a.last_message_at || a.created_at || 0).getTime();

export function useSupportUnread() {
  return useQuery({
    queryKey: queryKeys.supportUnread,
    queryFn: getUnreadSummary,
    refetchInterval: POLL_UNREAD_MS,
  });
}

export function useTickets() {
  return useQuery({
    queryKey: queryKeys.tickets,
    queryFn: async () => (await getMyTickets()).sort(byActivity),
    refetchInterval: POLL_LIST_MS,
  });
}

// Fetching a ticket marks it read server-side, so the badge and the list row
// are refreshed after each load.
export function useTicket(id: string) {
  return useQuery({
    queryKey: queryKeys.ticket(id),
    queryFn: async () => {
      const ticket = await getTicket(id);
      mergeSummary(ticket, { read: true });
      queryClient.invalidateQueries({ queryKey: queryKeys.supportUnread });
      return ticket;
    },
    refetchInterval: POLL_THREAD_MS,
  });
}

function mergeSummary(ticket: TicketDetail | Ticket, { read = false } = {}) {
  // List rows never hold the thread — only the open ticket does.
  const row: Ticket & { messages?: unknown } = { ...ticket, unread_count: read ? 0 : ticket.unread_count };
  delete row.messages;
  queryClient.setQueryData<Ticket[]>(queryKeys.tickets, (list) => {
    const current = list || [];
    const next = current.some((t) => t.id === row.id)
      ? current.map((t) => (t.id === row.id ? { ...t, ...row } : t))
      : [row, ...current];
    return next.sort(byActivity);
  });
}

export function useCreateTicket() {
  return useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket) => {
      queryClient.setQueryData(queryKeys.ticket(ticket.id), ticket);
      mergeSummary(ticket, { read: true });
    },
  });
}

export function useSendTicketMessage(id: string) {
  return useMutation({
    mutationFn: (body: string) => postTicketMessage(id, body),
    onSuccess: (message) => {
      const prev = queryClient.getQueryData<TicketDetail>(queryKeys.ticket(id));
      if (!prev || prev.messages.some((m) => m.id === message.id)) return;
      const next: TicketDetail = {
        ...prev,
        // Replying to a resolved ticket reopens it — mirror the server.
        status: prev.status === 'resolved' ? 'open' : prev.status,
        last_message_at: message.created_at,
        last_message: message,
        message_count: (prev.message_count || 0) + 1,
        messages: [...prev.messages, message],
      };
      queryClient.setQueryData(queryKeys.ticket(id), next);
      mergeSummary(next, { read: true });
    },
  });
}

export function useReopenTicket(id: string) {
  return useMutation({
    mutationFn: () => reopenTicket(id),
    onSuccess: (ticket) => {
      queryClient.setQueryData(queryKeys.ticket(id), ticket);
      mergeSummary(ticket, { read: true });
    },
  });
}
