// ---------------------------------------------------------------------------
// Chat history grouping — ported from the web app's utils/chatHistory.js.
// Conversations arrive newest-first from the server and are bucketed by age.
// ---------------------------------------------------------------------------

import type { Conversation } from '../types/api';

// Buckets in display order. `maxDays` is the age ceiling in whole days from
// the start of today, so a chat from 11pm yesterday reads as "Yesterday".
const BUCKETS = [
  { label: 'Today', maxDays: 0 },
  { label: 'Yesterday', maxDays: 1 },
  { label: 'Previous 7 days', maxDays: 7 },
  { label: 'Previous 30 days', maxDays: 30 },
];
const OLDER = 'Older';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(then: Date, now = new Date()): number {
  return Math.round((startOfDay(now).getTime() - startOfDay(then).getTime()) / 86400000);
}

function bucketFor(conversation: Conversation, now: Date): string {
  // No usable timestamp: "Older" is the honest bucket ("Today" would invent recency).
  const when = conversation.updatedAt ? new Date(conversation.updatedAt) : null;
  if (!when || Number.isNaN(when.getTime())) return OLDER;
  const age = daysAgo(when, now);
  // Clock skew can date a chat slightly in the future — it is the newest thing there is.
  if (age < 0) return BUCKETS[0].label;
  return BUCKETS.find((b) => age <= b.maxDays)?.label ?? OLDER;
}

export type ConversationGroup = { title: string; data: Conversation[] };

// Returns SectionList-ready groups with empty buckets dropped, preserving the
// incoming order within each group.
export function groupConversationsByDate(
  conversations: Conversation[],
  now = new Date(),
): ConversationGroup[] {
  const groups = new Map<string, Conversation[]>();
  for (const conversation of conversations) {
    const label = bucketFor(conversation, now);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(conversation);
  }
  return [...BUCKETS.map((b) => b.label), OLDER]
    .filter((label) => groups.has(label))
    .map((label) => ({ title: label, data: groups.get(label)! }));
}
