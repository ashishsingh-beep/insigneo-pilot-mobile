// ---------------------------------------------------------------------------
// The open conversation: its messages, the reply being streamed, and the
// attachments waiting to be sent. Ported from the state + handleSend logic in
// the web app's pages/Chat.jsx.
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { getConversation, getGeneratedFiles, sendMessage } from '../api/chat';
import { uploadFile } from '../api/files';
import { queryClient, queryKeys } from '../api/queryClient';
import { StreamInterruptedError, type StreamHandle } from '../api/sse';
import type {
  ChatEvent,
  Conversation,
  FileProgressEvent,
  GeneratedFile,
  Message,
} from '../types/api';
import { useSettingsStore } from './settingsStore';

export type LocalAttachment = { name: string; uri: string; isImage: boolean };

export type PendingAttachment = LocalAttachment & {
  key: string;
  type: string;
  size: number | null;
};

export type FileProgressFile = {
  filename: string;
  fmt: string;
  current: string;
  attempt: number | null;
  stageStartedAt: number;
  tokensOut: number | null;
  lastEventAt: number;
};

export type FileProgress = { total: number; files: Record<number, FileProgressFile> };

export type ChatMessage = Message & {
  // Thumbnails we already hold locally for a just-sent message.
  localAttachments?: LocalAttachment[] | null;
  generatedFiles?: GeneratedFile[];
  streaming?: boolean;
  stopped?: boolean;
  error?: string | null;
  fileProgress?: FileProgress;
};

type ChatState = {
  conversationId: string | null;
  title: string | null;
  messages: ChatMessage[];
  loadingMessages: boolean;
  sending: boolean;
  streamStatus: string | null;
  hasStreamedContent: boolean;
  pending: PendingAttachment[];
  attachError: string | null;
  // The stream dropped (usually the OS suspended the app). The server still
  // finishes and saves the reply, so the conversation is reloaded on return.
  needsResync: boolean;

  newChat: () => void;
  openConversation: (id: string, opts?: { force?: boolean }) => Promise<void>;
  send: (text: string) => Promise<void>;
  stop: () => void;
  addAttachments: (items: PendingAttachment[]) => void;
  removeAttachment: (key: string) => void;
  setAttachError: (message: string | null) => void;
  resyncIfNeeded: () => void;
  conversationDeleted: (id: string) => void;
  reset: () => void;
};

// --- module-level streaming state (not rendered, so kept out of the store) ---

// Bumped whenever the visible conversation changes. A stream that belongs to
// an older view keeps running (the server still saves the reply) but stops
// touching the screen.
let viewToken = 0;
let activeHandle: StreamHandle | null = null;
let stopRequested = false;

// Deltas arrive many times a second; re-rendering the markdown for each one
// is wasteful, so text is buffered and flushed every FLUSH_MS.
const FLUSH_MS = 50;
let deltaBuffer = '';
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const initialState = {
  conversationId: null,
  title: null,
  messages: [],
  loadingMessages: false,
  sending: false,
  streamStatus: null,
  hasStreamedContent: false,
  pending: [],
  attachError: null,
  needsResync: false,
};

function withGeneratedFiles(messages: Message[]): Promise<ChatMessage[]> {
  return Promise.all(
    messages.map(async (m) =>
      m.generatedFileIds?.length ? { ...m, generatedFiles: await getGeneratedFiles(m.generatedFileIds) } : m,
    ),
  );
}

function titleFromCache(id: string): string | null {
  const list = queryClient.getQueryData<Conversation[]>(queryKeys.conversations);
  return list?.find((c) => c.id === id)?.title ?? null;
}

export const useChatStore = create<ChatState>((set, get) => {
  const updateMessage = (id: string, fn: (m: ChatMessage) => ChatMessage) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === id ? fn(m) : m)) }));

  const cancelFlush = () => {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = null;
  };

  const leaveCurrentView = () => {
    viewToken += 1;
    cancelFlush();
    deltaBuffer = '';
  };

  return {
    ...initialState,

    newChat: () => {
      leaveCurrentView();
      set({ ...initialState, pending: get().pending });
    },

    openConversation: async (id, opts = {}) => {
      if (id === get().conversationId && !opts.force && !get().needsResync) return;
      leaveCurrentView();
      const token = viewToken;
      set({
        ...initialState,
        pending: get().pending,
        conversationId: id,
        title: titleFromCache(id),
        loadingMessages: true,
      });
      try {
        const conv = await getConversation(id);
        const messages = await withGeneratedFiles(conv.messages);
        if (token !== viewToken) return;
        set({ messages, title: conv.title, loadingMessages: false });
      } catch {
        if (token !== viewToken) return;
        set({ messages: [], loadingMessages: false });
      }
    },

    send: async (text) => {
      const content = text.trim();
      const { pending, sending, conversationId } = get();
      // An attachment on its own is a valid turn ("what does this chart show?").
      if ((!content && pending.length === 0) || sending) return;

      const token = viewToken;
      const isCurrent = () => token === viewToken;
      const { selectedModel, enableWebSearch } = useSettingsStore.getState();

      const localAttachments: LocalAttachment[] | null = pending.length
        ? pending.map(({ name, uri, isImage }) => ({ name, uri, isImage }))
        : null;
      const localId = `local_${Date.now()}`;
      let assistantId: string | null = null;
      stopRequested = false;

      set((s) => ({
        messages: [
          ...s.messages,
          {
            id: localId,
            role: 'user',
            content,
            createdAt: new Date().toISOString(),
            attachedFilenames: localAttachments?.map((a) => a.name) ?? null,
            attachedFileIds: null,
            generatedFileIds: null,
            citations: null,
            model: null,
            localAttachments,
          },
        ],
        pending: [],
        attachError: null,
        sending: true,
        streamStatus: null,
        hasStreamedContent: false,
        needsResync: false,
      }));

      const ensureAssistant = () => {
        if (assistantId) return assistantId;
        assistantId = `streaming_assistant_${Date.now()}`;
        const placeholder: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
          attachedFilenames: null,
          attachedFileIds: null,
          generatedFileIds: null,
          citations: null,
          model: null,
          streaming: true,
        };
        set((s) => ({ messages: [...s.messages, placeholder] }));
        return assistantId;
      };

      const flush = () => {
        cancelFlush();
        if (!deltaBuffer || !assistantId || !isCurrent()) return;
        const chunk = deltaBuffer;
        deltaBuffer = '';
        updateMessage(assistantId, (m) => ({ ...m, content: m.content + chunk }));
      };

      const pushError = (message: string) => {
        if (assistantId) {
          updateMessage(assistantId, (m) => ({ ...m, streaming: false, error: message }));
        } else {
          set((s) => ({
            messages: [
              ...s.messages,
              {
                id: `error_${Date.now()}`,
                role: 'assistant',
                content: '',
                createdAt: new Date().toISOString(),
                attachedFilenames: null,
                attachedFileIds: null,
                generatedFileIds: null,
                citations: null,
                model: null,
                error: message,
              },
            ],
          }));
        }
      };

      const onFileProgress = (evt: FileProgressEvent) => {
        const id = ensureAssistant();
        set({ streamStatus: null }); // the file stepper replaces the generic status
        updateMessage(id, (m) => {
          const prev = m.fileProgress || { total: evt.total, files: {} };
          const key = evt.index || 1;
          const now = Date.now();
          const file = prev.files[key];
          const stageChanged = evt.stage !== file?.current;
          return {
            ...m,
            fileProgress: {
              total: evt.total || prev.total,
              files: {
                ...prev.files,
                [key]: {
                  filename: evt.filename,
                  fmt: evt.fmt,
                  current: evt.stage,
                  attempt: evt.attempt,
                  stageStartedAt: stageChanged || !file ? now : file.stageStartedAt,
                  tokensOut: stageChanged ? evt.tokensOut : evt.tokensOut ?? file?.tokensOut ?? null,
                  lastEventAt: now,
                },
              },
            },
          };
        });
      };

      const onEvent = (evt: ChatEvent) => {
        if (!isCurrent()) {
          // This chat is no longer on screen; only keep the sidebar in step.
          if (evt.type === 'start' && !conversationId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
          }
          return;
        }
        switch (evt.type) {
          case 'start': {
            if (!conversationId) {
              const title = evt.title || content.slice(0, 40) || 'New chat';
              set({ conversationId: evt.conversationId, title });
              queryClient.setQueryData<Conversation[]>(queryKeys.conversations, (list) => [
                {
                  id: evt.conversationId,
                  title,
                  updatedAt: new Date().toISOString(),
                  projectId: null,
                  projectName: null,
                },
                ...(list || []).filter((c) => c.id !== evt.conversationId),
              ]);
            }
            // Swap the optimistic message for the server's copy, keeping the
            // local thumbnails so images don't blink out and reload.
            updateMessage(localId, () => ({ ...evt.userMessage, localAttachments }));
            break;
          }
          case 'status':
            set({ streamStatus: evt.state });
            break;
          case 'file_progress':
            onFileProgress(evt);
            break;
          case 'delta':
            ensureAssistant();
            if (!get().hasStreamedContent) set({ hasStreamedContent: true });
            deltaBuffer += evt.text;
            if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_MS);
            break;
          case 'done': {
            flush();
            const id = ensureAssistant();
            const message: ChatMessage = { ...evt.message, streaming: false };
            // Keep the (complete) file stepper until the file cards load, so it
            // does not flicker to nothing in between.
            updateMessage(id, (m) => ({ ...message, fileProgress: m.fileProgress }));
            assistantId = message.id;
            if (message.generatedFileIds?.length) {
              getGeneratedFiles(message.generatedFileIds).then((files) => {
                if (isCurrent() && files.length) {
                  updateMessage(message.id, (m) => ({ ...m, generatedFiles: files }));
                }
              });
            }
            break;
          }
          case 'error':
            flush();
            pushError(evt.message);
            break;
        }
      };

      try {
        const uploaded = await Promise.all(
          pending.map((a) => uploadFile({ uri: a.uri, name: a.name, type: a.type })),
        );
        if (stopRequested) return;

        activeHandle = sendMessage(
          {
            conversationId,
            content,
            fileIds: uploaded.map((f) => f.id),
            enableWebSearch,
            model: selectedModel,
          },
          onEvent,
        );
        await activeHandle.done;
      } catch (err: any) {
        if (isCurrent()) {
          flush();
          if (err instanceof StreamInterruptedError) {
            pushError(err.message);
            set({ needsResync: true });
          } else {
            pushError(err?.message || 'Something went wrong.');
          }
        }
      } finally {
        activeHandle = null;
        if (isCurrent()) {
          flush();
          if (stopRequested && assistantId) {
            updateMessage(assistantId, (m) => (m.streaming ? { ...m, streaming: false, stopped: true } : m));
          }
          set({ sending: false, streamStatus: null });
        }
        // Refresh updated_at ordering (and the server-side title) in the sidebar.
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      }
    },

    // Closes the connection; the server notices the disconnect between rounds.
    stop: () => {
      stopRequested = true;
      activeHandle?.abort();
      if (!activeHandle) set({ sending: false, streamStatus: null });
    },

    addAttachments: (items) => set((s) => ({ pending: [...s.pending, ...items] })),
    removeAttachment: (key) => set((s) => ({ pending: s.pending.filter((a) => a.key !== key) })),
    setAttachError: (message) => set({ attachError: message }),

    resyncIfNeeded: () => {
      const { needsResync, conversationId, sending } = get();
      if (needsResync && conversationId && !sending) {
        get().openConversation(conversationId, { force: true });
      }
    },

    conversationDeleted: (id) => {
      if (get().conversationId === id) get().newChat();
    },

    reset: () => {
      stopRequested = true;
      activeHandle?.abort();
      activeHandle = null;
      leaveCurrentView();
      set({ ...initialState });
    },
  };
});

// Is a reply currently streaming into this conversation?
export function isStreamingInto(conversationId: string): boolean {
  const s = useChatStore.getState();
  return s.sending && s.conversationId === conversationId;
}
