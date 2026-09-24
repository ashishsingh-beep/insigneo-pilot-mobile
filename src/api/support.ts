// ---------------------------------------------------------------------------
// Support tickets (domains/support/router.py) — ported from
// services/supportService.js.
// ---------------------------------------------------------------------------
// A ticket is a conversation with the support team. The web app gets live
// updates over a WebSocket; the production gateway does not pass WebSockets
// through yet, so the app polls instead (see hooks/useSupport.ts).
// ---------------------------------------------------------------------------

import type { Ticket, TicketDetail, TicketMessage, TicketPriority, UnreadSummary } from '../types/api';
import { apiFetch } from './http';

export const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const PRIORITIES: TicketPriority[] = ['low', 'normal', 'high', 'urgent'];

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

export function createTicket(input: {
  subject: string;
  description: string;
  priority: TicketPriority;
}): Promise<TicketDetail> {
  return apiFetch('/support/tickets', { method: 'POST', body: input });
}

export function getMyTickets(): Promise<Ticket[]> {
  return apiFetch('/support/tickets/mine');
}

// Reading a ticket clears the caller's unread count on the server.
export function getTicket(id: string): Promise<TicketDetail> {
  return apiFetch(`/support/tickets/${id}`);
}

export function postTicketMessage(id: string, body: string): Promise<TicketMessage> {
  return apiFetch(`/support/tickets/${id}/messages`, { method: 'POST', body: { body } });
}

// Pushes a closed (or resolved) ticket back open.
export function reopenTicket(id: string): Promise<TicketDetail> {
  return apiFetch(`/support/tickets/${id}/reopen`, { method: 'POST' });
}

export function getUnreadSummary(): Promise<UnreadSummary> {
  return apiFetch('/support/tickets/unread');
}
