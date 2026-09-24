// ---------------------------------------------------------------------------
// Conversations, models and the chat stream — ported from services/chatService.js
// ---------------------------------------------------------------------------

import { CLIENT_SOURCE } from '../config';
import type {
  ChatEvent,
  Conversation,
  ConversationDetail,
  GeneratedFile,
  Message,
  Model,
} from '../types/api';
import { apiFetch } from './http';
import { postSse, type StreamHandle } from './sse';

// Backend returns snake_case; the app uses camelCase.
function normalizeConv(c: any): Conversation {
  return {
    id: c.id,
    title: c.title,
    updatedAt: c.updated_at ?? null,
    projectId: c.project_id ?? null,
    projectName: c.project_name ?? null,
  };
}

export function normalizeMsg(m: any): Message {
  return {
    id: m.id,
    role: m.role,
    content: m.content ?? '',
    createdAt: m.created_at ?? null,
    attachedFilenames: m.attached_filenames ?? null,
    // Index-aligned with attachedFilenames — needed to fetch the original bytes
    // for image thumbnails and the preview screen.
    attachedFileIds: m.attached_file_ids ?? null,
    generatedFileIds: m.generated_file_ids ?? null,
    citations: m.citations ?? null,
    model: m.model ?? null,
  };
}

export async function getConversations(): Promise<Conversation[]> {
  const data = await apiFetch<any[]>('/conversations');
  return data.map(normalizeConv);
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const data = await apiFetch(`/conversations/${id}`);
  return {
    ...normalizeConv(data),
    messages: (data.messages || []).map(normalizeMsg),
  };
}

export async function renameConversation(id: string, title: string): Promise<Conversation> {
  return normalizeConv(await apiFetch(`/conversations/${id}`, { method: 'PATCH', body: { title } }));
}

// Permanently deletes the conversation, its messages and any files generated
// in it. A 404 means it is already gone — callers can treat that as success.
export async function deleteConversation(id: string): Promise<void> {
  await apiFetch(`/conversations/${id}`, { method: 'DELETE' });
}

export async function getAvailableModels(): Promise<Model[]> {
  return apiFetch('/models');
}

export async function getGeneratedFile(fileId: string): Promise<GeneratedFile> {
  return apiFetch(`/files/generated/${fileId}`);
}

// Metadata for every generated file of a message; files that no longer exist
// are dropped rather than failing the whole message.
export async function getGeneratedFiles(ids: string[]): Promise<GeneratedFile[]> {
  const files = await Promise.all(ids.map((id) => getGeneratedFile(id).catch(() => null)));
  return files.filter((f): f is GeneratedFile => f !== null);
}

type SendParams = {
  conversationId: string | null;
  content: string;
  fileIds: string[];
  enableWebSearch: boolean;
  model: string | null;
  projectId?: string | null;
};

// Starts a chat turn. Events are delivered to `onEvent` as they arrive;
// `done` settles when the stream ends. Call `abort()` to stop the reply.
export function sendMessage(params: SendParams, onEvent: (e: ChatEvent) => void): StreamHandle {
  const body = {
    conversation_id: params.conversationId,
    content: params.content,
    source: CLIENT_SOURCE,
    ...(params.fileIds.length ? { file_ids: params.fileIds } : {}),
    ...(params.enableWebSearch ? { enable_web_search: true } : {}),
    ...(params.model ? { model: params.model } : {}),
    // Only honoured by the server on a new chat started inside a project.
    ...(params.projectId ? { project_id: params.projectId } : {}),
  };

  return postSse('/chat', body, ({ event, data }) => {
    switch (event) {
      case 'start':
        onEvent({
          type: 'start',
          conversationId: data.conversation_id,
          title: data.title ?? null,
          userMessage: normalizeMsg(data.user_message),
        });
        break;
      case 'status':
        onEvent({ type: 'status', state: data?.state });
        break;
      case 'file_progress':
        onEvent({
          type: 'file_progress',
          stage: data.stage,
          filename: data.filename,
          fmt: data.fmt,
          index: data.index,
          total: data.total,
          attempt: data.attempt ?? null,
          fileId: data.file_id ?? null,
          tokensOut: data.tokens_out ?? null,
          heartbeat: data.heartbeat === true,
        });
        break;
      case 'delta':
        if (data?.text) onEvent({ type: 'delta', text: data.text });
        break;
      case 'done':
        onEvent({ type: 'done', message: normalizeMsg(data.message) });
        break;
      case 'error':
        onEvent({ type: 'error', message: data?.message || 'Something went wrong.' });
        break;
      default:
        break; // unknown / keep-alive frames
    }
  });
}
