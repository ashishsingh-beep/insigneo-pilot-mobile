import { useMutation, useQuery } from '@tanstack/react-query';
import { deleteConversation, getConversations, renameConversation } from '../api/chat';
import { ApiError } from '../api/http';
import { queryClient, queryKeys } from '../api/queryClient';
import { useChatStore } from '../stores/chatStore';
import type { Conversation } from '../types/api';

export function useConversations() {
  return useQuery({ queryKey: queryKeys.conversations, queryFn: getConversations });
}

function patchList(fn: (list: Conversation[]) => Conversation[]) {
  queryClient.setQueryData<Conversation[]>(queryKeys.conversations, (list) => fn(list || []));
}

// Optimistic: the new title shows immediately and is put back if the request
// fails.
export function useRenameConversation() {
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => renameConversation(id, title),
    onMutate: ({ id, title }) => {
      const previous = queryClient.getQueryData<Conversation[]>(queryKeys.conversations);
      patchList((list) => list.map((c) => (c.id === id ? { ...c, title } : c)));
      const chat = useChatStore.getState();
      if (chat.conversationId === id) useChatStore.setState({ title });
      return { previous };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKeys.conversations, ctx.previous);
      const old = ctx?.previous?.find((c) => c.id === id)?.title;
      if (old && useChatStore.getState().conversationId === id) useChatStore.setState({ title: old });
    },
  });
}

export function useDeleteConversation() {
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await deleteConversation(id);
      } catch (err) {
        // 404: already deleted — the intent is satisfied.
        if (!(err instanceof ApiError && err.status === 404)) throw err;
      }
    },
    onSuccess: (_data, id) => {
      patchList((list) => list.filter((c) => c.id !== id));
      useChatStore.getState().conversationDeleted(id);
    },
  });
}
